"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { getDb } from "@/server/db";

export interface OnboardingActionState {
  error?: string;
}

const optionalNumberField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return undefined;
  }

  return Number(normalized);
}, z.number().positive("Use um numero maior que zero.").optional());

const requiredNumberField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return Number.NaN;
  }

  return Number(value.replace(",", ".").trim());
}, z.number("Informe um numero valido.").positive("Use um numero maior que zero."));

const onboardingSchema = z.object({
  age: z.coerce.number().int().min(14).max(100),
  sex: z.enum(["MALE", "FEMALE"]),
  heightCm: requiredNumberField,
  weightKg: requiredNumberField,
  bodyFatPercentage: optionalNumberField,
  state: z.string().trim().max(2).optional(),
  city: z.string().trim().max(80).optional(),
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHT",
    "MODERATE",
    "ACTIVE",
    "VERY_ACTIVE",
  ]),
  exerciseFrequency: z.coerce.number().int().min(0).max(14),
  primaryExerciseType: z
    .enum([
      "WEIGHTLIFTING",
      "RUNNING",
      "CROSSFIT",
      "CALISTHENICS",
      "CYCLING",
      "SWIMMING",
      "MARTIAL_ARTS",
      "HIIT",
      "WALKING",
      "OTHER",
    ])
    .optional(),
  exerciseDurationMin: optionalNumberField,
  exerciseIntensity: z.enum(["LIGHT", "MODERATE", "INTENSE"]).optional(),
  mealsPerDay: z.coerce.number().int().min(1).max(8),
  workRoutine: z.enum([
    "CLT_9_TO_5",
    "HOME_OFFICE",
    "SHIFT_WORK",
    "FLEXIBLE",
    "STUDENT",
    "OTHER",
  ]),
  dietaryRestrictions: z.enum([
    "NONE",
    "VEGAN",
    "VEGETARIAN",
    "LACTOSE_FREE",
    "GLUTEN_FREE",
    "LOW_CARB",
    "KETO",
  ]),
  weeklyFoodBudget: optionalNumberField,
  goal: z.enum(["FAT_LOSS", "MUSCLE_GAIN", "MAINTENANCE", "PERFORMANCE"]),
  stapleFoods: z.string().trim().optional(),
  aversions: z.string().trim().optional(),
  favoriteFoods: z.string().trim().optional(),
  sweetPreference: z.coerce.number().int().min(1).max(5),
  saltyPreference: z.coerce.number().int().min(1).max(5),
  spicyTolerance: z.coerce.number().int().min(1).max(5),
  cookingSkill: z.coerce.number().int().min(1).max(5),
  cookingTime: optionalNumberField,
});

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function normalizeOptionalText(value?: string): string | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function parseList(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function saveOnboardingAction(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const rawValues = {
    age: getFormString(formData, "age"),
    sex: getFormString(formData, "sex"),
    heightCm: getFormString(formData, "heightCm"),
    weightKg: getFormString(formData, "weightKg"),
    bodyFatPercentage: getFormString(formData, "bodyFatPercentage"),
    state: getFormString(formData, "state"),
    city: getFormString(formData, "city"),
    activityLevel: getFormString(formData, "activityLevel"),
    exerciseFrequency: getFormString(formData, "exerciseFrequency"),
    primaryExerciseType: getFormString(formData, "primaryExerciseType") || undefined,
    exerciseDurationMin: getFormString(formData, "exerciseDurationMin"),
    exerciseIntensity: getFormString(formData, "exerciseIntensity") || undefined,
    mealsPerDay: getFormString(formData, "mealsPerDay"),
    workRoutine: getFormString(formData, "workRoutine"),
    dietaryRestrictions: getFormString(formData, "dietaryRestrictions"),
    weeklyFoodBudget: getFormString(formData, "weeklyFoodBudget"),
    goal: getFormString(formData, "goal"),
    stapleFoods: getFormString(formData, "stapleFoods"),
    aversions: getFormString(formData, "aversions"),
    favoriteFoods: getFormString(formData, "favoriteFoods"),
    sweetPreference: getFormString(formData, "sweetPreference"),
    saltyPreference: getFormString(formData, "saltyPreference"),
    spicyTolerance: getFormString(formData, "spicyTolerance"),
    cookingSkill: getFormString(formData, "cookingSkill"),
    cookingTime: getFormString(formData, "cookingTime"),
  };

  const parsedData = onboardingSchema.safeParse(rawValues);

  if (!parsedData.success) {
    return {
      error:
        parsedData.error.issues[0]?.message ??
        "Nao foi possivel validar o onboarding.",
    };
  }

  const values = parsedData.data;
  const stapleFoods = parseList(values.stapleFoods);
  const aversions = parseList(values.aversions);
  const favoriteFoods = parseList(values.favoriteFoods);

  const answers = [
    { question: "idade", answer: String(values.age) },
    { question: "sexo", answer: values.sex },
    { question: "altura_cm", answer: String(values.heightCm) },
    { question: "peso_kg", answer: String(values.weightKg) },
    {
      question: "atividade",
      answer: `${values.activityLevel} | ${values.exerciseFrequency}x por semana`,
    },
    { question: "objetivo", answer: values.goal },
    {
      question: "alimentos_habituais",
      answer: stapleFoods.join(", ") || "Nao informado",
    },
    {
      question: "aversoes",
      answer: aversions.join(", ") || "Nao informado",
    },
    {
      question: "orcamento_semanal",
      answer: values.weeklyFoodBudget
        ? `R$ ${values.weeklyFoodBudget.toFixed(2)}`
        : "Nao informado",
    },
  ];

  const db = getDb();

  await db.$transaction([
    db.userProfile.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        age: values.age,
        sex: values.sex,
        heightCm: values.heightCm,
        weightKg: values.weightKg,
        bodyFatPercentage: values.bodyFatPercentage ?? null,
        state: normalizeOptionalText(values.state),
        city: normalizeOptionalText(values.city),
        activityLevel: values.activityLevel,
        exerciseFrequency: values.exerciseFrequency,
        primaryExerciseType: values.primaryExerciseType ?? null,
        exerciseDurationMin: values.exerciseDurationMin ?? null,
        exerciseIntensity: values.exerciseIntensity ?? null,
        mealsPerDay: values.mealsPerDay,
        workRoutine: values.workRoutine,
        dietaryRestrictions: values.dietaryRestrictions,
        weeklyFoodBudget: values.weeklyFoodBudget ?? null,
        goal: values.goal,
      },
      create: {
        userId: session.user.id,
        age: values.age,
        sex: values.sex,
        heightCm: values.heightCm,
        weightKg: values.weightKg,
        bodyFatPercentage: values.bodyFatPercentage ?? null,
        state: normalizeOptionalText(values.state),
        city: normalizeOptionalText(values.city),
        activityLevel: values.activityLevel,
        exerciseFrequency: values.exerciseFrequency,
        primaryExerciseType: values.primaryExerciseType ?? null,
        exerciseDurationMin: values.exerciseDurationMin ?? null,
        exerciseIntensity: values.exerciseIntensity ?? null,
        mealsPerDay: values.mealsPerDay,
        workRoutine: values.workRoutine,
        dietaryRestrictions: values.dietaryRestrictions,
        weeklyFoodBudget: values.weeklyFoodBudget ?? null,
        goal: values.goal,
      },
    }),
    db.tasteProfile.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        stapleFoods: JSON.stringify(stapleFoods),
        aversions: JSON.stringify(aversions),
        favoriteFoods: JSON.stringify(favoriteFoods),
        sweetPreference: values.sweetPreference,
        saltyPreference: values.saltyPreference,
        spicyTolerance: values.spicyTolerance,
        cookingSkill: values.cookingSkill,
        cookingTime: values.cookingTime ?? null,
      },
      create: {
        userId: session.user.id,
        stapleFoods: JSON.stringify(stapleFoods),
        aversions: JSON.stringify(aversions),
        favoriteFoods: JSON.stringify(favoriteFoods),
        sweetPreference: values.sweetPreference,
        saltyPreference: values.saltyPreference,
        spicyTolerance: values.spicyTolerance,
        cookingSkill: values.cookingSkill,
        cookingTime: values.cookingTime ?? null,
      },
    }),
    db.onboardingAnswer.deleteMany({
      where: {
        userId: session.user.id,
      },
    }),
    db.onboardingAnswer.createMany({
      data: answers.map((answer) => ({
        userId: session.user.id,
        question: answer.question,
        answer: answer.answer,
      })),
    }),
  ]);

  redirect("/dashboard");
}
