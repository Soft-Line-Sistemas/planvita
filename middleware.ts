import { proxy } from "./src/proxy";

// Next precisa enxergar um objeto estático aqui (sem reexport).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req: Parameters<typeof proxy>[0]) {
  return proxy(req);
}
