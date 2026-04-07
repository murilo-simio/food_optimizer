import { Food, UserProfile, TasteProfile } from "@prisma/client";
import { CalculatedMetrics } from "./calculators/types";

/**
 * Representa um alimento com quantidade sugerida em uma refeição
 */
export interface DietFood {
  foodId: string;
  food: Food;
  grams: number;
  mealSlot: string; // "cafe_manha", "almoco", "jantar", "lanche1", "lanche2", etc.
}

/**
 * Dieta completa gerada
 */
export interface GeneratedDiet {
  foods: DietFood[];
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
  totalFiberG: number;
  estimatedCost: number | null; // null se não houver preços
  notes: string[];
}

/**
 * Configurações para geração de dieta
 */
export interface DietGenerationConfig {
  profile: UserProfile;
  nutrition: CalculatedMetrics;
  tasteProfile?: TasteProfile | null;
  availableFoods: Food[];
  mealSlots: string[]; // ex: ["cafe_manha", "almoco", "jantar", "lanche1", "lanche2"]
}

/**
 * Algoritmo guloso para montar dieta
 *
 * Estratégia:
 * 1. Filtrar alimentos por restrições (vegano, sem glúten, etc.)
 * 2. Priorizar alimentos do perfil de sabor (staple foods)
 * 3. Distribuir calorias totais entre os mealSlots (ex: 25% café, 35% almoço, 30% jantar, 10% lanches)
 * 4. Para cada mealSlot, selecionar alimentos gulosamente atendendo macros
 *    - Começar com proteínas (priorizar alimentos proteicos)
 *    - Adicionar carboidratos
 *    - Adicionar gorduras
 *    - Ajustar até chegar perto da meta calórica do slot
 * 5. Considerar aversões: excluir alimentos da lista
 *
 * Limitações (versão simples):
 * - Não otimiza por custo ainda (isso virá no passo 3 com simplex)
 * - Não garante 100% de micronutrientes (mas tenta variar categorias)
 * - Porcentagens de refeições fixas
 */
