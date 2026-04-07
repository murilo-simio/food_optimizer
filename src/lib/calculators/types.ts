/**
 * Tipos compartilhados para o sistema de calculadoras nutricionais
 * Baseado nos dados do onboarding e perfil do usuário
 */

export interface UserProfile {
	/** Idade em anos */
	age: number;
	/** Sexo biológico */
	sex: "MALE" | "FEMALE";
	/** Altura em cm */
	heightCm: number;
	/** Peso em kg */
	weightKg: number;
	/** % de gordura corporal (0-100) */
	bodyFatPercentage?: number;
	/** País (ISO 3166-1 alpha-2) */
	country?: string;
	/** Estado/Região */
	state?: string;
	/** Cidade (para dados de clima mais precisos) */
	city?: string;
	/** Latitude aproximada (opcional, para cálculos de UV/sol) */
	latitude?: number;
}

export interface ActivityData {
	/** Nível de atividade (do onboarding) */
	activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
	/** Dias de exercício por semana */
	exerciseFrequencyDays: number;
	/** Duração média por sessão em minutos */
	exerciseDurationMin?: number;
	/** Intensidade predominante do exercício */
	exerciseIntensity?: "LIGHT" | "MODERATE" | "INTENSE";
	/** Tipo principal de exercício */
	primaryExerciseType?: ExerciseType;
}

export type ExerciseType =
	| "WEIGHTLIFTING"
	| "RUNNING"
	| "CROSSFIT"
	| "CALISTHENICS"
	| "CYCLING"
	| "SWIMMING"
	| "MARTIAL_ARTS"
	| "HIIT"
	| "WALKING"
	| "OTHER";

export interface WorkData {
	/** Rotina de trabalho */
	workRoutine: "CLT_9_TO_5" | "HOME_OFFICE" | "SHIFT_WORK" | "FLEXIBLE" | "STUDENT" | "OTHER";
	/** Número médio de horas sentado por dia (estimativa) */
	sittingHoursPerDay?: number;
	/** Número médio de horas em pé/andando por dia (trabalho físico) */
	activeWorkHoursPerDay?: number;
}

export interface Goal {
	/** Objetivo principal */
	type: "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE" | "PERFORMANCE";
	/** Se é atleta de alto rendimento */
	isAthlete?: boolean;
	/** Preferência de estilo alimentar (pode afetar distribuição) */
	dietaryStyle?: "HIGH_CARB" | "LOW_CARB" | "MODERATE" | "KETO";
}

export interface CalculatedMetrics {
	/** Taxa Metabólica Basal (kcal/dia) */
	bmr: number;
	/** Gasto Energético Diário Total (kcal/dia) */
	tdee: number;
	/** Ajuste calórico baseado no objetivo (kcal) - pode ser negativo ou positivo */
	goalAdjustment: number;
	/** Calorias alvo diárias (kcal) */
	targetCalories: number;
	/** Proteína alvo (g/dia) */
	targetProteinG: number;
	/** Gordura alvo (g/dia) */
	targetFatG: number;
	/** Carboidrato alvo (g/dia) */
	targetCarbsG: number;
	/** Fibras alvo (g/dia) */
	targetFiberG: number;
	/** Água alvo (ml/dia) */
	targetWaterMl: number;
}

export interface MicronutrientTargets {
	/** Vitaminas (mcg ou mg/dia) */
	vitamins: {
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
	};
	/** Minerais (mg ou mcg/dia) */
	minerals: {
		calcium_MG: number;
		iron_MG: number;
		magnesium_MG: number;
		zinc_MG: number;
		potassium_MG: number;
		sodium_MG: number;
		selenium_UG: number;
	};
}

export interface GeographicalFactors {
	/** Região climática (afeta necessidades de vit D, eletrólitos) */
	climateZone: "TROPICAL" | "SUBTROPICAL" | "TEMPERATE" | "COLD";
	/** Intensidade de sol (1-10) baseada na latitude/estação */
	sunExposure: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
	/** Necessidade aumentada de vitamina D (fator multiplicador) */
	vitaminDMultiplier: number;
	/** Necessidade aumentada de eletrólitos (clima quente = suor) */
	electrolyteMultiplier: number;
}

export interface CalculatorInput {
	profile: UserProfile;
	activity: ActivityData;
	work: WorkData;
	goal: Goal;
	/** Fatores geográficos calculados (podem ser nulos se não houver dados) */
	geographical?: GeographicalFactors;
}

export interface CalculatorResult {
	metrics: CalculatedMetrics;
	micronutrients: MicronutrientTargets;
	adjustments: {
		work?: number;      // Ajuste kcal por tipo de trabalho
		climate?: number;   // Ajuste kcal por clima
		exercise?: number;  // Ajuste kcal por exercício específico
		totalAdjustment: number; // Soma de todos os ajustes + meta do objetivo
	};
	notes: string[]; // Explicações, warnings, recomendações
}
