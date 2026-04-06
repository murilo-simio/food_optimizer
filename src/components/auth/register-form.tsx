"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction, type AuthActionState } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthActionState = {};

export function RegisterForm(): React.JSX.Element {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="name">
          Nome
        </label>
        <Input
          autoComplete="name"
          id="name"
          name="name"
          placeholder="Seu nome"
          required
          type="text"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          E-mail
        </label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="voce@exemplo.com"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="password"
        >
          Senha
        </label>
        <Input
          autoComplete="new-password"
          id="password"
          name="password"
          placeholder="Minimo de 8 caracteres"
          required
          type="password"
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="confirmPassword"
        >
          Confirmar senha
        </label>
        <Input
          autoComplete="new-password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Repita a senha"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p className="rounded-md border border-error/50 bg-error/10 px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      ) : null}

      <SubmitButton>Criar conta</SubmitButton>

      <p className="text-center text-sm text-foreground-muted">
        Ja tem conta?{" "}
        <Link className="text-accent hover:text-accent-hover" href="/login">
          Entrar
        </Link>
      </p>
    </form>
  );
}
