/**
 * Calculadora de Taxa Metabólica Basal (BMR)
 * Fórmula: Mifflin-St Jeor (2005) - considerada a mais precisa atualmente
 * Referência: Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO (1990)
 *
 * Fórmulas alternativas (Harris-Benedict) estão comentadas para referência futura.
 */

import { UserProfile } from "./types";

export interface BMRResult {
	/** BMR em kcal/dia */
	bmr: number;
	/** Massa magra estimada (kg) - usada para cálculo de proteína */
	leanMassKg: number;
	/** Fórmula utilizada */
	formula: "mifflin-st-jeor" | "harris-benedict";
	/** Notas sobre o cálculo */
	notes: string[];
}

/**
 * Calcula Massa Magra estimada
 * Se % gordura disponível: leanMass = weight × (1 - bodyFat%/100)
 * Caso contrário: estimativa por fórmula de Deurenberg (2004) para adultos
 */
export function calculateLeanMass(
	weightKg: number,
	bodyFatPercentage?: number
): number {
	if (bodyFatPercentage && bodyFatPercentage > 0 && bodyFatPercentage < 100) {
		return weightKg * (1 - bodyFatPercentage / 100);
	}

	// Estimativa: leanMass ≈ weight × 0.75 para homens, × 0.65 para mulheres
	// Esta é uma simplificação - idealmente usaríamos bioimpedância
	// Por enquanto, retorna peso (será refinado depois)
	return weightKg * 0.75; // Valor conservador
}

/**
 * Calcula BMR usando Mifflin-St Jeor
 * Mais preciso que Harris-Benedict, especialmente em populações modernas
 */
export function calculateMifflinStJeor(profile: UserProfile): number {
	const { weightKg, heightCm, age, sex } = profile;

	// Mifflin-St Jeor
	if (sex === "MALE") {
		return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
	} else {
		return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
	}
}

/**
 * Harris-Benedict (alternativa)
 * Mais antiga, mas ainda utilizada. Inclui fator de estresse não presente em Mifflin.
 */
export function calculateHarrisBenedict(profile: UserProfile): number {
	const { weightKg, heightCm, age, sex } = profile;

	if (sex === "MALE") {
		return 66.5 + 13.75 * weightKg + 5.003 * heightCm - 6.775 * age;
	} else {
		return 655 + 9.563 * weightKg + 1.850 * heightCm - 4.676 * age;
	}
}

/**
 * Calcula BMR principal
 * Por padrão usa Mifflin-St Jeor.
 * No futuro pode ser ajustado com base em:
 * - Predições de RM (resting metabolic rate) de modelos ML treinados em dados reais
 * - Ajuste baseado em medições de calorimetria indireta (se disponível)
 */
export function calculateBMR(profile: UserProfile): BMRResult {
	const bmr = calculateMifflinStJeor(profile);
	const leanMass = calculateLeanMass(profile.weightKg, profile.bodyFatPercentage);

	// Validação mínima: BMR não deve ser menor que ~1200 para mulheres ou ~1400 para homens
	const minBMR = profile.sex === "MALE" ? 1400 : 1200;
	if (bmr < minBMR) {
		// Pode ser usuário muito pequeno ou erro de input
		// Retornamos o valor mesmo assim mas adicionamos nota
		return {
			bmr,
			leanMassKg: leanMass,
			formula: "mifflin-st-jeor",
			notes: [
				`BMR calculado (${Math.round(bmr)} kcal) está abaixo do mínimo esperado. Verifique os dados de entrada.`,
				`Isso pode indicar baixa massa muscular ou baixo peso. Considere consultar um profissional.`,
			],
		};
	}

	return {
		bmr,
		leanMassKg: leanMass,
		formula: "mifflin-st-jeor",
		notes: [
			`BMR calculado usando Mifflin-St Jeor.`,
			`Massa magra estimada: ${leanMass.toFixed(1)} kg.`,
		],
	};
}
