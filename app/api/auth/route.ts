import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE, COOKIE_NAME } from "@/shared/config/env";

async function tryLogin(payload: any) {
  return fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // 1) пробуем как username/password (dummyjson-совместимо)
    let res = await tryLogin({ username, password });

    // 2) если 401 — пробуем как email/password
    if (res.status === 401) {
      res = await tryLogin({ email: username, password });
    }

    // 3) если всё ещё не ок — при DEV-режиме кладём тестовый токен и идём дальше
    if (!res.ok) {
      if (process.env.NEXT_PUBLIC_DEV_LOGIN === "1") {
        const cookieStore = await cookies();
        cookieStore.set({
          name: COOKIE_NAME,
          value: "dev-token",
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24,
        });
        return NextResponse.json({ ok: true, dev: true });
      }
      const text = await res.text();
      return NextResponse.json({ error: text || "Invalid credentials" }, { status: 401 });
    }

    // 4) получили токен с сервера
    const data = await res.json();
    const token = data?.token;
    if (!token) return NextResponse.json({ error: "No token received" }, { status: 500 });

    const cookieStore = await cookies();
    cookieStore.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }
}
