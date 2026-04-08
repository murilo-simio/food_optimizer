import { describe, expect, it } from "vitest";

import { calculateNutrition } from "./index";
import type { CalculatorInput } from "./types";

describe("calculateNutrition", () => {
  it("treats high-intensity endurance training as resistance exercise and applies cold climate adjustments", () => {
    const input: CalculatorInput = {
      profile: {
        age: 30,
        sex: "MALE",
        heightCm: 180,
        weightKg: 80,
        bodyFatPercentage: 20,
        country: "NO",
      },
      activity: {
        activityLevel: "ACTIVE",
        exerciseFrequencyDays: 3,
        exerciseDurationMin: 60,
        exerciseIntensity: "INTENSE",
        primaryExerciseType: "RUNNING",
      },
      work: {
        workRoutine: "CLT_9_TO_5",
      },
      goal: {
        type: "FAT_LOSS",
      },
    };

    const result = calculateNutrition(input);

    expect(result.metrics).toMatchObject({
      bmr: 1780,
      tdee: 2455,
      goalAdjustment: -400,
      targetCalories: 2055,
      targetProteinG: 141,
      targetFatG: 57,
      targetCarbsG: 245,
      targetFiberG: 29,
      targetWaterMl: 2954,
    });
    expect(result.micronutrients.vitamins.vitaminD_UG).toBe(38);
    expect(result.micronutrients.minerals).toMatchObject({
      iron_MG: 8,
      potassium_MG: 3060,
      sodium_MG: 1350,
    });
    expect(result.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("TDEE (completo): 2455 kcal/dia"),
        expect.stringContaining("Vitamina D: meta ajustada"),
        expect.stringContaining("Exercício intenso"),
        expect.stringContaining("Vitamina D: necessidade aumentada"),
      ])
    );
  });

  it("clamps TDEE to the safety floor when the raw estimate drops too low", () => {
    const input: CalculatorInput = {
      profile: {
        age: 35,
        sex: "FEMALE",
        heightCm: 150,
        weightKg: 35,
      },
      activity: {
        activityLevel: "SEDENTARY",
        exerciseFrequencyDays: 0,
      },
      work: {
        workRoutine: "HOME_OFFICE",
        sittingHoursPerDay: 10,
      },
      goal: {
        type: "MAINTENANCE",
      },
    };

    const result = calculateNutrition(input);

    expect(result.metrics.tdee).toBe(1200);
    expect(result.metrics.targetCalories).toBe(1200);
    expect(result.adjustments.exercise).toBe(0);
    expect(result.notes).toEqual(
      expect.arrayContaining([expect.stringContaining("TDEE (completo): 1200 kcal/dia")])
    );
  });
});
