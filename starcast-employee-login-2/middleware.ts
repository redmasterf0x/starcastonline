import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

// Routes that require authentication. Role checks (admin/crew) happen
// server-side in the pages/layouts themselves, since middleware cannot
// query the database in the edge runtime.
const PROTECTED_ROUTES = ["/dashboard", "/admin", "/production", "/staff", "/portal"]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const sessionCookie = getSessionCookie(request)

  // Protect authenticated routes - redirect to login if no session cookie
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  if (isProtected && !sessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === "/login" || pathname === "/signup") && sessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = "/articles"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
