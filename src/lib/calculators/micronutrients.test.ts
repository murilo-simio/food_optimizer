import { describe, expect, it } from "vitest";

import { calculateMicronutrients, generateMicronutrientNotes } from "./micronutrients";
import type { GeographicalFactors, UserProfile } from "./types";

describe("calculateMicronutrients", () => {
  it("applies sex baseline, tropical electrolyte multipliers, and intense exercise adjustments", () => {
    const profile: UserProfile = {
      age: 28,
      sex: "FEMALE",
      heightCm: 165,
      weightKg: 62,
      country: "BR",
    };

    const geoFactors: GeographicalFactors = {
      climateZone: "TROPICAL",
      sunExposure: 8,
      vitaminDMultiplier: 1,
      electrolyteMultiplier: 1.3,
    };

    const result = calculateMicronutrients(profile, geoFactors, true, 6);

    expect(result.vitamins).toMatchObject({
      vitaminA_UG: 700,
      vitaminD_UG: 15,
      vitaminB3_MG: 15,
    });
    expect(result.minerals).toMatchObject({
      iron_MG: 18,
      potassium_MG: 3380,
      sodium_MG: 1950,
      magnesium_MG: 503,
      zinc_MG: 8,
    });
  });
});

describe("generateMicronutrientNotes", () => {
  it("emits guidance for cold climate and intense exercise", () => {
    const geoFactors: GeographicalFactors = {
      climateZone: "COLD",
      sunExposure: 2,
      vitaminDMultiplier: 2.5,
      electrolyteMultiplier: 0.9,
    };

    const notes = generateMicronutrientNotes(geoFactors, true);

    expect(notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Vitamina D: meta ajustada"),
        expect.stringContaining("Exercício intenso"),
      ])
    );
  });
});
