import { auth } from "../auth";
import { NextRequest } from "next/server";

/**
 * Authentication middleware that protects routes
 * Currently allows all requests to pass through until auth providers are configured
 */
export default auth(async function middleware(req: NextRequest) {
  // The auth() wrapper will handle authentication automatically
  // You can add custom middleware logic here if needed
  console.log("Auth middleware:", req.nextUrl.pathname);
});

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
