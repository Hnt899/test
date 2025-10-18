// shared/components/CommentsModal.tsx
"use client";

import Modal from "@/shared/components/Modal";
import { useComments } from "@/shared/hooks/useComments";

export default function CommentsModal({
  open,
  onClose,
  postId,
  title,
}: {
  open: boolean;
  onClose: () => void;
  postId: number;
  title: string;
}) {
  const { data, isLoading, isError } = useComments(open ? postId : null);

  // ожидаем, что fetchCommentsByPost возвращает { comments: Comment[] } или массив
  const comments = Array.isArray(data) ? data : (data?.comments ?? []);

  return (
    <Modal open={open} onClose={onClose} title={`Комментарии · ${title || `#${postId}`}`}>
      <div className="space-y-3">
        {isLoading && <div className="text-sub">Загрузка…</div>}
        {isError && <div className="text-danger">Не удалось загрузить комментарии</div>}
        {!isLoading && !isError && comments.length === 0 && (
          <div className="text-sub">Комментариев нет</div>
        )}

        {!isLoading && !isError && comments.length > 0 && (
          <div className="rounded-card border border-line">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th">Автор</th>
                  <th className="th">Email</th>
                  <th className="th">Текст</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c: any) => (
                  <tr key={c.id} className="tr">
                    <td className="td w-[220px]">
                      {/* поддержим разные форматы */}
                      {c.user?.fullName || c.user?.username || c.name || "—"}
                    </td>
                    <td className="td w-[220px]">
                      {c.user?.email || c.email || "—"}
                    </td>
                    <td className="td">{c.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button className="btn-ghost" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </Modal>
  );
}
