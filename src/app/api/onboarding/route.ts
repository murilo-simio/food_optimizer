import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateNutrition, CalculatorInput } from "@/lib/calculators";

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

		// Preparar input para calculadoras
		const calculatorInput: CalculatorInput = {
			profile: {
				age: data.age,
				sex: data.sex,
				heightCm: data.heightCm,
				weightKg: data.weightKg,
				bodyFatPercentage: data.bodyFatPercentage,
				country: data.country,
				state: data.state,
				city: data.city,
			},
			activity: {
				activityLevel: data.activityLevel,
				exerciseFrequencyDays: data.exerciseFrequency,
				primaryExerciseType: data.primaryExerciseType,
				exerciseDurationMin: data.exerciseDurationMin,
				exerciseIntensity: data.exerciseIntensity,
			},
			work: {
				workRoutine: data.workRoutine,
			},
			goal: {
				type: data.goal,
			},
			// Geographical factors: omitidos, serão calculados automaticamente pela calculateNutrition
		};

		// Calcular métricas nutricionais completas
		const nutritionResult = calculateNutrition(calculatorInput);

		// Salvar perfil + cálculos
		const profile = await prisma.userProfile.upsert({
			where: { userId: data.userId },
			update: data,
			create: data,
		});

		// Atualizar com valores calculados
		await prisma.userProfile.update({
			where: { userId: data.userId },
			data: {
				tdee: nutritionResult.metrics.tdee,
				targetCalories: nutritionResult.metrics.targetCalories,
				targetProteinG: nutritionResult.metrics.targetProteinG,
				targetFatG: nutritionResult.metrics.targetFatG,
				targetCarbsG: nutritionResult.metrics.targetCarbsG,
			},
		});

		// Retornar resultado completo
		return NextResponse.json(
			{
				profile,
				nutrition: nutritionResult.metrics,
				micronutrients: nutritionResult.micronutrients,
				adjustments: nutritionResult.adjustments,
				notes: nutritionResult.notes,
			},
			{ status: 200 }
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 }
			);
		}
		console.error("Error in onboarding:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 }
		);
	}
}
