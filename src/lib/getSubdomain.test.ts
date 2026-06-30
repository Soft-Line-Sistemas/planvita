import { afterEach, describe, expect, it, vi } from "vitest";

describe("getSubdomainFromHost with subdomain-only routing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns null for the apex custom domain", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING", "true");
    const { getSubdomainFromHost } = await import("./getSubdomain");

    expect(getSubdomainFromHost("campodobosque.com.br")).toBeNull();
  });

  it("extracts the tenant from a custom subdomain", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING", "true");
    const { getSubdomainFromHost } = await import("./getSubdomain");

    expect(getSubdomainFromHost("bosque.campodobosque.com.br")).toBe("bosque");
  });

  it("ignores the app subdomain on a custom domain", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING", "true");
    const { getSubdomainFromHost } = await import("./getSubdomain");

    expect(getSubdomainFromHost("app.campodobosque.com.br")).toBeNull();
  });
});
