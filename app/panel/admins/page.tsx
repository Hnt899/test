"use client";

import { useMemo, useState } from "react";
import { useAdmins, useAdminMutations } from "@/shared/hooks/useAdmins";
import AdminFormModal from "@/shared/components/AdminFormModal";
import ConfirmDialog from "@/shared/components/ConfirmDialog";
import type { Admin } from "@/shared/api-services/admins";

const PAGE_SIZES = [5, 10, 20];

export default function AdminsPage() {
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const skip = (page - 1) * pageSize;
    return { q: q.trim() || undefined, limit: pageSize, skip };
  }, [q, page, pageSize]);

  const { data, isLoading, isError } = useAdmins(params);
  const admins = data?.users ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const { create, update, remove } = useAdminMutations();

  // модалки
  const [openCreate, setOpenCreate] = useState(false);
  const [editItem, setEditItem] = useState<Admin | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Администраторы</h1>
        <button className="px-4 py-2 rounded bg-black text-white" onClick={() => setOpenCreate(true)}>
          + Создать
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="border rounded px-3 py-2"
          placeholder="Поиск по имени/почте…"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
        />
        <select
          className="border rounded px-2 py-2"
          value={pageSize}
          onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / стр.</option>)}
        </select>
      </div>

      <div className="rounded-xl border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Имя</th>
              <th className="text-left p-3">Фамилия</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-4">Загрузка…</td></tr>}
            {isError && <tr><td colSpan={5} className="p-4 text-red-600">Ошибка загрузки</td></tr>}
            {!isLoading && !isError && admins.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-gray-500">Ничего не найдено</td></tr>
            )}
            {admins.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.id}</td>
                <td className="p-3">{a.firstName}</td>
                <td className="p-3">{a.lastName}</td>
                <td className="p-3">{a.email}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="px-3 py-1 border rounded" onClick={() => setEditItem(a)}>Редактировать</button>
                    <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => setDeleteId(a.id)}>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* пагинация */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}>←</button>
        <span className="text-sm">Стр. {page} из {pages}</span>
        <button className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}>→</button>
      </div>

      {/* модалки */}
      <AdminFormModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        mode="create"
        loading={create.isPending}
        onSubmit={async (data) => {
          await create.mutateAsync(data);
          setOpenCreate(false);
        }}
      />

      <AdminFormModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        mode="edit"
        initial={editItem ?? undefined}
        loading={update.isPending}
        onSubmit={async (data) => {
          if (!editItem) return;
          await update.mutateAsync({ id: editItem.id, data });
          setEditItem(null);
        }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Удалить администратора?"
        text="Операция симулируется тестовым API, но мы обновим список."
        loading={remove.isPending}
        onConfirm={async () => {
          if (deleteId == null) return;
          await remove.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
