import type { Food } from "@prisma/client";

import { distributeCaloriesBySlot, getMacroTargetsForSlot } from "./meal-planning";

/**
 * Representa uma solução de otimização de dieta
 */
export interface OptimizedDiet extends DietSolution {
  foods: FoodQuantity[];
}

export interface FoodQuantity {
  foodId: string;
  food: Food;
  grams: number;
  mealSlot: string;
}

type SlotFoodSelection = Omit<FoodQuantity, "mealSlot">;

interface NutritionTotals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  cost: number;
}

export interface DietSolution {
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
  totalFiberG: number;
  totalCost: number;
}

/**
 * Configuração do otimizador
 */
export interface OptimizerConfig {
  availableFoods: Food[];
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
  targetFiberG: number;
  mealSlots: string[];
  slotCalories: Record<string, number>;
  constraints: {
    protein: [number, number];
    fat: [number, number];
    carbs: [number, number];
    fiber: [number, number];
    costWeight: number;
  };
  excludeFoods?: string[];
  preferFoods?: string[];
  priceMap?: Map<string, number>;
}

/**
 * Algoritmo de otimização por custo usando heuristic de "cost per nutrient"
 */
export function optimizeDietCost(config: OptimizerConfig): OptimizedDiet {
  const {
    availableFoods,
    targetProteinG,
    targetFatG,
    targetCarbsG,
    mealSlots,
    slotCalories,
    excludeFoods = [],
    preferFoods = [],
    priceMap,
  } = config;

  const excludedFoodIds = resolveFoodIds(availableFoods, excludeFoods);
  const candidateFoods = availableFoods.filter(food => !excludedFoodIds.includes(food.id));
  const preferredFoodIds = resolveFoodIds(candidateFoods, preferFoods);

  const categories = {
    proteina: candidateFoods.filter(food => food.category === "proteina" || food.category === "lacteo"),
    carboidrato: candidateFoods.filter(food => food.category === "carboidrato" || food.category === "fruta"),
    gordura: candidateFoods.filter(food => food.category === "gordura"),
    verdura: candidateFoods.filter(food => food.category === "verdura"),
  };

  const allFoods: FoodQuantity[] = [];

  for (const slot of mealSlots) {
    const targetCaloriesForSlot = slotCalories[slot];
    if (targetCaloriesForSlot <= 0) {
      continue;
    }

    const [targetProteinForSlot, targetFatForSlot, targetCarbsForSlot] =
      getMacroTargetsForSlot(slot, targetCaloriesForSlot);

    const slotFoods = selectFoodsForSlot({
      targetCalories: targetCaloriesForSlot,
      targetProteinG: targetProteinForSlot,
      targetFatG: targetFatForSlot,
      targetCarbsG: targetCarbsForSlot,
      categories,
      preferFoods: preferredFoodIds,
      priceMap,
    });

    for (const slotFood of slotFoods) {
      allFoods.push({
        ...slotFood,
        mealSlot: slot,
      });
    }
  }

  let totals = recalculateTotals(allFoods, priceMap);

  const proteinRatio = totals.protein / targetProteinG;
  const fatRatio = totals.fat / targetFatG;
  const carbsRatio = totals.carbs / targetCarbsG;

  const adjustScale = Math.max(
    0.95 / Math.min(proteinRatio, fatRatio, carbsRatio),
    1.05 / Math.max(proteinRatio, fatRatio, carbsRatio),
    1
  );

  if (Math.abs(adjustScale - 1) > 0.01) {
    for (const food of allFoods) {
      food.grams = Math.round(food.grams * adjustScale);
    }

    totals = recalculateTotals(allFoods, priceMap);
  }

  const usedCategories = new Set(allFoods.map(food => food.food.category));
  if (usedCategories.size < 3) {
    const vegetable = categories.verdura[0];
    if (vegetable && !allFoods.some(food => food.food.category === "verdura")) {
      allFoods.push({
        foodId: vegetable.id,
        food: vegetable,
        grams: 100,
        mealSlot: mealSlots[0],
      });

      totals = recalculateTotals(allFoods, priceMap);
    }
  }

  return {
    foods: allFoods,
    totalCalories: Math.round(totals.calories),
    totalProteinG: Math.round(totals.protein),
    totalFatG: Math.round(totals.fat),
    totalCarbsG: Math.round(totals.carbs),
    totalFiberG: Math.round(totals.fiber),
    totalCost: Math.round(totals.cost * 100) / 100,
  };
}

