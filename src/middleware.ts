import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubdomainFromHost } from "@/lib/getSubdomain";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

  const subdomain = getSubdomainFromHost(host);

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
