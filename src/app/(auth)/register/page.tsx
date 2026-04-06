import { redirectAuthenticatedUser } from "@/app/(auth)/actions";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage(): Promise<React.JSX.Element> {
  await redirectAuthenticatedUser();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">
          Food Optimizer
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          Criar conta
        </h1>
        <p className="text-sm text-foreground-muted">
          Cadastre-se para iniciar o onboarding e montar a base nutricional do
          app.
        </p>
      </div>

      <RegisterForm />
    </section>
  );
}
