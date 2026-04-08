export type AppNavKey = "dieta" | "chat" | "dashboard" | "log" | "perfil";

export interface AppNavItem {
  key: AppNavKey;
  label: string;
  href: string;
  aliases: readonly string[];
}

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  {
    key: "dieta",
    label: "Dieta",
    href: "/dieta",
    aliases: ["/dieta", "/diet"],
  },
  {
    key: "chat",
    label: "Chat",
    href: "/chat",
    aliases: ["/chat"],
  },
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    aliases: ["/dashboard"],
  },
  {
    key: "log",
    label: "Log",
    href: "/log",
    aliases: ["/log", "/tracking"],
  },
  {
    key: "perfil",
    label: "Perfil",
    href: "/perfil",
    aliases: ["/perfil", "/profile"],
  },
] as const;

export function isActiveNavPath(
  pathname: string,
  aliases: readonly string[]
): boolean {
  return aliases.some(
    (alias) => pathname === alias || pathname.startsWith(`${alias}/`)
  );
}
