import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REFRESH_TOKEN_COOKIE = "sgrtc_refresh_token";

// Routes reachable without a session.
const PUBLIC_ROUTES = ["/login"];
// Public route trees (e.g. shareable, no-login shipment tracking links).
const PUBLIC_PREFIXES = ["/track/"];

function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // A logged-in user shouldn't sit on the login page.
  if (pathname === "/login" && refreshToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Everything except public routes requires a session.
  if (!isPublicRoute(pathname) && !refreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
