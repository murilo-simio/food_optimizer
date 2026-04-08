import type { CalculatorInput } from "./types";

export interface CalculatorInputSource {
  age: number;
  sex: CalculatorInput["profile"]["sex"];
  heightCm: number;
  weightKg: number;
  bodyFatPercentage?: number | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  latitude?: number | null;
  activityLevel: CalculatorInput["activity"]["activityLevel"];
  exerciseFrequency: number;
  primaryExerciseType?: CalculatorInput["activity"]["primaryExerciseType"] | null;
  exerciseDurationMin?: number | null;
  exerciseIntensity?: CalculatorInput["activity"]["exerciseIntensity"] | null;
  workRoutine: CalculatorInput["work"]["workRoutine"];
  goal: CalculatorInput["goal"]["type"];
}

export function buildCalculatorInput(source: CalculatorInputSource): CalculatorInput {
  return {
    profile: {
      age: source.age,
      sex: source.sex,
      heightCm: source.heightCm,
      weightKg: source.weightKg,
      bodyFatPercentage: source.bodyFatPercentage ?? undefined,
      country: source.country ?? undefined,
      state: source.state ?? undefined,
      city: source.city ?? undefined,
      latitude: source.latitude ?? undefined,
    },
    activity: {
      activityLevel: source.activityLevel,
      exerciseFrequencyDays: source.exerciseFrequency,
      primaryExerciseType: source.primaryExerciseType ?? undefined,
      exerciseDurationMin: source.exerciseDurationMin ?? undefined,
      exerciseIntensity: source.exerciseIntensity ?? undefined,
    },
    work: {
      workRoutine: source.workRoutine,
    },
    goal: {
      type: source.goal,
    },
  };
}
