import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/analysis", "/analyze", "/dashboard", "/qr-scan"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get("tcx_token")?.value;

  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  loginUrl.searchParams.set("message", "login-required");

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/analysis/:path*", "/analyze/:path*", "/dashboard/:path*", "/qr-scan/:path*"]
};
