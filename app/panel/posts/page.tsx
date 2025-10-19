"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import CommentsModal from "@/shared/components/CommentsModal";
import { usePosts } from "@/shared/hooks/usePosts";
import { fetchUserById, type User } from "@/shared/api-services/users";
import type { Post } from "@/shared/api-services/posts";

const PAGE_SIZES = [10, 20, 50];
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
  const [sort, setSort] = useState<SortState>(null);
  const [randomSeed, setRandomSeed] = useState<number | null>(null);
  const [openComments, setOpenComments] = useState<null | { postId: number; title: string }>(null);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pageSizeRef.current && !pageSizeRef.current.contains(event.target as Node)) {
        setIsPageSizeOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  useEffect(() => {
    setPage((prev) => Math.min(prev, pages));
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

  const handleToggleSort = (field: SortField) => {
    setPage(1);
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
      <div className="section flex flex-col gap-4">
        <div>
          <h1>Публикации</h1>
          <p className="mt-1 text-sm text-sub">Управление публикациями пользователей</p>
        </div>

        <input
          className="input max-w-md"
          placeholder="Поиск по публикациям"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
        />
      </div>

      {/* таблица */}
      <div className="table-wrap">
        <table className="table">
          <thead className="thead">
            <tr>
              <SortableHeader field="id" label="ID" sort={sort} onToggle={handleToggleSort} />
              <th className="th">Пост</th>
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
                    <CommentsLink
                      onClick={() => setOpenComments({ postId: post.id, title: post.title })}
                    />
                  </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* пагинация */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Pagination page={page} pages={pages} onChange={setPage} />

        <div className="relative" ref={pageSizeRef}>
          <button
            type="button"
            className="page-size-button"
            onClick={() => setIsPageSizeOpen((prev) => !prev)}
          >
            <span className="text-sub mr-2">Показывать на странице</span>
            <span className="text-base font-semibold text-ink">{pageSize}</span>
            <ChevronDown className="ml-1 h-4 w-4 text-brand" />
          </button>

          {isPageSizeOpen && (
            <div className="page-size-menu">
              {PAGE_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`page-size-option${size === pageSize ? " active" : ""}`}
                  onClick={() => {
                    setIsPageSizeOpen(false);
                    setPage(1);
                    setPageSize(size);
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
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

function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  const numbers = useMemo(() => buildPagination(page, pages), [page, pages]);

  return (
    <div className="pagination">
      <PaginationButton
        label="Предыдущая страница"
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
        icon="prev"
      />
      {numbers.map((n, index) => (
        typeof n === "number"
          ? (
            <PaginationButton
              key={n}
              active={n === page}
              onClick={() => onChange(n)}
            >
              {n}
            </PaginationButton>
          )
          : (
            <span key={`gap-${index}`} className="pagination-ellipsis">…</span>
          )
      ))}
      <PaginationButton
        label="Следующая страница"
        disabled={page >= pages}
        onClick={() => onChange(Math.min(pages, page + 1))}
        icon="next"
      />
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
      className={`pagination-button${active ? " active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      {content}
    </button>
  );
}

function buildPagination(current: number, total: number) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  pages.add(current);
  pages.add(current - 1);
  pages.add(current + 1);

  const sorted = Array.from(pages)
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const result: Array<number | "gap"> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const value = sorted[i];
    if (i > 0) {
      const prev = sorted[i - 1];
      if (value - prev > 1) {
        result.push("gap");
      }
    }
    result.push(value);
  }

  return result;
}

function CommentsLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="comments-link"
      onClick={onClick}
      aria-label="Открыть комментарии к публикации"
    >
      <ChevronRight className="h-5 w-5" />
    </button>
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
