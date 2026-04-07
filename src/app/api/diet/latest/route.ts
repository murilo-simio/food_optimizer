import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Buscar dieta mais recente (DRAFT ou ACTIVE)
    const diet = await prisma.diet.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        foods: {
          include: {
            food: true,
          },
        },
      },
    });

    if (!diet) {
      return NextResponse.json({ error: "Dieta não encontrada" }, { status: 404 });
    }

    // Formatar resposta
    const formattedFoods = diet.foods.map(df => ({
      foodId: df.foodId,
      name: df.food.name,
      category: df.food.category,
      grams: df.grams,
      calories: (df.grams / 100) * df.food.caloriesKcal,
      protein: (df.grams / 100) * df.food.proteinG,
      fat: (df.grams / 100) * df.food.fatG,
      carbs: (df.grams / 100) * df.food.carbsG,
      fiber: (df.grams / 100) * (df.food.fiberG || 0),
    }));

    // Calcular totais
    let totalCal = 0, totalP = 0, totalF = 0, totalC = 0, totalFib = 0;
    formattedFoods.forEach((f: any) => {
      totalCal += f.calories;
      totalP += f.protein;
      totalF += f.fat;
      totalC += f.carbs;
      totalFib += f.fiber;
    });

    return NextResponse.json({
      diet: {
        id: diet.id,
        name: diet.name,
        source: diet.source,
        status: diet.status,
        totalCalories: diet.totalCalories,
        totalProteinG: diet.totalProteinG,
        totalFatG: diet.totalFatG,
        totalCarbsG: diet.totalCarbsG,
        estimatedCost: diet.estimatedCost,
        createdAt: diet.createdAt,
      },
      foods: formattedFoods,
      summary: {
        totalCalories: Math.round(totalCal),
        totalProteinG: Math.round(totalP),
        totalFatG: Math.round(totalF),
        totalCarbsG: Math.round(totalC),
        totalFiberG: Math.round(totalFib),
      },
      notes: diet.aiReasoning ? diet.aiReasoning.split("; ") : [],
    });
  } catch (error) {
    console.error("Error fetching diet:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}