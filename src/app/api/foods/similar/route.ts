import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { attachFoodPrices, suggestSimilarFoods } from "@/lib/diet-customization";
import { prisma } from "@/lib/prisma";

const similarFoodsQuerySchema = z.object({
  foodId: z.string().min(1),
  grams: z.coerce.number().min(1).max(1000).optional().default(100),
  limit: z.coerce.number().min(1).max(10).optional().default(5),
});

export async function GET(req: NextRequest) {
  try {
    const params = similarFoodsQuerySchema.parse({
      foodId: req.nextUrl.searchParams.get("foodId"),
      grams: req.nextUrl.searchParams.get("grams") ?? undefined,
      limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const foods = await prisma.food.findMany({
      orderBy: { name: "asc" },
    });
    const currentFood = foods.find((food) => food.id === params.foodId);

    if (!currentFood) {
      return NextResponse.json(
        { error: "Alimento atual não encontrado." },
        { status: 404 }
      );
    }

    const prices = await prisma.foodPrice.findMany({
      where: {
        foodId: { in: foods.map((food) => food.id) },
      },
      orderBy: { collectedAt: "desc" },
    });

    const priceMap = new Map<string, number>();
    for (const price of prices) {
      if (!priceMap.has(price.foodId)) {
        priceMap.set(price.foodId, price.pricePerKg / 10);
      }
    }

    const suggestions = suggestSimilarFoods(
      {
        foodId: currentFood.id,
        food: currentFood,
        grams: params.grams,
        mealSlot: "substituicao",
      },
      attachFoodPrices(foods, priceMap),
      params.limit
    );

    return NextResponse.json({
      foods: suggestions.map((food) => ({
        id: food.id,
        name: food.name,
        category: food.category,
        caloriesKcal: food.caloriesKcal,
        proteinG: food.proteinG,
        fatG: food.fatG,
        carbsG: food.carbsG,
        fiberG: food.fiberG,
        pricePer100g: food.pricePer100g,
        suggestedGrams: food.suggestedGrams,
        similarityScore: food.similarityScore,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parâmetros inválidos para sugerir alimentos." },
        { status: 400 }
      );
    }

    console.error("Error suggesting similar foods:", error);
    return NextResponse.json(
      { error: "Erro interno ao sugerir alimentos." },
      { status: 500 }
    );
  }
}
