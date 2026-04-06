import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
	userId: z.string(),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { userId } = schema.parse(body);

		await prisma.onboardingAnswer.create({
			data: {
				userId,
				question: "onboarding_complete",
				answer: "true",
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
