import { redirectAuthenticatedUser } from "@/app/(auth)/actions";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage(): Promise<React.JSX.Element> {
  await redirectAuthenticatedUser();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">
          Food Optimizer
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Entrar</h1>
        <p className="text-sm text-foreground-muted">
          Acesse sua base inicial para configurar perfil, objetivo e onboarding.
        </p>
      </div>

      <LoginForm />
    </section>
  );
}
