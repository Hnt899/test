"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import CommentsModal from "@/shared/components/CommentsModal";
import { usePosts } from "@/shared/hooks/usePosts";
import { fetchUserById, type User } from "@/shared/api-services/users";
import type { Post } from "@/shared/api-services/posts";

const PAGE_SIZES = [10, 20, 50];
const NUMBER_FORMAT = new Intl.NumberFormat("ru-RU");

type SortField = "id" | "title" | "views" | "likes" | "comments";
type SortState = { field: SortField; order: "asc" | "desc" } | null;

const SORT_API_FIELD: Record<SortField, string> = {
  id: "id",
  title: "title",
  views: "views",
  likes: "likes",
  comments: "comments",
};

function extractNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function getPostViews(post: Post) {
  return (
    extractNumber(post.views)
    ?? extractNumber(post["viewsCount"])
    ?? extractNumber(post["viewCount"])
    ?? 0
  );
}

function getPostLikes(post: Post) {
  if (typeof post.likes === "number") return post.likes;
  if (typeof post.reactions === "number") return post.reactions;
  if (post.reactions && typeof post.reactions === "object") {
    const reactionObj = post.reactions as Record<string, unknown>;
    return (
      extractNumber(reactionObj.likes)
      ?? extractNumber(reactionObj.total)
      ?? extractNumber(reactionObj.upvotes)
      ?? 0
    );
  }
  return (
    extractNumber(post["likesCount"])
    ?? extractNumber(post["thumbsUp"])
    ?? 0
  );
}

function getPostComments(post: Post) {
  return (
    extractNumber(post.comments)
    ?? extractNumber(post["commentsCount"])
    ?? extractNumber(post["commentCount"])
    ?? extractNumber(post["totalComments"])
    ?? 0
  );
}

function getSortValue(post: Post, field: SortField) {
  switch (field) {
    case "id":
      return post.id;
    case "title":
      return post.title.toLowerCase();
    case "views":
      return getPostViews(post);
    case "likes":
      return getPostLikes(post);
    case "comments":
      return getPostComments(post);
    default:
      return 0;
  }
}

