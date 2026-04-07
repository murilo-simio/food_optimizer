import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { userId } = body;

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Check if user has a profile (onboarding is complete when profile exists)
		const profile = await prisma.userProfile.findUnique({
			where: { userId },
		});

		if (!profile) {
			return NextResponse.json(
				{ error: "Onboarding not complete. Please complete the profile first." },
				{ status: 400 }
			);
		}

		// Optionally, you could store a flag, but checking profile existence is sufficient
		return NextResponse.json({ ok: true, onboardingComplete: true }, { status: 200 });
	} catch (error) {
		console.error("Error completing onboarding:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 }
		);
	}
}
