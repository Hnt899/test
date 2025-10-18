import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE, COOKIE_NAME } from "@/shared/config/env";

export async function GET() {
  try {
    const token = (await cookies()).get(COOKIE_NAME)?.value;

    // Если не залогинен — возвращаем гостя (UI сам решит, что показать)
    if (!token) {
      return NextResponse.json({ guest: true }, { status: 200 });
    }

    // Основной путь: бэкенд должен уметь отдавать текущего юзера по токену
    const me = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (me.ok) return NextResponse.json(await me.json());

    // Фолбэк под dummyjson-like API
    const alt = await fetch(`${API_BASE}/users/1`, { cache: "no-store" });
    if (alt.ok) return NextResponse.json(await alt.json());

    return NextResponse.json({ error: "ME not available" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "ME route error" }, { status: 500 });
  }
}
