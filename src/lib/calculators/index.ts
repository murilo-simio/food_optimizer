/**
 * Índice principal do sistema de calculadoras nutricionais
 * Esta é a única função pública que deve ser usada pelo resto da aplicação
 */

import type {
  CalculatorInput,
  CalculatorResult,
  CalculatedMetrics,
  GeographicalFactors,
  MicronutrientTargets,
} from "./types";

export type {
  CalculatorInput,
  CalculatorResult,
  CalculatedMetrics,
  GeographicalFactors,
  MicronutrientTargets,
};

import { calculateBMR } from "./bmr";
import {
  calculateClimateAdjustment,
  calculateGeographicalFactors,
} from "./climate";
import { calculateExerciseAdjustment } from "./exercise";
import {
  calculateCarbsTarget,
  calculateFatTarget,
  calculateFiberTarget,
  calculateProteinTarget,
  calculateWaterTarget,
} from "./macros";
import { calculateMicronutrients, generateMicronutrientNotes } from "./micronutrients";
import { calculateWorkAdjustment } from "./work";

function determineGoalAdjustment(goalType: CalculatorInput["goal"]["type"]): number {
  switch (goalType) {
    case "FAT_LOSS":
      return -400;
    case "MUSCLE_GAIN":
      return 300;
    case "PERFORMANCE":
      return 200;
    default:
      return 0;
  }
}

function hasResistanceExercise(activity: CalculatorInput["activity"]): boolean {
  const resistanceTypes = ["WEIGHTLIFTING", "CROSSFIT", "HIIT", "CALISTHENICS"];
  const enduranceTypes = ["RUNNING", "CYCLING", "SWIMMING", "MARTIAL_ARTS"];

  if (
    activity.primaryExerciseType &&
    resistanceTypes.includes(activity.primaryExerciseType)
  ) {
    return true;
  }

  return Boolean(
    activity.primaryExerciseType &&
      activity.exerciseIntensity === "INTENSE" &&
      activity.exerciseFrequencyDays >= 2 &&
      enduranceTypes.includes(activity.primaryExerciseType)
  );
}

export function calculateNutrition(input: CalculatorInput): CalculatorResult {
  const bmrResult = calculateBMR(input.profile);
  const bmr = bmrResult.bmr;
  const leanMass = bmrResult.leanMassKg;

  const exerciseAdjustment = calculateExerciseAdjustment(
    input.activity,
    input.profile.weightKg
  );
  const workAdjustment = calculateWorkAdjustment(input.work, bmr, input.profile.age);

  const geoFactors: GeographicalFactors =
    input.geographical ??
    calculateGeographicalFactors(
      input.profile.country,
      input.profile.state,
      input.profile.city,
      input.profile.latitude
    );

  const climateAdjustment = calculateClimateAdjustment(geoFactors);

  const workMultiplier = workAdjustment.additionalKcal / bmr;
  const rawTdee =
    bmr * (1 + workMultiplier) +
    exerciseAdjustment.additionalKcalPerDay +
    climateAdjustment.calorieAdjustment;
  const safeTdee = Math.max(Math.round(rawTdee), 1200);

  const goalAdjustment = determineGoalAdjustment(input.goal.type);
  const targetCalories = safeTdee + goalAdjustment;

  const resistanceExercise = hasResistanceExercise(input.activity);
  const targetProteinG = calculateProteinTarget(leanMass, input.goal, resistanceExercise);
  const targetFatG = calculateFatTarget(
    targetCalories,
    input.profile.weightKg,
    input.goal
  );
  const targetCarbsG = calculateCarbsTarget(
    targetCalories,
    targetProteinG,
    targetFatG
  );
  const targetFiberG = calculateFiberTarget(targetCalories);
  const waterTarget = calculateWaterTarget(
    input.profile.weightKg,
    exerciseAdjustment.additionalKcalPerDay,
    geoFactors.climateZone
  );

  const exerciseHoursPerWeek =
    (input.activity.exerciseFrequencyDays *
      (input.activity.exerciseDurationMin ?? 45)) /
    60;
  const micronutrients: MicronutrientTargets = calculateMicronutrients(
    input.profile,
    geoFactors,
    input.activity.exerciseIntensity === "INTENSE",
    exerciseHoursPerWeek
  );

  const metrics: CalculatedMetrics = {
    bmr: Math.round(bmr),
    tdee: safeTdee,
    goalAdjustment,
    targetCalories,
    targetProteinG,
    targetFatG,
    targetCarbsG,
    targetFiberG,
    targetWaterMl: waterTarget.totalMl,
  };

  const notes: string[] = [
    `BMR (Mifflin-St Jeor): ${Math.round(bmr)} kcal/dia`,
    `TDEE (completo): ${safeTdee} kcal/dia`,
    ...exerciseAdjustment.notes,
    ...workAdjustment.notes,
    ...climateAdjustment.notes,
    ...generateMicronutrientNotes(
      geoFactors,
      input.activity.exerciseIntensity === "INTENSE"
    ),
  ];

  if (geoFactors.vitaminDMultiplier > 1.2) {
    notes.push(
      `Vitamina D: necessidade aumentada (fator ${geoFactors.vitaminDMultiplier.toFixed(1)}x) devido a baixa exposição solar em ${geoFactors.climateZone}.`
    );
  }

  return {
    metrics,
    micronutrients,
    adjustments: {
      work: workAdjustment.additionalKcal,
      climate: climateAdjustment.calorieAdjustment,
      exercise: exerciseAdjustment.additionalKcalPerDay,
      totalAdjustment: goalAdjustment,
    },
    notes,
  };
}
