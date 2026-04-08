export type MacroDistribution = [proteinRatio: number, fatRatio: number, carbRatio: number];
export type MacroTargets = [proteinG: number, fatG: number, carbsG: number];

const DEFAULT_SLOT_DISTRIBUTION: Record<string, number> = {
  cafe_manha: 0.25,
  almoco: 0.35,
  jantar: 0.3,
  lanche1: 0.05,
  lanche2: 0.05,
};

export function distributeCaloriesBySlot(
  totalCalories: number,
  slots: string[]
): Record<string, number> {
  const distribution: Record<string, number> = {};
  const usedDistribution: Record<string, number> = {};
  let allocated = 0;

  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    usedDistribution[slot] =
      index < 3 ? (DEFAULT_SLOT_DISTRIBUTION[slot] ?? 0.3) : 0.05;
    allocated += usedDistribution[slot];
  }

  for (const slot of Object.keys(usedDistribution)) {
    distribution[slot] = Math.round(totalCalories * (usedDistribution[slot] / allocated));
  }

  return distribution;
}

export function getMacroDistributionForSlot(slot: string): MacroDistribution {
  switch (slot) {
    case "cafe_manha":
      return [0.25, 0.25, 0.5];
    case "almoco":
      return [0.3, 0.3, 0.4];
    case "jantar":
      return [0.35, 0.35, 0.3];
    case "lanche1":
    case "lanche2":
      return [0.2, 0.2, 0.6];
    default:
      return [0.3, 0.3, 0.4];
  }
}

export function getMacroTargetsForSlot(slot: string, totalCalories: number): MacroTargets {
  const [proteinRatio, fatRatio, carbRatio] = getMacroDistributionForSlot(slot);

  return [
    (totalCalories * proteinRatio) / 4,
    (totalCalories * fatRatio) / 9,
    (totalCalories * carbRatio) / 4,
  ];
}
