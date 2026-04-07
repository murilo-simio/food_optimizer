/**
 * Ajustes de gasto energético baseados em exercício físico
 * Considera: tipo, frequência, duração, intensidade
 * Baseado em compêndios de fisiologia do exercício (ACSM, 2023)
 */

import { ActivityData, ExerciseType } from "./types";

export interface ExerciseAdjustment {
	/** Fator multiplicador sobre o BMR para o dia de treino */
	multiplier: number;
	/** Estimativa de calorias adicionais/dia (média semanal) */
	additionalKcalPerDay: number;
	/** Recomendação de proteína extra (g/dia) baseada no tipo/tamanho */
	extraProteinG?: number;
	/** Notas explicativas */
	notes: string[];
}

/**
 * Estimativa de gasto calórico por tipo de exercício (kcal/min)
 * Valores médios para pessoa de 70kg
 * Referência: Compendium of Physical Activities (Ainsworth et al., 2011)
 */
const EXERCISE_CAL_PER_MIN_70KG: Record<ExerciseType, { light: number; moderate: number; intense: number }> = {
	WEIGHTLIFTING: { light: 4, moderate: 6, intense: 8 },
	RUNNING: { light: 10, moderate: 12, intense: 15 },
	CROSSFIT: { light: 8, moderate: 11, intense: 14 },
	CALISTHENICS: { light: 5, moderate: 7, intense: 9 },
	CYCLING: { light: 6, moderate: 9, intense: 12 },
	SWIMMING: { light: 7, moderate: 10, intense: 13 },
	MARTIAL_ARTS: { light: 6, moderate: 9, intense: 12 },
	HIIT: { light: 8, moderate: 12, intense: 16 },
	WALKING: { light: 3, moderate: 5, intense: 7 },
	OTHER: { light: 5, moderate: 7, intense: 9 },
};

/**
 * Ajusta gasto calórico baseado no exercício
 * Retorna calorias adicionais médias por dia (distribuídas na semana)
 */
export function calculateExerciseAdjustment(
	activityData: ActivityData,
	bodyWeightKg: number
): ExerciseAdjustment {
	const { exerciseFrequencyDays, exerciseDurationMin, exerciseIntensity, primaryExerciseType } = activityData;

	// Se não houver frequência, retorna zero
	if (!exerciseFrequencyDays || exerciseFrequencyDays === 0) {
		return {
			multiplier: 1.0,
			additionalKcalPerDay: 0,
			extraProteinG: 0,
			notes: ["Sedentário ou sem exercícios registrados."],
		};
	}

	// Determina o tipo e intensidade
	const exerciseType = primaryExerciseType || "OTHER";
	const intensity = exerciseIntensity || "MODERATE";
	const duration = exerciseDurationMin || 45; // Padrão: 45 min

	// Obtém taxa calórica base (kcal/min) para pessoa de 70kg
	// As chaves do objeto são minúsculas: light, moderate, intense
	const intensityKey = intensity.toLowerCase() as keyof typeof EXERCISE_CAL_PER_MIN_70KG[ExerciseType];
	const baseRate = EXERCISE_CAL_PER_MIN_70KG[exerciseType][intensityKey];

	// Ajusta pela massa corporal (linear approx)
	const weightFactor = bodyWeightKg / 70;
	const kcalPerMin = baseRate * weightFactor;

	// Calcula calorias por sessão
	const kcalPerSession = kcalPerMin * duration;

	// Distribui pela semana (média diária)
	const additionalKcalPerDay = (kcalPerSession * exerciseFrequencyDays) / 7;

	// Fator multiplicador sobre BMR (pequeno, para dia de treino)
	// Em dia de treino, BMR sobe ~5-10% devido ao afterburn effect e recuperação
	const multiplier = 1 + (additionalKcalPerDay / 2500); // Exemplo: 300 kcal extra = 1.12

	// Proteína extra baseada no tipo/intensidade do exercício
	// Pesquisas sugerem: necessidade adicional apenas nos dias de treino
	// Depois convertemos para média diária (para manter consistência na meta diária)
	// Referência: Jäger et al. (2017) - protein intake for athletes
	let extraProteinGPerTrainingDay = 0;
	if (exerciseType === "WEIGHTLIFTING" || exerciseType === "CROSSFIT" || exerciseType === "HIIT") {
		// Para hipertrofia/força: +0.2g/kg nos dias de treino
		extraProteinGPerTrainingDay = bodyWeightKg * 0.2;
	} else if (exerciseType === "RUNNING" || exerciseType === "CYCLING" || exerciseType === "SWIMMING" || exerciseType === "MARTIAL_ARTS") {
		// Para endurance: +0.1g/kg nos dias de treino
		extraProteinGPerTrainingDay = bodyWeightKg * 0.1;
	} else {
		// Geral/leve: +0.05g/kg
		extraProteinGPerTrainingDay = bodyWeightKg * 0.05;
	}

	// Converte para média diária (distribui na semana)
	const extraProteinG = extraProteinGPerTrainingDay * (exerciseFrequencyDays / 7);

	const notes: string[] = [
		`Exercício: ${exerciseFrequencyDays}x/semana, ${duration}min/sessão, intensidade ${intensity.toLowerCase()}.`,
		`Gasto estimado: ${Math.round(kcalPerSession)} kcal por sessão → ${Math.round(additionalKcalPerDay)} kcal/dia média.`,
		extraProteinG > 0 ? `Proteína adicional sugerida: +${Math.round(extraProteinG)}g/dia.` : "",
	];

	return {
		multiplier,
		additionalKcalPerDay: Math.round(additionalKcalPerDay),
		extraProteinG: extraProteinG > 0 ? Math.round(extraProteinG) : undefined,
		notes: notes.filter(Boolean),
	};
}
