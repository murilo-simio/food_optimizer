"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
	LayoutDashboard,
	MessageCircle,
	Plus,
	User,
	UtensilsCrossed,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
	type AppNavKey,
	APP_NAV_ITEMS,
	isActiveNavPath,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<AppNavKey, LucideIcon> = {
	dieta: UtensilsCrossed,
	chat: MessageCircle,
	dashboard: LayoutDashboard,
	log: Plus,
	perfil: User,
};

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background-elevated/95 backdrop-blur-sm">
			<div className="mx-auto grid max-w-2xl grid-cols-5 px-2 py-2 pb-safe">
				{APP_NAV_ITEMS.map((item) => {
					const Icon = NAV_ICONS[item.key];
					const isActive = isActiveNavPath(pathname, item.aliases);

					return (
						<Link
							key={item.key}
							href={item.href}
							aria-current={isActive ? "page" : undefined}
							className={cn(
								"flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-sm px-2 py-1 text-[11px] transition-colors",
								isActive ? "text-accent" : "text-foreground-muted"
							)}
						>
							<Icon className="h-5 w-5" />
							<span>{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
