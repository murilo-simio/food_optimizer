import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNutrition } from "@/lib/calculators";
import { buildCalculatorInput } from "@/lib/calculators/adapters";
import { generateDietGreedy, DietGenerationConfig } from "@/lib/diet-builder";
import {
  calculateDietCost,
  normalizeDietFoodsToTargets,
} from "@/lib/diets";
import {
  distributeCaloriesBySlot,
  optimizeDietCost,
  OptimizerConfig,
} from "@/lib/optimizer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // 1. Buscar perfil do usuário
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado. Complete o onboarding primeiro." },
        { status: 404 }
      );
    }

    // 2. Buscar tasteProfile (se existir)
    const tasteProfile = await prisma.tasteProfile.findUnique({
      where: { userId },
    });

    // 3. Buscar todos os alimentos disponíveis
    const availableFoods = await prisma.food.findMany({
      orderBy: { name: "asc" },
    });

    if (availableFoods.length === 0) {
      return NextResponse.json(
        { error: "Nenhum alimento cadastrado no banco. Execute o seed primeiro." },
        { status: 500 }
      );
    }

    // 4. Calcular necessidades nutricionais
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

    // 5. Buscar preços de alimentos
    const foodPrices = await prisma.foodPrice.findMany({
      where: {
        foodId: { in: availableFoods.map(f => f.id) },
      },
      orderBy: { collectedAt: "desc" },
    });

    // Mapear preço por foodId (usar o mais recente)
    const priceMap = new Map<string, number>();
    for (const price of foodPrices) {
      priceMap.set(price.foodId, price.pricePerKg / 10); // converter para preço por 100g
    }

    // 6. Configurar geração de dieta
    const config: DietGenerationConfig = {
      profile,
      nutrition: nutrition.metrics,
      tasteProfile,
      availableFoods,
      mealSlots: ["cafe_manha", "almoco", "jantar", "lanche1", "lanche2"],
    };

    // 7. Gerar dieta inicial (gulosa)
    let diet = generateDietGreedy(config);

    // 8. Se houver preços suficientes, otimizar por custo
    const foodsWithPrices = diet.foods.filter(f => priceMap.has(f.foodId)).length;
    if (foodsWithPrices >= 3) {
      const optimizerConfig: OptimizerConfig = {
        availableFoods,
        targetCalories: nutrition.metrics.targetCalories,
        targetProteinG: nutrition.metrics.targetProteinG,
        targetFatG: nutrition.metrics.targetFatG,
        targetCarbsG: nutrition.metrics.targetCarbsG,
        targetFiberG: nutrition.metrics.targetFiberG,
        mealSlots: config.mealSlots,
        slotCalories: distributeCaloriesBySlot(nutrition.metrics.targetCalories, config.mealSlots),
        constraints: {
          protein: [0.95, 1.05],
          fat: [0.9, 1.1],
          carbs: [0.9, 1.1],
          fiber: [0.8, 1.2],
          costWeight: 0.5, // equilibrar custo e nutrição
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
        notes: [...diet.notes, "Otimizado por custo com base nos preços disponíveis."],
      };
    } else {
      diet.estimatedCost = null;
      diet.notes.push("Custo não calculado — preços indisponíveis no banco.");
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

    // 7. Salvar dieta no banco
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
        }),
        aiReasoning: diet.notes.join("; "),
        foods: {
          create: diet.foods.map(df => ({
            foodId: df.foodId,
            grams: df.grams,
            mealSlot: df.mealSlot,
          })),
        },
      },
    });

    // 8. Retornar dieta completa
    return NextResponse.json({
      diet: savedDiet,
      foods: diet.foods.map(df => ({
        foodId: df.foodId,
        mealSlot: df.mealSlot,
        name: df.food.name,
        category: df.food.category,
        grams: df.grams,
        calories: (df.grams / 100) * df.food.caloriesKcal,
        protein: (df.grams / 100) * df.food.proteinG,
        fat: (df.grams / 100) * df.food.fatG,
        carbs: (df.grams / 100) * df.food.carbsG,
        fiber: (df.grams / 100) * (df.food.fiberG || 0),
      })),
      summary: {
        totalCalories: diet.totalCalories,
        totalProteinG: diet.totalProteinG,
        totalFatG: diet.totalFatG,
        totalCarbsG: diet.totalCarbsG,
        totalFiberG: diet.totalFiberG,
      },
      notes: diet.notes,
    }, { status: 201 });
  } catch (error) {
    console.error("Error generating diet:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar dieta" },
      { status: 500 }
    );
  }
}
