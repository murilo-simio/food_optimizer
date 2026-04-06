import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
	userId: z.string(),
	type: z.enum(["WEIGHTLIFTING", "RUNNING", "CROSSFIT", "CALISTHENICS", "CYCLING", "SWIMMING", "MARTIAL_ARTS", "HIIT", "WALKING", "OTHER"]),
	durationMin: z.number().positive(),
	intensity: z.enum(["LIGHT", "MODERATE", "INTENSE"]),
	caloriesBurned: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const data = schema.parse(body);

		const log = await prisma.exerciseLog.create({
			data: {
				userId: data.userId,
				type: data.type,
				durationMin: data.durationMin,
				intensity: data.intensity,
				caloriesBurned: data.caloriesBurned ?? null,
			},
		});

		return NextResponse.json(log, { status: 201 });
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
