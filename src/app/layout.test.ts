import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
  Inter: () => ({ variable: "font-inter" }),
  JetBrains_Mono: () => ({ variable: "font-jetbrains-mono" }),
}));

describe("RootLayout", () => {
  it("suppresses hydration warnings on body to tolerate injected client attributes", async () => {
    const { default: RootLayout } = await import("./layout");

    const tree = RootLayout({
      children: "content",
    });

    const body = tree.props.children;

    expect(body.type).toBe("body");
    expect(body.props.suppressHydrationWarning).toBe(true);
  });
});
