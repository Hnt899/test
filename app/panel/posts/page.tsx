"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Search,
} from "lucide-react";

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

const SORT_FIELD_LABELS: Record<SortField, string> = {
  id: "ID",
  views: "Просмотры",
  likes: "Лайки",
  comments: "Комментарии",
};

function extractNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function getPostViews(post: Post) {
  return (
    extractNumber(post.views) ??
    extractNumber((post as any)["viewsCount"]) ??
    extractNumber((post as any)["viewCount"]) ??
    0
  );
}

function getPostLikes(post: Post) {
  if (typeof post.likes === "number") return post.likes;
  if (typeof (post as any).reactions === "number") return (post as any).reactions;
  if ((post as any).reactions && typeof (post as any).reactions === "object") {
    const reactionObj = (post as any).reactions as Record<string, unknown>;
    return (
      extractNumber(reactionObj.likes) ??
      extractNumber(reactionObj.total) ??
      extractNumber(reactionObj.upvotes) ??
      0
    );
  }
  return (
    extractNumber((post as any)["likesCount"]) ??
    extractNumber((post as any)["thumbsUp"]) ??
    0
  );
}

function getPostComments(post: Post) {
  return (
    extractNumber(post.comments) ??
    extractNumber(((post as any).reactions as Record<string, unknown> | undefined)?.comments) ??
    extractNumber((post as any)["commentsCount"]) ??
    extractNumber((post as any)["commentCount"]) ??
    extractNumber((post as any)["totalComments"]) ??
    0
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
  const userIds = useMemo(
    () => Array.from(new Set(posts.map((p) => p.userId).filter(Boolean))),
    [posts],
  );

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
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

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

  const { data, isLoading, isError, isFetching } = usePosts(params);
  const posts = useMemo(() => data?.posts ?? [], [data]);

  const lastTotalRef = useRef(0);
  useEffect(() => {
    if (typeof data?.total === "number" && data.total > 0) {
      lastTotalRef.current = data.total;
    }
  }, [data?.total]);

  const effectiveTotal = data?.total ?? lastTotalRef.current;
  const total = effectiveTotal;
  const pages = Math.max(1, Math.ceil(effectiveTotal / BASE_PAGE_SIZE));

  useEffect(() => {
    if (isFetching) return;
    setPage((prev) => (prev > pages ? pages : prev));
  }, [pages, isFetching]);

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
  const isRandomSort = !sort && randomSeed !== null;

  const handleChangePage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), pages));
    setShowMoreCount(0);
  };

  const resetToFirstPage = () => handleChangePage(1);

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
      return null; // сброс в случайный порядок
    });
  };

  // Закрывать мобильное меню сортировки при изменении сортировки/режима
  useEffect(() => {
    if (isSortMenuOpen) setIsSortMenuOpen(false);
  }, [sort, isRandomSort,]);

  return (
    <div className="page">
      <div className="flex flex-col gap-4">
        <div>
          <h1>Публикации</h1>
          <p className="mt-1 text-sm text-sub">Управление публикациями пользователей</p>
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

        {/* Мобильное меню сортировки */}
        <div className="md:hidden">
          <MobileSortMenu
            sort={sort}
            isRandom={isRandomSort}
            open={isSortMenuOpen}
            onOpenChange={setIsSortMenuOpen}
            onToggle={handleToggleSort}
          />
        </div>
      </div>

      {/* Таблица для ≥ md */}
      <div className="hidden md:block">
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
                    <td className="td text-right font-medium">{NUMBER_FORMAT.format(views)}</td>
                    <td className="td text-right font-medium">{NUMBER_FORMAT.format(likes)}</td>
                    <td className="td text-right font-medium">{NUMBER_FORMAT.format(comments)}</td>
                    <td className="td text-right">
                      <CommentsLink href={`/panel/posts/${post.id}/comments`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Мобильный список карточек */}
      <div className="md:hidden">
        <MobilePostsList posts={sortedPosts} authors={authors} isLoading={isLoading} isError={isError} />
      </div>

      {/* Пагинация */}
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

/* ===== Mobile UI ===== */

function MobileSortMenu({
  sort,
  isRandom,
  open,
  onOpenChange,
  onToggle,
}: {
  sort: SortState;
  isRandom: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (field: SortField) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fields: SortField[] = ["id", "views", "likes", "comments"];

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, onOpenChange]);

  const summary = sort
    ? `${SORT_FIELD_LABELS[sort.field]} ${sort.order === "desc" ? "↓" : "↑"}`
    : isRandom
      ? "Случайно"
      : "Без сортировки";

  return (
    <div className="mobile-sort" ref={containerRef}>
      <button
        type="button"
        className="mobile-sort__toggle"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
      >
        <div className="flex flex-col text-left">
          <span className="mobile-sort__label">Сортировать по</span>
          <span className="mobile-sort__value">{summary}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mobile-sort__panel">
          {fields.map((field) => {
            const active = sort?.field === field;
            const status = active
              ? sort?.order === "desc"
                ? "По убыванию"
                : "По возрастанию"
              : isRandom
                ? "Случайно"
                : "Выключено";

            const icon = active
              ? sort?.order === "desc"
                ? <ArrowDown className="h-4 w-4 text-brand" />
                : <ArrowUp className="h-4 w-4 text-brand" />
              : <ArrowUpDown className="h-4 w-4 text-sub" />;

            return (
              <button
                key={field}
                type="button"
                className={`mobile-sort__option${active ? " active" : ""}`}
                onClick={() => onToggle(field)}
              >
                <span className="mobile-sort__option-label">{SORT_FIELD_LABELS[field]}</span>
                <span className="mobile-sort__option-meta">
                  <span className="mobile-sort__option-status">{status}</span>
                  {icon}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobilePostsList({
  posts,
  authors,
  isLoading,
  isError,
}: {
  posts: Post[];
  authors: Record<number, User>;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) return <div className="mobile-posts-empty">Загрузка…</div>;
  if (isError)   return <div className="mobile-posts-empty text-danger">Ошибка загрузки</div>;
  if (posts.length === 0) return <div className="mobile-posts-empty text-sub">Ничего не найдено</div>;

  return (
    <div className="mobile-post-list">
      {posts.map((post) => {
        const author = authors[post.userId];
        return <MobilePostCard key={post.id} post={post} author={author} />;
      })}
    </div>
  );
}

function MobilePostCard({ post, author }: { post: Post; author?: User }) {
  const avatarUrl = typeof author?.image === "string" ? author.image : "";
  const fullName = formatUserName(author);
  const initials = userInitials(author) || (author ? author.firstName?.[0] ?? "" : "");

  const views = getPostViews(post);
  const likes = getPostLikes(post);
  const comments = getPostComments(post);

  return (
    <div className="mobile-post-card">
      <div className="mobile-post-card__header">
        <span className="mobile-post-card__id">{post.id}</span>
        <CommentsLink href={`/panel/posts/${post.id}/comments`} />
      </div>

      <div className="mobile-post-card__author">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={fullName} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="mobile-post-card__avatar-fallback">{initials || "?"}</div>
        )}
        <div className="mobile-post-card__author-name">{fullName}</div>
      </div>

      <div className="mobile-post-card__title line-clamp-2">{post.title}</div>

      <div className="mobile-post-card__metrics">
        <Metric icon={<Eye className="h-4 w-4" />} value={views} label="Просмотры" />
        <Metric icon={<Heart className="h-4 w-4" />} value={likes} label="Лайки" />
        <Metric icon={<MessageCircle className="h-4 w-4" />} value={comments} label="Комментарии" />
      </div>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="mobile-post-card__metric" aria-label={label} title={label}>
      {icon}
      <span>{NUMBER_FORMAT.format(value)}</span>
    </div>
  );
}

/* ===== Utils ===== */

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
