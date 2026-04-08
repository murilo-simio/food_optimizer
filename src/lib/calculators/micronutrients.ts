/**
 * Calculadora de necessidades de micronutrientes (vitaminas e minerais)
 * Baseada em:
 * - Dietary Reference Intakes (DRI) - Institute of Medicine (2019)
 * - WHO Guidelines (2021)
 * - European Food Safety Authority (EFSA)
 *
 * Considera ajustes por: idade, sexo, clima/geografia, exercício, gravidez (futuro)
 */

import type { GeographicalFactors, MicronutrientTargets, UserProfile } from "./types";

// Baselines por sexo e faixa etária (DRI, RDA/AI)
// Valores em mg ou µg/dia
interface BaselineNutrients {
	vitaminA_UG: number;
	vitaminC_MG: number;
	vitaminD_UG: number;
	vitaminE_MG: number;
	vitaminK_UG: number;
	vitaminB1_MG: number;
	vitaminB2_MG: number;
	vitaminB3_MG: number;
	vitaminB5_MG: number;
	vitaminB6_MG: number;
	vitaminB9_UG: number;
	vitaminB12_UG: number;
	calcium_MG: number;
	iron_MG: number;
	magnesium_MG: number;
	zinc_MG: number;
	potassium_MG: number;
	sodium_MG: number;
	selenium_UG: number;
}

function getBaselineNutrients(sex: "MALE" | "FEMALE"): BaselineNutrients {
	// Valores para adultos 19-50 anos ( ajuste por idade posterior )
	if (sex === "MALE") {
		return {
			vitaminA_UG: 900,
			vitaminC_MG: 90,
			vitaminD_UG: 15, // 600 IU = 15 µg
			vitaminE_MG: 15,
			vitaminK_UG: 120,
			vitaminB1_MG: 1.2,
			vitaminB2_MG: 1.3,
			vitaminB3_MG: 16,
			vitaminB5_MG: 5, // AI
			vitaminB6_MG: 1.3,
			vitaminB9_UG: 400,
			vitaminB12_UG: 2.4,
			calcium_MG: 1000,
			iron_MG: 8,
			magnesium_MG: 400,
			zinc_MG: 11,
			potassium_MG: 3400,
			sodium_MG: 1500, // AI (máximo 2300)
			selenium_UG: 55,
		};
	} else {
		return {
			vitaminA_UG: 700,
			vitaminC_MG: 75,
			vitaminD_UG: 15,
			vitaminE_MG: 15,
			vitaminK_UG: 90,
			vitaminB1_MG: 1.1,
			vitaminB2_MG: 1.1,
			vitaminB3_MG: 14,
			vitaminB5_MG: 5,
			vitaminB6_MG: 1.3,
			vitaminB9_UG: 400,
			vitaminB12_UG: 2.4,
			calcium_MG: 1000,
			iron_MG: 18, // maior devido à menstruação
			magnesium_MG: 310,
			zinc_MG: 8,
			potassium_MG: 2600,
			sodium_MG: 1500,
			selenium_UG: 55,
		};
	}
}

/**
 * Aplica multiplicadores geográficos/climáticos às necessidades
 */
function applyGeographicalFactors(
	baseline: BaselineNutrients,
	geo: GeographicalFactors
): BaselineNutrients {
	// Vitamina D: multiplicador significativo
	const vitaminD = Math.round(baseline.vitaminD_UG * geo.vitaminDMultiplier);

	// Eletrólitos: sódio, potássio, magnésio suam mais em clima quente
	const electrolyteMult = geo.electrolyteMultiplier;
	const sodium = Math.round(baseline.sodium_MG * electrolyteMult);
	const potassium = Math.round(baseline.potassium_MG * electrolyteMult);
	const magnesium = Math.round(baseline.magnesium_MG * electrolyteMult);

	return {
		...baseline,
		vitaminD_UG: vitaminD,
		sodium_MG: sodium,
		potassium_MG: potassium,
		magnesium_MG: magnesium,
	};
}

