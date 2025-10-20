import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/shared/config/env";

export async function POST() {
  (await cookies()).set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
