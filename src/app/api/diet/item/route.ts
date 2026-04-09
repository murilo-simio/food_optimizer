import { DietSource } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  calculateReplacementGrams,
  rebalanceMealToTargetTotals,
} from "@/lib/diet-customization";
import {
  calculateDietCost,
  calculateDietTotals,
  formatDietFoods,
} from "@/lib/diets";
import { prisma } from "@/lib/prisma";

const updateDietItemSchema = z.object({
  dietId: z.string().min(1),
  foodId: z.string().min(1),
  mealSlot: z.string().min(1),
  replacementFoodId: z.string().min(1),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = updateDietItemSchema.parse(await req.json());
    const currentDiet = await prisma.diet.findUnique({
      where: { id: body.dietId },
      include: {
        foods: {
          include: {
            food: true,
          },
        },
      },
    });

    if (!currentDiet) {
      return NextResponse.json({ error: "Dieta não encontrada." }, { status: 404 });
    }

    const currentItem = currentDiet.foods.find(
      (food) => food.foodId === body.foodId && food.mealSlot === body.mealSlot
    );

    if (!currentItem) {
      return NextResponse.json(
        { error: "Alimento da refeição não encontrado." },
        { status: 404 }
      );
    }

    const replacementFood = await prisma.food.findUnique({
      where: { id: body.replacementFoodId },
    });

    if (!replacementFood) {
      return NextResponse.json(
        { error: "Alimento substituto não encontrado." },
        { status: 404 }
      );
    }

    const replacementGrams = calculateReplacementGrams(
      {
        foodId: currentItem.foodId,
        food: currentItem.food,
        grams: currentItem.grams,
        mealSlot: currentItem.mealSlot,
      },
      replacementFood
    );
    const originalMealFoods = currentDiet.foods.filter(
      (food) => food.mealSlot === body.mealSlot
    );

    const updatedResponse = await prisma.$transaction(async (tx) => {
      const duplicateTarget = await tx.foodInDiet.findFirst({
        where: {
          dietId: body.dietId,
          mealSlot: body.mealSlot,
          foodId: body.replacementFoodId,
          NOT: {
            id: currentItem.id,
          },
        },
      });

      if (duplicateTarget) {
        await tx.foodInDiet.update({
          where: { id: duplicateTarget.id },
          data: {
            grams: duplicateTarget.grams + replacementGrams,
          },
        });
        await tx.foodInDiet.delete({
          where: { id: currentItem.id },
        });
      } else {
        await tx.foodInDiet.update({
          where: { id: currentItem.id },
          data: {
            foodId: body.replacementFoodId,
            grams: replacementGrams,
          },
        });
      }

      const replacedFoods = await tx.foodInDiet.findMany({
        where: { dietId: body.dietId },
        include: {
          food: true,
        },
      });
      const updatedMealFoods = replacedFoods.filter(
        (food) => food.mealSlot === body.mealSlot
      );
      const rebalancedMeal = rebalanceMealToTargetTotals(
        originalMealFoods,
        updatedMealFoods
      );

      for (const mealFood of rebalancedMeal.foods) {
        const persistedFood = updatedMealFoods.find(
          (food) =>
            food.foodId === mealFood.foodId && food.mealSlot === mealFood.mealSlot
        );

        if (!persistedFood) {
          continue;
        }

        await tx.foodInDiet.update({
          where: { id: persistedFood.id },
          data: {
            grams: mealFood.grams,
          },
        });
      }

      const updatedFoods = await tx.foodInDiet.findMany({
        where: { dietId: body.dietId },
        include: {
          food: true,
        },
      });
      const prices = await tx.foodPrice.findMany({
        where: {
          foodId: { in: updatedFoods.map((food) => food.foodId) },
        },
        orderBy: { collectedAt: "desc" },
      });

      const priceMap = new Map<string, number>();
      for (const price of prices) {
        if (!priceMap.has(price.foodId)) {
          priceMap.set(price.foodId, price.pricePerKg / 10);
        }
      }

      const totals = calculateDietTotals(updatedFoods);
      const estimatedCost = calculateDietCost(updatedFoods, priceMap);
      const existingNotes = currentDiet.aiReasoning
        ? currentDiet.aiReasoning.split("; ").filter(Boolean)
        : [];
      const nextNotes = [
        ...existingNotes,
        `Substituição manual: ${currentItem.food.name} -> ${replacementFood.name} em ${body.mealSlot}.`,
        `Refeição ${body.mealSlot} rebalanceada para preservar macros e calorias-alvo do slot.`,
      ];

      const context = currentDiet.context ? JSON.parse(currentDiet.context) : {};
      const updatedDiet = await tx.diet.update({
        where: { id: body.dietId },
        data: {
          source: DietSource.MANUAL,
          totalCalories: Math.round(totals.totalCalories),
          totalProteinG: Math.round(totals.totalProteinG),
          totalFatG: Math.round(totals.totalFatG),
          totalCarbsG: Math.round(totals.totalCarbsG),
          estimatedCost,
          aiReasoning: nextNotes.join("; "),
          context: JSON.stringify({
            ...context,
            manualEdited: true,
            lastManualEditAt: new Date().toISOString(),
            lastRebalancedMealSlot: body.mealSlot,
          }),
        },
      });

      return {
        diet: updatedDiet,
        foods: formatDietFoods(updatedFoods),
        summary: {
          totalCalories: Math.round(totals.totalCalories),
          totalProteinG: Math.round(totals.totalProteinG),
          totalFatG: Math.round(totals.totalFatG),
          totalCarbsG: Math.round(totals.totalCarbsG),
          totalFiberG: Math.round(totals.totalFiberG),
        },
        notes: nextNotes,
      };
    });

    return NextResponse.json(updatedResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parâmetros inválidos para atualizar a dieta." },
        { status: 400 }
      );
    }

    console.error("Error updating diet item:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar item da dieta." },
      { status: 500 }
    );
  }
}