/**
 * Ajustes por exercício intenso
 */
function applyExerciseAdjustments(
	baseline: BaselineNutrients,
	hasIntenseExercise: boolean,
	exerciseHoursPerWeek?: number
): BaselineNutrients {
	if (!hasIntenseExercise) return baseline;

	// Atletas podem precisar de mais:
	// - Magnésio: +50-100mg (perda pelo suor)
	// - Zinco: +2-5mg (metabolismo aumentado)
	// - Vitaminas B: ligeiro aumento (metabolismo energético)
	// - Sódio: reposição de suor (já coberto pelo electrolyte multiplier)

	let magnesium = baseline.magnesium_MG + 50;
	if (exerciseHoursPerWeek && exerciseHoursPerWeek > 5) {
		magnesium += 50; // +100mg total para atletas muito ativos
	}

	return {
		...baseline,
		magnesium_MG: magnesium,
		vitaminB1_MG: Math.round(baseline.vitaminB1_MG * 1.1),
		vitaminB2_MG: Math.round(baseline.vitaminB2_MG * 1.1),
		vitaminB3_MG: Math.round(baseline.vitaminB3_MG * 1.1),
		vitaminB6_MG: Math.round(baseline.vitaminB6_MG * 1.1),
	};
}

/**
 * Calcula todas as necessidades de micronutrientes
 */
export function calculateMicronutrients(
	profile: UserProfile,
	geoFactors: GeographicalFactors,
	hasIntenseExercise?: boolean,
	exerciseHoursPerWeek?: number
): MicronutrientTargets {
	const baseline = getBaselineNutrients(profile.sex);

	// Aplica ajustes geográficos
	let adjusted = applyGeographicalFactors(baseline, geoFactors);

	// Ajustes por exercício
	adjusted = applyExerciseAdjustments(adjusted, hasIntenseExercise || false, exerciseHoursPerWeek);

	// Formata resultado
	return {
		vitamins: {
			vitaminA_UG: adjusted.vitaminA_UG,
			vitaminC_MG: adjusted.vitaminC_MG,
			vitaminD_UG: adjusted.vitaminD_UG,
			vitaminE_MG: adjusted.vitaminE_MG,
			vitaminK_UG: adjusted.vitaminK_UG,
			vitaminB1_MG: adjusted.vitaminB1_MG,
			vitaminB2_MG: adjusted.vitaminB2_MG,
			vitaminB3_MG: adjusted.vitaminB3_MG,
			vitaminB5_MG: adjusted.vitaminB5_MG,
			vitaminB6_MG: adjusted.vitaminB6_MG,
			vitaminB9_UG: adjusted.vitaminB9_UG,
			vitaminB12_UG: adjusted.vitaminB12_UG,
		},
		minerals: {
			calcium_MG: adjusted.calcium_MG,
			iron_MG: adjusted.iron_MG,
			magnesium_MG: adjusted.magnesium_MG,
			zinc_MG: adjusted.zinc_MG,
			potassium_MG: adjusted.potassium_MG,
			sodium_MG: adjusted.sodium_MG,
			selenium_UG: adjusted.selenium_UG,
		},
	};
}

/**
 * Gera recomendações nutricionais em linguagem natural
 */
export function generateMicronutrientNotes(
	geoFactors: GeographicalFactors,
	hasIntenseExercise: boolean
): string[] {
	const notes: string[] = [];

	if (geoFactors.climateZone === "COLD") {
		notes.push(`Vitamina D: meta ajustada para ${Math.round(15 * geoFactors.vitaminDMultiplier)} µg/dia devido à baixa exposição solar. Considere suplementação após avaliação médica.`);
	} else if (geoFactors.climateZone === "TROPICAL") {
		notes.push("Clima quente: atenção à hidratação e reposição de eletrólitos (sódio, potássio, magnésio).");
	}

	if (hasIntenseExercise) {
		notes.push("Exercício intenso: necessidades aumentadas de magnésio (+50-100mg) e vitaminas do complexo B.");
	}

	return notes;
}
