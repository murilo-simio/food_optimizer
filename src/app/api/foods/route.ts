import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  attachFoodPrices,
  filterFoodCatalog,
  sortFoodCatalog,
} from "@/lib/diet-customization";
import { prisma } from "@/lib/prisma";

const foodsQuerySchema = z.object({
  query: z.string().optional().default(""),
  sortBy: z
    .enum(["name", "price", "protein", "carbs", "fat", "calories"])
    .optional()
    .default("name"),
  direction: z.enum(["asc", "desc"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const params = foodsQuerySchema.parse({
      query: req.nextUrl.searchParams.get("query") ?? undefined,
      sortBy: req.nextUrl.searchParams.get("sortBy") ?? undefined,
      direction: req.nextUrl.searchParams.get("direction") ?? undefined,
    });

    const foods = await prisma.food.findMany({
      orderBy: { name: "asc" },
    });
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

    const catalog = sortFoodCatalog(
      filterFoodCatalog(attachFoodPrices(foods, priceMap), params.query),
      params.sortBy,
      params.direction
    );

    return NextResponse.json({
      foods: catalog.map((food) => ({
        id: food.id,
        name: food.name,
        category: food.category,
        caloriesKcal: food.caloriesKcal,
        proteinG: food.proteinG,
        fatG: food.fatG,
        carbsG: food.carbsG,
        fiberG: food.fiberG,
        pricePer100g: food.pricePer100g,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parâmetros inválidos para buscar alimentos." },
        { status: 400 }
      );
    }

    console.error("Error listing foods:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar alimentos." },
      { status: 500 }
    );
  }
}
