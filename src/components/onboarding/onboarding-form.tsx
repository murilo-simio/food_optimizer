"use client";

import { useActionState } from "react";

import {
  saveOnboardingAction,
  type OnboardingActionState,
} from "@/app/(app)/onboarding/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface OnboardingFormValues {
  age?: number;
  sex?: "MALE" | "FEMALE";
  heightCm?: number;
  weightKg?: number;
  bodyFatPercentage?: number | null;
  state?: string | null;
  city?: string | null;
  activityLevel?: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
  exerciseFrequency?: number;
  primaryExerciseType?:
    | "WEIGHTLIFTING"
    | "RUNNING"
    | "CROSSFIT"
    | "CALISTHENICS"
    | "CYCLING"
    | "SWIMMING"
    | "MARTIAL_ARTS"
    | "HIIT"
    | "WALKING"
    | "OTHER"
    | null;
  exerciseDurationMin?: number | null;
  exerciseIntensity?: "LIGHT" | "MODERATE" | "INTENSE" | null;
  mealsPerDay?: number;
  workRoutine?:
    | "CLT_9_TO_5"
    | "HOME_OFFICE"
    | "SHIFT_WORK"
    | "FLEXIBLE"
    | "STUDENT"
    | "OTHER";
  dietaryRestrictions?:
    | "NONE"
    | "VEGAN"
    | "VEGETARIAN"
    | "LACTOSE_FREE"
    | "GLUTEN_FREE"
    | "LOW_CARB"
    | "KETO";
  weeklyFoodBudget?: number | null;
  goal?: "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE" | "PERFORMANCE";
  stapleFoods?: string;
  aversions?: string;
  favoriteFoods?: string;
  sweetPreference?: number;
  saltyPreference?: number;
  spicyTolerance?: number;
  cookingSkill?: number;
  cookingTime?: number | null;
}

const initialState: OnboardingActionState = {};

const fieldClassName =
  "h-11 w-full rounded-md border border-border bg-background-subtle px-3 text-sm text-foreground focus:border-accent focus:outline-none";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background-elevated p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-foreground-muted">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-foreground-muted">{hint}</p> : null}
    </div>
  );
}

