import { describe, expect, it } from "vitest";

import { getProtectedPageState } from "./auth-redirect";

describe("getProtectedPageState", () => {
  it("returns loading while the session state is still loading", () => {
    expect(getProtectedPageState("loading", false)).toBe("loading");
    expect(getProtectedPageState("loading", true)).toBe("loading");
  });

  it("returns redirect when the session is resolved without a user", () => {
    expect(getProtectedPageState("unauthenticated", false)).toBe("redirect");
  });

  it("returns ready when the session is authenticated", () => {
    expect(getProtectedPageState("authenticated", true)).toBe("ready");
  });
});
