import type { Food } from "@prisma/client";
import { calculateDietTotals, type DietTotals } from "./diets";

export interface DietFoodEntry {
  foodId: string;
  food: Food;
  grams: number;
  mealSlot: string;
}

export interface FoodWithPrice extends Food {
  pricePer100g: number | null;
}

export interface SimilarFoodSuggestion extends FoodWithPrice {
  similarityScore: number;
  suggestedGrams: number;
}

export type FoodSortKey =
  | "name"
  | "price"
  | "protein"
  | "carbs"
  | "fat"
  | "calories";

export type FoodSortDirection = "asc" | "desc";

interface NutritionVector {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

const REBALANCE_MIN_GRAMS = 1;
const REBALANCE_MAX_GRAMS = 800;
const REBALANCE_TOLERANCE = 0.5;
const REBALANCE_STEPS = [20, 10, 5, 1, 0.5, 0.1] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizeRebalancedGrams(value: number): number {
  return roundToSingleDecimal(
    clamp(value, REBALANCE_MIN_GRAMS, REBALANCE_MAX_GRAMS)
  );
}

function getNutritionForFood(food: Pick<Food, "caloriesKcal" | "proteinG" | "fatG" | "carbsG" | "fiberG">, grams: number): NutritionVector {
  const factor = grams / 100;

  return {
    calories: factor * food.caloriesKcal,
    protein: factor * food.proteinG,
    fat: factor * food.fatG,
    carbs: factor * food.carbsG,
    fiber: factor * (food.fiberG || 0),
  };
}

function getNutritionForEntry(entry: DietFoodEntry): NutritionVector {
  return getNutritionForFood(entry.food, entry.grams);
}

function getRebalanceBucket(
  category: string
): "protein" | "carbs" | "fat" | "vegetables" | "general" {
  if (category === "proteina" || category === "lacteo" || category === "suplemento") {
    return "protein";
  }

  if (category === "carboidrato" || category === "fruta") {
    return "carbs";
  }

  if (category === "gordura") {
    return "fat";
  }

  if (category === "verdura" || category === "legume") {
    return "vegetables";
  }

  return "general";
}

function getRebalanceScore(currentTotals: DietTotals, targetTotals: DietTotals): number {
  return (
    Math.abs(currentTotals.totalCalories - targetTotals.totalCalories) /
      Math.max(targetTotals.totalCalories, 1) +
    Math.abs(currentTotals.totalProteinG - targetTotals.totalProteinG) /
      Math.max(targetTotals.totalProteinG, 1) +
    Math.abs(currentTotals.totalFatG - targetTotals.totalFatG) /
      Math.max(targetTotals.totalFatG, 1) +
    Math.abs(currentTotals.totalCarbsG - targetTotals.totalCarbsG) /
      Math.max(targetTotals.totalCarbsG, 1)
  );
}

function isWithinRebalanceTolerance(
  currentTotals: DietTotals,
  targetTotals: DietTotals
): boolean {
  return (
    Math.abs(currentTotals.totalCalories - targetTotals.totalCalories) <=
      REBALANCE_TOLERANCE &&
    Math.abs(currentTotals.totalProteinG - targetTotals.totalProteinG) <=
      REBALANCE_TOLERANCE &&
    Math.abs(currentTotals.totalFatG - targetTotals.totalFatG) <=
      REBALANCE_TOLERANCE &&
    Math.abs(currentTotals.totalCarbsG - targetTotals.totalCarbsG) <=
      REBALANCE_TOLERANCE
  );
}

function getPriceForEntry(
  foodId: string,
  grams: number,
  priceMap: Map<string, number>
): number {
  const pricePer100g = priceMap.get(foodId) ?? 0;
  return (grams / 100) * pricePer100g;
}

function getSimilarityScore(
  currentNutrition: NutritionVector,
  candidateNutrition: NutritionVector,
  sameCategory: boolean
): number {
  const caloriesDelta =
    Math.abs(candidateNutrition.calories - currentNutrition.calories) /
    Math.max(currentNutrition.calories, 1);
  const proteinDelta =
    Math.abs(candidateNutrition.protein - currentNutrition.protein) /
    Math.max(currentNutrition.protein, 1);
  const fatDelta =
    Math.abs(candidateNutrition.fat - currentNutrition.fat) /
    Math.max(currentNutrition.fat, 1);
  const carbsDelta =
    Math.abs(candidateNutrition.carbs - currentNutrition.carbs) /
    Math.max(currentNutrition.carbs, 1);
  const fiberDelta =
    Math.abs(candidateNutrition.fiber - currentNutrition.fiber) /
    Math.max(currentNutrition.fiber, 1);

  const categoryPenalty = sameCategory ? 0 : 0.4;
  const totalDelta =
    caloriesDelta + proteinDelta + fatDelta + carbsDelta + fiberDelta + categoryPenalty;

  return 1 / (1 + totalDelta);
}

function mergeDuplicatedFoods(foods: DietFoodEntry[]): DietFoodEntry[] {
  const merged = new Map<string, DietFoodEntry>();

  for (const item of foods) {
    const key = `${item.mealSlot}:${item.foodId}`;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, { ...item });
      continue;
    }

