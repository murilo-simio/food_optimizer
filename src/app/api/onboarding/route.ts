import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
	userId: z.string(),
	age: z.number().min(12).max(100),
	sex: z.enum(["MALE", "FEMALE"]),
	country: z.string().max(3).optional(),
	heightCm: z.number().positive(),
	weightKg: z.number().positive(),
	bodyFatPercentage: z.number().min(1).max(70).optional(),
	activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]),
	exerciseFrequency: z.number().min(0).max(14),
	primaryExerciseType: z.enum(["WEIGHTLIFTING", "RUNNING", "CROSSFIT", "CALISTHENICS", "CYCLING", "SWIMMING", "MARTIAL_ARTS", "HIIT", "WALKING", "OTHER"]).optional(),
	exerciseDurationMin: z.number().positive().optional(),
	exerciseIntensity: z.enum(["LIGHT", "MODERATE", "INTENSE"]).optional(),
	mealsPerDay: z.number().min(1).max(10),
	workRoutine: z.enum(["CLT_9_TO_5", "HOME_OFFICE", "SHIFT_WORK", "FLEXIBLE", "STUDENT", "OTHER"]),
	dietaryRestrictions: z.enum(["NONE", "VEGAN", "VEGETARIAN", "LACTOSE_FREE", "GLUTEN_FREE", "LOW_CARB", "KETO"]),
	weeklyFoodBudget: z.number().positive().optional(),
	state: z.string().max(2).optional(),
	city: z.string().max(100).optional(),
	goal: z.enum(["FAT_LOSS", "MUSCLE_GAIN", "MAINTENANCE", "PERFORMANCE"]),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const data = profileSchema.parse(body);

		// Calculate simple TDEE estimate
		const activityMultiplier: Record<string, number> = {
			SEDENTARY: 1.2,
			LIGHT: 1.375,
			MODERATE: 1.55,
			ACTIVE: 1.725,
			VERY_ACTIVE: 1.9,
		};

		// Mifflin-St Jeor
		let bmr: number;
		if (data.sex === "MALE") {
			bmr = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age + 5;
		} else {
			bmr = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age - 161;
		}

		const tdee = Math.round(bmr * activityMultiplier[data.activityLevel]);

		// Macro targets based on goal
	 const leanMass = data.bodyFatPercentage
			? data.weightKg * (1 - data.bodyFatPercentage / 100)
			: data.weightKg;

		const proteinMultiplier: Record<string, number> = {
			FAT_LOSS: 2.2,
			MUSCLE_GAIN: 1.8,
			MAINTENANCE: 1.6,
			PERFORMANCE: 2.0,
		};

		const targetProteinG = Math.round(leanMass * proteinMultiplier[data.goal]);
		const targetFatG = Math.round(data.weightKg * 0.9);

		const caloriesAdjust: Record<string, number> = {
			FAT_LOSS: -400,
			MUSCLE_GAIN: 300,
			MAINTENANCE: 0,
			PERFORMANCE: 0,
		};

		const targetCalories = tdee + caloriesAdjust[data.goal];
		const carbCalories = targetCalories - targetProteinG * 4 - targetFatG * 9;
		const targetCarbsG = Math.round(carbCalories / 4);

		let profile = await prisma.userProfile.upsert({
			where: { userId: data.userId },
			update: data,
			create: data,
		});

		// Save computed values
		profile = await prisma.userProfile.update({
			where: { userId: data.userId },
			data: {
				tdee,
				targetCalories,
				targetProteinG,
				targetFatG,
				targetCarbsG,
			},
		});

		return NextResponse.json(profile, { status: 200 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 }
		);
	}
}
