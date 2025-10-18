"use client";

import { useMemo, useState } from "react";
import { usePosts } from "@/shared/hooks/usePosts";
import CommentsModal from "@/shared/components/CommentsModal";

const PAGE_SIZES = [10, 20, 50];

export default function PostsPage() {
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [openComments, setOpenComments] = useState<null | { postId: number; title: string }>(null);

  const params = useMemo(() => {
    const skip = (page - 1) * pageSize;
    return { q: q.trim() || undefined, limit: pageSize, skip };
  }, [q, page, pageSize]);

  const { data, isLoading, isError } = usePosts(params);
  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

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
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / стр.</option>)}
        </select>
      </div>

      {/* таблица */}
      <div className="table-wrap">
        <table className="table">
          <thead className="thead">
            <tr>
              <th className="th">ID</th>
              <th className="th">Заголовок</th>
              <th className="th">Текст</th>
              <th className="th">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="td" colSpan={4}>Загрузка…</td></tr>}
            {isError &&   <tr><td className="td text-danger" colSpan={4}>Ошибка загрузки</td></tr>}
            {!isLoading && !isError && posts.length === 0 && (
              <tr><td className="td text-sub" colSpan={4}>Ничего не найдено</td></tr>
            )}

            {posts.map((p) => (
              <tr key={p.id} className="tr">
                <td className="td">{p.id}</td>
                <td className="td font-medium">{p.title}</td>
                <td className="td max-w-[900px]">
                  <div className="truncate">{p.body}</div>
                </td>
                <td className="td">
                  <button
                    className="btn-primary"
                    onClick={() => setOpenComments({ postId: p.id, title: p.title })}
                  >
                    Комментарии
                  </button>
                </td>
              </tr>
            ))}
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