    merged.set(key, {
      ...existing,
      grams: existing.grams + item.grams,
    });
  }

  return Array.from(merged.values());
}

function calculateDietCostFromCatalog(
  foods: DietFoodEntry[],
  priceMap: Map<string, number>
): number | null {
  if (priceMap.size === 0) {
    return null;
  }

  const total = foods.reduce(
    (sum, item) => sum + getPriceForEntry(item.foodId, item.grams, priceMap),
    0
  );

  return Math.round(total * 100) / 100;
}

function getCostDistance(
  cost: number,
  range: { minDailyCost?: number | null; maxDailyCost?: number | null }
): number {
  const min = range.minDailyCost ?? null;
  const max = range.maxDailyCost ?? null;

  if (min !== null && cost < min) {
    return min - cost;
  }

  if (max !== null && cost > max) {
    return cost - max;
  }

  return 0;
}

export function attachFoodPrices(
  foods: Food[],
  priceMap: Map<string, number>
): FoodWithPrice[] {
  return foods.map((food) => ({
    ...food,
    pricePer100g: priceMap.get(food.id) ?? null,
  }));
}

export function filterFoodCatalog(
  foods: FoodWithPrice[],
  query: string
): FoodWithPrice[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return foods;
  }

  return foods.filter((food) => {
    const searchable = `${food.name} ${food.category} ${food.brand ?? ""}`.toLowerCase();
    return searchable.includes(normalizedQuery);
  });
}

export function sortFoodCatalog(
  foods: FoodWithPrice[],
  sortBy: FoodSortKey,
  direction?: FoodSortDirection
): FoodWithPrice[] {
  const resolvedDirection =
    direction ?? (sortBy === "price" || sortBy === "name" ? "asc" : "desc");

  const sorted = [...foods];
  sorted.sort((left, right) => {
    const multiplier = resolvedDirection === "asc" ? 1 : -1;

    if (sortBy === "name") {
      return left.name.localeCompare(right.name, "pt-BR") * multiplier;
    }

    const leftValue =
      sortBy === "price"
        ? left.pricePer100g ?? Number.POSITIVE_INFINITY
        : sortBy === "protein"
          ? left.proteinG
          : sortBy === "carbs"
            ? left.carbsG
            : sortBy === "fat"
              ? left.fatG
              : left.caloriesKcal;

    const rightValue =
      sortBy === "price"
        ? right.pricePer100g ?? Number.POSITIVE_INFINITY
        : sortBy === "protein"
          ? right.proteinG
          : sortBy === "carbs"
            ? right.carbsG
            : sortBy === "fat"
              ? right.fatG
              : right.caloriesKcal;

    if (leftValue === rightValue) {
      return left.name.localeCompare(right.name, "pt-BR");
    }

    return (leftValue - rightValue) * multiplier;
  });

  return sorted;
}

