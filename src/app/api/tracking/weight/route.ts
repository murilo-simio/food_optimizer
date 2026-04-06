import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
	userId: z.string(),
	weightKg: z.number().positive(),
	bodyFatPercentage: z.number().min(1).max(70).optional(),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const data = schema.parse(body);

		const record = await prisma.bodyRecord.create({
			data: {
				userId: data.userId,
				weightKg: data.weightKg,
				bodyFatPercentage: data.bodyFatPercentage ?? null,
			},
		});

		return NextResponse.json(record, { status: 201 });
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
