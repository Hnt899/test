import { clientGet } from "./http";

export type Admin = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export type AdminsResponse = {
  users: Admin[]; // используем users-эндпоинты тестового API как "админов"
  total: number;
  skip?: number;
  limit?: number;
};

// список / поиск
export async function fetchAdmins(params?: { q?: string; limit?: number; skip?: number }) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.skip != null) qs.set("skip", String(params.skip));

  const path = params?.q
    ? `/users/search?${qs}`   // тестовый API
    : (qs.toString() ? `/users?${qs}` : `/users`);
  return clientGet<AdminsResponse>(path);
}

// CRUD (симуляция через test-api)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://test-api.live-server.xyz";

export async function createAdmin(payload: Omit<Admin, "id">) {
  const res = await fetch(`${API_BASE}/users/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Create admin failed");
  return (await res.json()) as Admin;
}

export async function updateAdmin(id: number, data: Partial<Omit<Admin, "id">>) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update admin failed");
  return (await res.json()) as Admin;
}

export async function deleteAdmin(id: number) {
  const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete admin failed");
  return true;
}
