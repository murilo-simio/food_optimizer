import { Food } from "@prisma/client";

/**
 * Representa uma solução de otimização de dieta
 */
export interface OptimizedDiet extends DietSolution {
  foods: FoodQuantity[];
}

export interface FoodQuantity {
  foodId: string;
  food: Food;
  grams: number;
  mealSlot: string;
}

export interface DietSolution {
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
  totalFiberG: number;
  totalCost: number;
}

/**
 * Configuração do otimizador
 */
export interface OptimizerConfig {
  availableFoods: Food[];
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
  targetFiberG: number;
  mealSlots: string[];
  slotCalories: Record<string, number>; // calorias por refeição
  constraints: {
    protein: [number, number]; // [min%, max%] ex: [0.9, 1.1] = ±10%
    fat: [number, number];
    carbs: [number, number];
    fiber: [number, number]; // min%
    costWeight: number; // 0-1, importância do custo (0=ignorar, 1=só custo)
  };
  excludeFoods?: string[]; // IDs de alimentos a excluir
  preferFoods?: string[]; // IDs de alimentos a priorizar
}

/**
 * Algoritmo de otimização por custo usando approached de "cost per nutrient"
 *
 * Estratégia:
 * 1. Para cada mealSlot, selecionar alimentos que minimizem custo por kcal
 * 2. Ajustar quantidades para atingir macros do slot
 * 3.iterar até convergir (ou limite de iterações)
 * 4. Garantir restrições de variedade (mínimo 3 categorias)
 *
 * Nota: Este é um solver simplificado. Para Fase 3+ podemos integrar biblioteca de LP.
 */
