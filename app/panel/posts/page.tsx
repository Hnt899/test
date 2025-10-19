"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { usePosts } from "@/shared/hooks/usePosts";
import { fetchUserById, type User } from "@/shared/api-services/users";
import type { Post } from "@/shared/api-services/posts";
import { formatUserName, userInitials } from "@/shared/lib/userDisplay";
import { buildSlidingWindow } from "@/shared/lib/pagination";

const BASE_PAGE_SIZE = 10;
const NUMBER_FORMAT = new Intl.NumberFormat("ru-RU");

type SortField = "id" | "views" | "likes" | "comments";
type SortState = { field: SortField; order: "asc" | "desc" } | null;

const SORT_API_FIELD: Record<SortField, string> = {
  id: "id",
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
    ?? extractNumber((post.reactions as Record<string, unknown> | undefined)?.comments)
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
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>(null);
  const [randomSeed, setRandomSeed] = useState<number | null>(null);
  const [showMoreCount, setShowMoreCount] = useState(0);

  const skip = (page - 1) * BASE_PAGE_SIZE;
  const limit = BASE_PAGE_SIZE + showMoreCount;

  const params = useMemo(() => {
    return {
      q: q.trim() || undefined,
      limit,
      skip,
      sortBy: sort ? SORT_API_FIELD[sort.field] : undefined,
      order: sort?.order,
    };
  }, [q, limit, skip, sort]);

  const { data, isLoading, isError } = usePosts(params);
  const posts = useMemo(() => data?.posts ?? [], [data]);
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / BASE_PAGE_SIZE));

  useEffect(() => {
    setPage((prev) => {
      const next = Math.min(prev, pages);
      if (next !== prev) {
        setShowMoreCount(0);
      }
      return next;
    });
  }, [pages]);

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    if (!sort) {
      if (!randomSeed) return copy;
      return shuffleWithSeed(copy, randomSeed);
    }
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
  }, [posts, sort, randomSeed]);

  const authors = useAuthorsMap(sortedPosts);

  const handleChangePage = (nextPage: number, force = false) => {
    const clamped = Math.min(Math.max(nextPage, 1), pages);
    if (!force && clamped === page) return;
    setPage(clamped);
    setShowMoreCount(0);
  };

  const resetToFirstPage = () => handleChangePage(1, true);

  const handleToggleSort = (field: SortField) => {
    resetToFirstPage();
    setSort((prev) => {
      if (!prev || prev.field !== field) {
        setRandomSeed(null);
        return { field, order: "desc" };
      }
      if (prev.order === "desc") {
        setRandomSeed(null);
        return { field, order: "asc" };
      }
      const newSeed = Math.floor(Math.random() * 0xffffffff) || 1;
      setRandomSeed(newSeed);
      return null;
    });
  };

  return (
    <div className="page">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">Публикации</h1>
          <p className="mt-1 text-sm font-semibold text-sub">Управление публикациями пользователей</p>
        </div>

        {/* Поле поиска с иконкой */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sub" />
          <input
            className="input pl-10 w-full"
            placeholder="Поиск по публикациям"
            value={q}
            onChange={(e) => {
              resetToFirstPage();
              setQ(e.target.value);
            }}
          />
        </div>
      </div>

      {/* таблица */}
      <div className="table-wrap">
        <table className="table">
          <thead className="thead">
            <tr>
              <SortableHeader field="id" label="ID" sort={sort} onToggle={handleToggleSort} />
              <th className="th">Пост</th>
              <th className="th">Автор</th>
              <SortableHeader field="views" label="Просмотры" sort={sort} onToggle={handleToggleSort} align="right" />
              <SortableHeader field="likes" label="Лайки" sort={sort} onToggle={handleToggleSort} align="right" />
              <SortableHeader field="comments" label="Комментарии" sort={sort} onToggle={handleToggleSort} align="right" />
              <th className="th text-right" aria-label="Комментарий переход" />
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
              const avatarUrl = typeof author?.image === "string" ? author.image : "";
              const fullName = formatUserName(author);
              const initials = userInitials(author) || (author ? author.firstName?.[0] ?? "" : "");

              return (
                <tr key={post.id} className="tr">
                  <td className="td font-medium text-sub">#{post.id}</td>
                  <td className="td max-w-[360px]">
                    <div className="font-medium text-sm leading-5 text-ink line-clamp-2">{post.title}</div>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={fullName} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                          {initials || "?"}
                        </div>
                      )}
                      <div>
                        <div className="font-medium leading-tight">{fullName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td text-right font-medium">{NUMBER_FORMAT.format(getPostViews(post))}</td>
                  <td className="td text-right font-medium">{NUMBER_FORMAT.format(getPostLikes(post))}</td>
                  <td className="td text-right font-medium">{NUMBER_FORMAT.format(getPostComments(post))}</td>
                  <td className="td text-right">
                    <CommentsLink href={`/panel/posts/${post.id}/comments`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* пагинация */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex justify-start">
          {!isLoading && !isError && showMoreCount === 0 && (skip + BASE_PAGE_SIZE) < total && (
            <button
              type="button"
              className="show-more-button"
              onClick={() => {
                const available = Math.max(0, total - (skip + BASE_PAGE_SIZE));
                if (available <= 0) return;
                const increment = Math.min(BASE_PAGE_SIZE, available);
                setShowMoreCount(increment);
              }}
            >
              Показать ещё <span className="show-more-button__number">10</span>
            </button>
          )}
        </div>

        <Pagination page={page} pages={pages} onChange={handleChangePage} />
      </div>
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

  return (
    <th className={`th ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onToggle(field)}
        className={`flex w-full items-center gap-1 text-sm font-medium transition-colors ${align === "right" ? "justify-end" : "justify-start"} ${isActive ? "text-brand" : "text-sub hover:text-brand"}`}
      >
        <span>{label}</span>
        {icon}
      </button>
    </th>
  );
}

function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  const numbers = useMemo(() => buildSlidingWindow(page, pages), [page, pages]);

  return (
    <div className="pagination">
      <div className="pagination-group divide-x-2 divide-brand">
        <PaginationButton label="Предыдущая страница" disabled={page <= 1} onClick={() => onChange(Math.max(1, page - 1))} icon="prev" />
        {numbers.map((n) => (
          <PaginationButton key={n} active={n === page} onClick={() => onChange(n)}>
            {n}
          </PaginationButton>
        ))}
        <PaginationButton label="Следующая страница" disabled={page >= pages} onClick={() => onChange(Math.min(pages, page + 1))} icon="next" />
      </div>
    </div>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
  active,
  icon,
  label,
}: {
  children?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  icon?: "prev" | "next";
  label?: string;
}) {
  const content = icon === "prev"
    ? <ChevronLeft className="h-4 w-4" aria-hidden="true" />
    : icon === "next"
      ? <ChevronRight className="h-4 w-4" aria-hidden="true" />
      : children;

  return (
    <button
      type="button"
      className={`pagination-button${active ? " active" : ""}${disabled ? " disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      {content}
    </button>
  );
}

function CommentsLink({ href }: { href: string }) {
  return (
    <Link href={href} className="comments-link" aria-label="Открыть комментарии к публикации">
      <ChevronRight className="h-5 w-5" />
    </Link>
  );
}

function shuffleWithSeed<T>(array: T[], seed: number) {
  let currentIndex = array.length;
  const result = [...array];
  const random = mulberry32(seed);

  while (currentIndex > 0) {
    const randomIndex = Math.floor(random() * currentIndex);
    currentIndex -= 1;
    [result[currentIndex], result[randomIndex]] = [result[randomIndex], result[currentIndex]];
  }

  return result;
}

function mulberry32(a: number) {
  let t = a + 0x6D2B79F5;
  return function random() {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
