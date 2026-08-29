import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/dashboard", "/mensajes", "/atleta", "/club", "/cuenta"];

export function proxy(request: NextRequest) {
  const needsSession = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!needsSession) return NextResponse.next();

  const token = request.cookies.get("tp_session")?.value;
  const payload = token ? verifyToken(token) : null;
  if (payload?.type === "access") return NextResponse.next();

  const loginUrl = new URL("/", request.url);
  loginUrl.searchParams.set("login", "required");
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/mensajes/:path*",
    "/atleta/:path*",
    "/club/:path*",
    "/cuenta/:path*",
  ],
};
