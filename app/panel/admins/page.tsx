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
  MoreVertical,
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
    (skip + BASE_PAGE_SIZE) < total;

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

        <div className="search-field">
          <Search className="search-field__icon" aria-hidden="true" />
          <span className="search-field__label">Поиск по администраторам</span>
          <input
            className="search-field__input"
            placeholder="По имени или email"
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
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
          <PaginationButton
            key={n}
            active={n === page}
            onClick={() => onChange(n)}
          >
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

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="actions-menu__wrapper" ref={containerRef}>
      <button
        type="button"
        className="actions-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreVertical className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div className="actions-menu" role="menu">
          <button
            type="button"
            className="actions-menu__item"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            role="menuitem"
          >
            <Pencil className="h-4 w-4" />
            <span>Редактировать</span>
          </button>
          <button
            type="button"
            className="actions-menu__item actions-menu__item--danger"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            role="menuitem"
          >
            <Trash2 className="h-4 w-4" />
            <span>Удалить</span>
          </button>
        </div>
      )}
    </div>
  );
}
