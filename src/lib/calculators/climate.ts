/**
 * Ajustes nutricionais baseados em fatores geográficos e climáticos
 * Considera: zona climática, exposição solar, altitude, umidade
 * Baseado em recomendações da OMS, NIH, e literatura de nutrição ambiental
 */

import { GeographicalFactors } from "./types";

export interface ClimateAdjustment {
	/** Ajuste calórico (kcal/dia) - clima frio aumenta metabolismo, calor pode diminuir apetite */
	calorieAdjustment: number;
	/** Multiplicador para água (litros/dia) */
	waterMultiplier: number;
	/** Ajustes específicos de micronutrientes */
	micronutrientMultipliers: {
		vitaminD?: number;
		vitaminC?: number;
		electrolytes?: number; // sódio, potássio, magnésio
	};
	/** Notas explicativas */
	notes: string[];
}

/**
 * Determina zona climática a partir de latitude
 * Zonas Köppen-Geiger simplificadas
 */
export function determineClimateZone(latitude?: number, country?: string): "TROPICAL" | "SUBTROPICAL" | "TEMPERATE" | "COLD" {
	if (!latitude) {
		// Fallback baseado em países conhecidos
		if (country) {
			const coldCountries = ["IS", "NO", "SE", "FI", "RU", "CA"]; // Island, Noruega, Suécia, Finlândia, Rússia, Canadá
			const tropicalCountries = ["BR", "CO", "AR", "ID", "MY", "TH", "IN", "NG", "KE"]; // etc.
			if (coldCountries.includes(country)) return "COLD";
			if (tropicalCountries.includes(country)) return "TROPICAL";
		}
		// Padrão: temperado
		return "TEMPERATE";
	}

	const lat = Math.abs(latitude);
	if (lat <= 23.5) return "TROPICAL"; // Trópicos
	if (lat <= 35) return "SUBTROPICAL"; // Subtropical
	if (lat <= 55) return "TEMPERATE"; // Temperado
	return "COLD"; // Polar/frio
}

/**
 * Estimativa de exposição solar (1-10)
 * Considera: latitude, estação do ano (assumimos média anual)
 * Em países de alta latitude, inverno pode ter quase zero UV
 */
export function estimateSunExposure(latitude?: number, climateZone?: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 {
	if (climateZone === "TROPICAL") return 8; // Sol forte o ano todo
	if (climateZone === "SUBTROPICAL") return 7;
	if (climateZone === "TEMPERATE") return 5; // Variação sazonal considerável
	if (climateZone === "COLD") return 2; // Pouco sol, especialmente inverno

	// Se não tiver zona, calcular pela latitude
	if (latitude) {
		const lat = Math.abs(latitude);
		if (lat <= 20) return 9;
		if (lat <= 30) return 7;
		if (lat <= 40) return 5;
		if (lat <= 50) return 3;
		return 2;
	}

	// Padrão: moderado
	return 5;
}

/**
 * Calcula fatores geográficos baseados em localização
 */
export function calculateGeographicalFactors(
	country?: string,
	state?: string,
	city?: string,
	latitude?: number
): GeographicalFactors {
	const climateZone = determineClimateZone(latitude, country);
	const sunExposure = estimateSunExposure(latitude, climateZone);

	// Vitamina D: necessário mais em climas frios/pouca exposição solar
	// Population Reference Intake (PRI): 400-800 IU/dia em sol pleno; até 2000+ IU em pouca exposição
	// Fator multiplicador em cima da baseline (600 IU = 15 mcg)
	// Referência: Endocrine Society, 2011
	let vitaminDMultiplier = 1.0;
	if (climateZone === "COLD") vitaminDMultiplier = 2.5; // Até 1500 IU (37.5 mcg)
	else if (climateZone === "TEMPERATE") vitaminDMultiplier = 1.5; // ~900 IU (22.5 mcg)
	else if (climateZone === "SUBTROPICAL") vitaminDMultiplier = 1.2; // ~720 IU
	else vitaminDMultiplier = 1.0; // 600 IU baseline

	// Eletrólitos: clima quente = suor = maior necessidade
	// Base: 2000mg sódio, 4700mg potássio, 400mg magnésio (adultos)
	let electrolyteMultiplier = 1.0;
	if (climateZone === "TROPICAL") electrolyteMultiplier = 1.3;
	else if (climateZone === "SUBTROPICAL") electrolyteMultiplier = 1.15;
	else if (climateZone === "COLD") electrolyteMultiplier = 0.9; // Menos suor

	// Para cidades de alta altitude (>2500m), ajustes adicionais:
	// - Maior necessidade de ferro (mais glóbulos vermelhos)
	// - Maor necessidade de líquidos
	// Ignorado por enquanto por falta de dados

	return {
		climateZone,
		sunExposure,
		vitaminDMultiplier,
		electrolyteMultiplier,
	};
}

/**
 * Aplica ajuste climático nas necessidades nutricionais
 */
export function calculateClimateAdjustment(
	factors: GeographicalFactors
): ClimateAdjustment {
	// Caloria: em média, clima frio aumenta TEF e shivering (se muito frio)
	// Mas dentro de ambientes controlados (casas aquecidas), o efeito é pequeno (< 100 kcal/dia)
	let calorieAdjustment = 0;
	if (factors.climateZone === "COLD") {
		calorieAdjustment = 100; // +100 kcal/dia
	}
	if (factors.climateZone === "TROPICAL") {
		calorieAdjustment = -50; // -50 kcal/dia (apetite reduzido)
	}

	// Água: multiplier baseado em necessidade de reposição de suor
	// Baseline: 2.0L/dia (mulheres), 2.5L/dia (homens) — já incluso nas macros
	// Aplicamos um multiplier sobre a baseline de 2.5L
	const waterMultiplier = factors.electrolyteMultiplier; // mesma lógica

	// Ajustes de micronutrientes
	const micronutrientMultipliers = {
		vitaminD: factors.vitaminDMultiplier,
		electrolytes: factors.electrolyteMultiplier,
	};

	const notes: string[] = [];

	if (factors.climateZone === "COLD") {
		notes.push("Clima frio: aumento leve de necessidades calóricas + maior necessidade de vitamina D (menos sol).");
		if (factors.sunExposure <= 3) {
			notes.push("Baixa exposição solar: considere suplementação de vitamina D (20-40mcg/dia) após consulta médica.");
		}
	}

	if (factors.climateZone === "TROPICAL") {
		notes.push("Clima quente: aumente a ingestão de água e eletrólitos (sódio, potássio, magnésio) para compensar suor.");
	}

	return {
		calorieAdjustment: Math.round(calorieAdjustment),
		waterMultiplier,
		micronutrientMultipliers: {
			vitaminD: factors.vitaminDMultiplier,
			electrolytes: factors.electrolyteMultiplier,
		},
		notes,
	};
}
