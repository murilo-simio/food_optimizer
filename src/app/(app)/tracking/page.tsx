"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function TrackingPage() {
	const { data: session } = useSession();
	const [tab, setTab] = useState<"weight" | "exercise" | "meal">("weight");

	if (!session?.user) {
		return null;
	}

	return (
		<div className="px-4 py-4 max-w-2xl mx-auto">
			<h1 className="text-xl font-bold mb-4">Registrar</h1>

			{/* Tabs */}
			<div className="flex gap-1 bg-background-elevated rounded-sm p-1 mb-6">
				{(["weight", "exercise", "meal"] as const).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors min-h-[44px] ${
							tab === t
								? "bg-background-subtle text-foreground"
								: "text-foreground-muted"
						}`}
					>
						{t === "weight"
							? "Peso"
							: t === "exercise"
							? "Exercício"
							: "Refeição"}
					</button>
				))}
			</div>

			{tab === "weight" && <WeightForm userId={session.user.id} />}
			{tab === "exercise" && <ExerciseForm userId={session.user.id} />}
			{tab === "meal" && <MealForm userId={session.user.id} />}
		</div>
	);
}

function WeightForm({ userId }: { userId: string }) {
	const [weight, setWeight] = useState("");
	const [bodyFat, setBodyFat] = useState("");
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSuccess(false);

		const res = await fetch("/api/tracking/weight", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				userId,
				weightKg: parseFloat(weight),
				bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : undefined,
			}),
		});

		if (res.ok) {
			setSuccess(true);
			setWeight("");
			setBodyFat("");
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			{success && (
				<div className="text-success text-sm bg-success/10 border border-success/20 rounded-sm px-3 py-2">
					Peso registrado com sucesso!
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Peso (kg)</label>
				<input
					type="number"
					value={weight}
					onChange={(e) => setWeight(e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="80.0"
					step="0.1"
					required
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					% Gordura <span className="text-foreground-muted">(opcional)</span>
				</label>
				<input
					type="number"
					value={bodyFat}
					onChange={(e) => setBodyFat(e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="15"
					step="0.1"
				/>
			</div>

			<button
				type="submit"
				className="bg-accent text-foreground-inverse font-medium rounded-sm px-4 py-2 text-sm hover:brightness-110 transition-colors min-h-[44px]"
			>
				Registrar
			</button>
		</form>
	);
}

function ExerciseForm({ userId }: { userId: string }) {
	const [type, setType] = useState("");
	const [duration, setDuration] = useState("");
	const [intensity, setIntensity] = useState("MODERATE");
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSuccess(false);

		const res = await fetch("/api/tracking/exercise", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				userId,
				type,
				durationMin: parseInt(duration),
				intensity,
			}),
		});

		if (res.ok) {
			setSuccess(true);
			setType("");
			setDuration("");
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			{success && (
				<div className="text-success text-sm bg-success/10 border border-success/20 rounded-sm px-3 py-2">
					Exercício registrado!
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Tipo</label>
				<select
					value={type}
					onChange={(e) => setType(e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm text-foreground focus:border-accent transition-colors"
					required
				>
					<option value="">Selecione...</option>
					<option value="WEIGHTLIFTING">Musculação</option>
					<option value="RUNNING">Corrida</option>
					<option value="CROSSFIT">CrossFit</option>
					<option value="CALISTHENICS">Calistenia</option>
					<option value="CYCLING">Ciclismo</option>
					<option value="SWIMMING">Natação</option>
					<option value="WALKING">Caminhada</option>
					<option value="HIIT">HIIT</option>
				</select>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					Duração (min)
				</label>
				<input
					type="number"
					value={duration}
					onChange={(e) => setDuration(e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
					placeholder="45"
					required
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Intensidade</label>
				<div className="grid grid-cols-3 gap-2">
					{(["LIGHT", "MODERATE", "INTENSE"] as const).map((val) => (
						<button
							key={val}
							type="button"
							onClick={() => setIntensity(val)}
							className={`h-11 rounded-sm text-sm font-medium border transition-colors min-h-[44px] ${
								intensity === val
									? "bg-accent text-foreground-inverse border-accent"
									: "bg-background-subtle text-foreground-muted border-border hover:border-accent"
							}`}
						>
							{val === "LIGHT"
								? "Leve"
								: val === "MODERATE"
								? "Moderada"
								: "Intensa"}
						</button>
					))}
				</div>
			</div>

			<button
				type="submit"
				className="bg-accent text-foreground-inverse font-medium rounded-sm px-4 py-2 text-sm hover:brightness-110 transition-colors min-h-[44px]"
			>
				Registrar
			</button>
		</form>
	);
}

function MealForm({ userId }: { userId: string }) {
	const [mealSlot, setMealSlot] = useState("almoco");
	const [foods, setFoods] = useState("");
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSuccess(false);

		// Parse: "arroz 200g, frango 150g" => [{name, grams}]
		const parsed = foods
			.split(",")
			.map((f: string) => f.trim())
			.filter(Boolean)
			.map((f: string) => {
				const match = f.match(/^(.+?)(\d+(?:\.\d+)?)\s*g$/i);
				if (match) {
					return { name: match[1].trim(), grams: parseFloat(match[2]) };
				}
				return null;
			})
			.filter(Boolean) as { name: string; grams: number }[];

		const res = await fetch("/api/tracking/meal", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, mealSlot, foods: parsed }),
		});

		if (res.ok) {
			setSuccess(true);
			setFoods("");
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			{success && (
				<div className="text-success text-sm bg-success/10 border border-success/20 rounded-sm px-3 py-2">
					Refeição registrada!
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">Refeição</label>
				<select
					value={mealSlot}
					onChange={(e) => setMealSlot(e.target.value)}
					className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm text-foreground focus:border-accent transition-colors"
				>
					<option value="cafe_manha">Café da manhã</option>
					<option value="almoco">Almoço</option>
					<option value="lanche">Lanche</option>
					<option value="jantar">Jantar</option>
					<option value="ceia">Ceia</option>
				</select>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium">
					Alimentos
					<span className="block text-foreground-muted text-xs mt-0.5">
						Um por linha: nome + gramas (ex: arroz 200g)
					</span>
				</label>
				<textarea
					value={foods}
					onChange={(e) => setFoods(e.target.value)}
					className="bg-background-subtle border border-border rounded-sm px-3 py-2 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors min-h-[120px] resize-none"
					placeholder={"arroz 200g\nfrango 150g\nfeijão 120g"}
					required
				/>
			</div>

			<button
				type="submit"
				className="bg-accent text-foreground-inverse font-medium rounded-sm px-4 py-2 text-sm hover:brightness-110 transition-colors min-h-[44px]"
			>
				Registrar
			</button>
		</form>
	);
}