function initialsFromUser(user?: User) {
  if (!user) return "";
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

function formatFullName(user?: User) {
  if (!user) return "Без имени";
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Без имени";
}

function useAuthorsMap(posts: Post[]) {
  const userIds = useMemo(() => Array.from(new Set(posts.map((p) => p.userId).filter(Boolean))), [posts]);

  const { data } = useQuery({
    queryKey: ["post-authors", userIds],
    queryFn: async () => {
      const entries = await Promise.all(
        userIds.map(async (id) => {
          const user = await fetchUserById(id);
          return [id, user] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<number, User>;
    },
    enabled: userIds.length > 0,
  });

  return data ?? ({} as Record<number, User>);
}

export default function PostsPage() {
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ field: "id", order: "asc" });
  const [openComments, setOpenComments] = useState<null | { postId: number; title: string }>(null);

  const params = useMemo(() => {
    const skip = (page - 1) * pageSize;
    return {
      q: q.trim() || undefined,
      limit: pageSize,
      skip,
      sortBy: sort ? SORT_API_FIELD[sort.field] : undefined,
      order: sort?.order,
    };
  }, [q, page, pageSize, sort]);

  const { data, isLoading, isError } = usePosts(params);
  const posts = useMemo(() => data?.posts ?? [], [data]);
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    if (!sort) return copy;
    const direction = sort.order === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      const aValue = getSortValue(a, sort.field);
      const bValue = getSortValue(b, sort.field);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * direction;
      }

      const aString = String(aValue ?? "");
      const bString = String(bValue ?? "");
      return aString.localeCompare(bString) * direction;
    });
    return copy;
  }, [posts, sort]);

  const authors = useAuthorsMap(sortedPosts);

  const handleToggleSort = (field: SortField) => {
    setPage(1);
    setSort((prev) => {
      if (prev?.field === field) {
        return { field, order: prev.order === "asc" ? "desc" : "asc" };
      }
      if (field === "title") {
        return { field, order: "asc" };
      }
      return { field, order: "desc" };
    });
  };

  return (
    <div className="page">
      <div className="flex items-center justify-between">
        <h1>Публикации</h1>
      </div>

      {/* фильтры */}
      <div className="section flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Поиск по заголовку/тексту"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
        />
        <select
          className="select w-[120px]"
          value={pageSize}
          onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
        >
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / стр.</option>)}
        </select>
      </div>

      {/* таблица */}
      <div className="table-wrap">
        <table className="table">
          <thead className="thead">
            <tr>
              <SortableHeader field="id" label="ID" sort={sort} onToggle={handleToggleSort} />
              <SortableHeader field="title" label="Пост" sort={sort} onToggle={handleToggleSort} />
              <th className="th">Автор</th>
              <SortableHeader
                field="views"
                label="Просмотры"
                sort={sort}
                onToggle={handleToggleSort}
                align="right"
              />
              <SortableHeader
                field="likes"
                label="Лайки"
                sort={sort}
                onToggle={handleToggleSort}
                align="right"
              />
              <SortableHeader
                field="comments"
                label="Комментарии"
                sort={sort}
                onToggle={handleToggleSort}
                align="right"
              />
              <th className="th text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="td" colSpan={7}>Загрузка…</td></tr>}
            {isError &&   <tr><td className="td text-danger" colSpan={7}>Ошибка загрузки</td></tr>}
            {!isLoading && !isError && sortedPosts.length === 0 && (
              <tr><td className="td text-sub" colSpan={7}>Ничего не найдено</td></tr>
            )}

            {sortedPosts.map((post) => {
              const author = authors[post.userId];
              const avatarUrl = (author?.image as string | undefined) || "";
              const fullName = formatFullName(author);
              const initials = initialsFromUser(author) || (author ? author.firstName?.[0] ?? "" : "");

              const views = getPostViews(post);
              const likes = getPostLikes(post);
              const comments = getPostComments(post);

              return (
                <tr key={post.id} className="tr">
                  <td className="td font-medium text-sub">#{post.id}</td>
                  <td className="td max-w-[360px]">
                    <div className="font-medium text-sm leading-5 text-ink line-clamp-2">{post.title}</div>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={fullName}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                          {initials || "?"}
                        </div>
                      )}
                      <div>
                        <div className="font-medium leading-tight">{fullName}</div>
                        <div className="text-xs text-sub">ID: {post.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td text-right font-medium">{NUMBER_FORMAT.format(views)}</td>
                  <td className="td text-right font-medium">{NUMBER_FORMAT.format(likes)}</td>
                  <td className="td text-right font-medium">{NUMBER_FORMAT.format(comments)}</td>
                  <td className="td text-right">
                    <button
                      className="btn-primary px-4 py-2 text-sm"
                      onClick={() => setOpenComments({ postId: post.id, title: post.title })}
                    >
                      Комментарии
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* пагинация */}
      <div className="flex items-center gap-2">
        <button
          className="btn-ghost disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          ←
        </button>
        <span className="text-sm text-sub">Стр. {page} из {pages}</span>
        <button
          className="btn-ghost disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          disabled={page >= pages}
        >
          →
        </button>
      </div>

      {/* модалка комментариев */}
      <CommentsModal
        open={!!openComments}
        onClose={() => setOpenComments(null)}
        postId={openComments?.postId ?? 0}
        title={openComments?.title ?? ""}
      />
    </div>
  );
}

function SortableHeader({
  field,
  label,
  sort,
  onToggle,
  align,
}: {
  field: SortField;
  label: string;
  sort: SortState;
  onToggle: (field: SortField) => void;
  align?: "right" | "left";
}) {
  const isActive = sort?.field === field;
  const order = sort?.order ?? "asc";
  const icon = !isActive
    ? <ArrowUpDown className="h-4 w-4 text-sub" />
    : order === "asc"
      ? <ArrowUp className="h-4 w-4 text-brand" />
      : <ArrowDown className="h-4 w-4 text-brand" />;

  const buttonClasses = [
    "flex w-full items-center gap-1 text-sm font-medium transition-colors",
    align === "right" ? "justify-end text-right" : "justify-start text-left",
    isActive ? "text-brand" : "text-sub hover:text-brand",
  ].join(" ");

  return (
    <th className={`th ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onToggle(field)}
        className={buttonClasses}
      >
        <span>{label}</span>
        {icon}
      </button>
    </th>
  );
}