export function calculateReplacementGrams(
  currentFood: DietFoodEntry,
  replacementFood: Pick<Food, "caloriesKcal" | "proteinG" | "fatG" | "carbsG" | "fiberG">
): number {
  const currentNutrition = getNutritionForEntry(currentFood);
  const replacementVector = [
    replacementFood.caloriesKcal,
    replacementFood.proteinG,
    replacementFood.fatG,
    replacementFood.carbsG,
    replacementFood.fiberG || 0,
  ];
  const currentVector = [
    currentNutrition.calories,
    currentNutrition.protein,
    currentNutrition.fat,
    currentNutrition.carbs,
    currentNutrition.fiber,
  ];

  const numerator = replacementVector.reduce(
    (sum, value, index) => sum + value * currentVector[index],
    0
  );
  const denominator = replacementVector.reduce(
    (sum, value) => sum + value * value,
    0
  );

  if (denominator <= 0) {
    return Math.max(1, Math.round(currentFood.grams));
  }

  const scale = numerator / denominator;
  return clamp(Math.round(scale * 100), 10, 600);
}

export function rebalanceMealToTargetTotals(
  originalMealFoods: DietFoodEntry[],
  updatedMealFoods: DietFoodEntry[]
): {
  foods: DietFoodEntry[];
  totals: DietTotals;
} {
  if (originalMealFoods.length === 0 || updatedMealFoods.length === 0) {
    return {
      foods: updatedMealFoods,
      totals: calculateDietTotals(updatedMealFoods),
    };
  }

  const targetTotals = calculateDietTotals(originalMealFoods);
  let rebalancedFoods = updatedMealFoods.map((food) => ({
    ...food,
    grams: normalizeRebalancedGrams(food.grams),
  }));

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const currentTotals = calculateDietTotals(rebalancedFoods);
    if (isWithinRebalanceTolerance(currentTotals, targetTotals)) {
      break;
    }

    const proteinScale =
      currentTotals.totalProteinG > 0
        ? clamp(targetTotals.totalProteinG / currentTotals.totalProteinG, 0.6, 1.6)
        : 1;
    const carbScale =
      currentTotals.totalCarbsG > 0
        ? clamp(targetTotals.totalCarbsG / currentTotals.totalCarbsG, 0.6, 1.6)
        : 1;
    const fatScale =
      currentTotals.totalFatG > 0
        ? clamp(targetTotals.totalFatG / currentTotals.totalFatG, 0.6, 1.6)
        : 1;
    const caloriesScale =
      currentTotals.totalCalories > 0
        ? clamp(targetTotals.totalCalories / currentTotals.totalCalories, 0.8, 1.2)
        : 1;

    rebalancedFoods = rebalancedFoods.map((food) => {
      const bucket = getRebalanceBucket(food.food.category);
      const bucketScale =
        bucket === "protein"
          ? proteinScale
          : bucket === "carbs"
            ? carbScale
            : bucket === "fat"
              ? fatScale
              : caloriesScale;
      const nextScale =
        bucket === "vegetables"
          ? clamp(caloriesScale, 0.9, 1.1)
          : Math.sqrt(bucketScale * caloriesScale);

      return {
        ...food,
        grams: normalizeRebalancedGrams(food.grams * nextScale),
      };
    });
  }

  const bestFoods = rebalancedFoods.map((food) => ({ ...food }));
  let bestTotals = calculateDietTotals(bestFoods);
  let bestScore = getRebalanceScore(bestTotals, targetTotals);

  for (const step of REBALANCE_STEPS) {
    let improved = true;
    let guard = 0;

    while (improved && guard < 200) {
      guard += 1;
      improved = false;

      if (isWithinRebalanceTolerance(bestTotals, targetTotals)) {
        break;
      }

      let candidateBest:
        | {
            index: number;
            grams: number;
            totals: DietTotals;
            score: number;
          }
        | null = null;

      for (const [index, food] of bestFoods.entries()) {
        for (const direction of [-1, 1] as const) {
          const nextGrams = normalizeRebalancedGrams(food.grams + direction * step);

          if (nextGrams === food.grams) {
            continue;
          }

          const candidateFoods = bestFoods.map((entry, candidateIndex) =>
            candidateIndex === index
              ? {
                  ...entry,
                  grams: nextGrams,
                }
              : entry
          );
          const candidateTotals = calculateDietTotals(candidateFoods);
          const candidateScore = getRebalanceScore(candidateTotals, targetTotals);

          if (candidateScore + 0.0001 >= bestScore) {
            continue;
          }

          if (!candidateBest || candidateScore < candidateBest.score) {
            candidateBest = {
              index,
              grams: nextGrams,
              totals: candidateTotals,
              score: candidateScore,
            };
          }
        }
      }

      if (!candidateBest) {
        continue;
      }

      bestFoods[candidateBest.index] = {
        ...bestFoods[candidateBest.index],
        grams: candidateBest.grams,
      };
      bestTotals = candidateBest.totals;
      bestScore = candidateBest.score;
      improved = true;
    }
  }

  return {
    foods: bestFoods,
    totals: bestTotals,
  };
}

