"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	if (status === "loading") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (!session?.user) {
		router.push("/login");
		return null;
	}

	return (
		<div className="px-4 py-4 max-w-2xl mx-auto">
			{/* Header */}
			<header className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-bold">
						Olá, {session.user.name.split(" ")[0]}
					</h1>
					<p className="text-sm text-foreground-muted">
						Seu resumo de hoje
					</p>
				</div>
				<button
					onClick={() => signOut({ callbackUrl: "/login" })}
					className="text-foreground-muted hover:text-foreground transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
					aria-label="Sair"
				>
					<LogOut className="w-5 h-5" />
				</button>
			</header>

			{/* Stats cards */}
			<div className="grid grid-cols-2 gap-4 mb-6">
				<StatCard
					label="Calorias"
					value="—"
					unit="kcal"
					status="empty"
				/>
				<StatCard
					label="Proteína"
					value="—"
					unit="g"
					status="empty"
				/>
				<StatCard
					label="Carbos"
					value="—"
					unit="g"
					status="empty"
				/>
				<StatCard
					label="Gordura"
					value="—"
					unit="g"
					status="empty"
				/>
			</div>

			{/* Empty state */}
			<div className="bg-background-elevated border border-border rounded-md p-6 text-center">
				<p className="text-foreground-muted text-sm">
					Nenhuma dieta montada ainda.
				</p>
				<p className="text-foreground-muted text-xs mt-1">
					Fase futura: gerador de dietas
				</p>
			</div>
		</div>
	);
}

function StatCard({
	label,
	value,
	unit,
	status,
}: {
	label: string;
	value: string;
	unit: string;
	status: "empty" | "below" | "on-track" | "over" | "over-budget";
}) {
	const statusColor = {
		empty: "text-foreground-muted",
		below: "text-warning",
		"on-track": "text-accent",
		over: "text-warning",
		"over-budget": "text-error",
	};

	return (
		<div className="bg-background-elevated border border-border rounded-md p-4 shadow-sm">
			<p className="text-xs text-foreground-muted">{label}</p>
			<p className={cn("text-2xl font-mono font-bold mt-1", statusColor[status])}>
				{value}
			</p>
			<p className="text-xs text-foreground-muted">{unit}</p>
		</div>
	);
}
