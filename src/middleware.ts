import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_session";

// Public API routes that don't need auth
const PUBLIC_API = ["/api/checkin/", "/api/inbound-email", "/api/auth/", "/api/upload-doc", "/api/contact", "/api/portaria/auth/"];

const SHORT_DOMAIN = "airchk.in";
const MAIN_DOMAIN = "https://aircheck.com.br";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.replace(/:.*$/, "") || "";

  // Short domain → redirect to main domain (same path)
  if (host === SHORT_DOMAIN || host === `www.${SHORT_DOMAIN}`) {
    return NextResponse.redirect(`${MAIN_DOMAIN}${pathname}${request.nextUrl.search}`, 301);
  }

  // Public pages (no auth required)
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/register/condominio" ||
    pathname === "/portaria/login" ||
    pathname.startsWith("/checkin/") ||
    pathname.startsWith("/reset-password/")
  ) {
    return NextResponse.next();
  }

  // Public API routes
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Portaria routes: use portaria cookie
  if (pathname.startsWith("/portaria") || pathname.startsWith("/api/portaria/")) {
    const portariaToken = request.cookies.get("aircheck_portaria")?.value;
    if (!portariaToken) {
      if (pathname.startsWith("/api/portaria/")) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/portaria/login", request.url));
    }
    try {
      await jwtVerify(portariaToken, SECRET);
      return NextResponse.next();
    } catch {
      const response = pathname.startsWith("/api/portaria/")
        ? NextResponse.json({ error: "Sessão expirada" }, { status: 401 })
        : NextResponse.redirect(new URL("/portaria/login", request.url));
      response.cookies.delete("aircheck_portaria");
      return response;
    }
  }

  // Protected: /dashboard, /onboarding, and /api/*
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding") || pathname.startsWith("/api/")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      const response = pathname.startsWith("/api/")
        ? NextResponse.json({ error: "Sessão expirada" }, { status: 401 })
        : NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/:path*", "/login", "/register", "/register/:path*", "/checkin/:path*", "/c/:path*", "/d/:path*", "/doc/:path*", "/reset-password/:path*", "/onboarding/:path*", "/portaria/:path*"],
};
