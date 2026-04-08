import { describe, expect, it } from "vitest";

import {
  calculateDietCost,
  calculateDietTotals,
  formatDietFoods,
  normalizeDietFoodsToTargets,
} from "./diets";
import { makeFood } from "../test/factories";

describe("diet helpers", () => {
  const chicken = makeFood({
    id: "chicken",
    name: "frango",
    category: "proteina",
    caloriesKcal: 200,
    proteinG: 30,
    fatG: 8,
    carbsG: 0,
  });
  const rice = makeFood({
    id: "rice",
    name: "arroz",
    category: "carboidrato",
    caloriesKcal: 130,
    proteinG: 2,
    fatG: 0.3,
    carbsG: 28,
  });
  const oil = makeFood({
    id: "oil",
    name: "azeite",
    category: "gordura",
    caloriesKcal: 884,
    proteinG: 0,
    fatG: 100,
    carbsG: 0,
  });

  const foods = [
    { foodId: chicken.id, mealSlot: "almoco", grams: 100, food: chicken },
    { foodId: rice.id, mealSlot: "almoco", grams: 100, food: rice },
    { foodId: oil.id, mealSlot: "almoco", grams: 10, food: oil },
  ];

  it("formats foods and calculates totals consistently", () => {
    const formatted = formatDietFoods(foods);
    const totals = calculateDietTotals(foods);

    expect(formatted[0]).toMatchObject({
      foodId: "chicken",
      mealSlot: "almoco",
      calories: 200,
      protein: 30,
    });
    expect(totals).toMatchObject({
      totalCalories: 418.4,
      totalProteinG: 32,
      totalFatG: 18.3,
      totalCarbsG: 28,
      totalFiberG: 0,
    });
  });

  it("normalizes grams toward macro targets and recalculates totals", () => {
    const normalized = normalizeDietFoodsToTargets(foods, {
      targetCalories: 550,
      targetProteinG: 40,
      targetFatG: 20,
      targetCarbsG: 60,
      targetFiberG: 10,
    });

    expect(normalized.foods.find(food => food.foodId === chicken.id)?.grams).toBeGreaterThan(100);
    expect(normalized.foods.find(food => food.foodId === rice.id)?.grams).toBeGreaterThan(100);
    expect(normalized.totals.totalProteinG).toBeGreaterThan(32);
    expect(normalized.totals.totalCarbsG).toBeGreaterThan(28);
  });

  it("calculates diet cost from the provided price map", () => {
    const totalCost = calculateDietCost(
      foods,
      new Map<string, number>([
        [chicken.id, 3],
        [rice.id, 0.7],
        [oil.id, 1.5],
      ])
    );

    expect(totalCost).toBe(3.85);
  });
});
