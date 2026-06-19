import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/",
  "/home",
  "/about",
  "/contact",
  "/investment-plans",
  "/copy-trading",
  "/mentorship",
  "/how-it-works",
  "/faq",
  "/terms",
  "/privacy",
  "/risk-disclosure",
  "/cookies",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/cron/",
  "/api/market",
  "/sitemap.xml",
];
const ADMIN_PATHS = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get("stoxoptionhub_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? "fallback-secret-for-dev-only"
  );

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));
    if (isAdmin && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("stoxoptionhub_session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
