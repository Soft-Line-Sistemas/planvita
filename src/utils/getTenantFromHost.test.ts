// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

describe("getTenantFromHost with subdomain-only routing", () => {
  const originalLocation = window.location;

  const setHostname = (hostname: string) => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        hostname,
        search: "",
      },
    });
  };

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("returns null on the apex custom domain", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING", "true");
    setHostname("campodobosque.com.br");

    const { default: getTenantFromHost } = await import("./getTenantFromHost");

    expect(getTenantFromHost()).toBeNull();
  });

  it("returns the tenant on a custom subdomain", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING", "true");
    setHostname("bosque.campodobosque.com.br");

    const { default: getTenantFromHost } = await import("./getTenantFromHost");

    expect(getTenantFromHost()).toBe("bosque");
  });
});
