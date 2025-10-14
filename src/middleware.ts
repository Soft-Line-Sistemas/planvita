import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubdomainFromHost } from "@/lib/getSubdomain";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const subdomain = getSubdomainFromHost(host);

  // Ignorar assets e api
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  // Redireciona a raiz para login
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Evita loop: se já estiver na página de redirecionamento, não redireciona
  if (pathname.startsWith("/login/redirecionamento")) {
    return NextResponse.next();
  }

  // Página de login sem subdomínio
  if (pathname.startsWith("/login") && !subdomain) {
    const url = req.nextUrl.clone();
    url.pathname = "/login/redirecionamento";
    return NextResponse.redirect(url);
  }

  // Painel sem subdomínio
  if (pathname.startsWith("/painel") && !subdomain) {
    const url = req.nextUrl.clone();
    url.pathname = "/login/redirecionamento";
    return NextResponse.redirect(url);
  }

  // Adiciona header do tenant
  const response = NextResponse.next();
  if (subdomain) {
    response.headers.set("x-tenant-id", subdomain);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
