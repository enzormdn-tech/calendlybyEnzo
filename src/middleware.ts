import { NextRequest, NextResponse } from "next/server";

/**
 * Protect /dashboard routes with simple password authentication.
 * Checks for DASHBOARD_PASSWORD in cookie or Authorization header.
 * Login page is excluded from protection.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and API routes through
  if (pathname === "/dashboard/login") {
    return NextResponse.next();
  }

  const password = process.env.DASHBOARD_PASSWORD;

  // If no password configured, allow access (dev convenience)
  if (!password) {
    return NextResponse.next();
  }

  // Check cookie
  const cookieAuth = request.cookies.get("dashboard_auth")?.value;
  if (cookieAuth === password) {
    return NextResponse.next();
  }

  // Check Authorization header (for API clients)
  const headerAuth = request.headers.get("authorization");
  if (headerAuth === `Bearer ${password}`) {
    return NextResponse.next();
  }

  // Not authenticated — redirect to login
  const loginUrl = new URL("/dashboard/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
