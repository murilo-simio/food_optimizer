import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { prisma } from "@/lib/prisma";

const tasteSchema = z.object({
	userId: z.string(),
	stapleFoods: z.array(z.string()).default([]),
	aversions: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const data = tasteSchema.parse(body);

		await prisma.tasteProfile.upsert({
			where: { userId: data.userId },
			update: {
				stapleFoods: JSON.stringify(data.stapleFoods),
				aversions: JSON.stringify(data.aversions),
			},
			create: {
				userId: data.userId,
				stapleFoods: JSON.stringify(data.stapleFoods),
				aversions: JSON.stringify(data.aversions),
			},
		});

		return NextResponse.json({ ok: true }, { status: 200 });
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
