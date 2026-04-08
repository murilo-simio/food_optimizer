import { describe, expect, it } from "vitest";

import { APP_NAV_ITEMS, isActiveNavPath } from "./navigation";

describe("app navigation", () => {
  it("exposes the bottom navigation with the expected Portuguese routes", () => {
    expect(APP_NAV_ITEMS).toMatchObject([
      { key: "dieta", label: "Dieta", href: "/dieta" },
      { key: "chat", label: "Chat", href: "/chat" },
      { key: "dashboard", label: "Dashboard", href: "/dashboard" },
      { key: "log", label: "Log", href: "/log" },
      { key: "perfil", label: "Perfil", href: "/perfil" },
    ]);
  });

  it("marks current items as active for both canonical and legacy paths", () => {
    const dietaItem = APP_NAV_ITEMS.find((item) => item.key === "dieta");
    const logItem = APP_NAV_ITEMS.find((item) => item.key === "log");
    const perfilItem = APP_NAV_ITEMS.find((item) => item.key === "perfil");

    expect(dietaItem).toBeDefined();
    expect(logItem).toBeDefined();
    expect(perfilItem).toBeDefined();

    expect(isActiveNavPath("/dieta", dietaItem!.aliases)).toBe(true);
    expect(isActiveNavPath("/diet", dietaItem!.aliases)).toBe(true);
    expect(isActiveNavPath("/log", logItem!.aliases)).toBe(true);
    expect(isActiveNavPath("/tracking", logItem!.aliases)).toBe(true);
    expect(isActiveNavPath("/perfil/configuracoes", perfilItem!.aliases)).toBe(true);
    expect(isActiveNavPath("/dashboard", dietaItem!.aliases)).toBe(false);
  });
});
