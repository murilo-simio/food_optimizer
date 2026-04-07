/**
 * Índice principal do sistema de calculadoras nutricionais
 * Esta é a única função pública que deve ser usada pelo resto da aplicação
 */

import type {
	CalculatorInput,
	CalculatorResult,
	CalculatedMetrics,
	MicronutrientTargets,
	GeographicalFactors,
} from "./types";

// Re-export types for public use
export type {
	CalculatorInput,
	CalculatorResult,
	CalculatedMetrics,
	MicronutrientTargets,
	GeographicalFactors,
};

import { calculateBMR, BMRResult } from "./bmr";
import { calculateExerciseAdjustment, ExerciseAdjustment } from "./exercise";
import { calculateWorkAdjustment, WorkAdjustment } from "./work";
import { calculateClimateAdjustment, ClimateAdjustment } from "./climate";
import { determineClimateZone, estimateSunExposure } from "./climate";

// Helper functions
function determineMultipliers(climateZone: string): { vitaminD: number; electrolytes: number } {
	switch (climateZone) {
		case "COLD":
			return { vitaminD: 2.5, electrolytes: 0.9 };
		case "TEMPERATE":
			return { vitaminD: 1.5, electrolytes: 1.0 };
		case "SUBTROPICAL":
			return { vitaminD: 1.2, electrolytes: 1.15 };
		case "TROPICAL":
			return { vitaminD: 1.0, electrolytes: 1.3 };
		default:
			return { vitaminD: 1.0, electrolytes: 1.0 };
	}
}

function calculateProteinTarget(leanMass: number, goalType: string, hasResistanceExercise: boolean): number {
	let proteinPerKg = 0.8;
	if (hasResistanceExercise) {
		if (goalType === "MUSCLE_GAIN") proteinPerKg = 2.0;
		else if (goalType === "FAT_LOSS") proteinPerKg = 2.2;
		else if (goalType === "PERFORMANCE") proteinPerKg = 1.8;
		else proteinPerKg = 1.6;
	} else {
		if (goalType === "MUSCLE_GAIN") proteinPerKg = 1.2;
		else proteinPerKg = 0.8;
	}
	const maxProtein = leanMass * 2.5;
	const calculated = leanMass * proteinPerKg;
	return Math.min(Math.round(calculated), Math.round(maxProtein));
}

function calculateFatTarget(targetCalories: number, bodyWeight: number, goalType: string): number {
	const minFatG = bodyWeight * 0.5;
	let fatPercent = 25;
	if (goalType === "PERFORMANCE" || goalType === "MAINTENANCE") fatPercent = 30;
	const fatG = Math.round((targetCalories * fatPercent) / 100 / 9);
	return Math.max(fatG, Math.round(minFatG));
}

function calculateCarbsTarget(targetCalories: number, proteinG: number, fatG: number): number {
	const remainingCal = targetCalories - proteinG * 4 - fatG * 9;
	if (remainingCal < 0) return 0;
	return Math.round(remainingCal / 4);
}

function calculateFiberTarget(targetCalories: number): number {
	return Math.round((targetCalories / 1000) * 14);
}

function calculateWaterTarget(weightKg: number, exerciseKcal?: number, climateZone?: string): { totalMl: number; perDayBottles: number } {
	let waterMl = weightKg * 30;
	if (exerciseKcal && exerciseKcal > 0) {
		const hours = exerciseKcal / 250;
		waterMl += hours * 500;
	}
	if (climateZone === "TROPICAL" || climateZone === "SUBTROPICAL") waterMl *= 1.2;
	else if (climateZone === "COLD") waterMl *= 0.9;
	return {
		totalMl: Math.round(waterMl),
		perDayBottles: Math.ceil(waterMl / 500),
	};
}

/**
 * Função principal - calcula tudo
 */
