import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getDb } from "@/server/db";

function parseStoredList(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  try {
    const parsedValue = JSON.parse(value) as string[];
    return parsedValue.join(", ");
  } catch {
    return "";
  }
}

export default async function OnboardingPage(): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getDb().user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      name: true,
      profile: true,
      tasteProfile: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const profile = user.profile;
  const tasteProfile = user.tasteProfile;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-background-elevated p-5 shadow-sm shadow-black/30">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">
          Onboarding
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          {profile ? "Atualize seu perfil base" : `Vamos configurar ${user.name}`}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
          Esta etapa salva os dados estruturais da fase 1: autenticacao,
          preferencias e respostas iniciais que vao alimentar as fases seguintes.
        </p>
      </div>

      <OnboardingForm
        defaultValues={{
          age: profile?.age,
          sex: profile?.sex,
          heightCm: profile?.heightCm,
          weightKg: profile?.weightKg,
          bodyFatPercentage: profile?.bodyFatPercentage,
          state: profile?.state,
          city: profile?.city,
          activityLevel: profile?.activityLevel,
          exerciseFrequency: profile?.exerciseFrequency,
          primaryExerciseType: profile?.primaryExerciseType,
          exerciseDurationMin: profile?.exerciseDurationMin,
          exerciseIntensity: profile?.exerciseIntensity,
          mealsPerDay: profile?.mealsPerDay,
          workRoutine: profile?.workRoutine,
          dietaryRestrictions: profile?.dietaryRestrictions,
          weeklyFoodBudget: profile?.weeklyFoodBudget,
          goal: profile?.goal,
          stapleFoods: parseStoredList(tasteProfile?.stapleFoods),
          aversions: parseStoredList(tasteProfile?.aversions),
          favoriteFoods: parseStoredList(tasteProfile?.favoriteFoods),
          sweetPreference: tasteProfile?.sweetPreference,
          saltyPreference: tasteProfile?.saltyPreference,
          spicyTolerance: tasteProfile?.spicyTolerance,
          cookingSkill: tasteProfile?.cookingSkill,
          cookingTime: tasteProfile?.cookingTime,
        }}
      />
    </section>
  );
}
