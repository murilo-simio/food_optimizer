"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
	{ id: 0, title: "Dados Pessoais" },
	{ id: 1, title: "Corpo" },
	{ id: 2, title: "Exercício" },
	{ id: 3, title: "Hábitos" },
	{ id: 4, title: "Sabor" },
	{ id: 5, title: "Objetivo" },
];

type FormData = {
	age: string;
	sex: string;
	country: string;
	heightCm: string;
	weightKg: string;
	bodyFatPercentage: string;
	activityLevel: string;
	exerciseFrequency: string;
	primaryExerciseType: string;
	exerciseDurationMin: string;
	exerciseIntensity: string;
	mealsPerDay: string;
	workRoutine: string;
	dietaryRestrictions: string;
	weeklyFoodBudget: string;
	state: string;
	city: string;
	goal: string;
	stapleFoods: string;
	aversions: string;
};

const initialData: FormData = {
	age: "",
	sex: "",
	country: "",
	heightCm: "",
	weightKg: "",
	bodyFatPercentage: "",
	activityLevel: "",
	exerciseFrequency: "",
	primaryExerciseType: "",
	exerciseDurationMin: "",
	exerciseIntensity: "",
	mealsPerDay: "3",
	workRoutine: "",
	dietaryRestrictions: "NONE",
	weeklyFoodBudget: "",
	state: "",
	city: "",
	goal: "",
	stapleFoods: "",
	aversions: "",
};

export default function OnboardingPage() {
	const [step, setStep] = useState(0);
	const [data, setData] = useState<FormData>(initialData);
	const [saving, setSaving] = useState(false);
	const router = useRouter();
	const { data: session, update } = useSession();

	const updateField = (field: keyof FormData, value: string) =>
		setData((prev) => ({ ...prev, [field]: value }));

	const canProceed = () => {
		switch (step) {
			case 0:
				return data.age && data.sex;
			case 1:
				return data.heightCm && data.weightKg;
			case 2:
				return data.activityLevel && data.exerciseFrequency;
			case 3:
				return data.workRoutine;
			case 4:
				return true;
			case 5:
				return data.goal !== "";
			default:
				return false;
		}
	};

	const handleSubmit = async () => {
		if (!session?.user?.id) return;
		setSaving(true);

		try {
			const profileRes = await fetch("/api/onboarding", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: session.user.id,
					age: parseInt(data.age),
					sex: data.sex,
					country: data.country || undefined,
					heightCm: parseFloat(data.heightCm),
					weightKg: parseFloat(data.weightKg),
					bodyFatPercentage: data.bodyFatPercentage
						? parseFloat(data.bodyFatPercentage)
						: undefined,
					activityLevel: data.activityLevel,
					exerciseFrequency: parseInt(data.exerciseFrequency),
					primaryExerciseType:
						data.primaryExerciseType || undefined,
					exerciseDurationMin: data.exerciseDurationMin
						? parseInt(data.exerciseDurationMin)
						: undefined,
					exerciseIntensity:
						data.exerciseIntensity || undefined,
					mealsPerDay: parseInt(data.mealsPerDay),
					workRoutine: data.workRoutine,
					dietaryRestrictions: data.dietaryRestrictions,
					weeklyFoodBudget: data.weeklyFoodBudget
						? parseFloat(data.weeklyFoodBudget)
						: undefined,
					state: data.state || undefined,
					city: data.city || undefined,
					goal: data.goal,
				}),
			});

			if (!profileRes.ok) {
				const err = await profileRes.json();
				alert(err.error ?? "Erro ao salvar perfil");
				setSaving(false);
				return;
			}

			const tasteRes = await fetch("/api/onboarding/taste", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: session.user.id,
					stapleFoods: data.stapleFoods
						? data.stapleFoods
								.split(",")
								.map((s: string) => s.trim())
								.filter(Boolean)
						: [],
					aversions: data.aversions
						? data.aversions
								.split(",")
								.map((s: string) => s.trim())
								.filter(Boolean)
						: [],
				}),
			});

			if (!tasteRes.ok) {
				const err = await tasteRes.json();
				alert(err.error ?? "Erro ao salvar preferências");
				setSaving(false);
				return;
			}

			await fetch("/api/onboarding/complete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: session.user.id }),
			});

			await update();
			router.push("/dashboard");
			router.refresh();
		} catch {
			alert("Erro de conexão. Tente novamente.");
		}

		setSaving(false);
	};

	const nextDisabled = step < STEPS.length - 1 && !canProceed();

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<div className="px-4 pt-4">
				<div className="flex gap-1 mb-2">
					{STEPS.map((s, i) => (
						<div
							key={s.id}
							className={cn(
								"h-1 flex-1 rounded-full transition-colors",
								i <= step ? "bg-accent" : "bg-background-subtle"
							)}
						/>
					))}
				</div>
				<p className="text-xs text-foreground-muted">
					Passo {step + 1} de {STEPS.length} — {STEPS[step].title}
				</p>
			</div>

			<div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
				{step === 0 && <StepDadosPessoais data={data} update={updateField} />}
				{step === 1 && <StepCorpo data={data} update={updateField} />}
				{step === 2 && <StepExercicio data={data} update={updateField} />}
				{step === 3 && <StepHabitos data={data} update={updateField} />}
				{step === 4 && <StepSabor data={data} update={updateField} />}
				{step === 5 && <StepObjetivo data={data} update={updateField} />}
			</div>

			<div className="px-4 py-4 border-t border-border flex gap-3 max-w-lg mx-auto w-full">
				{step > 0 && (
					<button
						type="button"
						onClick={() => setStep((s) => s - 1)}
						className="flex-1 border border-border bg-background-elevated text-foreground font-medium rounded-sm px-4 py-2 text-sm hover:bg-background-subtle transition-colors min-h-[44px]"
					>
						Voltar
					</button>
				)}
				{step < STEPS.length - 1 ? (
					<button
						type="button"
						onClick={() => setStep((s) => s + 1)}
						disabled={nextDisabled}
						className="flex-1 bg-accent text-foreground-inverse font-medium rounded-sm px-4 py-2 text-sm hover:brightness-110 transition-colors min-h-[44px] disabled:opacity-50"
					>
						Próximo
					</button>
				) : (
					<button
						type="button"
						onClick={handleSubmit}
						disabled={!canProceed() || saving}
						className="flex-1 bg-accent text-foreground-inverse font-medium rounded-sm px-4 py-2 text-sm hover:brightness-110 transition-colors min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
					>
						<Check className="w-4 h-4" />
						{saving ? "Salvando..." : "Começar"}
					</button>
				)}
			</div>
		</div>
	);
}

