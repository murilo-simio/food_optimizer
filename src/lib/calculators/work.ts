/**
 * Ajustes de necessidades nutricionais baseados no tipo de trabalho
 * Considera: nível de atividade durante o trabalho, horários, estresse
 * Baseado em literatura de ergonomia e gasto energético ocupacional
 */

import { WorkData } from "./types";

export interface WorkAdjustment {
	/** Ajuste calórico adicional (kcal/dia) - pode ser negativo se trabalho é sedentário */
	additionalKcal: number;
	/** Recomendação de refeições por dia (ajustada) */
	suggestedMealFrequency?: number;
	/** Notas sobre timing das refeições */
	mealTimingNotes?: string[];
	/** Alertas especiais (ex: turnos noturnos) */
	warnings?: string[];
	/** Notas gerais sobre o cálculo */
	notes: string[];
}

/**
 * Fatores de multiplicação para Different work types
 * Estimativa de BMR × fator = TEF (Thermic Effect of Food) + NEAT (Non-Exercise Activity Thermogenesis)
 * Baseado em researches: Even-Chen et al., 2019; CHAMPS, 2014.
 */
const WORK_NEAT_FACTORS: Record<string, { min: number; max: number; description: string }> = {
	CLT_9_TO_5: { min: 0.05, max: 0.10, description: "Trabalho de escritório, majoritariamente sentado" },
	HOME_OFFICE: { min: 0.05, max: 0.10, description: "Similar a CLT, potencialmente menos movimento" },
	SHIFT_WORK: { min: 0.10, max: 0.20, description: "Turnos variados, possível aumento de estresse e alterações metabólicas" },
	FLEXIBLE: { min: 0.10, max: 0.20, description: "Maior autonomia para movimentação" },
	STUDENT: { min: 0.10, max: 0.15, description: "Andar entre aulas, alguma atividade física moderada" },
	OTHER: { min: 0.05, max: 0.15, description: "Indeterminado - usar perfil do usuário" },
};

/**
 * Calcula ajustes baseados no trabalho
 * Considera NEAT (non-exercise activity thermogenesis) e estresse
 */
export function calculateWorkAdjustment(
	work: WorkData,
	bmr: number,
	profileAge: number
): WorkAdjustment {
	const { workRoutine } = work;
	const factorRange = WORK_NEAT_FACTORS[workRoutine] || WORK_NEAT_FACTORS.OTHER;

	// Escolhe um fator intermediário baseado em informação adicional se disponível
	// Se tiver activeWorkHoursPerDay, podemos ajustar
	let factor = (factorRange.min + factorRange.max) / 2;
	if (work.activeWorkHoursPerDay && work.activeWorkHoursPerDay > 2) {
		// Trabalho ativo: aumentar fator
		factor = factorRange.max;
	}
	if (work.sittingHoursPerDay && work.sittingHoursPerDay > 8) {
		// Muito sentado: diminuir fator
		factor = factorRange.min;
	}

	const additionalKcal = Math.round(bmr * factor);
	const notes: string[] = [`Trabalho ${workRoutine}: NEAT estimado em ${Math.round(factor * 100)}% do BMR (${additionalKcal} kcal/dia).`];

	// Recomendações de refeições
	let suggestedMealFrequency: number;
	if (workRoutine === "SHIFT_WORK") {
		suggestedMealFrequency = 4; // Turnos benefit de mais refeições menores
		notes.push("Trabalho em turnos pode exigir ajuste no horário das refeições. Considere refeições menores e frequentes.");
	} else if (workRoutine === "CLT_9_TO_5" || workRoutine === "HOME_OFFICE") {
		suggestedMealFrequency = 3; // Padrão
	} else {
		suggestedMealFrequency = 4;
		notes.push("Trabalho ativo/flexível: considere 4-5 refeições para manter energia constante.");
	}

	// Verificação de idade + trabalho pesado
	if (profileAge > 50 && (workRoutine === "SHIFT_WORK" || work.activeWorkHoursPerDay && work.activeWorkHoursPerDay > 6)) {
		notes.push("Idade + trabalho fisicamente exigente: atenção à recuperação e ingestão proteica.");
	}

	// Estrutura de refeições sugerida
	let mealTimingNotes: string[] = [];
	if (workRoutine === "CLT_9_TO_5" || workRoutine === "HOME_OFFICE") {
		mealTimingNotes = [
			"Café da manhã antes do trabalho",
			"Almoço no meio do expediente",
			"Lanche no final da tarde",
			"Jantar leve após o trabalho",
		];
	} else if (workRoutine === "SHIFT_WORK") {
		mealTimingNotes = [
			"Faça uma refeição completa antes do turno",
			"Leve lanches nutritivos durante o turno",
			"Evite refeições pesadas no final do turno (atrapalha sono)",
		];
	}

	return {
		additionalKcal,
		suggestedMealFrequency,
		mealTimingNotes: mealTimingNotes.length > 0 ? mealTimingNotes : undefined,
		warnings: undefined,
		notes,
	};
}
