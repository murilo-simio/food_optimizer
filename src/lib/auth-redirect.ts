export type ProtectedPageState = "loading" | "redirect" | "ready";

export function getProtectedPageState(
  status: string,
  hasUser: boolean
): ProtectedPageState {
  if (status === "loading") {
    return "loading";
  }

  if (!hasUser) {
    return "redirect";
  }

  return "ready";
}
