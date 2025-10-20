const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://test-api.live-server.xyz";

export async function changePassword(payload: { oldPassword: string; newPassword: string }) {
  // тестовый вызов: симулируем смену пароля через PUT /users/1
  const res = await fetch(`${API_BASE}/users/1`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: payload.newPassword }),
  });
  if (!res.ok) throw new Error("Change password failed");
  return await res.json();
}