export function generateDietGreedy(config: DietGenerationConfig): GeneratedDiet {
  const { profile, nutrition, tasteProfile, availableFoods, mealSlots } = config;
  const { targetCalories, targetProteinG, targetFatG, targetCarbsG, targetFiberG } = nutrition;

  const dietFoods: DietFood[] = [];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber = 0;

  // 1. Filtrar alimentos por restrições
  let allowedFoods = filterFoodsByRestrictions(availableFoods, profile.dietaryRestrictions);

  // 2. Excluir aversões
  if (tasteProfile?.aversions) {
    const aversions = JSON.parse(tasteProfile.aversions);
    allowedFoods = allowedFoods.filter(f => !aversions.includes(f.name.toLowerCase()));
  }

  // 3. Distribuir calorias por mealSlot (simples: 25% café, 35% almoço, 30% jantar, 10% lanches)
  const slotCalories = distributeCaloriesBySlot(targetCalories, mealSlots);

  // 4. Alimentos prioritários (staple foods) - dar preferência
  const stapleFoodNames = tasteProfile?.stapleFoods
    ? JSON.parse(tasteProfile.stapleFoods as string)
    : [];

  // Separar alimentos em categorias para easier selection
  const proteins = filterByCategory(allowedFoods, ["proteina", "lacteo"]);
  const carbs = filterByCategory(allowedFoods, ["carboidrato", "fruta"]);
  const fats = filterByCategory(allowedFoods, ["gordura"]);
  const vegetables = filterByCategory(allowedFoods, ["verdura"]);

  // 5. Para cada slot, montar refeição
  for (const slot of mealSlots) {
    const slotTargetCal = slotCalories[slot];
    let currentSlotCalories = 0; // calorias acumuladas nesta refeição
    const slotFoods: DietFood[] = [];

    // Determinar proporção de macros para este slot (ex: café mais carbo, almoço mais均衡)
    const [proteinPct, fatPct, carbPct] = getMacroDistributionForSlot(slot);

    const slotTargetProtein = (slotTargetCal * proteinPct) / 4; // 4 kcal/g
    const slotTargetFat = (slotTargetCal * fatPct) / 9;       // 9 kcal/g
    const slotTargetCarbs = (slotTargetCal * carbPct) / 4;    // 4 kcal/g

    // Selecionar proteína
    let proteinGrams = 0;
    let proteinSource: Food | null = null;

    // Priorizar staple foods que sejam proteínas
    for (const food of proteins) {
      if (stapleFoodNames.includes(food.name.toLowerCase()) && food.proteinG > 10) {
        proteinSource = food;
        break;
      }
    }
    // Se não achou staple, pega a proteína com maior densidade proteica
    if (!proteinSource) {
      proteinSource = proteins
        .filter(f => f.proteinG > 15)
        .sort((a, b) => b.proteinG - a.proteinG)[0] || proteins[0];
    }

    if (proteinSource) {
      proteinGrams = slotTargetProtein * 0.4; // 40% da proteína do slot
      const proteinCal = (proteinGrams / 100) * proteinSource.caloriesKcal;
      slotFoods.push({
        foodId: proteinSource.id,
        food: proteinSource,
        grams: proteinGrams,
        mealSlot: slot,
      });
      currentSlotCalories += proteinCal;
    }

    // Selecionar carboidrato
    let carbGrams = 0;
    let carbSource: Food | null = null;

    // Priorizar staple foods carboidratos
    for (const food of carbs) {
      if (stapleFoodNames.includes(food.name.toLowerCase())) {
        carbSource = food;
        break;
      }
    }
    if (!carbSource) {
      carbSource = carbs
        .filter(f => f.carbsG > 15)
        .sort((a, b) => b.carbsG - a.carbsG)[0] || carbs[0];
    }

    if (carbSource) {
      carbGrams = slotTargetCarbs * 0.6; // 60% dos carbs do slot
      const carbCal = (carbGrams / 100) * carbSource.caloriesKcal;
      slotFoods.push({
        foodId: carbSource.id,
        food: carbSource,
        grams: carbGrams,
        mealSlot: slot,
      });
      currentSlotCalories += carbCal;
    }

    // Selecionar gordura
    let fatGrams = 0;
    let fatSource: Food | null = null;

    // Gordura pode ser azeite, manteiga, abacate
    fatSource = fats[0]; // Simples: pega a primeira

    if (fatSource) {
      fatGrams = slotTargetFat * 0.8; // 80% da gordura do slot
      const fatCal = (fatGrams / 100) * fatSource.caloriesKcal;
      slotFoods.push({
        foodId: fatSource.id,
        food: fatSource,
        grams: fatGrams,
        mealSlot: slot,
      });
      currentSlotCalories += fatCal;
    }

    // Adicionar vegetais (livre, quase sem calorias) - pelo menos 50g
    if (vegetables.length > 0) {
      const veg = vegetables[0];
      const vegGrams = 100; // 100g de vegetal
      const vegCal = (vegGrams / 100) * veg.caloriesKcal;
      slotFoods.push({
        foodId: veg.id,
        food: veg,
        grams: vegGrams,
        mealSlot: slot,
      });
      currentSlotCalories += vegCal;
    }

    // Acumular totais
    for (const df of slotFoods) {
      dietFoods.push(df);
      totalCalories += (df.grams / 100) * df.food.caloriesKcal;
      totalProtein += (df.grams / 100) * df.food.proteinG;
      totalFat += (df.grams / 100) * df.food.fatG;
      totalCarbs += (df.grams / 100) * df.food.carbsG;
      totalFiber += (df.grams / 100) * (df.food.fiberG || 0);
    }
  }

  // 6. Ajustar para bater metas (simples scaling)
  const calorieDiff = targetCalories - totalCalories;
  if (Math.abs(calorieDiff) > 50) { // Se diferença > 50kcal, ajusta proporcionalmente
    const scaleFactor = targetCalories / totalCalories;
    dietFoods.forEach(df => {
      df.grams = Math.round(df.grams * scaleFactor);
    });
    // Recalcular totais
    totalCalories = 0;
    totalProtein = 0;
    totalFat = 0;
    totalCarbs = 0;
    totalFiber = 0;
    for (const df of dietFoods) {
      totalCalories += (df.grams / 100) * df.food.caloriesKcal;
      totalProtein += (df.grams / 100) * df.food.proteinG;
      totalFat += (df.grams / 100) * df.food.fatG;
      totalCarbs += (df.grams / 100) * df.food.carbsG;
      totalFiber += (df.grams / 100) * (df.food.fiberG || 0);
    }
  }

  // 7. Estimar custo (se houver preços)
  let estimatedCost: number | null = null;
  // Por enquanto, null. O passo 3 (simplex) calculará custo otimizado

  const notes: string[] = [];
  notes.push(`Dieta gerada via algoritmo guloso.`);
  notes.push(`Meta calórica: ${targetCalories} kcal, atingida: ${Math.round(totalCalories)} kcal.`);
  notes.push(`Proteína: ${Math.round(totalProtein)}g/${targetProteinG}g, Gordura: ${Math.round(totalFat)}g/${targetFatG}g, Carbos: ${Math.round(totalCarbs)}g/${targetCarbsG}g.`);

  return {
    foods: dietFoods,
    totalCalories: Math.round(totalCalories),
    totalProteinG: Math.round(totalProtein),
    totalFatG: Math.round(totalFat),
    totalCarbsG: Math.round(totalCarbs),
    totalFiberG: Math.round(totalFiber),
    estimatedCost,
    notes,
  };
}

