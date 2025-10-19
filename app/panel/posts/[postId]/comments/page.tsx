"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { useComments } from "@/shared/hooks/useComments";
import { fetchPostById } from "@/shared/api-services/posts";
import type { Comment } from "@/shared/api-services/comments";
import { fetchUserById, type User } from "@/shared/api-services/users";
import { formatUserName, userInitials, type UserLike } from "@/shared/lib/userDisplay";
import { buildSlidingWindow } from "@/shared/lib/pagination";

const BASE_PAGE_SIZE = 10;

type ExtendedComment = Comment & {
  user?: Comment["user"] & {
    image?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
  };
};

export default function PostCommentsPage() {
  const params = useParams<{ postId?: string }>();
  const postIdParam = Array.isArray(params?.postId) ? params?.postId[0] : params?.postId;
  const postId = Number(postIdParam);
  const hasValidPostId = Number.isFinite(postId) && postId > 0;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showMoreCount, setShowMoreCount] = useState(0);

  const { data: postData } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
    enabled: hasValidPostId,
  });

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    isError: isCommentsError,
  } = useComments(hasValidPostId ? postId : null);

  const comments = useMemo(() => {
    const raw = Array.isArray(commentsData)
      ? commentsData
      : commentsData?.comments ?? [];
    return raw as ExtendedComment[];
  }, [commentsData]);

  const filteredComments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return comments;
    return comments.filter((comment) => {
      const body = comment.body?.toLowerCase?.() ?? String(comment.body ?? "").toLowerCase();
      const user = comment.user;
      const userName = user?.fullName || (user as any)?.name || user?.username || "";
      return body.includes(term) || userName.toLowerCase().includes(term);
    });
  }, [comments, search]);

  const total = filteredComments.length;
  const pages = Math.max(1, Math.ceil(total / BASE_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
    setShowMoreCount(0);
  }, [search, postId]);

  useEffect(() => {
    setPage((prev) => {
      const next = Math.min(prev, pages);
      if (next !== prev) {
        setShowMoreCount(0);
      }
      return next;
    });
  }, [pages]);

  const skip = (page - 1) * BASE_PAGE_SIZE;
  const limit = BASE_PAGE_SIZE + showMoreCount;
  const visibleComments = filteredComments.slice(skip, skip + limit);

  const authors = useCommentAuthorsMap(filteredComments);

  const handleChangePage = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), pages);
    if (clamped === page) return;
    setPage(clamped);
    setShowMoreCount(0);
  };

  const postTitle = postData?.title ?? (hasValidPostId ? `Публикация #${postId}` : "Публикация");

  return (
    <div className="page">
      <div className="flex flex-col gap-6">
        <Link
          href="/panel/posts"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-brand/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к списку публикаций
        </Link>

        <div className="space-y-2">
          <h1>Комментарии к посту</h1>
          <p className="text-lg font-semibold text-ink">{postTitle}</p>
        </div>

        <input
          className="input max-w-xl"
          placeholder="Поиск по комментариям"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="table-wrap mt-8">
        <table className="table">
          <thead className="thead">
            <tr>
              <th className="th">Комментарий</th>
              <th className="th w-[320px]">Автор</th>
            </tr>
          </thead>
          <tbody>
            {isCommentsLoading && (
              <tr>
                <td className="td" colSpan={2}>Загрузка…</td>
              </tr>
            )}
            {isCommentsError && (
              <tr>
                <td className="td text-danger" colSpan={2}>Не удалось загрузить комментарии</td>
              </tr>
            )}
            {!isCommentsLoading && !isCommentsError && visibleComments.length === 0 && (
              <tr>
                <td className="td text-sub" colSpan={2}>Комментариев нет</td>
              </tr>
            )}

            {visibleComments.map((comment) => {
              const userId = typeof comment.user?.id === "number" ? comment.user?.id : undefined;
              const fetchedUser = userId ? authors[userId] : undefined;
              const fallbackUser = comment.user as UserLike | undefined;
              const displayUser: UserLike | undefined = fetchedUser ?? fallbackUser;
              const avatarUrl = displayUser && typeof displayUser.image === "string" ? displayUser.image : "";
              const fullName = formatUserName(displayUser);
              const initials = userInitials(displayUser) || "?";

              return (
                <tr key={comment.id} className="tr align-top">
                  <td className="td align-top">
                    <p className="text-sm leading-5 text-ink">{comment.body}</p>
                  </td>
                  <td className="td align-top">
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
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="font-medium leading-tight text-ink">{fullName}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex justify-start">
          {!isCommentsLoading
            && !isCommentsError
            && showMoreCount === 0
            && (skip + BASE_PAGE_SIZE) < total && (
              <button
                type="button"
                className="show-more-button"
                onClick={() => {
                  const remaining = Math.max(0, total - (skip + BASE_PAGE_SIZE));
                  if (remaining <= 0) return;
                  const increment = Math.min(BASE_PAGE_SIZE, remaining);
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
        <PaginationButton
          label="Предыдущая страница"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          icon="prev"
        />
        {numbers.map((number) => (
          <PaginationButton
            key={number}
            active={number === page}
            onClick={() => onChange(number)}
          >
            {number}
          </PaginationButton>
        ))}
        <PaginationButton
          label="Следующая страница"
          disabled={page >= pages}
          onClick={() => onChange(Math.min(pages, page + 1))}
          icon="next"
        />
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

function useCommentAuthorsMap(comments: ExtendedComment[]) {
  const userIds = useMemo(
    () => Array.from(
      new Set(
        comments
          .map((comment) => comment.user?.id)
          .filter((id): id is number => typeof id === "number"),
      ),
    ),
    [comments],
  );

  const { data } = useQuery({
    queryKey: ["comment-authors", userIds],
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
