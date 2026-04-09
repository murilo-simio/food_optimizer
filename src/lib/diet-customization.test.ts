import { describe, expect, it } from "vitest";

import {
  attachFoodPrices,
  calculateReplacementGrams,
  rebalanceMealToTargetTotals,
  sortFoodCatalog,
  suggestSimilarFoods,
  tuneDietCostRange,
} from "./diet-customization";
import { calculateDietTotals } from "./diets";
import { makeFood } from "../test/factories";

describe("diet customization helpers", () => {
  const currentProtein = makeFood({
    id: "current-protein",
    name: "frango grelhado",
    category: "proteina",
    caloriesKcal: 165,
    proteinG: 31,
    fatG: 3.6,
    carbsG: 0,
  });
  const similarProtein = makeFood({
    id: "similar-protein",
    name: "patinho moido",
    category: "proteina",
    caloriesKcal: 170,
    proteinG: 29,
    fatG: 5,
    carbsG: 0,
  });
  const cheapProtein = makeFood({
    id: "cheap-protein",
    name: "frango economico",
    category: "proteina",
    caloriesKcal: 160,
    proteinG: 30,
    fatG: 3.5,
    carbsG: 0,
  });
  const carb = makeFood({
    id: "carb",
    name: "arroz branco",
    category: "carboidrato",
    caloriesKcal: 130,
    proteinG: 2.5,
    fatG: 0.3,
    carbsG: 28,
  });
  const expensiveCarb = makeFood({
    id: "expensive-carb",
    name: "arroz premium",
    category: "carboidrato",
    caloriesKcal: 130,
    proteinG: 2.5,
    fatG: 0.3,
    carbsG: 28,
  });

  it("sorts the food catalog by price with nulls last", () => {
    const foods = attachFoodPrices(
      [currentProtein, carb, similarProtein],
      new Map<string, number>([
        [currentProtein.id, 3.2],
        [carb.id, 0.6],
      ])
    );

    const sorted = sortFoodCatalog(foods, "price");

    expect(sorted.map((food) => food.id)).toEqual([
      carb.id,
      currentProtein.id,
      similarProtein.id,
    ]);
  });

  it("calculates replacement grams close to the original nutritional load", () => {
    const currentItem = {
      foodId: currentProtein.id,
      food: currentProtein,
      grams: 150,
      mealSlot: "almoco",
    };

    const replacementGrams = calculateReplacementGrams(currentItem, similarProtein);
    const currentCalories = (currentItem.grams / 100) * currentProtein.caloriesKcal;
    const replacementCalories = (replacementGrams / 100) * similarProtein.caloriesKcal;

    expect(replacementGrams).toBeGreaterThan(0);
    expect(Math.abs(replacementCalories - currentCalories)).toBeLessThan(25);
  });

  it("suggests nutritionally similar foods before unrelated options", () => {
    const currentItem = {
      foodId: currentProtein.id,
      food: currentProtein,
      grams: 150,
      mealSlot: "almoco",
    };

    const suggestions = suggestSimilarFoods(
      currentItem,
      attachFoodPrices(
        [similarProtein, carb],
        new Map<string, number>([
          [similarProtein.id, 3.5],
          [carb.id, 0.6],
        ])
      ),
      2
    );

    expect(suggestions[0]?.id).toBe(similarProtein.id);
    expect(suggestions[0]?.suggestedGrams).toBeGreaterThan(0);
  });

  it("rebalances the whole meal after a replacement to keep meal macros close to the original target", () => {
    const oliveOil = makeFood({
      id: "olive-oil",
      name: "azeite",
      category: "gordura",
      caloriesKcal: 884,
      proteinG: 0,
      fatG: 100,
      carbsG: 0,
    });
    const originalMeal = [
      {
        foodId: currentProtein.id,
        food: currentProtein,
        grams: 160,
        mealSlot: "almoco",
      },
      {
        foodId: carb.id,
        food: carb,
        grams: 180,
        mealSlot: "almoco",
      },
      {
        foodId: oliveOil.id,
        food: oliveOil,
        grams: 12,
        mealSlot: "almoco",
      },
    ];
    const replacedMeal = [
      {
        foodId: similarProtein.id,
        food: similarProtein,
        grams: calculateReplacementGrams(originalMeal[0], similarProtein),
        mealSlot: "almoco",
      },
      originalMeal[1],
      originalMeal[2],
    ];

    const originalTotals = calculateDietTotals(originalMeal);
    const rebalanced = rebalanceMealToTargetTotals(originalMeal, replacedMeal);

    expect(rebalanced.totals.totalCalories).toBeCloseTo(originalTotals.totalCalories, 0);
    expect(rebalanced.totals.totalProteinG).toBeCloseTo(originalTotals.totalProteinG, 0);
    expect(rebalanced.totals.totalCarbsG).toBeCloseTo(originalTotals.totalCarbsG, 0);
    expect(rebalanced.totals.totalFatG).toBeCloseTo(originalTotals.totalFatG, 0);
    expect(rebalanced.foods.find((food) => food.foodId === similarProtein.id)?.grams).not.toBe(
      replacedMeal[0].grams
    );
  });

  it("tunes the diet down to a cheaper daily range when similar alternatives exist", () => {
    const currentFoods = [
      {
        foodId: currentProtein.id,
        food: currentProtein,
        grams: 180,
        mealSlot: "almoco",
      },
      {
        foodId: expensiveCarb.id,
        food: expensiveCarb,
        grams: 220,
        mealSlot: "almoco",
      },
    ];

    const catalog = attachFoodPrices(
      [currentProtein, similarProtein, cheapProtein, carb, expensiveCarb],
      new Map<string, number>([
        [currentProtein.id, 4.8],
        [similarProtein.id, 5.1],
        [cheapProtein.id, 2.6],
        [carb.id, 0.7],
        [expensiveCarb.id, 2.2],
      ])
    );

    const tuned = tuneDietCostRange(currentFoods, catalog, {
      maxDailyCost: 6.3,
    });

    expect(tuned.withinRange).toBe(true);
    expect(tuned.estimatedCost).not.toBeNull();
    expect(tuned.estimatedCost!).toBeLessThanOrEqual(6.3);
    expect(tuned.foods.some((food) => food.foodId === cheapProtein.id)).toBe(true);
    expect(tuned.foods.some((food) => food.foodId === carb.id)).toBe(true);
  });
});