export function suggestSimilarFoods(
  currentFood: DietFoodEntry,
  foods: FoodWithPrice[],
  limit = 5
): SimilarFoodSuggestion[] {
  const currentNutrition = getNutritionForEntry(currentFood);
  const rankedFoods = foods
    .filter((food) => food.id !== currentFood.foodId)
    .map((food) => {
      const suggestedGrams = calculateReplacementGrams(currentFood, food);
      const suggestedNutrition = getNutritionForFood(food, suggestedGrams);

      return {
        ...food,
        suggestedGrams,
        similarityScore: getSimilarityScore(
          currentNutrition,
          suggestedNutrition,
          food.category === currentFood.food.category
        ),
      };
    })
    .sort((left, right) => right.similarityScore - left.similarityScore);

  const sameCategory = rankedFoods.filter(
    (food) => food.category === currentFood.food.category
  );
  const differentCategory = rankedFoods.filter(
    (food) => food.category !== currentFood.food.category
  );

  return [...sameCategory, ...differentCategory].slice(0, limit);
}

export function tuneDietCostRange(
  foods: DietFoodEntry[],
  catalog: FoodWithPrice[],
  range: {
    minDailyCost?: number | null;
    maxDailyCost?: number | null;
  }
): {
  foods: DietFoodEntry[];
  estimatedCost: number | null;
  withinRange: boolean;
  notes: string[];
} {
  const priceMap = new Map<string, number>();
  for (const food of catalog) {
    if (food.pricePer100g !== null) {
      priceMap.set(food.id, food.pricePer100g);
    }
  }

  const normalizedRange = {
    minDailyCost:
      range.minDailyCost !== null && range.minDailyCost !== undefined
        ? Math.max(range.minDailyCost, 0)
        : null,
    maxDailyCost:
      range.maxDailyCost !== null && range.maxDailyCost !== undefined
        ? Math.max(range.maxDailyCost, 0)
        : null,
  };

  if (priceMap.size === 0) {
    return {
      foods,
      estimatedCost: null,
      withinRange: false,
      notes: ["Faixa de custo ignorada porque não há preços disponíveis."],
    };
  }

  if (
    normalizedRange.minDailyCost !== null &&
    normalizedRange.maxDailyCost !== null &&
    normalizedRange.minDailyCost > normalizedRange.maxDailyCost
  ) {
    normalizedRange.maxDailyCost = normalizedRange.minDailyCost;
  }

  let tunedFoods = foods.map((food) => ({ ...food }));
  let currentCost = calculateDietCostFromCatalog(tunedFoods, priceMap);

  if (currentCost === null) {
    return {
      foods: tunedFoods,
      estimatedCost: null,
      withinRange: false,
      notes: ["Não foi possível calcular o custo atual da dieta."],
    };
  }

  const initialDistance = getCostDistance(currentCost, normalizedRange);
  if (initialDistance === 0) {
    return {
      foods: tunedFoods,
      estimatedCost: currentCost,
      withinRange: true,
      notes: ["Faixa de custo atendida com a dieta gerada."],
    };
  }

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const direction =
      normalizedRange.maxDailyCost !== null && currentCost > normalizedRange.maxDailyCost
        ? "down"
        : normalizedRange.minDailyCost !== null &&
            currentCost < normalizedRange.minDailyCost
          ? "up"
          : null;

    if (!direction) {
      break;
    }

    let bestCandidate:
      | {
          index: number;
          replacement: SimilarFoodSuggestion;
          nextCost: number;
          score: number;
        }
      | null = null;

    for (const [index, currentFood] of tunedFoods.entries()) {
      const currentItemCost = getPriceForEntry(
        currentFood.foodId,
        currentFood.grams,
        priceMap
      );
      const rankedCandidates = suggestSimilarFoods(currentFood, catalog, 12);
      const sameCategoryCandidates = rankedCandidates.filter(
        (candidate) => candidate.category === currentFood.food.category
      );
      const candidates =
        sameCategoryCandidates.length > 0
          ? sameCategoryCandidates
          : rankedCandidates;

      for (const candidate of candidates) {
        if (candidate.pricePer100g === null) {
          continue;
        }

        const nextItemCost =
          (candidate.suggestedGrams / 100) * candidate.pricePer100g;

        if (direction === "down" && nextItemCost >= currentItemCost) {
          continue;
        }

        if (direction === "up" && nextItemCost <= currentItemCost) {
          continue;
        }

        const nextCost: number =
          Math.round((currentCost - currentItemCost + nextItemCost) * 100) / 100;
        const improvement: number =
          getCostDistance(currentCost, normalizedRange) -
          getCostDistance(nextCost, normalizedRange);

        if (improvement <= 0) {
          continue;
        }

        const score: number = improvement * 100 + candidate.similarityScore * 10;
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = {
            index,
            replacement: candidate,
            nextCost,
            score,
          };
        }
      }
    }

    if (!bestCandidate) {
      break;
    }

    tunedFoods[bestCandidate.index] = {
      foodId: bestCandidate.replacement.id,
      food: bestCandidate.replacement,
      grams: bestCandidate.replacement.suggestedGrams,
      mealSlot: tunedFoods[bestCandidate.index].mealSlot,
    };
    tunedFoods = mergeDuplicatedFoods(tunedFoods);
    currentCost = calculateDietCostFromCatalog(tunedFoods, priceMap) ?? bestCandidate.nextCost;
  }

  if (
    normalizedRange.maxDailyCost !== null &&
    currentCost > normalizedRange.maxDailyCost
  ) {
    const mostExpensiveFood = tunedFoods.reduce<DietFoodEntry | null>(
      (selected, food) => {
        if (!selected) {
          return food;
        }

        return getPriceForEntry(food.foodId, food.grams, priceMap) >
          getPriceForEntry(selected.foodId, selected.grams, priceMap)
          ? food
          : selected;
      },
      null
    );

    if (mostExpensiveFood) {
      const itemPricePer100g = priceMap.get(mostExpensiveFood.foodId) ?? 0;
      const gramsReduction = itemPricePer100g
        ? Math.ceil(
            ((currentCost - normalizedRange.maxDailyCost) / itemPricePer100g) * 100
          )
        : 0;

      if (gramsReduction > 0) {
        mostExpensiveFood.grams = Math.max(10, mostExpensiveFood.grams - gramsReduction);
        currentCost = calculateDietCostFromCatalog(tunedFoods, priceMap) ?? currentCost;
      }
    }
  }

  if (
    normalizedRange.minDailyCost !== null &&
    currentCost < normalizedRange.minDailyCost
  ) {
    const richestFood = tunedFoods.reduce<DietFoodEntry | null>((selected, food) => {
      if (!selected) {
        return food;
      }

      return (priceMap.get(food.foodId) ?? 0) > (priceMap.get(selected.foodId) ?? 0)
        ? food
        : selected;
    }, null);

    if (richestFood) {
      const itemPricePer100g = priceMap.get(richestFood.foodId) ?? 0;
      const gramsIncrease = itemPricePer100g
        ? Math.ceil(
            ((normalizedRange.minDailyCost - currentCost) / itemPricePer100g) * 100
          )
        : 0;

      if (gramsIncrease > 0) {
        richestFood.grams += gramsIncrease;
        currentCost = calculateDietCostFromCatalog(tunedFoods, priceMap) ?? currentCost;
      }
    }
  }

  const withinRange = getCostDistance(currentCost, normalizedRange) === 0;

  return {
    foods: tunedFoods,
    estimatedCost: currentCost,
    withinRange,
    notes: withinRange
      ? ["Faixa de custo ajustada com trocas de alimentos similares."]
      : ["Não foi possível atingir totalmente a faixa de custo com os alimentos disponíveis."],
  };
}
