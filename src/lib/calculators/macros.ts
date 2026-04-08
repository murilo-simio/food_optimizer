/**
 * Calculadora de macronutrientes
 * Baseada em evidências científicas e ajustada por objetivo, exercício, idade
 */

import type { Goal } from "./types";

export interface MacroResult {
	calories: number;
	proteinG: number;
	fatG: number;
	carbsG: number;
	fiberG: number;
	percentages: { protein: number; fat: number; carbs: number };
	notes: string[];
}

/**
 * Calcula necessidades de proteína baseada em massa magra e objetivo
 * ISSN (2018): 1.4-2.0g/kg/dia para atletas; 0.8g/kg/dia para sedentários
 */
export function calculateProteinTarget(
	leanMassKg: number,
	goal: Goal,
	hasResistanceExercise: boolean
): number {
	let proteinPerKg = 0.8;

	if (hasResistanceExercise) {
		if (goal.type === "MUSCLE_GAIN") proteinPerKg = 2.0;
		else if (goal.type === "FAT_LOSS") proteinPerKg = 2.2;
		else if (goal.type === "PERFORMANCE") proteinPerKg = 1.8;
		else proteinPerKg = 1.6;
	} else {
		if (goal.type === "MUSCLE_GAIN") proteinPerKg = 1.2;
		else proteinPerKg = 0.8;
	}

	const maxProtein = leanMassKg * 2.5;
	const calculated = leanMassKg * proteinPerKg;
	return Math.min(Math.round(calculated), Math.round(maxProtein));
}

/**
 * Calcula necessidades de gordura
 */
export function calculateFatTarget(
	targetCalories: number,
	weightKg: number,
	goal: Goal
): number {
	const minFatG = weightKg * 0.5;
	let fatPercent = 25;
	if (goal.type === "PERFORMANCE" || goal.type === "MAINTENANCE") fatPercent = 30;
	const fatGFromPercent = Math.round((targetCalories * fatPercent) / 100 / 9);
	return Math.max(fatGFromPercent, Math.round(minFatG));
}

/**
 * Calcula carboidratos ( resto das calorias )
 */
export function calculateCarbsTarget(
	targetCalories: number,
	proteinG: number,
	fatG: number
): number {
	const remainingCal = targetCalories - proteinG * 4 - fatG * 9;
	if (remainingCal < 0) return 0;
	return Math.round(remainingCal / 4);
}

/**
 * Calcula fibras (baseado em intake geral e calorias)
 */
export function calculateFiberTarget(targetCalories: number): number {
	return Math.round((targetCalories / 1000) * 14);
}

/**
 * Calcula água necessária
 */
export function calculateWaterTarget(
	weightKg: number,
	exerciseAdjustmentKcal?: number,
	climateZone?: string
): { totalMl: number; perDayBottles: number } {
	let waterMl = weightKg * 30;
	if (exerciseAdjustmentKcal && exerciseAdjustmentKcal > 0) {
		const exerciseHours = exerciseAdjustmentKcal / 250;
		waterMl += exerciseHours * 500;
	}
	if (climateZone === "TROPICAL" || climateZone === "SUBTROPICAL") {
		waterMl *= 1.2;
	} else if (climateZone === "COLD") {
		waterMl *= 0.9;
	}
	return {
		totalMl: Math.round(waterMl),
		perDayBottles: Math.ceil(waterMl / 500),
	};
}