function StepDadosPessoais({
	data,
	update,
}: {
	data: FormData;
	update: (f: keyof FormData, v: string) => void;
}) {
	return (
		<div className="flex flex-col gap-5">
			<h2 className="text-xl font-bold">Dados Pessoais</h2>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Idade</label>
				<input
					type="number"
					value={data.age}
					onChange={(e) => update("age", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="25"
					min={12}
					max={100}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Sexo biológico</label>
				<div className="grid grid-cols-2 gap-3">
					{(
						[
							{ val: "MALE", label: "Masculino" },
							{ val: "FEMALE", label: "Feminino" },
						] as const
					).map((item) => (
						<button
							key={item.val}
							type="button"
							onClick={() => update("sex", item.val)}
							className={cn(
								"h-11 rounded-sm text-sm font-medium border transition-colors min-h-[44px]",
								data.sex === item.val
									? "bg-accent text-foreground-inverse border-accent"
									: "bg-background-subtle text-foreground-muted border-border hover:border-accent"
							)}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">País</label>
				<input
					type="text"
					value={data.country}
					onChange={(e) => update("country", e.target.value.toUpperCase())}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="BR"
					maxLength={3}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Estado (UF)</label>
				<input
					type="text"
					value={data.state}
					onChange={(e) => update("state", e.target.value.toUpperCase())}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="SP"
					maxLength={2}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Cidade</label>
				<input
					type="text"
					value={data.city}
					onChange={(e) => update("city", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="São Paulo"
				/>
			</div>
		</div>
	);
}

function StepCorpo({
	data,
	update,
}: {
	data: FormData;
	update: (f: keyof FormData, v: string) => void;
}) {
	return (
		<div className="flex flex-col gap-5">
			<h2 className="text-xl font-bold">Dados Corporais</h2>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Altura (cm)</label>
				<input
					type="number"
					value={data.heightCm}
					onChange={(e) => update("heightCm", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="175"
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Peso (kg)</label>
				<input
					type="number"
					value={data.weightKg}
					onChange={(e) => update("weightKg", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="80"
					step="0.1"
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					% Gordura{" "}
					<span className="text-foreground-muted">(opcional)</span>
				</label>
				<input
					type="number"
					value={data.bodyFatPercentage}
					onChange={(e) => update("bodyFatPercentage", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="18"
					min={3}
					max={60}
					step="0.1"
				/>
			</div>
		</div>
	);
}

function StepExercicio({
	data,
	update,
}: {
	data: FormData;
	update: (f: keyof FormData, v: string) => void;
}) {
	return (
		<div className="flex flex-col gap-5">
			<h2 className="text-xl font-bold">Exercício Físico</h2>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Nível de atividade</label>
				<div className="flex flex-col gap-2">
					{(
						[
							{ val: "SEDENTARY", label: "Sedentário", desc: "Trabalho de escritório, sem exercício regular" },
							{ val: "LIGHT", label: "Leve", desc: "Exercício leve 1-3x/semana" },
							{ val: "MODERATE", label: "Moderado", desc: "Exercício moderado 3-5x/semana" },
							{ val: "ACTIVE", label: "Ativo", desc: "Exercício intenso 6-7x/semana" },
							{ val: "VERY_ACTIVE", label: "Muito Ativo", desc: "Atleta ou treina 2x por dia" },
						] as const
					).map((item) => (
						<button
							key={item.val}
							type="button"
							onClick={() => update("activityLevel", item.val)}
							className={cn(
								"rounded-sm text-sm font-medium border text-left px-4 py-3 transition-colors min-h-[44px]",
								data.activityLevel === item.val
									? "bg-accent text-foreground-inverse border-accent"
									: "bg-background-subtle text-foreground-muted border-border hover:border-accent"
							)}
						>
							<span className="block font-semibold">{item.label}</span>
							<span className="block text-xs opacity-70 mt-0.5">{item.desc}</span>
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					Dias de exercício por semana
				</label>
				<input
					type="number"
					value={data.exerciseFrequency}
					onChange={(e) => update("exerciseFrequency", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="4"
					min={0}
					max={14}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					Duração média (min){" "}
					<span className="text-foreground-muted">(opcional)</span>
				</label>
				<input
					type="number"
					value={data.exerciseDurationMin}
					onChange={(e) => update("exerciseDurationMin", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="60"
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Intensidade</label>
				<div className="grid grid-cols-3 gap-2">
					{(
						[
							{ val: "LIGHT", label: "Leve" },
							{ val: "MODERATE", label: "Moderada" },
							{ val: "INTENSE", label: "Intensa" },
						] as const
					).map((item) => (
						<button
							key={item.val}
							type="button"
							onClick={() => update("exerciseIntensity", item.val)}
							className={cn(
								"h-11 rounded-sm text-sm font-medium border transition-colors min-h-[44px]",
								data.exerciseIntensity === item.val
									? "bg-accent text-foreground-inverse border-accent"
									: "bg-background-subtle text-foreground-muted border-border hover:border-accent"
							)}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

function StepHabitos({
	data,
	update,
}: {
	data: FormData;
	update: (f: keyof FormData, v: string) => void;
}) {
	return (
		<div className="flex flex-col gap-5">
			<h2 className="text-xl font-bold">Hábitos e Rotina</h2>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Refeições por dia</label>
				<div className="grid grid-cols-4 gap-2">
					{["2", "3", "4", "5"].map((val) => (
						<button
							key={val}
							type="button"
							onClick={() => update("mealsPerDay", val)}
							className={cn(
								"h-11 rounded-sm text-sm font-medium border transition-colors min-h-[44px]",
								data.mealsPerDay === val
									? "bg-accent text-foreground-inverse border-accent"
									: "bg-background-subtle text-foreground-muted border-border hover:border-accent"
							)}
						>
							{val}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					Rotina de trabalho
				</label>
				<div className="flex flex-col gap-2">
					{(
						[
							{ val: "CLT_9_TO_5", label: "CLT (9h-18h)" },
							{ val: "HOME_OFFICE", label: "Home Office" },
							{ val: "SHIFT_WORK", label: "Turnos" },
							{ val: "FLEXIBLE", label: "Horário flexível" },
							{ val: "STUDENT", label: "Estudante" },
							{ val: "OTHER", label: "Outro" },
						] as const
					).map((item) => (
						<button
							key={item.val}
							type="button"
							onClick={() => update("workRoutine", item.val)}
							className={cn(
								"h-11 rounded-sm text-sm font-medium border text-left px-4 transition-colors min-h-[44px]",
								data.workRoutine === item.val
									? "bg-accent text-foreground-inverse border-accent"
									: "bg-background-subtle text-foreground-muted border-border hover:border-accent"
							)}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					Restrição alimentar
				</label>
				<select
					value={data.dietaryRestrictions}
					onChange={(e) => update("dietaryRestrictions", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm text-foreground focus:border-accent transition-colors"
				>
					<option value="NONE">Nenhuma</option>
					<option value="VEGAN">Vegano</option>
					<option value="VEGETARIAN">Vegetariano</option>
					<option value="LACTOSE_FREE">Sem Lactose</option>
					<option value="GLUTEN_FREE">Sem Glúten</option>
					<option value="LOW_CARB">Low Carb</option>
					<option value="KETO">Keto</option>
				</select>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					Orçamento semanal (R$){" "}
					<span className="text-foreground-muted">(opcional)</span>
				</label>
				<input
					type="number"
					value={data.weeklyFoodBudget}
					onChange={(e) => update("weeklyFoodBudget", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="150"
					step="0.01"
				/>
			</div>
		</div>
	);
}

function StepSabor({
	data,
	update,
}: {
	data: FormData;
	update: (f: keyof FormData, v: string) => void;
}) {
	return (
		<div className="flex flex-col gap-5">
			<h2 className="text-xl font-bold">Sabor e Preferências</h2>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					Alimentos do dia-a-dia{" "}
					<span className="text-foreground-muted">
						(o que você come regularmente)
					</span>
				</label>
				<input
					type="text"
					value={data.stapleFoods}
					onChange={(e) => update("stapleFoods", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="feijão, arroz, aveia, banana"
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					Aversões{" "}
					<span className="text-foreground-muted">
						(o que você não come)
					</span>
				</label>
				<input
					type="text"
					value={data.aversions}
					onChange={(e) => update("aversions", e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="fígado, berinjela"
				/>
			</div>
		</div>
	);
}

function StepObjetivo({
	data,
	update,
}: {
	data: FormData;
	update: (f: keyof FormData, v: string) => void;
}) {
	return (
		<div className="flex flex-col gap-5">
			<h2 className="text-xl font-bold">Seu Objetivo</h2>

			<div className="flex flex-col gap-3">
				{(
					[
						{ val: "FAT_LOSS", label: "Perda de gordura", desc: "Déficit calórico controlado" },
						{ val: "MUSCLE_GAIN", label: "Ganho de massa", desc: "Superávit calórico + proteína alta" },
						{ val: "MAINTENANCE", label: "Manutenção", desc: "Recomposição corporal" },
						{ val: "PERFORMANCE", label: "Performance", desc: "Maximizar performance esportiva" },
					] as const
				).map((item) => (
					<button
						key={item.val}
						type="button"
						onClick={() => update("goal", item.val)}
						className={cn(
							"rounded-sm text-sm font-medium border text-left px-4 py-3 transition-colors min-h-[44px]",
							data.goal === item.val
								? "bg-accent/15 border-accent text-accent"
								: "bg-background-subtle text-foreground-muted border-border hover:border-accent"
						)}
					>
						<span className="block font-semibold">{item.label}</span>
						<span className="block text-xs opacity-70 mt-0.5">
							{item.desc}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}
