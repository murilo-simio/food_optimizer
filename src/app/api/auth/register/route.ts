import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { name, email, password } = registerSchema.parse(body);

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "Email já cadastrado" },
				{ status: 409 }
			);
		}

		const passwordHash = await bcrypt.hash(password, 12);

		const user = await prisma.user.create({
			data: {
				name,
				email,
				passwordHash,
			},
		});

		return NextResponse.json(
			{
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
				},
			},
			{ status: 201 }
		);
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