function selectFoodsForSlot(params: {
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
  categories: Record<string, Food[]>;
  preferFoods: string[];
  priceMap?: Map<string, number>;
}): SlotFoodSelection[] {
  const {
    targetCalories,
    targetProteinG,
    targetFatG,
    targetCarbsG,
    categories,
    preferFoods,
    priceMap,
  } = params;

  const result: SlotFoodSelection[] = [];
  let remainingCalories = targetCalories;

  const proteinSource = selectBestProtein(categories.proteina, preferFoods, priceMap);
  if (proteinSource) {
    const gramsNeeded = (targetProteinG * 100) / proteinSource.proteinG;
    const grams = Math.min(
      gramsNeeded,
      (remainingCalories * 0.4) / (proteinSource.caloriesKcal / 100)
    );

    result.push({
      foodId: proteinSource.id,
      food: proteinSource,
      grams: Math.round(grams),
    });
    remainingCalories -= (result[result.length - 1].grams / 100) * proteinSource.caloriesKcal;
  }

  const carbSource = selectBestCarb(categories.carboidrato, preferFoods, priceMap);
  if (carbSource) {
    const gramsNeeded = (targetCarbsG * 100) / carbSource.carbsG;
    const grams = Math.min(
      gramsNeeded,
      (remainingCalories * 0.6) / (carbSource.caloriesKcal / 100)
    );

    result.push({
      foodId: carbSource.id,
      food: carbSource,
      grams: Math.round(grams),
    });
    remainingCalories -= (result[result.length - 1].grams / 100) * carbSource.caloriesKcal;
  }

  const fatSource = categories.gordura[0];
  if (fatSource) {
    const gramsNeeded = (targetFatG * 100) / fatSource.fatG;
    const grams = Math.min(
      gramsNeeded,
      (remainingCalories * 0.9) / (fatSource.caloriesKcal / 100)
    );

    result.push({
      foodId: fatSource.id,
      food: fatSource,
      grams: Math.round(Math.max(grams, 5)),
    });
    remainingCalories -= (result[result.length - 1].grams / 100) * fatSource.caloriesKcal;
  }

  const vegetableSource = categories.verdura[0];
  if (vegetableSource && remainingCalories > 50) {
    result.push({
      foodId: vegetableSource.id,
      food: vegetableSource,
      grams: 100,
    });
  }

  return result;
}

function selectBestProtein(
  proteins: Food[],
  preferFoods: string[],
  priceMap?: Map<string, number>
): Food | null {
  if (proteins.length === 0) {
    return null;
  }

  const preferred = proteins.filter(food => preferFoods.includes(food.id));
  return preferred.length > 0
    ? preferBestByCostPerProtein(preferred, priceMap)
    : preferBestByCostPerProtein(proteins, priceMap);
}

function selectBestCarb(
  carbs: Food[],
  preferFoods: string[],
  priceMap?: Map<string, number>
): Food | null {
  if (carbs.length === 0) {
    return null;
  }

  const preferred = carbs.filter(food => preferFoods.includes(food.id));
  return preferred.length > 0
    ? preferBestByCostPerCarb(preferred, priceMap)
    : preferBestByCostPerCarb(carbs, priceMap);
}

function preferBestByCostPerProtein(
  foods: Food[],
  priceMap?: Map<string, number>
): Food {
  return foods
    .filter(food => food.proteinG > 5)
    .sort((left, right) => {
      const leftPrice = getFoodPrice(left, priceMap) || Number.POSITIVE_INFINITY;
      const rightPrice = getFoodPrice(right, priceMap) || Number.POSITIVE_INFINITY;
      return leftPrice / left.proteinG - rightPrice / right.proteinG;
    })[0] ?? foods[0];
}

function preferBestByCostPerCarb(
  foods: Food[],
  priceMap?: Map<string, number>
): Food {
  return foods
    .filter(food => food.carbsG > 10)
    .sort((left, right) => {
      const leftPrice = getFoodPrice(left, priceMap) || Number.POSITIVE_INFINITY;
      const rightPrice = getFoodPrice(right, priceMap) || Number.POSITIVE_INFINITY;
      return leftPrice / left.carbsG - rightPrice / right.carbsG;
    })[0] ?? foods[0];
}

function resolveFoodIds(foods: Food[], identifiers: string[]): string[] {
  const normalizedIdentifiers = identifiers.map(identifier => identifier.trim().toLowerCase());

  return foods
    .filter(
      food =>
        normalizedIdentifiers.includes(food.id.toLowerCase()) ||
        normalizedIdentifiers.includes(food.name.toLowerCase())
    )
    .map(food => food.id);
}

function recalculateTotals(
  foods: FoodQuantity[],
  priceMap?: Map<string, number>
): NutritionTotals {
  return foods.reduce<NutritionTotals>(
    (totals, food) => {
      const factor = food.grams / 100;
      totals.calories += factor * food.food.caloriesKcal;
      totals.protein += factor * food.food.proteinG;
      totals.fat += factor * food.food.fatG;
      totals.carbs += factor * food.food.carbsG;
      totals.fiber += factor * (food.food.fiberG || 0);
      totals.cost += factor * (getFoodPrice(food.food, priceMap) || 0);
      return totals;
    },
    {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      cost: 0,
    }
  );
}

export function getFoodPrice(food: Food, priceMap?: Map<string, number>): number | null {
  if (priceMap && priceMap.has(food.id)) {
    return priceMap.get(food.id) ?? null;
  }

  return null;
}

export { distributeCaloriesBySlot };
