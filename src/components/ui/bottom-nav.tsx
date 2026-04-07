"use client";

import Link from "next/link";
import { Flame, Plus, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-background-elevated border-t border-border flex justify-around py-2 z-50 pb-safe">
			<Link
				href="/dashboard"
				className={cn(
					"flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors",
					pathname.startsWith("/dashboard") &&
						"text-accent",
					!pathname.startsWith("/dashboard") && "text-foreground-muted"
				)}
			>
				<Flame className="w-5 h-5" />
				<span>Dieta</span>
			</Link>
			<Link
				href="/tracking"
				className={cn(
					"flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors",
					pathname.startsWith("/tracking") &&
						"text-accent",
					!pathname.startsWith("/tracking") && "text-foreground-muted"
				)}
			>
				<Plus className="w-5 h-5" />
				<span>Log</span>
			</Link>
			<Link
				href="/profile"
				className={cn(
					"flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors",
					pathname.startsWith("/profile") && "text-accent",
					!pathname.startsWith("/profile") && "text-foreground-muted"
				)}
			>
				<User className="w-5 h-5" />
				<span>Perfil</span>
			</Link>
		</nav>
	);
}
