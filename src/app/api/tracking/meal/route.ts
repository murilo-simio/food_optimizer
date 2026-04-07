import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
	userId: z.string(),
	mealSlot: z.enum(["cafe_manha", "almoco", "lanche", "jantar", "ceia"]),
	foods: z.array(z.object({
		name: z.string().min(1),
		grams: z.number().positive(),
	})),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const data = schema.parse(body);

		// Create meal log
		const mealLog = await prisma.mealLog.create({
			data: {
				userId: data.userId,
				mealSlot: data.mealSlot,
			},
		});

		// Create items — lookup or track not found foods
		const notFound: string[] = [];

		for (const food of data.foods) {
			const existingFood = await prisma.food.findFirst({
				where: { name: { contains: food.name } },
			});

			if (existingFood) {
				await prisma.mealLogItem.create({
					data: {
						mealLogId: mealLog.id,
						foodId: existingFood.id,
						grams: food.grams,
					},
				});
			} else {
				notFound.push(`${food.name} (${food.grams}g)`);
			}
		}

		return NextResponse.json({ ok: true, mealLogId: mealLog.id, notFound }, { status: 201 });
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
