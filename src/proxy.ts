import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/portale", "/admin"];
const authPages = ["/login", "/registrazione"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session_id");

  // Redirect authenticated users away from auth pages
  if (authPages.some((p) => pathname.startsWith(p)) && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow access to protected routes only with session (cookie-level check;
  // full validation happens server-side in API routes / server components)
  if (protectedPrefixes.some((p) => pathname.startsWith(p)) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/portale/:path*", "/admin/:path*", "/login", "/registrazione"],
};
