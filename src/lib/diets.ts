import type { CalculatedMetrics } from "./calculators";

export interface DietFoodLike {
  foodId: string;
  grams: number;
  mealSlot: string;
  food: {
    name: string;
    category: string;
    caloriesKcal: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
    fiberG: number | null;
  };
}

export interface DietTotals {
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
  totalFiberG: number;
}

export interface FormattedDietFood {
  foodId: string;
  mealSlot: string;
  name: string;
  category: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateDietTotals<T extends DietFoodLike>(foods: T[]): DietTotals {
  return foods.reduce<DietTotals>(
    (totals, item) => {
      totals.totalCalories += (item.grams / 100) * item.food.caloriesKcal;
      totals.totalProteinG += (item.grams / 100) * item.food.proteinG;
      totals.totalFatG += (item.grams / 100) * item.food.fatG;
      totals.totalCarbsG += (item.grams / 100) * item.food.carbsG;
      totals.totalFiberG += (item.grams / 100) * (item.food.fiberG || 0);
      return totals;
    },
    {
      totalCalories: 0,
      totalProteinG: 0,
      totalFatG: 0,
      totalCarbsG: 0,
      totalFiberG: 0,
    }
  );
}

export function normalizeDietFoodsToTargets<T extends DietFoodLike>(
  foods: T[],
  targets: Pick<
    CalculatedMetrics,
    "targetCalories" | "targetProteinG" | "targetFatG" | "targetCarbsG" | "targetFiberG"
  >
): { foods: T[]; totals: DietTotals } {
  let normalizedFoods = foods.map(food => ({
    ...food,
    grams: Math.max(1, Math.round(food.grams)),
  }));

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const totals = calculateDietTotals(normalizedFoods);
    const proteinScale =
      totals.totalProteinG > 0
        ? clamp(targets.targetProteinG / totals.totalProteinG, 0.25, 4)
        : 1;
    const carbScale =
      totals.totalCarbsG > 0
        ? clamp(targets.targetCarbsG / totals.totalCarbsG, 0.25, 4)
        : 1;
    const fatScale =
      totals.totalFatG > 0
        ? clamp(targets.targetFatG / totals.totalFatG, 0.25, 4)
        : 1;

    normalizedFoods = normalizedFoods.map(food => {
      const { category } = food.food;

      if (category === "proteina" || category === "lacteo" || category === "suplemento") {
        return {
          ...food,
          grams: Math.max(1, Math.round(food.grams * proteinScale)),
        };
      }

      if (category === "carboidrato" || category === "fruta") {
        return {
          ...food,
          grams: Math.max(1, Math.round(food.grams * carbScale)),
        };
      }

      if (category === "gordura") {
        return {
          ...food,
          grams: Math.max(1, Math.round(food.grams * fatScale)),
        };
      }

      return food;
    });
  }

  return {
    foods: normalizedFoods,
    totals: calculateDietTotals(normalizedFoods),
  };
}

export function calculateDietCost(
  foods: Pick<DietFoodLike, "foodId" | "grams">[],
  priceMap: Map<string, number>
): number | null {
  if (priceMap.size === 0) {
    return null;
  }

  const total = foods.reduce((sum, item) => {
    const pricePer100g = priceMap.get(item.foodId) ?? 0;
    return sum + (item.grams / 100) * pricePer100g;
  }, 0);

  return Math.round(total * 100) / 100;
}

export function formatDietFoods<T extends DietFoodLike>(foods: T[]): FormattedDietFood[] {
  return foods.map(item => ({
    foodId: item.foodId,
    mealSlot: item.mealSlot,
    name: item.food.name,
    category: item.food.category,
    grams: item.grams,
    calories: (item.grams / 100) * item.food.caloriesKcal,
    protein: (item.grams / 100) * item.food.proteinG,
    fat: (item.grams / 100) * item.food.fatG,
    carbs: (item.grams / 100) * item.food.carbsG,
    fiber: (item.grams / 100) * (item.food.fiberG || 0),
  }));
}
