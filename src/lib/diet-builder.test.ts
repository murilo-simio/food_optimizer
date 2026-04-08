import { DietaryRestriction } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { generateDietGreedy } from "./diet-builder";
import { makeFood, makeTasteProfile, makeUserProfile } from "../test/factories";

describe("generateDietGreedy", () => {
  it("respects dietary restrictions and aversions while prioritizing staple foods", () => {
    const profile = makeUserProfile({
      dietaryRestrictions: DietaryRestriction.VEGAN,
    });
    const tasteProfile = makeTasteProfile({
      stapleFoods: JSON.stringify(["lentilha", "arroz"]),
      aversions: JSON.stringify(["espinafre"]),
    });
    const availableFoods = [
      makeFood({
        id: "lentilha",
        name: "lentilha",
        category: "proteina",
        caloriesKcal: 116,
        proteinG: 9,
        fatG: 0.4,
        carbsG: 20,
        fiberG: 8,
      }),
      makeFood({
        id: "frango",
        name: "frango",
        category: "proteina",
        caloriesKcal: 165,
        proteinG: 31,
        fatG: 3.6,
        carbsG: 0,
      }),
      makeFood({
        id: "arroz",
        name: "arroz",
        category: "carboidrato",
        caloriesKcal: 130,
        proteinG: 2.7,
        fatG: 0.3,
        carbsG: 28,
      }),
      makeFood({
        id: "azeite",
        name: "azeite",
        category: "gordura",
        caloriesKcal: 884,
        proteinG: 0,
        fatG: 100,
        carbsG: 0,
      }),
      makeFood({
        id: "espinafre",
        name: "espinafre",
        category: "verdura",
        caloriesKcal: 23,
        proteinG: 2.9,
        fatG: 0.4,
        carbsG: 3.6,
      }),
      makeFood({
        id: "alface",
        name: "alface",
        category: "verdura",
        caloriesKcal: 15,
        proteinG: 1.4,
        fatG: 0.2,
        carbsG: 2.9,
      }),
    ];

    const diet = generateDietGreedy({
      profile,
      nutrition: {
        bmr: 1700,
        tdee: 2200,
        goalAdjustment: 0,
        targetCalories: 1800,
        targetProteinG: 120,
        targetFatG: 60,
        targetCarbsG: 200,
        targetFiberG: 30,
        targetWaterMl: 2500,
      },
      tasteProfile,
      availableFoods,
      mealSlots: ["cafe_manha", "almoco", "jantar"],
    });

    const selectedNames = diet.foods.map((food) => food.food.name);

    expect(selectedNames).toContain("lentilha");
    expect(selectedNames).toContain("arroz");
    expect(selectedNames).not.toContain("frango");
    expect(selectedNames).not.toContain("espinafre");
    expect(diet.foods.every((food) => food.food.category !== "lacteo")).toBe(true);
    expect(diet.totalCalories).toBeGreaterThanOrEqual(1700);
    expect(diet.totalCalories).toBeLessThanOrEqual(1900);
    expect(diet.notes[0]).toContain("algoritmo guloso");
  });
});
