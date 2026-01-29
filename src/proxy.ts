import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubdomainFromHost } from "@/lib/getSubdomain";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

  const subdomain = getSubdomainFromHost(host);
  const tenantParam = req.nextUrl.searchParams.get("tenant");
  const tenantCookie = req.cookies.get("tenant")?.value;
  const tenant = subdomain || tenantParam || tenantCookie;

  if (pathname.startsWith("/api")) {
    // Desativa qualquer backend do Next (rotas API) e evita surface de ataque.
    return new NextResponse("Not Found", { status: 404 });
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/login/redirecionamento")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/login") && !tenant) {
    const url = req.nextUrl.clone();
    url.pathname = "/login/redirecionamento";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/painel") && !tenant) {
    const url = req.nextUrl.clone();
    url.pathname = "/login/redirecionamento";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  if (tenant) {
    response.headers.set("X-tenant", tenant);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
