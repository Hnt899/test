import type { User } from "@/shared/api-services/users";

export type UserLike = Partial<User> & {
  fullName?: string;
  name?: string;
  initials?: string;
};

export function formatUserName(user?: UserLike) {
  if (!user) return "Без имени";

  const first = user.firstName ?? "";
  const last = user.lastName ?? "";
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;

  const fullName = user.fullName?.trim();
  if (fullName) return fullName;

  const name = user.name?.trim();
  if (name) return name;

  const username = user.username?.trim();
  if (username) return username;

  return "Без имени";
}

export function userInitials(user?: UserLike) {
  if (!user) return "";

  const first = user.firstName ?? "";
  const last = user.lastName ?? "";
  const combined = `${first} ${last}`.trim();
  const source = combined || user.fullName || user.name || user.username || user.initials || "";
  const trimmed = source.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  const cleaned = trimmed.replace(/[^\p{L}\p{N}]/gu, "");
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2).toUpperCase();
  }
  if (cleaned.length === 1) {
    return cleaned.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}
