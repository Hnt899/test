import { clientGet } from "./http";

/** Роль в API */
export type RoleApi = "admin" | "user";

/** Модель пользователя, с опциональными полями, которые используются в UI */
export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;

  // доп. поля, которые приходят из API/нужны в UI
  username?: string;
  birthDate?: string;      // ISO: yyyy-mm-dd
  image?: string;          // avatar url
  role?: RoleApi;          // <-- ключевое поле для смены роли
};

export type UsersResponse = {
  users: User[];
  total: number;
  skip?: number;
  limit?: number;
};

export async function fetchUsers(params?: { q?: string; limit?: number; skip?: number }) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.skip != null) qs.set("skip", String(params.skip));

  // search если есть q, иначе обычный список
  const path = params?.q
    ? `/users/search?${qs}`
    : (qs.toString() ? `/users?${qs}` : `/users`);
  return clientGet<UsersResponse>(path);
}

// ---- CRUD (тест-API симулирует изменения и возвращает успешный ответ) ----
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://test-api.live-server.xyz";

export async function createUser(payload: Omit<User, "id">) {
  const res = await fetch(`${API_BASE}/users/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Create failed");
  return (await res.json()) as User;
}

/**
 * Обновление пользователя.
 * Принимает любые частичные поля пользователя, включая role.
 */
export async function updateUser(id: number, payload: Partial<Omit<User, "id">>) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: "PUT", // у твоего тест-API PUT работает как PATCH
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Update failed");
  return (await res.json()) as User;
}

export async function deleteUser(id: number) {
  const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return true;
}
