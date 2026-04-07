import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
	const userId = req.nextUrl.searchParams.get("userId");
	if (!userId) {
		return NextResponse.json({ error: "User ID required" }, { status: 400 });
	}

	try {
		const [profile, bodyRecords, exerciseLogs] = await Promise.all([
			prisma.userProfile.findUnique({ where: { userId } }),
			prisma.bodyRecord.findMany({
				where: { userId },
				orderBy: { recordedAt: "desc" },
				take: 30,
			}),
			prisma.exerciseLog.findMany({
				where: { userId },
				orderBy: { loggedAt: "desc" },
				take: 20,
			}),
		]);

		return NextResponse.json({
			profile,
			bodyRecords,
			exerciseLogs,
			onboardingComplete: !!profile,
		});
	} catch {
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 }
		);
	}
}
