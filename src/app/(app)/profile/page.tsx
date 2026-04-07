"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

type HistoryData = {
	bodyRecords: Array<{
		id: string;
		weightKg: number;
		bodyFatPercentage?: number;
		recordedAt: string;
	}>;
	exerciseLogs: Array<{
		id: string;
		type: string;
		durationMin: number;
		intensity: string;
		caloriesBurned?: number;
		notes?: string;
		loggedAt: string;
	}>;
};

const exerciseTypeLabels: Record<string, string> = {
	WEIGHTLIFTING: "Musculação",
	RUNNING: "Corrida",
	CROSSFIT: "CrossFit",
	CALISTHENICS: "Calistenia",
	CYCLING: "Ciclismo",
	SWIMMING: "Natação",
	MARTIAL_ARTS: "Artes marciais",
	HIIT: "HIIT",
	WALKING: "Caminhada",
	OTHER: "Outro",
};

const intensityLabels: Record<string, string> = {
	LIGHT: "Leve",
	MODERATE: "Moderada",
	INTENSE: "Intensa",
};

function formatDate(dateStr: string) {
	const d = new Date(dateStr);
	return d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export default function ProfilePage() {
	const { data: session } = useSession();
	const [history, setHistory] = useState<HistoryData | null>(null);
	const [tab, setTab] = useState<"info" | "weight" | "exercise">("info");

	useEffect(() => {
		if (!session?.user?.id) return;
		fetch(`/api/profile?userId=${session.user.id}`)
			.then((res) => res.json())
			.then((data) => setHistory(data))
			.catch(() => setHistory(null));
	}, [session]);

	if (!session?.user) {
		return null;
	}

	return (
		<div className="px-4 py-4 max-w-2xl mx-auto">
			<h1 className="text-xl font-bold mb-4">Perfil</h1>

			{/* Tabs */}
			<div className="flex gap-1 bg-background-elevated rounded-sm p-1 mb-6">
				{([
					{ id: "info" as const, label: "Info" },
					{ id: "weight" as const, label: "Peso" },
					{ id: "exercise" as const, label: "Exercício" },
				]).map((t) => (
					<button
						key={t.id}
						onClick={() => setTab(t.id)}
						className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors min-h-[44px] ${
							tab === t.id
								? "bg-background-subtle text-foreground"
								: "text-foreground-muted"
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{tab === "info" && (
				<>
					<div className="bg-background-elevated border border-border rounded-md p-4 mb-4">
						<p className="text-xs text-foreground-muted">Nome</p>
						<p className="text-base font-medium">{session.user.name}</p>
					</div>

					<div className="bg-background-elevated border border-border rounded-md p-4 mb-4">
						<p className="text-xs text-foreground-muted">Email</p>
						<p className="text-base font-medium">{session.user.email}</p>
					</div>
				</>
			)}

			{tab === "weight" && (
				<div className="space-y-3">
					{history?.bodyRecords && history.bodyRecords.length > 0 ? (
						history.bodyRecords.map((rec) => (
							<div
								key={rec.id}
								className="bg-background-elevated border border-border rounded-md p-4"
							>
								<div className="flex justify-between items-center">
									<div>
										<p className="text-lg font-bold">
											{rec.weightKg} kg
										</p>
										{rec.bodyFatPercentage && (
											<p className="text-xs text-foreground-muted">
												{rec.bodyFatPercentage}% gordura
											</p>
										)}
									</div>
									<p className="text-xs text-foreground-muted">
										{formatDate(rec.recordedAt)}
									</p>
								</div>
							</div>
						))
					) : (
						<p className="text-foreground-muted text-sm text-center py-4">
							Nenhum registro de peso ainda.
						</p>
					)}
				</div>
			)}

			{tab === "exercise" && (
				<div className="space-y-3">
					{history?.exerciseLogs && history.exerciseLogs.length > 0 ? (
						history.exerciseLogs.map((log) => (
							<div
								key={log.id}
								className="bg-background-elevated border border-border rounded-md p-4"
							>
								<div className="flex justify-between items-start">
									<div>
										<p className="font-medium">
											{exerciseTypeLabels[log.type] ?? log.type}
										</p>
										<p className="text-xs text-foreground-muted">
											{log.durationMin}min • {intensityLabels[log.intensity] ?? log.intensity}
											{log.caloriesBurned && (
												<span> • {log.caloriesBurned} kcal</span>
											)}
										</p>
									</div>
									<p className="text-xs text-foreground-muted">
										{formatDate(log.loggedAt)}
									</p>
								</div>
							</div>
						))
					) : (
						<p className="text-foreground-muted text-sm text-center py-4">
							Nenhum registro de exercício ainda.
						</p>
					)}
				</div>
			)}

			<div className="mt-8">
				<button
					onClick={() => signOut({ callbackUrl: "/login" })}
					className="w-full border border-error text-error font-medium rounded-sm px-4 py-2 text-sm hover:bg-error/10 transition-colors min-h-[44px]"
				>
					Sair da conta
				</button>
			</div>
		</div>
	);
}
