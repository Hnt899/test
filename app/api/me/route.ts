import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE, COOKIE_NAME } from "@/shared/config/env";

export async function GET() {
  try {
    const token = (await cookies()).get(COOKIE_NAME)?.value;

    if (!token) return NextResponse.json({ guest: true }, { status: 200 });

    // основной: /auth/me
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) return NextResponse.json(await res.json());

    // фолбэк для демо API (dummyjson-like)
    const alt = await fetch(`${API_BASE}/users/1`, { cache: "no-store" });
    if (alt.ok) return NextResponse.json(await alt.json());

    return NextResponse.json({ error: "ME not available" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "ME route error" }, { status: 500 });
  }
}
