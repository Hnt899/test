"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  FileText,
  Heart,
  MessageCircle,
} from "lucide-react";

import UserFormModal from "@/shared/components/UserFormModal";
import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { useUsers, useUserMutations } from "@/shared/hooks/useUsers";
import {
  fetchUsersStats,
  type User,
  type UserStats,
} from "@/shared/api-services/users";
import { buildSlidingWindow } from "@/shared/lib/pagination";
import { formatUserName, userInitials } from "@/shared/lib/userDisplay";

const BASE_PAGE_SIZE = 10;
const NUMBER_FORMAT = new Intl.NumberFormat("ru-RU");

export default function UsersPage() {
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

  const { data, isLoading, isError, isFetching } = useUsers(params);
  const users = useMemo(() => data?.users ?? [], [data?.users]);

  // сохраняем последний валидный total, чтобы не дёргать пагинацию при фетчинге
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

  const { create, update, remove } = useUserMutations();

  const [openCreate, setOpenCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const handleChangePage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), pages));
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

  const userIds = useMemo(
    () => users.map((user) => user.id).filter((id): id is number => typeof id === "number"),
    [users],
  );

  const { data: statsMap } = useQuery({
    queryKey: ["user-stats", userIds],
    queryFn: () => fetchUsersStats(userIds),
    enabled: userIds.length > 0,
  });

  const statsById = statsMap ?? {};

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
            <h1>Пользователи</h1>
            <p className="mt-1 text-sm text-sub">Управление пользователями системы</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand/90"
            onClick={() => setOpenCreate(true)}
          >
            <PlusCircle className="h-5 w-5" />
            Добавить пользователя
          </button>
        </div>

        <div className="search-field relative w-full md:max-w-xl">
          <Search
            className="search-field__icon pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-sub"
            aria-hidden="true"
          />
          <input
            type="search"
            className="search-field__input h-12 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-ink placeholder:text-sub shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            placeholder="Поиск по пользователям"
            aria-label="Поиск по пользователям"
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Мобильные карточки */}
      <div className="md:hidden">
        <MobileUsersList
          users={users}
          statsById={statsById}
          isLoading={isLoading}
          isError={isError}
          onEdit={(user) => setEditUser(user)}
          onDelete={(user) => setDeleteUserId(user.id)}
        />
      </div>

      {/* Таблица на десктопе */}
      <div className="table-wrap hidden md:block">
        <table className="table">
          <thead className="thead">
            <tr>
              <th className="th">Пользователь</th>
              <th className="th">Email</th>
              <th className="th">Дата рождения</th>
              <th className="th">Пол</th>
              <th className="th text-right">Посты</th>
              <th className="th text-right">Лайки</th>
              <th className="th text-right">Комментарии</th>
              <th className="th">Роль</th>
              <th className="th text-right" aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="td" colSpan={9}>
                  Загрузка…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td className="td text-danger" colSpan={9}>
                  Ошибка загрузки
                </td>
              </tr>
            )}
            {!isLoading && !isError && users.length === 0 && (
              <tr>
                <td className="td text-sub" colSpan={9}>
                  Ничего не найдено
                </td>
              </tr>
            )}
            {users.map((user) => {
              const avatarUrl = typeof user.image === "string" ? user.image : "";
              const initials = userInitials(user) || formatUserName(user)[0] || "";
              const fullName = formatUserFullName(user);
              const birthDateLabel = formatBirthDate(user);
              const genderLabel = formatGender(user.gender);
              const roleLabel = formatRole(user.role);
              const stats = statsById[user.id];

              return (
                <tr key={user.id} className="tr">
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
                        <span className="text-sm font-semibold leading-tight text-ink">{fullName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="td align-middle">
                    {user.email ? (
                      <a
                        className="text-sm font-medium text-brand transition-colors hover:text-brand/80"
                        href={`mailto:${user.email}`}
                      >
                        {user.email}
                      </a>
                    ) : (
                      <span className="text-sm text-sub">—</span>
                    )}
                  </td>
                  <td className="td align-middle text-sm font-medium text-ink">{birthDateLabel}</td>
                  <td className="td align-middle text-sm font-medium text-ink">{genderLabel}</td>
                  <td className="td align-middle text-right text-sm font-semibold text-ink">
                    {formatStat(stats?.posts)}
                  </td>
                  <td className="td align-middle text-right text-sm font-semibold text-ink">
                    {formatStat(stats?.likes)}
                  </td>
                  <td className="td align-middle text-right text-sm font-semibold text-ink">
                    {formatStat(stats?.comments)}
                  </td>
                  <td className="td align-middle text-sm font-medium text-ink">
                    <RoleBadge role={user.role} label={roleLabel} />
                  </td>
                  <td className="td text-right align-middle">
                    <RowActions
                      onEdit={() => setEditUser(user)}
                      onDelete={() => setDeleteUserId(user.id)}
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

      <UserFormModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        mode="create"
        loading={create.isPending}
        onSubmit={async (formData) => {
          await create.mutateAsync(formData);
          setOpenCreate(false);
        }}
      />

      <UserFormModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        mode="edit"
        initial={editUser ?? undefined}
        loading={update.isPending}
        onSubmit={async (formData) => {
          if (!editUser) return;
          await update.mutateAsync({ id: editUser.id, data: formData });
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

/* ===== UI helpers ===== */

function RoleBadge({
  role,
  label,
}: {
  role?: string | null;
  label?: string;
}) {
  const { className, fallbackLabel } = getRoleStyle(role);
  const text = label ?? fallbackLabel;

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${className}`}
      title={text}
    >
      {text}
    </span>
  );
}

function ActivityStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;   // <— теперь принимаем ReactNode
  label: string;
  value: string;
}) {
  return (
    <div className="mobile-user-card__activity-item" aria-label={label} title={label}>
      <span className="mobile-user-card__activity-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="mobile-user-card__activity-value">{value}</span>
      <span className="mobile-user-card__activity-label">{label}</span>
    </div>
  );
}

/* ===== formatters ===== */

function formatUserFullName(user: User) {
  const parts = [user.lastName, user.firstName, user.maidenName]
    .map((part) => part?.trim())
    .filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  const fallback = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean);
  if (fallback.length > 0) {
    return fallback.join(" ");
  }
  return formatUserName(user);
}

function formatBirthDate(user: User) {
  if (!user.birthDate) return "—";
  const parsed = new Date(user.birthDate);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  const formatted = parsed.toLocaleDateString("ru-RU");
  const age = user.age ?? calculateAge(parsed);
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

function formatRole(role?: string | null) {
  return getRoleStyle(role).fallbackLabel;
}

function formatStat(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return NUMBER_FORMAT.format(0);
  return NUMBER_FORMAT.format(value);
}

function getRoleStyle(role?: string | null) {
  const normalized = role?.toLowerCase();

  if (normalized === "admin") {
    return {
      className: "bg-orange-500 text-white",
      fallbackLabel: "Администратор",
    };
  }

  if (normalized === "moderator") {
    return {
      className: "bg-blue-500 text-white",
      fallbackLabel: "Модератор",
    };
  }

  if (!normalized || normalized === "user" || normalized === "author") {
    return {
      className: "bg-gray-300 text-ink",
      fallbackLabel: "Автор",
    };
  }

  const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return {
    className: "bg-gray-300 text-ink",
    fallbackLabel: capitalized,
  };
}

/* ===== Pagination ===== */

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
        className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
      >
        <MoreHorizontal className="h-5 w-5 text-ink/70" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95"
        >
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-50"
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
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== Mobile list ===== */

function MobileUsersList({
  users,
  statsById,
  isLoading,
  isError,
  onEdit,
  onDelete,
}: {
  users: User[];
  statsById: Record<number, UserStats>;
  isLoading: boolean;
  isError: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  if (isLoading) return <div className="mobile-admins-empty">Загрузка…</div>;
  if (isError) return <div className="mobile-admins-empty text-danger">Ошибка загрузки</div>;
  if (users.length === 0) return <div className="mobile-admins-empty text-sub">Ничего не найдено</div>;

  return (
    <div className="mobile-user-list">
      {users.map((user) => {
        const avatarUrl = typeof user.image === "string" ? user.image : "";
        const initials = userInitials(user) || formatUserName(user)[0] || "";
        const fullName = formatUserFullName(user);
        const birthDateLabel = formatBirthDate(user);
        const genderLabel = formatGender(user.gender);
        const stats = statsById[user.id];
        const email = user.email?.trim();
        const roleLabel = formatRole(user.role);

        return (
          <div key={user.id} className="mobile-user-card">
            <div className="mobile-user-card__header">
              <div className="mobile-user-card__avatar">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={fullName}
                    width={48}
                    height={48}
                    className="mobile-user-card__avatar-image"
                  />
                ) : (
                  <div className="mobile-user-card__avatar-fallback">{initials || "?"}</div>
                )}
              </div>
              <RowActions
                onEdit={() => onEdit(user)}
                onDelete={() => onDelete(user)}
              />
            </div>

            <div className="mobile-user-card__name-row">
              <div className="mobile-user-card__name">{fullName}</div>
            </div>

            {/* Роль — только бейдж, без слова "Роль" слева */}
            <div className="mobile-user-card__role-row">
              <RoleBadge role={user.role} label={roleLabel} />
            </div>

            {email ? (
              <a href={`mailto:${email}`} className="mobile-user-card__email">
                {email}
              </a>
            ) : (
              <span className="mobile-user-card__email text-sub">—</span>
            )}

            <div className="mobile-user-card__meta">
              <div>
                <div className="mobile-user-card__meta-label">Дата рождения</div>
                <div className="mobile-user-card__meta-value">{birthDateLabel}</div>
              </div>
              <div>
                <div className="mobile-user-card__meta-label">Пол</div>
                <div className="mobile-user-card__meta-value">{genderLabel}</div>
              </div>
            </div>

            <div className="mobile-user-card__activity">
              <ActivityStat
                icon={<FileText className="h-4 w-4" />}
                label="Посты"
                value={formatStat(stats?.posts)}
              />
              <ActivityStat
                icon={<Heart className="h-4 w-4" />}
                label="Лайки"
                value={formatStat(stats?.likes)}
              />
              <ActivityStat
                icon={<MessageCircle className="h-4 w-4" />}
                label="Комментарии"
                value={formatStat(stats?.comments)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