export function optimizeDietCost(config: OptimizerConfig): OptimizedDiet {
  const {
    availableFoods,
    targetCalories,
    targetProteinG,
    targetFatG,
    targetCarbsG,
    targetFiberG,
    mealSlots,
    slotCalories,
    constraints,
    excludeFoods = [],
    preferFoods = [],
  } = config;

  // 1. Filtrar alimentos excluídos
  let candidateFoods = availableFoods.filter(f => !excludeFoods.includes(f.id));

  // 2. Dividir por categoria
  const categories = {
    proteina: candidateFoods.filter(f => f.category === "proteina" || f.category === "lacteo"),
    carboidrato: candidateFoods.filter(f => f.category === "carboidrato" || f.category === "fruta"),
    gordura: candidateFoods.filter(f => f.category === "gordura"),
    verdura: candidateFoods.filter(f => f.category === "verdura"),
  };

  // 3. Para cada slot, construir refeição otimizada por custo
  const allFoods: FoodQuantity[] = [];
  let totalCal = 0, totalP = 0, totalF = 0, totalC = 0, totalFib = 0, totalCost = 0;

  for (const slot of mealSlots) {
    const targetCalSlot = slotCalories[slot];
    if (targetCalSlot <= 0) continue;

    const [targetPSlot, targetFSlot, targetCSlot] = getMacroDistributionForSlot(slot, targetCalSlot);

    // Selecionar alimentos para este slot
    const slotFoods = selectFoodsForSlot({
      targetCalories: targetCalSlot,
      targetProteinG: targetPSlot,
      targetFatG: targetFSlot,
      targetCarbsG: targetCSlot,
      categories,
      preferFoods,
    });

    // Adicionar à solução
    for (const sf of slotFoods) {
      allFoods.push({
        ...sf,
        mealSlot: slot,
      });
      const cal = (sf.grams / 100) * sf.food.caloriesKcal;
      totalCal += cal;
      totalP += (sf.grams / 100) * sf.food.proteinG;
      totalF += (sf.grams / 100) * sf.food.fatG;
      totalC += (sf.grams / 100) * sf.food.carbsG;
      totalFib += (sf.grams / 100) * (sf.food.fiberG || 0);
      totalCost += (sf.grams / 100) * (getFoodPrice(sf.food) || 0);
    }
  }

  // 4. Ajustar para garantir constraints de macros (dentro de ±5%)
  const proteinRatio = totalP / targetProteinG;
  const fatRatio = totalF / targetFatG;
  const carbsRatio = totalC / targetCarbsG;

  // Se fora dos limites, ajustar scaling
  const adjustScale = Math.max(
    0.95 / Math.min(proteinRatio, fatRatio, carbsRatio),
    1.05 / Math.max(proteinRatio, fatRatio, carbsRatio),
    1.0
  );

  if (Math.abs(adjustScale - 1.0) > 0.01) {
    allFoods.forEach(f => {
      f.grams = Math.round(f.grams * adjustScale);
    });
    // Recalcular totais
    totalCal = 0; totalP = 0; totalF = 0; totalC = 0; totalFib = 0; totalCost = 0;
    for (const f of allFoods) {
      totalCal += (f.grams / 100) * f.food.caloriesKcal;
      totalP += (f.grams / 100) * f.food.proteinG;
      totalF += (f.grams / 100) * f.food.fatG;
      totalC += (f.grams / 100) * f.food.carbsG;
      totalFib += (f.grams / 100) * (f.food.fiberG || 0);
      totalCost += (f.grams / 100) * (getFoodPrice(f.food) || 0);
    }
  }

  // 5. Verificar variedade de categorias (mínimo 3)
  const usedCategories = new Set(allFoods.map(f => f.food.category));
  if (usedCategories.size < 3) {
    // Adicionar vegetais (geralmente faltam)
    const vegFood = categories.verdura[0];
    if (vegFood && !allFoods.some(f => f.food.category === "verdura")) {
      const vegGrams = 100;
      allFoods.push({
        foodId: vegFood.id,
        food: vegFood,
        grams: vegGrams,
        mealSlot: mealSlots[0], // adicionar no primeiro slot
      });
      totalCal += (vegGrams / 100) * vegFood.caloriesKcal;
      // ... atualizar outros totais
    }
  }

  return {
    foods: allFoods,
    totalCalories: Math.round(totalCal),
    totalProteinG: Math.round(totalP),
    totalFatG: Math.round(totalF),
    totalCarbsG: Math.round(totalC),
    totalFiberG: Math.round(totalFib),
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

/**
 * Seleciona alimentos para uma refeição (slot) específica
 * Usa heuristic de menor custo por nutriente
 */
function selectFoodsForSlot(params: {
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
  categories: Record<string, Food[]>;
  preferFoods: string[];
}): FoodQuantity[] {
  const { targetCalories, targetProteinG, targetFatG, targetCarbsG, categories, preferFoods } = params;

  const result: FoodQuantity[] = [];
  let remainingCal = targetCalories;

  // Proteína
  const proteinTarget = targetProteinG;
  let proteinUsed = 0;
  const proteinSource = selectBestProtein(categories.proteina, preferFoods);
  if (proteinSource) {
    const gramsNeeded = (proteinTarget * 100) / proteinSource.proteinG; // grams needed for target
    const grams = Math.min(gramsNeeded, remainingCal * 0.4 / (proteinSource.caloriesKcal / 100)); // não mais que 40% das calorias
    result.push({
      foodId: proteinSource.id,
      food: proteinSource,
      grams: Math.round(grams),
    });
    remainingCal -= (result[result.length - 1].grams / 100) * proteinSource.caloriesKcal;
    proteinUsed = (result[result.length - 1].grams / 100) * proteinSource.proteinG;
  }

  // Carboidrato
  const carbTarget = targetCarbsG;
  const carbSource = selectBestCarb(categories.carboidrato, preferFoods);
  if (carbSource) {
    const gramsNeeded = (carbTarget * 100) / carbSource.carbsG;
    const grams = Math.min(gramsNeeded, remainingCal * 0.6 / (carbSource.caloriesKcal / 100));
    result.push({
      foodId: carbSource.id,
      food: carbSource,
      grams: Math.round(grams),
    });
    remainingCal -= (result[result.length - 1].grams / 100) * carbSource.caloriesKcal;
  }

  // Gordura
  const fatTarget = targetFatG;
  const fatSource = categories.gordura[0];
  if (fatSource) {
    const gramsNeeded = (fatTarget * 100) / fatSource.fatG;
    const grams = Math.min(gramsNeeded, remainingCal * 0.9 / (fatSource.caloriesKcal / 100));
    result.push({
      foodId: fatSource.id,
      food: fatSource,
      grams: Math.round(Math.max(grams, 5)), // pelo menos 5g
    });
    remainingCal -= (result[result.length - 1].grams / 100) * fatSource.caloriesKcal;
  }

  // Verdura (opcional, livre)
  const vegSource = categories.verdura[0];
  if (vegSource && remainingCal > 50) {
    result.push({
      foodId: vegSource.id,
      food: vegSource,
      grams: 100, // padrão 100g
    });
  }

  return result;
}

/**
 * Seleciona melhor proteína baseada em custo por grama de proteína
 */
function selectBestProtein(proteins: Food[], preferFoods: string[]): Food | null {
  if (proteins.length === 0) return null;

  // Priorizar alimentos preferidos
  const preferred = proteins.filter(f => preferFoods.includes(f.id));
  if (preferred.length > 0) {
    return preferBestByCostPerProtein(preferred);
  }

  return preferBestByCostPerProtein(proteins);
}

/**
 * Seleciona melhor carboidrato baseada em custo por grama de carboidrato
 */
function selectBestCarb(carbs: Food[], preferFoods: string[]): Food | null {
  if (carbs.length === 0) return null;

  const preferred = carbs.filter(f => preferFoods.includes(f.id));
  if (preferred.length > 0) {
    return preferBestByCostPerCarb(preferred);
  }

  return preferBestByCostPerCarb(carbs);
}

/**
 * Preferencia por custo por nutriente (menor é melhor)
 */
function preferBestByCostPerProtein(foods: Food[]): Food {
  return foods
    .filter(f => f.proteinG > 5) // pelo menos 5g de proteína
    .sort((a, b) => {
      const priceA = getFoodPrice(a) || Infinity;
      const priceB = getFoodPrice(b) || Infinity;
      const costPerProteinA = priceA / a.proteinG;
      const costPerProteinB = priceB / b.proteinG;
      return costPerProteinA - costPerProteinB;
    })[0] || foods[0];
}

function preferBestByCostPerCarb(foods: Food[]): Food {
  return foods
    .filter(f => f.carbsG > 10) // pelo menos 10g de carboidrato
    .sort((a, b) => {
      const priceA = getFoodPrice(a) || Infinity;
      const priceB = getFoodPrice(b) || Infinity;
      const costPerCarbA = priceA / a.carbsG;
      const costPerCarbB = priceB / b.carbsG;
      return costPerCarbA - costPerCarbB;
    })[0] || foods[0];
}

/**
 * Retorna preço por 100g do alimento (se disponível)
 * Aceita um mapa de preços pré-carregado para efficiency
 */
export function getFoodPrice(
  food: Food,
  priceMap?: Map<string, number>
): number | null {
  if (priceMap && priceMap.has(food.id)) {
    return priceMap.get(food.id);
  }
  return null;
}

/**
 * Distribuição de macros para cada tipo de refeição
 */
function getMacroDistributionForSlot(slot: string, totalCal: number): [number, number, number] {
  switch (slot) {
    case "cafe_manha":
      return [
        (totalCal * 0.25) / 4,   // protein g
        (totalCal * 0.25) / 9,   // fat g
        (totalCal * 0.50) / 4,   // carbs g
      ];
    case "almoco":
      return [
        (totalCal * 0.30) / 4,
        (totalCal * 0.30) / 9,
        (totalCal * 0.40) / 4,
      ];
    case "jantar":
      return [
        (totalCal * 0.35) / 4,
        (totalCal * 0.35) / 9,
        (totalCal * 0.30) / 4,
      ];
    default: // lanches
      return [
        (totalCal * 0.20) / 4,
        (totalCal * 0.20) / 9,
        (totalCal * 0.60) / 4,
      ];
  }
}

/**
 * Distribui calorias totais entre os slots de refeição
 * (copiado de diet-builder para evitar circular dependency)
 */
export function distributeCaloriesBySlot(
  totalCalories: number,
  slots: string[]
): Record<string, number> {
  const distribution: Record<string, number> = {};

  const defaultDist: Record<string, number> = {
    cafe_manha: 0.25,
    almoco: 0.35,
    jantar: 0.30,
    lanche1: 0.05,
    lanche2: 0.05,
  };

  const usedDist: Record<string, number> = {};
  let allocated = 0;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (i < 3) {
      usedDist[slot] = defaultDist[slot] || 0.30;
    } else {
      usedDist[slot] = 0.05;
    }
    allocated += usedDist[slot];
  }

  for (const slot of Object.keys(usedDist)) {
    distribution[slot] = Math.round(totalCalories * (usedDist[slot] / allocated));
  }

  return distribution;
}