import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { calculateNutrition } from "@/lib/calculators";
import { buildCalculatorInput } from "@/lib/calculators/adapters";
import {
  attachFoodPrices,
  tuneDietCostRange,
} from "@/lib/diet-customization";
import {
  type DietGenerationConfig,
  generateDietGreedy,
} from "@/lib/diet-builder";
import {
  calculateDietCost,
  calculateDietTotals,
  normalizeDietFoodsToTargets,
} from "@/lib/diets";
import { prisma } from "@/lib/prisma";
import {
  distributeCaloriesBySlot,
  type OptimizerConfig,
  optimizeDietCost,
} from "@/lib/optimizer";

const generateDietSchema = z.object({
  userId: z.string().min(1),
  algorithm: z.enum(["GREEDY", "LOW_COST"]).default("LOW_COST"),
  minDailyCost: z.number().min(0).max(500).nullable().optional(),
  maxDailyCost: z.number().min(0).max(500).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      algorithm,
      minDailyCost = null,
      maxDailyCost = null,
    } = generateDietSchema.parse(await req.json());

    const normalizedCostRange = {
      minDailyCost,
      maxDailyCost:
        minDailyCost !== null && maxDailyCost !== null && maxDailyCost < minDailyCost
          ? minDailyCost
          : maxDailyCost,
    };

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado. Complete o onboarding primeiro." },
        { status: 404 }
      );
    }

    const tasteProfile = await prisma.tasteProfile.findUnique({
      where: { userId },
    });
    const availableFoods = await prisma.food.findMany({
      orderBy: { name: "asc" },
    });

    if (availableFoods.length === 0) {
      return NextResponse.json(
        { error: "Nenhum alimento cadastrado no banco. Execute o seed primeiro." },
        { status: 500 }
      );
    }

    const calculatorInput = buildCalculatorInput({
      age: profile.age,
      sex: profile.sex,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      bodyFatPercentage: profile.bodyFatPercentage,
      country: profile.country,
      state: profile.state,
      city: profile.city,
      activityLevel: profile.activityLevel,
      exerciseFrequency: profile.exerciseFrequency,
      primaryExerciseType: profile.primaryExerciseType,
      exerciseDurationMin: profile.exerciseDurationMin,
      exerciseIntensity: profile.exerciseIntensity,
      workRoutine: profile.workRoutine,
      goal: profile.goal,
    });
    const nutrition = calculateNutrition(calculatorInput);

    const foodPrices = await prisma.foodPrice.findMany({
      where: {
        foodId: { in: availableFoods.map((food) => food.id) },
      },
      orderBy: { collectedAt: "desc" },
    });

    const priceMap = new Map<string, number>();
    for (const price of foodPrices) {
      if (!priceMap.has(price.foodId)) {
        priceMap.set(price.foodId, price.pricePerKg / 10);
      }
    }

    const config: DietGenerationConfig = {
      profile,
      nutrition: nutrition.metrics,
      tasteProfile,
      availableFoods,
      mealSlots: ["cafe_manha", "almoco", "jantar", "lanche1", "lanche2"],
    };

    let diet = generateDietGreedy(config);
    const foodsWithPrices = diet.foods.filter((food) => priceMap.has(food.foodId)).length;

    if (algorithm === "LOW_COST" && foodsWithPrices >= 3) {
      const optimizerConfig: OptimizerConfig = {
        availableFoods,
        targetCalories: nutrition.metrics.targetCalories,
        targetProteinG: nutrition.metrics.targetProteinG,
        targetFatG: nutrition.metrics.targetFatG,
        targetCarbsG: nutrition.metrics.targetCarbsG,
        targetFiberG: nutrition.metrics.targetFiberG,
        mealSlots: config.mealSlots,
        slotCalories: distributeCaloriesBySlot(
          nutrition.metrics.targetCalories,
          config.mealSlots
        ),
        constraints: {
          protein: [0.95, 1.05],
          fat: [0.9, 1.1],
          carbs: [0.9, 1.1],
          fiber: [0.8, 1.2],
          costWeight: 0.5,
        },
        excludeFoods: tasteProfile?.aversions
          ? JSON.parse(tasteProfile.aversions as string)
          : [],
        preferFoods: tasteProfile?.stapleFoods
          ? JSON.parse(tasteProfile.stapleFoods as string)
          : [],
        priceMap,
      };

      const optimized = optimizeDietCost(optimizerConfig);
      diet = {
        ...diet,
        foods: optimized.foods,
        totalCalories: optimized.totalCalories,
        totalProteinG: optimized.totalProteinG,
        totalFatG: optimized.totalFatG,
        totalCarbsG: optimized.totalCarbsG,
        totalFiberG: optimized.totalFiberG,
        estimatedCost: optimized.totalCost,
        notes: [
          "Dieta gerada via algoritmo de menor custo.",
          "Otimizado por custo com base nos preços disponíveis.",
        ],
      };
    } else if (algorithm === "LOW_COST") {
      diet.notes.push(
        "Algoritmo de menor custo indisponível por falta de preços suficientes. Dieta gerada com o algoritmo guloso."
      );
    }

    if (algorithm === "GREEDY") {
      const initialCost = calculateDietCost(diet.foods, priceMap);
      diet.estimatedCost = initialCost;
      if (initialCost !== null) {
        diet.notes.push(`Custo estimado inicial: R$ ${initialCost.toFixed(2)}/dia.`);
      } else {
        diet.notes.push("Custo não calculado — preços indisponíveis no banco.");
      }
    }

    const normalizedDiet = normalizeDietFoodsToTargets(diet.foods, nutrition.metrics);
    const recalculatedEstimatedCost = calculateDietCost(normalizedDiet.foods, priceMap);

    diet = {
      ...diet,
      foods: normalizedDiet.foods,
      totalCalories: Math.round(normalizedDiet.totals.totalCalories),
      totalProteinG: Math.round(normalizedDiet.totals.totalProteinG),
      totalFatG: Math.round(normalizedDiet.totals.totalFatG),
      totalCarbsG: Math.round(normalizedDiet.totals.totalCarbsG),
      totalFiberG: Math.round(normalizedDiet.totals.totalFiberG),
      estimatedCost:
        recalculatedEstimatedCost !== null
          ? Math.round(recalculatedEstimatedCost * 100) / 100
          : diet.estimatedCost,
      notes: [
        ...diet.notes,
        `Macros finais aproximados: P ${Math.round(normalizedDiet.totals.totalProteinG)}g, C ${Math.round(normalizedDiet.totals.totalCarbsG)}g, G ${Math.round(normalizedDiet.totals.totalFatG)}g.`,
      ],
    };

    if (
      (normalizedCostRange.minDailyCost !== null || normalizedCostRange.maxDailyCost !== null) &&
      priceMap.size > 0
    ) {
      const tunedDiet = tuneDietCostRange(
        diet.foods,
        attachFoodPrices(availableFoods, priceMap),
        normalizedCostRange
      );
      const tunedTotals = calculateDietTotals(tunedDiet.foods);

      diet = {
        ...diet,
        foods: tunedDiet.foods,
        totalCalories: Math.round(tunedTotals.totalCalories),
        totalProteinG: Math.round(tunedTotals.totalProteinG),
        totalFatG: Math.round(tunedTotals.totalFatG),
        totalCarbsG: Math.round(tunedTotals.totalCarbsG),
        totalFiberG: Math.round(tunedTotals.totalFiberG),
        estimatedCost: tunedDiet.estimatedCost,
        notes: [
          ...diet.notes,
          `Faixa de custo solicitada: ${normalizedCostRange.minDailyCost !== null ? `R$ ${normalizedCostRange.minDailyCost.toFixed(2)}` : "sem mínimo"} até ${normalizedCostRange.maxDailyCost !== null ? `R$ ${normalizedCostRange.maxDailyCost.toFixed(2)}` : "sem máximo"} por dia.`,
          ...tunedDiet.notes,
        ],
      };
    }

    const savedDiet = await prisma.diet.create({
      data: {
        userId,
        name: `Dieta ${new Date().toLocaleDateString("pt-BR")}`,
        source: "ALGORITHM",
        status: "DRAFT",
        totalCalories: diet.totalCalories,
        totalProteinG: diet.totalProteinG,
        totalFatG: diet.totalFatG,
        totalCarbsG: diet.totalCarbsG,
        estimatedCost: diet.estimatedCost,
        context: JSON.stringify({
          targetCalories: nutrition.metrics.targetCalories,
          targetProteinG: nutrition.metrics.targetProteinG,
          targetFatG: nutrition.metrics.targetFatG,
          targetCarbsG: nutrition.metrics.targetCarbsG,
          mealSlots: config.mealSlots,
          algorithm,
          generatedAutomatically: true,
          costRange: normalizedCostRange,
        }),
        aiReasoning: diet.notes.join("; "),
        foods: {
          create: diet.foods.map((dietFood) => ({
            foodId: dietFood.foodId,
            grams: dietFood.grams,
            mealSlot: dietFood.mealSlot,
          })),
        },
      },
    });

    return NextResponse.json(
      {
        diet: savedDiet,
        foods: diet.foods.map((dietFood) => ({
          foodId: dietFood.foodId,
          mealSlot: dietFood.mealSlot,
          name: dietFood.food.name,
          category: dietFood.food.category,
          grams: dietFood.grams,
          calories: (dietFood.grams / 100) * dietFood.food.caloriesKcal,
          protein: (dietFood.grams / 100) * dietFood.food.proteinG,
          fat: (dietFood.grams / 100) * dietFood.food.fatG,
          carbs: (dietFood.grams / 100) * dietFood.food.carbsG,
          fiber: (dietFood.grams / 100) * (dietFood.food.fiberG || 0),
        })),
        summary: {
          totalCalories: diet.totalCalories,
          totalProteinG: diet.totalProteinG,
          totalFatG: diet.totalFatG,
          totalCarbsG: diet.totalCarbsG,
          totalFiberG: diet.totalFiberG,
        },
        notes: diet.notes,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parâmetros inválidos para gerar dieta." },
        { status: 400 }
      );
    }

    console.error("Error generating diet:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar dieta" },
      { status: 500 }
    );
  }
}
