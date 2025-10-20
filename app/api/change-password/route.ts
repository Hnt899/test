import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE, COOKIE_NAME } from "@/shared/config/env";
export async function POST(req: NextRequest) {
  try {
    const { current, next } = await req.json();
    const token = (await cookies()).get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // примерный эндпоинт
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || "Ошибка смены пароля" }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Change password error" }, { status: 500 });
  }
}
