import type { Food, TasteProfile, UserProfile } from "@prisma/client";

import type { CalculatedMetrics } from "./calculators/types";
import {
  distributeCaloriesBySlot,
  getMacroDistributionForSlot,
} from "./meal-planning";

/**
 * Representa um alimento com quantidade sugerida em uma refeição
 */
export interface DietFood {
  foodId: string;
  food: Food;
  grams: number;
  mealSlot: string;
}

/**
 * Dieta completa gerada
 */
export interface GeneratedDiet {
  foods: DietFood[];
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
  totalFiberG: number;
  estimatedCost: number | null;
  notes: string[];
}

/**
 * Configurações para geração de dieta
 */
export interface DietGenerationConfig {
  profile: UserProfile;
  nutrition: CalculatedMetrics;
  tasteProfile?: TasteProfile | null;
  availableFoods: Food[];
  mealSlots: string[];
}

/**
 * Algoritmo guloso para montar dieta
 */
export function generateDietGreedy(config: DietGenerationConfig): GeneratedDiet {
  const { profile, nutrition, tasteProfile, availableFoods, mealSlots } = config;
  const { targetCalories, targetProteinG, targetFatG, targetCarbsG } = nutrition;

  const dietFoods: DietFood[] = [];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber = 0;

  let allowedFoods = filterFoodsByRestrictions(availableFoods, profile.dietaryRestrictions);

  const aversionNames = parsePreferenceNames(tasteProfile?.aversions);
  if (aversionNames.length > 0) {
    allowedFoods = allowedFoods.filter(food => !aversionNames.includes(food.name.toLowerCase()));
  }

  const slotCalories = distributeCaloriesBySlot(targetCalories, mealSlots);
  const stapleFoodNames = parsePreferenceNames(tasteProfile?.stapleFoods);

  const proteins = filterByCategory(allowedFoods, ["proteina", "lacteo"]);
  const carbs = filterByCategory(allowedFoods, ["carboidrato", "fruta"]);
  const fats = filterByCategory(allowedFoods, ["gordura"]);
  const vegetables = filterByCategory(allowedFoods, ["verdura"]);

  for (const slot of mealSlots) {
    const slotTargetCal = slotCalories[slot];
    const slotFoods: DietFood[] = [];

    const [proteinPct, fatPct, carbPct] = getMacroDistributionForSlot(slot);
    const slotTargetProtein = (slotTargetCal * proteinPct) / 4;
    const slotTargetFat = (slotTargetCal * fatPct) / 9;
    const slotTargetCarbs = (slotTargetCal * carbPct) / 4;

    const proteinSource =
      proteins.find(
        food =>
          stapleFoodNames.includes(food.name.toLowerCase()) &&
          food.proteinG > 10
      ) ??
      proteins
        .filter(food => food.proteinG > 15)
        .sort((left, right) => right.proteinG - left.proteinG)[0] ??
      proteins[0] ??
      null;

    if (proteinSource) {
      slotFoods.push({
        foodId: proteinSource.id,
        food: proteinSource,
        grams: slotTargetProtein * 0.4,
        mealSlot: slot,
      });
    }

    const carbSource =
      carbs.find(food => stapleFoodNames.includes(food.name.toLowerCase())) ??
      carbs
        .filter(food => food.carbsG > 15)
        .sort((left, right) => right.carbsG - left.carbsG)[0] ??
      carbs[0] ??
      null;

    if (carbSource) {
      slotFoods.push({
        foodId: carbSource.id,
        food: carbSource,
        grams: slotTargetCarbs * 0.6,
        mealSlot: slot,
      });
    }

    const fatSource = fats[0] ?? null;
    if (fatSource) {
      slotFoods.push({
        foodId: fatSource.id,
        food: fatSource,
        grams: slotTargetFat * 0.8,
        mealSlot: slot,
      });
    }

    const vegetableSource = vegetables[0] ?? null;
    if (vegetableSource) {
      slotFoods.push({
        foodId: vegetableSource.id,
        food: vegetableSource,
        grams: 100,
        mealSlot: slot,
      });
    }

    for (const dietFood of slotFoods) {
      dietFoods.push(dietFood);
      totalCalories += (dietFood.grams / 100) * dietFood.food.caloriesKcal;
      totalProtein += (dietFood.grams / 100) * dietFood.food.proteinG;
      totalFat += (dietFood.grams / 100) * dietFood.food.fatG;
      totalCarbs += (dietFood.grams / 100) * dietFood.food.carbsG;
      totalFiber += (dietFood.grams / 100) * (dietFood.food.fiberG || 0);
    }
  }

  const calorieDiff = targetCalories - totalCalories;
  if (Math.abs(calorieDiff) > 50 && totalCalories > 0) {
    const scaleFactor = targetCalories / totalCalories;
    for (const dietFood of dietFoods) {
      dietFood.grams = Math.round(dietFood.grams * scaleFactor);
    }

    totalCalories = 0;
    totalProtein = 0;
    totalFat = 0;
    totalCarbs = 0;
    totalFiber = 0;

    for (const dietFood of dietFoods) {
      totalCalories += (dietFood.grams / 100) * dietFood.food.caloriesKcal;
      totalProtein += (dietFood.grams / 100) * dietFood.food.proteinG;
      totalFat += (dietFood.grams / 100) * dietFood.food.fatG;
      totalCarbs += (dietFood.grams / 100) * dietFood.food.carbsG;
      totalFiber += (dietFood.grams / 100) * (dietFood.food.fiberG || 0);
    }
  }

  return {
    foods: dietFoods,
    totalCalories: Math.round(totalCalories),
    totalProteinG: Math.round(totalProtein),
    totalFatG: Math.round(totalFat),
    totalCarbsG: Math.round(totalCarbs),
    totalFiberG: Math.round(totalFiber),
    estimatedCost: null,
    notes: [
      "Dieta gerada via algoritmo guloso.",
      `Meta calórica: ${targetCalories} kcal, atingida: ${Math.round(totalCalories)} kcal.`,
      `Proteína: ${Math.round(totalProtein)}g/${targetProteinG}g, Gordura: ${Math.round(totalFat)}g/${targetFatG}g, Carbos: ${Math.round(totalCarbs)}g/${targetCarbsG}g.`,
    ],
  };
}

function filterFoodsByRestrictions(foods: Food[], restriction: string): Food[] {
  switch (restriction) {
    case "VEGAN":
      return foods.filter(
        food =>
          food.category !== "lacteo" &&
          (food.category !== "proteina" || isPlantProtein(food))
      );
    case "VEGETARIAN":
      return foods.filter(food => food.category !== "proteina" || isPlantProtein(food));
    case "LACTOSE_FREE":
      return foods.filter(food => food.category !== "lacteo");
    case "GLUTEN_FREE":
      return foods.filter(food => {
        const normalizedName = food.name.toLowerCase();
        return !normalizedName.includes("pão") && !normalizedName.includes("aveia");
      });
    case "LOW_CARB":
      return foods.filter(food => food.carbsG < 30);
    case "KETO":
      return foods.filter(food => food.fatG > 0 && food.carbsG < 5);
    default:
      return foods;
  }
}

function filterByCategory(foods: Food[], categories: string[]): Food[] {
  return foods.filter(food => categories.includes(food.category));
}

function parsePreferenceNames(serializedList?: string | null): string[] {
  if (!serializedList) {
    return [];
  }

  try {
    const parsed = JSON.parse(serializedList);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(item => String(item).trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

function isPlantProtein(food: Food): boolean {
  const normalizedName = food.name.toLowerCase();
  return normalizedName.includes("feij") || normalizedName.includes("lentilha");
}
