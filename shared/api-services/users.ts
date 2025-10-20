import { clientGet } from "./http";
import type { Post } from "./posts";

/** Роль в API */
export type RoleApi = "admin" | "user";

/** Модель пользователя, с опциональными полями, которые используются в UI */
export type User = {
  id: number;
  firstName: string;
  lastName: string;
  maidenName?: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;

  // доп. поля, которые приходят из API/нужны в UI
  username?: string;
  birthDate?: string;      // ISO: yyyy-mm-dd
  image?: string;          // avatar url
  role?: RoleApi;          // <-- ключевое поле для смены роли
};

export type UserStats = {
  posts: number;
  likes: number;
  comments: number;
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

export async function fetchUserById(id: number) {
  return clientGet<User>(`/users/${id}`);
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
    method: "PUT", // у тест-API PUT работает как PATCH
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

// ---- дополнительные данные для пользовательских таблиц ----

/** Ответы могут приходить как массивом, так и объектом с массивом+total */
type UserPostsResponse =
  | { posts?: Post[]; total?: number }
  | Post[];

type UserCommentsResponse =
  | { comments?: Array<{ id: number }>; total?: number }
  | Array<{ id: number }>;

/** безопасный number */
const num = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

/** достаём массив из ответа независимо от формы */
function asArray<T>(v: any, key: "posts" | "comments"): T[] {
  if (Array.isArray(v)) return v as T[];
  if (Array.isArray(v?.[key])) return v[key] as T[];
  return [];
}

/** Лайки из разных возможных схем поля reactions/likes */
function getPostLikes(post: Post) {
  if (typeof post.likes === "number") return post.likes;

  const r: any = (post as any).reactions;
  if (typeof r === "number") return r;
  if (r && typeof r === "object") {
    return num(r.likes) || num(r.total) || num(r.upVotes) || num(r.upvotes);
  }

  const p: any = post;
  return num(p.likesCount) || num(p.thumbsUp);
}

/** Комментарии из разных возможных схем */
function getPostComments(post: Post) {
  if (typeof post.comments === "number") return post.comments;

  const r: any = (post as any).reactions;
  const fromReactions = r && typeof r === "object"
    ? (num(r.comments) || num(r.totalComments))
    : 0;
  if (fromReactions) return fromReactions;

  const p: any = post;
  return num(p.commentsCount) || num(p.commentCount);
}

export async function fetchUserStats(userId: number): Promise<UserStats> {
  // Берём ограничение 100 — обычно хватает, и total тоже приходит
  const qs = new URLSearchParams({ limit: "100" });

  const [postsRes, commentsRes] = await Promise.all([
    clientGet<UserPostsResponse>(`/users/${userId}/posts?${qs}`),
    clientGet<UserCommentsResponse>(`/users/${userId}/comments?${qs}`),
  ]);

  const posts = asArray<Post>(postsRes, "posts");
  const postsTotal =
    (Array.isArray(postsRes) ? postsRes.length : num((postsRes as any)?.total)) || posts.length;

  const likesTotal = posts.reduce((acc, p) => acc + getPostLikes(p), 0);

  const commentsArr = asArray<{ id: number }>(commentsRes, "comments");
  const commentsTotal =
    (Array.isArray(commentsRes) ? commentsRes.length : num((commentsRes as any)?.total))
    || commentsArr.length
    || posts.reduce((acc, p) => acc + getPostComments(p), 0); // fallback

  return { posts: postsTotal, likes: likesTotal, comments: commentsTotal };
}

export async function fetchUsersStats(ids: number[]) {
  if (!ids.length) return {} as Record<number, UserStats>;

  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const stats = await fetchUserStats(id);
        return [id, stats] as const;
      } catch (error) {
        console.error("Failed to fetch stats for user", id, error);
        return [id, { posts: 0, likes: 0, comments: 0 }] as const;
      }
    }),
  );

  return Object.fromEntries(entries) as Record<number, UserStats>;
}
