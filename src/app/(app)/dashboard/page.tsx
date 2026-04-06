import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getDb } from "@/server/db";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const db = getDb();
  const [user, foodsCount] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        profile: true,
        tasteProfile: true,
        onboardingAnswers: {
          select: {
            question: true,
            answer: true,
          },
          take: 4,
        },
      },
    }),
    db.food.count(),
  ]);

  if (!user?.profile) {
    redirect("/onboarding");
  }

  const metrics = [
    {
      label: "Calorias alvo",
      value: user.profile.targetCalories
        ? `${Math.round(user.profile.targetCalories)} kcal`
        : "Pendente",
    },
    {
      label: "Refeicoes por dia",
      value: `${user.profile.mealsPerDay}`,
    },
    {
      label: "Orcamento semanal",
      value: user.profile.weeklyFoodBudget
        ? `R$ ${user.profile.weeklyFoodBudget.toFixed(2)}`
        : "Nao informado",
    },
    {
      label: "Alimentos cadastrados",
      value: `${foodsCount}`,
    },
  ];

  const habitualFoods = user.tasteProfile
    ? JSON.parse(user.tasteProfile.stapleFoods) as string[]
    : [];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-background-elevated p-5 shadow-sm shadow-black/30">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.18em] text-accent">
              Base inicial pronta
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              {user.name}, sua fase 1 esta ativa
            </h1>
            <p className="max-w-2xl text-sm text-foreground-muted">
              Autenticacao, persistencia do onboarding e schema inicial ja estao
              conectados. A proxima etapa pode usar esse perfil para calculo
              nutricional e montagem de dieta.
            </p>
          </div>

          <Link href="/onboarding">
            <Button variant="secondary">Revisar onboarding</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.map((metric) => (
          <article
            className="rounded-2xl border border-border bg-background-elevated p-4 shadow-sm shadow-black/20"
            key={metric.label}
          >
            <p className="text-xs uppercase tracking-[0.16em] text-foreground-muted">
              {metric.label}
            </p>
            <p className="font-data mt-3 text-2xl font-semibold text-foreground">
              {metric.value}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <section className="rounded-2xl border border-border bg-background-elevated p-5">
          <h2 className="text-lg font-semibold text-foreground">
            Resumo do perfil
          </h2>
          <dl className="mt-4 grid gap-3 text-sm text-foreground-muted">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <dt>Objetivo</dt>
              <dd className="font-medium text-foreground">{user.profile.goal}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <dt>Nivel de atividade</dt>
              <dd className="font-medium text-foreground">
                {user.profile.activityLevel}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <dt>Rotina</dt>
              <dd className="font-medium text-foreground">
                {user.profile.workRoutine}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>E-mail</dt>
              <dd className="font-medium text-foreground">{user.email}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-background-elevated p-5">
          <h2 className="text-lg font-semibold text-foreground">
            Habitos alimentares
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {habitualFoods.length > 0 ? (
              habitualFoods.map((food) => (
                <span
                  className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent"
                  key={food}
                >
                  {food}
                </span>
              ))
            ) : (
              <p className="text-sm text-foreground-muted">
                Nenhum alimento habitual informado.
              </p>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              Respostas registradas
            </h3>
            {user.onboardingAnswers.map((answer: { question: string; answer: string }) => (
              <div
                className="rounded-xl border border-border bg-background-subtle px-3 py-3"
                key={answer.question}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-foreground-muted">
                  {answer.question}
                </p>
                <p className="mt-2 text-sm text-foreground">{answer.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
