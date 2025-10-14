import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubdomainFromHost } from "@/lib/getSubdomain";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host");
  const subdomain = getSubdomainFromHost(host);

  if (pathname === "/")
    return NextResponse.redirect(new URL("/login", req.url));

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(.*)$/)
  )
    return NextResponse.next();

  if (pathname.startsWith("/login")) return NextResponse.next();

  if (pathname.startsWith("/painel") && !subdomain)
    return NextResponse.redirect(new URL("/login", req.url));

  const res = NextResponse.next();
  if (subdomain) res.headers.set("x-tenant-id", subdomain);

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
