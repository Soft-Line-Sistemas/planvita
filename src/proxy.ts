import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubdomainFromHost } from "@/lib/getSubdomain";

function getAppHost(req: NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const portMatch = host.match(/(:\d+)$/);
  const port = portMatch ? portMatch[1] : "";
  const hostname = host.split(":")[0].toLowerCase();

  // Determine the base domain (without any subdomain)
  let base: string;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    base = "localhost";
  } else {
    // production: planvita.com.br is 3 parts; strip any leading subdomain
    const parts = hostname.split(".");
    if (parts.slice(-3).join(".") === "planvita.com.br") {
      base = "planvita.com.br";
    } else {
      // fallback genérico: remove um nível de subdomínio
      base = parts.slice(-2).join(".");
    }
  }

  return `app.${base}${port}`;
}

function isAppSubdomain(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  // localhost: app.localhost
  if (hostname === "app.localhost") return true;
  // production: app.planvita.com.br
  if (hostname === "app.planvita.com.br") return true;
  return false;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

  const subdomain = getSubdomainFromHost(host);
  const onAppSubdomain = isAppSubdomain(host);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(.*)$/)
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
