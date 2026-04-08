import { describe, expect, it } from "vitest";

import { buildCalculatorInput } from "./adapters";

describe("buildCalculatorInput", () => {
  it("maps persisted profile data into CalculatorInput and normalizes nullable fields", () => {
    const result = buildCalculatorInput({
      age: 29,
      sex: "MALE",
      heightCm: 182,
      weightKg: 84,
      bodyFatPercentage: null,
      country: "BR",
      state: null,
      city: "Sao Paulo",
      latitude: null,
      activityLevel: "MODERATE",
      exerciseFrequency: 4,
      primaryExerciseType: "WEIGHTLIFTING",
      exerciseDurationMin: null,
      exerciseIntensity: "MODERATE",
      workRoutine: "HOME_OFFICE",
      goal: "MUSCLE_GAIN",
    });

    expect(result).toEqual({
      profile: {
        age: 29,
        sex: "MALE",
        heightCm: 182,
        weightKg: 84,
        bodyFatPercentage: undefined,
        country: "BR",
        state: undefined,
        city: "Sao Paulo",
        latitude: undefined,
      },
      activity: {
        activityLevel: "MODERATE",
        exerciseFrequencyDays: 4,
        primaryExerciseType: "WEIGHTLIFTING",
        exerciseDurationMin: undefined,
        exerciseIntensity: "MODERATE",
      },
      work: {
        workRoutine: "HOME_OFFICE",
      },
      goal: {
        type: "MUSCLE_GAIN",
      },
    });
  });
});
