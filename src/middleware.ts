import { NextResponse } from "next/server";

/**
 * Middleware temporarily disabled while setting up authentication
 * Will be re-enabled once auth providers are properly configured
 */
export function middleware() {
  // Allow all requests to pass through for now
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
