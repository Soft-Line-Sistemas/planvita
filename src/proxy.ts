import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubdomainFromHost } from "@/lib/getSubdomain";

const SUBDOMAIN_ONLY_ROUTING_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING === "true";
const PRODUCTION_BASE_DOMAINS = ["planvita.com.br", "campodobosque.com.br"];

function getBaseDomain(hostname: string): string {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "localhost";
  }

  const parts = hostname.split(".");

  if (SUBDOMAIN_ONLY_ROUTING_ENABLED) {
    if (parts.length >= 3 && parts.slice(-2).join(".") === "com.br") {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  }

  const matchingProductionDomain = PRODUCTION_BASE_DOMAINS.find(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
  if (matchingProductionDomain) {
    return matchingProductionDomain;
  }

  return parts.slice(-2).join(".");
}

function getAppHost(req: NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const portMatch = host.match(/(:\d+)$/);
  const port = portMatch ? portMatch[1] : "";
  const hostname = host.split(":")[0].toLowerCase();
  const base = getBaseDomain(hostname);

  return `app.${base}${port}`;
}

function isAppSubdomain(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  // localhost: app.localhost
  if (hostname === "app.localhost") return true;
  if (PRODUCTION_BASE_DOMAINS.some((domain) => hostname === `app.${domain}`)) {
    return true;
  }
  if (SUBDOMAIN_ONLY_ROUTING_ENABLED) {
    return hostname.startsWith(`app.${getBaseDomain(hostname)}`);
  }
  return false;
}

function isApexHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  return hostname === getBaseDomain(hostname);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

  const subdomain = getSubdomainFromHost(host);
  const onAppSubdomain = isAppSubdomain(host);
  const onApexHost = isApexHost(host);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  if (
    SUBDOMAIN_ONLY_ROUTING_ENABLED &&
    onApexHost &&
    !subdomain &&
    !onAppSubdomain
  ) {
    return NextResponse.next();
  }

  // /cliente (e subrotas) sempre vai para app.localhost
  if (pathname.startsWith("/cliente") && !onAppSubdomain) {
    const url = req.nextUrl.clone();
    const appHost = getAppHost(req);
    url.host = appHost;
    url.hostname = appHost.split(":")[0];
    const portMatch = appHost.match(/:(\d+)$/);
    url.port = portMatch ? portMatch[1] : "";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    if (onAppSubdomain) {
      url.pathname = "/cliente";
    } else {
      url.pathname = subdomain ? "/login" : "/login/redirecionamento";
    }
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/privacidade")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/login/redirecionamento")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/login") && !subdomain) {
    const url = req.nextUrl.clone();
    url.pathname = "/login/redirecionamento";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/painel") && !subdomain) {
    const url = req.nextUrl.clone();
    url.pathname = "/login/redirecionamento";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  if (subdomain) {
    response.headers.set("X-tenant", subdomain);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
