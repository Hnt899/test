"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { useAdmins, useAdminMutations } from "@/shared/hooks/useAdmins";
import AdminFormModal from "@/shared/components/AdminFormModal";
import ConfirmDialog from "@/shared/components/ConfirmDialog";
import type { Admin } from "@/shared/api-services/admins";
import { buildSlidingWindow } from "@/shared/lib/pagination";
import { userInitials } from "@/shared/lib/userDisplay";

const BASE_PAGE_SIZE = 10;

export default function AdminsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [showMoreCount, setShowMoreCount] = useState(0);

  const skip = (page - 1) * BASE_PAGE_SIZE;
  const limit = BASE_PAGE_SIZE + showMoreCount;

  const params = useMemo(() => {
    return {
      q: q.trim() || undefined,
      limit,
      skip,
    };
  }, [q, limit, skip]);

  const { data, isLoading, isError } = useAdmins(params);
  const admins = data?.users ?? [];
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

  const { create, update, remove } = useAdminMutations();

  const [openCreate, setOpenCreate] = useState(false);
  const [editItem, setEditItem] = useState<Admin | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleChangePage = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), pages);
    if (clamped === page) return;
    setPage(clamped);
    setShowMoreCount(0);
  };

  const handleSearchChange = (value: string) => {
    setQ(value);
    setPage(1);
    setShowMoreCount(0);
  };

  const handleShowMore = () => {
    const remaining = Math.max(0, total - (skip + BASE_PAGE_SIZE));
    if (remaining <= 0) return;
    const increment = Math.min(BASE_PAGE_SIZE, remaining);
    setShowMoreCount(increment);
  };

  const showShowMoreButton =
    !isLoading &&
    !isError &&
    showMoreCount === 0 &&
    skip + BASE_PAGE_SIZE < total;

  return (
    <div className="page">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1>Администраторы</h1>
            <p className="mt-1 text-sm text-sub">Управление администраторами системы</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand/90"
            onClick={() => setOpenCreate(true)}
          >
            <PlusCircle className="h-5 w-5" />
            Создать администратора
          </button>
        </div>

        <div className="search-field relative w-full md:max-w-xl">
        <Search className="search-field__icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-sub" aria-hidden="true" />
        <input
        type="search"
        className="search-field__input w-full h-12 rounded-full border border-slate-200 bg-white pl-10 pr-4
               text-sm text-ink placeholder:text-sub shadow-sm
               focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
        placeholder="Поиск по администраторам"
        aria-label="Поиск по администраторам"
        value={q}
        onChange={(e) => handleSearchChange(e.target.value)}
           />
         </div>

      </div>

      <div className="md:hidden">
        <MobileAdminsList
          admins={admins}
          isLoading={isLoading}
          isError={isError}
          onEdit={(admin) => setEditItem(admin)}
          onDelete={(admin) => setDeleteId(admin.id)}
        />
      </div>

      <div className="table-wrap hidden md:block">
        <table className="table">
          <thead className="thead">
            <tr>
              <th className="th">Администратор</th>
              <th className="th">Email</th>
              <th className="th">Дата рождения</th>
              <th className="th">Пол</th>
              <th className="th text-right" aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="td" colSpan={5}>
                  Загрузка…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td className="td text-danger" colSpan={5}>
                  Ошибка загрузки
                </td>
              </tr>
            )}
            {!isLoading && !isError && admins.length === 0 && (
              <tr>
                <td className="td text-sub" colSpan={5}>
                  Ничего не найдено
                </td>
              </tr>
            )}
            {admins.map((admin) => {
              const avatarUrl = typeof admin.image === "string" ? admin.image : "";
              const initials = userInitials(admin) || (admin.firstName?.[0] ?? "");
              const fullName = formatAdminFullName(admin);
              const birthDateLabel = formatBirthDate(admin);
              const genderLabel = formatGender(admin.gender);

              return (
                <tr key={admin.id} className="tr">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={fullName}
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                          {initials || "?"}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-ink leading-tight">{fullName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="td align-middle">
                    <a
                      className="text-sm font-medium text-brand transition-colors hover:text-brand/80"
                      href={`mailto:${admin.email}`}
                    >
                      {admin.email}
                    </a>
                  </td>
                  <td className="td align-middle text-sm font-medium text-ink">{birthDateLabel}</td>
                  <td className="td align-middle text-sm font-medium text-ink">{genderLabel}</td>
                  <td className="td text-right align-middle">
                    <RowActions
                      onEdit={() => setEditItem(admin)}
                      onDelete={() => setDeleteId(admin.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex justify-start">
          {showShowMoreButton && (
            <button type="button" className="show-more-button" onClick={handleShowMore}>
              Показать ещё <span className="show-more-button__number">10</span>
            </button>
          )}
        </div>
        <Pagination page={page} pages={pages} onChange={handleChangePage} />
      </div>

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

function formatAdminFullName(admin: Admin) {
  const parts = [admin.lastName, admin.firstName, admin.maidenName]
    .map((part) => part?.trim())
    .filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  const fallback = [admin.firstName, admin.lastName]
    .map((part) => part?.trim())
    .filter(Boolean);
  if (fallback.length > 0) {
    return fallback.join(" ");
  }
  return "Без имени";
}

function formatBirthDate(admin: Admin) {
  if (!admin.birthDate) return "—";
  const parsed = new Date(admin.birthDate);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  const formatted = parsed.toLocaleDateString("ru-RU");
  const age = admin.age ?? calculateAge(parsed);
  if (age == null) return formatted;
  return `${formatted} (${age} ${pluralYears(age)})`;
}

function calculateAge(date: Date) {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function pluralYears(age: number) {
  const mod10 = age % 10;
  const mod100 = age % 100;
  if (mod10 === 1 && mod100 !== 11) return "год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "года";
  return "лет";
}

function formatGender(gender?: string) {
  if (!gender) return "—";
  const value = gender.toLowerCase();
  if (value === "male") return "Мужской";
  if (value === "female") return "Женский";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function MobileAdminsList({
  admins,
  isLoading,
  isError,
  onEdit,
  onDelete,
}: {
  admins: Admin[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (admin: Admin) => void;
  onDelete: (admin: Admin) => void;
}) {
  if (isLoading) return <div className="mobile-admins-empty">Загрузка…</div>;
  if (isError) return <div className="mobile-admins-empty text-danger">Ошибка загрузки</div>;
  if (admins.length === 0) return <div className="mobile-admins-empty text-sub">Ничего не найдено</div>;

  return (
    <div className="mobile-admin-list">
      {admins.map((admin) => {
        const avatarUrl = typeof admin.image === "string" ? admin.image : "";
        const initials = userInitials(admin) || (admin.firstName?.[0] ?? "");
        const fullName = formatAdminFullName(admin);
        const birthDateLabel = formatBirthDate(admin);
        const genderLabel = formatGender(admin.gender);
        const email = admin.email?.trim();

        return (
          <div key={admin.id} className="mobile-admin-card">
            <div className="mobile-admin-card__header">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName}
                  width={48}
                  height={48}
                  className="mobile-admin-card__avatar-image"
                />
              ) : (
                <div className="mobile-admin-card__avatar-fallback">{initials || "?"}</div>
              )}
              <RowActions
                onEdit={() => onEdit(admin)}
                onDelete={() => onDelete(admin)}
              />
            </div>

            <div className="mobile-admin-card__name">{fullName}</div>

            {email ? (
              <a
                href={`mailto:${email}`}
                className="mobile-admin-card__email"
              >
                {email}
              </a>
            ) : (
              <span className="mobile-admin-card__email text-sub">—</span>
            )}

            <div className="mobile-admin-card__meta">
              <div>
                <div className="mobile-admin-card__meta-label">Дата рождения</div>
                <div className="mobile-admin-card__meta-value">{birthDateLabel}</div>
              </div>
              <div>
                <div className="mobile-admin-card__meta-label">Пол</div>
                <div className="mobile-admin-card__meta-value">{genderLabel}</div>
              </div>
            </div>
          </div>
        );
      })}
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
        {numbers.map((n) => (
          <PaginationButton key={n} active={n === page} onClick={() => onChange(n)}>
            {n}
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
  const content =
    icon === "prev" ? (
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
    ) : icon === "next" ? (
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    ) : (
      children
    );

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
function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Действия"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full
                   hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
      >
        <MoreHorizontal className="h-5 w-5 text-ink/70" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200
                     bg-white p-1 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95"
        >
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm
                       text-ink hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Редактировать
          </button>

          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm
                       text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}

