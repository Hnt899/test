import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/shared/config/env";

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/panel")) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/panel/:path*"] };
