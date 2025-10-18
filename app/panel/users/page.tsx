// app/panel/users/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useUsers, useUserMutations } from "@/shared/hooks/useUsers";
import UserFormModal from "@/shared/components/UserFormModal";
import ConfirmDialog from "@/shared/components/ConfirmDialog";
import type { User } from "@/shared/api-services/users";

const PAGE_SIZES = [5, 10, 20];

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const skip = (page - 1) * pageSize;
    return { q: q.trim() || undefined, limit: pageSize, skip };
  }, [q, page, pageSize]);

  const { data, isLoading, isError } = useUsers(params);
  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const { create, update, remove } = useUserMutations();

  // модалки
  const [openCreate, setOpenCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  return (
    <div className="page">
      {/* заголовок + action */}
      <div className="flex items-center justify-between">
        <h1>Пользователи</h1>
        <button className="btn-primary" onClick={() => setOpenCreate(true)}>
          + Создать
        </button>
      </div>

      {/* фильтры */}
      <div className="section flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Поиск по имени/почте…"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
        />
        <select
          className="select w-[140px]"
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
              <th className="th">Имя</th>
              <th className="th">Фамилия</th>
              <th className="th">Email</th>
              <th className="th">Телефон</th>
              <th className="th">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="td" colSpan={6}>Загрузка…</td></tr>
            )}
            {isError && (
              <tr><td className="td text-danger" colSpan={6}>Ошибка загрузки</td></tr>
            )}
            {!isLoading && !isError && users.length === 0 && (
              <tr><td className="td text-sub" colSpan={6}>Ничего не найдено</td></tr>
            )}

            {users.map((u) => (
              <tr key={u.id} className="tr">
                <td className="td">{u.id}</td>
                <td className="td">{u.firstName}</td>
                <td className="td">{u.lastName}</td>
                <td className="td">{u.email}</td>
                <td className="td">{u.phone ?? "—"}</td>
                <td className="td">
                  <div className="flex gap-2">
                    <button className="btn-ghost" onClick={() => setEditUser(u)}>Редактировать</button>
                    <button className="btn-danger" onClick={() => setDeleteUserId(u.id)}>Удалить</button>
                  </div>
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

      {/* модалки */}
      <UserFormModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        mode="create"
        loading={create.isPending}
        onSubmit={async (data) => {
          await create.mutateAsync(data);
          setOpenCreate(false);
        }}
      />

      <UserFormModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        mode="edit"
        initial={editUser ?? undefined}
        loading={update.isPending}
        onSubmit={async (data) => {
          if (!editUser) return;
          await update.mutateAsync({ id: editUser.id, data });
          setEditUser(null);
        }}
      />

      <ConfirmDialog
        open={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        title="Удалить пользователя?"
        text="Действие симулируется тестовым API, но мы обновим список."
        loading={remove.isPending}
        onConfirm={async () => {
          if (deleteUserId == null) return;
          await remove.mutateAsync(deleteUserId);
          setDeleteUserId(null);
        }}
      />
    </div>
  );
}
