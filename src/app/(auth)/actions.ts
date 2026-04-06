"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth, signIn } from "@/auth";
import { getDb } from "@/server/db";

export interface AuthActionState {
  error?: string;
}

const loginSchema = z.object({
  email: z.email("Informe um e-mail valido.").trim().toLowerCase(),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

const registerSchema = loginSchema
  .extend({
    name: z
      .string()
      .trim()
      .min(2, "Informe seu nome.")
      .max(80, "Nome muito longo."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedData = loginSchema.safeParse({
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
  });

  if (!parsedData.success) {
    return {
      error:
        parsedData.error.issues[0]?.message ??
        "Nao foi possivel validar os dados.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsedData.data.email,
      password: parsedData.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "E-mail ou senha invalidos.",
      };
    }

    throw error;
  }

  return {};
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedData = registerSchema.safeParse({
    name: getFormString(formData, "name"),
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
    confirmPassword: getFormString(formData, "confirmPassword"),
  });

  if (!parsedData.success) {
    return {
      error:
        parsedData.error.issues[0]?.message ??
        "Nao foi possivel validar os dados.",
    };
  }

  const db = getDb();
  const existingUser = await db.user.findUnique({
    where: {
      email: parsedData.data.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return {
      error: "Ja existe uma conta com este e-mail.",
    };
  }

  const passwordHash = await hash(parsedData.data.password, 12);

  await db.user.create({
    data: {
      name: parsedData.data.name,
      email: parsedData.data.email,
      passwordHash,
    },
  });

  try {
    await signIn("credentials", {
      email: parsedData.data.email,
      password: parsedData.data.password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Conta criada, mas o login automatico falhou. Tente entrar.",
      };
    }

    throw error;
  }

  return {};
}

export async function redirectAuthenticatedUser(): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  const profile = await getDb().userProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  redirect(profile ? "/dashboard" : "/onboarding");
}
