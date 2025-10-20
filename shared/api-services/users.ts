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

// ---- дополнительные данные для пользовательских таблиц ----

type UserPostsResponse = {
  posts: Post[];
  total?: number;
};

type UserCommentsResponse = {
  comments: Array<{ id: number }>;
  total?: number;
};

function extractNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function getPostLikes(post: Post) {
  if (typeof post.likes === "number") return post.likes;

  const reactions = post.reactions;
  if (typeof reactions === "number") return reactions;

  if (reactions && typeof reactions === "object") {
    const record = reactions as Record<string, unknown>;
    return (
      extractNumber(record.likes) ??
      extractNumber(record.total) ??
      extractNumber(record.upVotes) ??
      extractNumber(record.upvotes) ??
      0
    );
  }

  return (
    extractNumber((post as Record<string, unknown>)["likesCount"]) ??
    extractNumber((post as Record<string, unknown>)["thumbsUp"]) ??
    0
  );
}

function getPostComments(post: Post) {
  if (typeof post.comments === "number") return post.comments;

  const reactions = post.reactions;
  if (reactions && typeof reactions === "object") {
    const record = reactions as Record<string, unknown>;
    const fromReactions =
      extractNumber(record.comments) ??
      extractNumber(record.totalComments);
    if (fromReactions != null) return fromReactions;
  }

  return (
    extractNumber((post as Record<string, unknown>)["commentsCount"]) ??
    extractNumber((post as Record<string, unknown>)["commentCount"]) ??
    0
  );
}

export async function fetchUserStats(userId: number): Promise<UserStats> {
  const [postsRes, commentsRes] = await Promise.all([
    clientGet<UserPostsResponse>(`/users/${userId}/posts`),
    clientGet<UserCommentsResponse>(`/users/${userId}/comments`),
  ]);

  const posts = postsRes.posts ?? [];
  const likes = posts.reduce((sum, post) => sum + getPostLikes(post), 0);
  const commentsFromPosts = posts.reduce(
    (sum, post) => sum + getPostComments(post),
    0,
  );
  const directCommentsCount = commentsRes.comments?.length ?? 0;

  return {
    posts: postsRes.total ?? posts.length,
    likes,
    comments: commentsRes.total ?? Math.max(directCommentsCount, commentsFromPosts),
  };
}

export async function fetchUsersStats(ids: number[]) {
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
