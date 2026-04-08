import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDietTotals, formatDietFoods } from "@/lib/diets";

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
    const formattedFoods = formatDietFoods(diet.foods);
    const totals = calculateDietTotals(diet.foods);

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
        totalCalories: Math.round(totals.totalCalories),
        totalProteinG: Math.round(totals.totalProteinG),
        totalFatG: Math.round(totals.totalFatG),
        totalCarbsG: Math.round(totals.totalCarbsG),
        totalFiberG: Math.round(totals.totalFiberG),
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
