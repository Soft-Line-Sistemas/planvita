import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// const PUBLIC_PATHS = ["/login", "/cadastro"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  //   if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
  //     return NextResponse.next();
  //   }

  //   const token = req.cookies.get("authToken")?.value;

  //   if (!token) {
  //     return NextResponse.redirect(new URL("/login", req.url));
  //   }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
