import { describe, expect, it } from "vitest";

import { distributeCaloriesBySlot, getFoodPrice, optimizeDietCost } from "./optimizer";
import { makeFood } from "../test/factories";

describe("distributeCaloriesBySlot", () => {
  it("normalizes the meal split and preserves the total calorie target", () => {
    const distribution = distributeCaloriesBySlot(2000, [
      "cafe_manha",
      "almoco",
      "jantar",
      "lanche1",
    ]);

    expect(Object.values(distribution).reduce((sum, value) => sum + value, 0)).toBe(2000);
    expect(distribution.almoco).toBeGreaterThan(distribution.cafe_manha);
    expect(distribution.cafe_manha).toBeGreaterThan(distribution.lanche1);
  });
});

describe("getFoodPrice", () => {
  it("returns the price per 100g when the map contains the food id", () => {
    const food = makeFood({ id: "arroz" });
    const priceMap = new Map<string, number>([["arroz", 0.65]]);

    expect(getFoodPrice(food, priceMap)).toBe(0.65);
    expect(getFoodPrice(food)).toBeNull();
  });
});

describe("optimizeDietCost", () => {
  const cheapProtein = makeFood({
    id: "frango-barato",
    name: "frango barato",
    category: "proteina",
    caloriesKcal: 150,
    proteinG: 25,
    fatG: 3,
    carbsG: 0,
  });
  const expensiveProtein = makeFood({
    id: "frango-premium",
    name: "frango premium",
    category: "proteina",
    caloriesKcal: 150,
    proteinG: 25,
    fatG: 3,
    carbsG: 0,
  });
  const cheapCarb = makeFood({
    id: "arroz-barato",
    name: "arroz barato",
    category: "carboidrato",
    caloriesKcal: 130,
    proteinG: 2,
    fatG: 0,
    carbsG: 28,
  });
  const premiumCarb = makeFood({
    id: "mandioca-premium",
    name: "mandioca premium",
    category: "carboidrato",
    caloriesKcal: 130,
    proteinG: 2,
    fatG: 0,
    carbsG: 28,
  });
  const fatSource = makeFood({
    id: "azeite",
    name: "azeite",
    category: "gordura",
    caloriesKcal: 884,
    proteinG: 0,
    fatG: 100,
    carbsG: 0,
  });
  const vegetable = makeFood({
    id: "brocolis",
    name: "brocolis",
    category: "verdura",
    caloriesKcal: 34,
    proteinG: 2.8,
    fatG: 0.4,
    carbsG: 7,
    fiberG: 3,
  });

  const baseConfig = {
    availableFoods: [cheapProtein, expensiveProtein, cheapCarb, premiumCarb, fatSource, vegetable],
    targetCalories: 600,
    targetProteinG: 43,
    targetFatG: 20,
    targetCarbsG: 45,
    targetFiberG: 10,
    mealSlots: ["almoco"],
    slotCalories: { almoco: 600 },
    constraints: {
      protein: [0.95, 1.05] as [number, number],
      fat: [0.95, 1.05] as [number, number],
      carbs: [0.95, 1.05] as [number, number],
      fiber: [0.8, 1.2] as [number, number],
      costWeight: 0.5,
    },
    priceMap: new Map<string, number>([
      [cheapProtein.id, 2.5],
      [expensiveProtein.id, 6],
      [cheapCarb.id, 0.6],
      [premiumCarb.id, 3],
      [fatSource.id, 1.2],
      [vegetable.id, 0.8],
    ]),
  };

  it("uses the provided price map to pick the lowest cost-per-nutrient foods", () => {
    const result = optimizeDietCost(baseConfig);
    const selectedIds = result.foods.map((food) => food.foodId);

    expect(selectedIds).toContain(cheapProtein.id);
    expect(selectedIds).toContain(cheapCarb.id);
    expect(selectedIds).not.toContain(expensiveProtein.id);
    expect(result.totalCost).toBeCloseTo(5.27, 2);
  });

  it("resolves preferred and excluded foods passed by name", () => {
    const result = optimizeDietCost({
      ...baseConfig,
      preferFoods: ["Frango Premium"],
      excludeFoods: ["ARROZ BARATO"],
    });

    const selectedIds = result.foods.map((food) => food.foodId);

    expect(selectedIds).toContain(expensiveProtein.id);
    expect(selectedIds).toContain(premiumCarb.id);
    expect(selectedIds).not.toContain(cheapCarb.id);
  });
});
