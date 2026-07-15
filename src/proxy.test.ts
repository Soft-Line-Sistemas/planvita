import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

describe("proxy with subdomain-only routing", () => {
  const buildRequest = (url: string) =>
    new NextRequest(url, {
      headers: {
        host: new URL(url).host,
      },
    });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("does not redirect the apex domain root", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING", "true");
    const { proxy } = await import("./proxy");

    const request = buildRequest("https://campodobosque.com.br/");
    const response = proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects custom app subdomain root to /cliente", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING", "true");
    const { proxy } = await import("./proxy");

    const request = buildRequest("https://app.campodobosque.com.br/");
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://app.campodobosque.com.br/cliente",
    );
  });

  it("redirects custom app subdomain root to /cliente without the custom routing flag", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING", "false");
    const { proxy } = await import("./proxy");

    const request = buildRequest("https://app.campodobosque.com.br/");
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://app.campodobosque.com.br/cliente",
    );
  });

  it("does not intercept /cliente on the apex host", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING", "true");
    const { proxy } = await import("./proxy");

    const request = buildRequest("https://campodobosque.com.br/cliente");
    const response = proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps tenant subdomain login routing active", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING", "true");
    const { proxy } = await import("./proxy");

    const request = buildRequest("https://bosque.campodobosque.com.br/");
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://bosque.campodobosque.com.br/login",
    );
  });
});
