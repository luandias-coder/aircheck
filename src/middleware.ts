import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_session";

// Public API routes that don't need auth
const PUBLIC_API = ["/api/checkin/", "/api/inbound-email", "/api/auth/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public pages
  if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/checkin/")) {
    return NextResponse.next();
  }

  // Public API routes
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protected: /dashboard and /api/*
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/")) {
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
      // Invalid token
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
  matcher: ["/dashboard/:path*", "/api/:path*", "/login", "/register", "/checkin/:path*"],
};