/**
 * Filtra alimentos por restrições alimentares
 */
function filterFoodsByRestrictions(foods: Food[], restriction: string): Food[] {
  switch (restriction) {
    case "VEGAN":
      return foods.filter(f =>
        f.category !== "lacteo" &&
        f.category !== "proteina" || f.name.includes("feijão") || f.name.includes("lentilha")
      );
    case "VEGETARIAN":
      return foods.filter(f =>
        f.category !== "proteina" || f.name.includes("feijão") || f.name.includes("lentilha")
      );
    case "LACTOSE_FREE":
      return foods.filter(f => f.category !== "lacteo");
    case "GLUTEN_FREE":
      return foods.filter(f => !f.name.toLowerCase().includes("pão") && !f.name.toLowerCase().includes("aveia"));
    case "LOW_CARB":
      return foods.filter(f => f.carbsG < 30); // Limite arbitrário
    case "KETO":
      return foods.filter(f => f.fatG > 0 && f.carbsG < 5);
    default:
      return foods;
  }
}

/**
 * Filtra alimentos por categoria
 */
function filterByCategory(foods: Food[], categories: string[]): Food[] {
  return foods.filter(f => categories.includes(f.category));
}

/**
 * Distribui calorias totais entre os slots de refeição
 */
function distributeCaloriesBySlot(totalCalories: number, slots: string[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  // Distribuição padrão
  const defaultDist: Record<string, number> = {
    cafe_manha: 0.25,
    almoco: 0.35,
    jantar: 0.30,
    lanche1: 0.05,
    lanche2: 0.05,
  };

  // Ajustar com base no número de slots
  const usedDist: Record<string, number> = {};
  let allocated = 0;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (i < 3) {
      // Primeiros 3 slots (café, almoço, jantar) recebem proporcionalmente
      usedDist[slot] = defaultDist[slot] || 0.30;
    } else {
      // Lanches recebem o restante dividido igualmente
      usedDist[slot] = 0.05;
    }
    allocated += usedDist[slot];
  }

  // Normalizar para 100%
  for (const slot of Object.keys(usedDist)) {
    distribution[slot] = Math.round(totalCalories * (usedDist[slot] / allocated));
  }

  return distribution;
}

/**
 * Retorna a distribuição de macros (proteína, gordura, carboidrato) para cada tipo de refeição
 * Retorna [proteinPct, fatPct, carbPct] - somam 1.0
 */
function getMacroDistributionForSlot(slot: string): [number, number, number] {
  switch (slot) {
    case "cafe_manha":
      return [0.25, 0.25, 0.50]; // Mais carboidratos
    case "almoco":
      return [0.30, 0.30, 0.40]; //均衡
    case "jantar":
      return [0.35, 0.35, 0.30]; // Mais proteína e gordura
    case "lanche1":
    case "lanche2":
      return [0.20, 0.20, 0.60]; // Lanches mais carboidratos
    default:
      return [0.30, 0.30, 0.40];
  }
}