export function calculateNutrition(input: CalculatorInput): CalculatorResult {
	// 1. BMR
	const bmrResult = calculateBMR(input.profile);
	const bmr = bmrResult.bmr;
	const leanMass = bmrResult.leanMassKg;

	// 2. Ajustes
	const exerciseAdj = calculateExerciseAdjustment(input.activity, input.profile.weightKg);
	const workAdj = calculateWorkAdjustment(input.work, bmr, input.profile.age);

	// 3. Fatores geográficos
	const climateZone = determineClimateZone(input.profile.latitude, input.profile.country);
	const sunExposure = estimateSunExposure(input.profile.latitude, climateZone);
	const multipliers = determineMultipliers(climateZone);
	const geoFactors: GeographicalFactors = {
		climateZone,
		sunExposure,
		vitaminDMultiplier: multipliers.vitaminD,
		electrolyteMultiplier: multipliers.electrolytes,
	};

	const climateAdj = calculateClimateAdjustment(geoFactors);

	// 4. TDEE
	const workMultiplier = workAdj.additionalKcal / bmr;
	const tdee = Math.round(
		bmr * (1 + workMultiplier) +
		exerciseAdj.additionalKcalPerDay +
		climateAdj.calorieAdjustment
	);
	const safeTdee = Math.max(tdee, 1200);

	// 5. Meta calórica
	let goalAdjustment = 0;
	if (input.goal.type === "FAT_LOSS") goalAdjustment = -400;
	else if (input.goal.type === "MUSCLE_GAIN") goalAdjustment = 300;
	else if (input.goal.type === "PERFORMANCE") goalAdjustment = 200;
	const targetCalories = safeTdee + goalAdjustment;

	// 6. Macros
	const resistanceTypes = ["WEIGHTLIFTING", "CROSSFIT", "HIIT", "CALISTHENICS"];
	const hasResistanceExercise = !!(input.activity.primaryExerciseType && resistanceTypes.includes(input.activity.primaryExerciseType));

	const proteinG = calculateProteinTarget(leanMass, input.goal.type, hasResistanceExercise);
	const fatG = calculateFatTarget(targetCalories, input.profile.weightKg, input.goal.type);
	const carbsG = calculateCarbsTarget(targetCalories, proteinG, fatG);
	const fiberG = calculateFiberTarget(targetCalories);
	const waterResult = calculateWaterTarget(input.profile.weightKg, exerciseAdj.additionalKcalPerDay, climateZone);

	// 7. Micronutrientes (placeholder - implementar depois)
	const micros: MicronutrientTargets = {
		vitamins: {
			vitaminA_UG: 900,
			vitaminC_MG: 90,
			vitaminD_UG: Math.round(15 * multipliers.vitaminD),
			vitaminE_MG: 15,
			vitaminK_UG: 120,
			vitaminB1_MG: 1.2,
			vitaminB2_MG: 1.3,
			vitaminB3_MG: 16,
			vitaminB5_MG: 5,
			vitaminB6_MG: 1.3,
			vitaminB9_UG: 400,
			vitaminB12_UG: 2.4,
		},
		minerals: {
			calcium_MG: 1000,
			iron_MG: input.profile.sex === "MALE" ? 8 : 18,
			magnesium_MG: 400,
			zinc_MG: input.profile.sex === "MALE" ? 11 : 8,
			potassium_MG: Math.round(3500 * multipliers.electrolytes),
			sodium_MG: Math.round(1500 * multipliers.electrolytes),
			selenium_UG: 55,
		},
	};

	// 8. Métricas
	const metrics: CalculatedMetrics = {
		bmr: Math.round(bmr),
		tdee: safeTdee,
		goalAdjustment,
		targetCalories,
		targetProteinG: proteinG,
		targetFatG: fatG,
		targetCarbsG: carbsG,
		targetFiberG: fiberG,
		targetWaterMl: waterResult.totalMl,
	};

	// 9. Notas
	const notes: string[] = [
		`BMR (Mifflin-St Jeor): ${Math.round(bmr)} kcal/dia`,
		`TDEE (completo): ${safeTdee} kcal/dia`,
		...exerciseAdj.notes,
		...workAdj.notes,
		...climateAdj.notes,
	];

	if (multipliers.vitaminD > 1.2) {
		notes.push(`Vitamina D: necessidade aumentada (fator ${multipliers.vitaminD.toFixed(1)}x) devido a baixa exposição solar em ${climateZone}.`);
	}

	return {
		metrics,
		micronutrients: micros,
		adjustments: {
			work: workAdj.additionalKcal,
			climate: climateAdj.calorieAdjustment,
			exercise: exerciseAdj.additionalKcalPerDay,
			totalAdjustment: goalAdjustment,
		},
		notes,
	};
}
