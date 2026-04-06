"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, type AuthActionState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};

export function LoginForm(): React.JSX.Element {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
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
          autoComplete="current-password"
          id="password"
          name="password"
          placeholder="Sua senha"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p className="rounded-md border border-error/50 bg-error/10 px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      ) : null}

      <SubmitButton>Entrar</SubmitButton>

      <p className="text-center text-sm text-foreground-muted">
        Ainda nao tem conta?{" "}
        <Link className="text-accent hover:text-accent-hover" href="/register">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