export function OnboardingForm({
  defaultValues,
}: {
  defaultValues: OnboardingFormValues;
}): React.JSX.Element {
  const [state, formAction] = useActionState(saveOnboardingAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <FormSection
        description="Base corporal, localizacao e objetivo principal."
        title="Perfil"
      >
        <Field htmlFor="age" label="Idade">
          <Input defaultValue={defaultValues.age} id="age" min="14" name="age" required type="number" />
        </Field>
        <Field htmlFor="sex" label="Sexo biologico">
          <select
            className={fieldClassName}
            defaultValue={defaultValues.sex ?? "MALE"}
            id="sex"
            name="sex"
          >
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Feminino</option>
          </select>
        </Field>
        <Field htmlFor="heightCm" label="Altura (cm)">
          <Input defaultValue={defaultValues.heightCm} id="heightCm" name="heightCm" required step="0.1" type="number" />
        </Field>
        <Field htmlFor="weightKg" label="Peso atual (kg)">
          <Input defaultValue={defaultValues.weightKg} id="weightKg" name="weightKg" required step="0.1" type="number" />
        </Field>
        <Field htmlFor="bodyFatPercentage" label="% de gordura">
          <Input
            defaultValue={defaultValues.bodyFatPercentage ?? ""}
            id="bodyFatPercentage"
            name="bodyFatPercentage"
            placeholder="Opcional"
            step="0.1"
            type="number"
          />
        </Field>
        <Field htmlFor="goal" label="Objetivo">
          <select
            className={fieldClassName}
            defaultValue={defaultValues.goal ?? "MUSCLE_GAIN"}
            id="goal"
            name="goal"
          >
            <option value="FAT_LOSS">Perda de gordura</option>
            <option value="MUSCLE_GAIN">Ganho de massa</option>
            <option value="MAINTENANCE">Manutencao</option>
            <option value="PERFORMANCE">Performance</option>
          </select>
        </Field>
        <Field htmlFor="state" label="UF">
          <Input
            defaultValue={defaultValues.state ?? ""}
            id="state"
            maxLength={2}
            name="state"
            placeholder="SP"
            type="text"
          />
        </Field>
        <Field htmlFor="city" label="Cidade">
          <Input
            defaultValue={defaultValues.city ?? ""}
            id="city"
            name="city"
            placeholder="Sao Paulo"
            type="text"
          />
        </Field>
      </FormSection>

      <FormSection
        description="Rotina diaria e volume de treino."
        title="Treino e rotina"
      >
        <Field htmlFor="activityLevel" label="Nivel de atividade">
          <select
            className={fieldClassName}
            defaultValue={defaultValues.activityLevel ?? "MODERATE"}
            id="activityLevel"
            name="activityLevel"
          >
            <option value="SEDENTARY">Sedentario</option>
            <option value="LIGHT">Leve</option>
            <option value="MODERATE">Moderado</option>
            <option value="ACTIVE">Ativo</option>
            <option value="VERY_ACTIVE">Muito ativo</option>
          </select>
        </Field>
        <Field htmlFor="exerciseFrequency" label="Treinos por semana">
          <Input
            defaultValue={defaultValues.exerciseFrequency ?? 4}
            id="exerciseFrequency"
            max="14"
            min="0"
            name="exerciseFrequency"
            required
            type="number"
          />
        </Field>
        <Field htmlFor="primaryExerciseType" label="Exercicio principal">
          <select
            className={fieldClassName}
            defaultValue={defaultValues.primaryExerciseType ?? "WEIGHTLIFTING"}
            id="primaryExerciseType"
            name="primaryExerciseType"
          >
            <option value="WEIGHTLIFTING">Musculacao</option>
            <option value="RUNNING">Corrida</option>
            <option value="CROSSFIT">Crossfit</option>
            <option value="CALISTHENICS">Calistenia</option>
            <option value="CYCLING">Ciclismo</option>
            <option value="SWIMMING">Natacao</option>
            <option value="MARTIAL_ARTS">Luta</option>
            <option value="HIIT">HIIT</option>
            <option value="WALKING">Caminhada</option>
            <option value="OTHER">Outro</option>
          </select>
        </Field>
        <Field htmlFor="exerciseDurationMin" label="Duracao media (min)">
          <Input
            defaultValue={defaultValues.exerciseDurationMin ?? ""}
            id="exerciseDurationMin"
            name="exerciseDurationMin"
            placeholder="Opcional"
            type="number"
          />
        </Field>
        <Field htmlFor="exerciseIntensity" label="Intensidade">
          <select
            className={fieldClassName}
            defaultValue={defaultValues.exerciseIntensity ?? "MODERATE"}
            id="exerciseIntensity"
            name="exerciseIntensity"
          >
            <option value="LIGHT">Leve</option>
            <option value="MODERATE">Moderada</option>
            <option value="INTENSE">Intensa</option>
          </select>
        </Field>
        <Field htmlFor="workRoutine" label="Rotina de trabalho">
          <select
            className={fieldClassName}
            defaultValue={defaultValues.workRoutine ?? "HOME_OFFICE"}
            id="workRoutine"
            name="workRoutine"
          >
            <option value="CLT_9_TO_5">CLT 9h-18h</option>
            <option value="HOME_OFFICE">Home office</option>
            <option value="SHIFT_WORK">Turnos</option>
            <option value="FLEXIBLE">Flexivel</option>
            <option value="STUDENT">Estudante</option>
            <option value="OTHER">Outra</option>
          </select>
        </Field>
      </FormSection>

      <FormSection
        description="Preferencias alimentares e limite financeiro."
        title="Habitos e sabor"
      >
        <Field htmlFor="mealsPerDay" label="Refeicoes por dia">
          <Input
            defaultValue={defaultValues.mealsPerDay ?? 4}
            id="mealsPerDay"
            max="8"
            min="1"
            name="mealsPerDay"
            required
            type="number"
          />
        </Field>
        <Field htmlFor="dietaryRestrictions" label="Restricao principal">
          <select
            className={fieldClassName}
            defaultValue={defaultValues.dietaryRestrictions ?? "NONE"}
            id="dietaryRestrictions"
            name="dietaryRestrictions"
          >
            <option value="NONE">Nenhuma</option>
            <option value="VEGAN">Vegana</option>
            <option value="VEGETARIAN">Vegetariana</option>
            <option value="LACTOSE_FREE">Sem lactose</option>
            <option value="GLUTEN_FREE">Sem gluten</option>
            <option value="LOW_CARB">Low carb</option>
            <option value="KETO">Keto</option>
          </select>
        </Field>
        <Field htmlFor="weeklyFoodBudget" label="Orcamento semanal (R$)">
          <Input
            defaultValue={defaultValues.weeklyFoodBudget ?? ""}
            id="weeklyFoodBudget"
            name="weeklyFoodBudget"
            placeholder="Opcional"
            step="0.01"
            type="number"
          />
        </Field>
        <Field htmlFor="cookingTime" label="Tempo por refeicao (min)">
          <Input
            defaultValue={defaultValues.cookingTime ?? ""}
            id="cookingTime"
            name="cookingTime"
            placeholder="Opcional"
            type="number"
          />
        </Field>
        <Field htmlFor="sweetPreference" label="Preferencia por doce">
          <Input
            defaultValue={defaultValues.sweetPreference ?? 3}
            id="sweetPreference"
            max="5"
            min="1"
            name="sweetPreference"
            required
            type="number"
          />
        </Field>
        <Field htmlFor="saltyPreference" label="Preferencia por salgado">
          <Input
            defaultValue={defaultValues.saltyPreference ?? 3}
            id="saltyPreference"
            max="5"
            min="1"
            name="saltyPreference"
            required
            type="number"
          />
        </Field>
        <Field htmlFor="spicyTolerance" label="Tolerancia a picancia">
          <Input
            defaultValue={defaultValues.spicyTolerance ?? 2}
            id="spicyTolerance"
            max="5"
            min="1"
            name="spicyTolerance"
            required
            type="number"
          />
        </Field>
        <Field htmlFor="cookingSkill" label="Habilidade na cozinha">
          <Input
            defaultValue={defaultValues.cookingSkill ?? 3}
            id="cookingSkill"
            max="5"
            min="1"
            name="cookingSkill"
            required
            type="number"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            hint="Separe por virgula ou linha. Ex.: arroz, feijao, aveia"
            htmlFor="stapleFoods"
            label="Alimentos do dia a dia"
          >
            <Textarea
              defaultValue={defaultValues.stapleFoods ?? ""}
              id="stapleFoods"
              name="stapleFoods"
              placeholder="Arroz, feijao, ovos..."
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field htmlFor="aversions" label="Aversoes">
            <Textarea
              defaultValue={defaultValues.aversions ?? ""}
              id="aversions"
              name="aversions"
              placeholder="Figado, beringela..."
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field htmlFor="favoriteFoods" label="Favoritos">
            <Textarea
              defaultValue={defaultValues.favoriteFoods ?? ""}
              id="favoriteFoods"
              name="favoriteFoods"
              placeholder="Iogurte, banana, frango..."
            />
          </Field>
        </div>
      </FormSection>

      {state.error ? (
        <p className="rounded-md border border-error/50 bg-error/10 px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      ) : null}

      <SubmitButton>Salvar onboarding</SubmitButton>
    </form>
  );
}
