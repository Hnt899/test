"use client";


import React, { useEffect, useMemo, useState } from "react";
import { CircleUserRound, X } from "lucide-react";
import Modal from "./Modal";
import type { Admin } from "@/shared/api-services/admins";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizeDateInput(value?: string) {
  if (!value) return "";
  const isoMatch = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}.${month}.${year}`;
  }
  const formattedMatch = /^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/.exec(value);
  if (formattedMatch) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const year = parsed.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

function toIsoDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const ruMatch = /^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/.exec(trimmed);
  if (ruMatch) {
    const [, day, month, year] = ruMatch;
    return `${year}-${month}-${day}`;
  }
  const isoMatch = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(trimmed);
  if (isoMatch) {
    return trimmed;
  }
  return trimmed;
}

export default function AdminFormModal({
  open,
  onClose,
  mode,
  initial,
  onSubmit,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: Partial<Admin>;
  loading?: boolean;
  onSubmit: (data: Omit<Admin, "id">) => Promise<void> | void;
}) {
  const [fullName, setFullName] = useState(composeFullName(initial));
  const [email, setEmail] = useState(initial?.email ?? "");
  const [birthDate, setBirthDate] = useState(normalizeDateInput(initial?.birthDate));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFullName(composeFullName(initial));
      setEmail(initial?.email ?? "");
      setBirthDate(normalizeDateInput(initial?.birthDate));
      setErrors({});
    }
  }, [open, initial]);

  const heading = useMemo(
    () => (mode === "create" ? "Добавление администратора" : "Редактирование администратора"),
    [mode],
  );

  function validate() {
    const trimmedEmail = email.trim();
    const parsedName = splitFullName(fullName);
    const e: Record<string, string> = {};

    if (!parsedName.lastName || !parsedName.firstName) {
      e.fullName = "Укажите ФИО полностью";
    }
    if (!trimmedEmail) {
      e.email = "Email обязателен";
    } else if (!isEmail(trimmedEmail)) {
      e.email = "Некорректный email";
    }

    return { errors: e, parsedName, trimmedEmail };
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const { errors: validationErrors, parsedName, trimmedEmail } = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    await onSubmit({
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      email: trimmedEmail,
      birthDate: toIsoDate(birthDate),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideHeader

      dialogClassName="card w-[420px] max-w-[calc(100vw-48px)] rounded-[32px] border-none shadow-2xl"
      contentClassName="p-10"

    >
      <div className="relative flex flex-col items-center text-center">
        <button
          type="button"
          onClick={onClose}

          className="absolute right-5 top-5 inline-flex h-6 w-6 items-center justify-center text-sub transition-colors hover:text-ink"
          aria-label="Закрыть модальное окно"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>

        <h2 className="text-[28px] font-semibold leading-tight text-ink">{heading}</h2>

        <div className="mt-7 flex h-24 w-24 items-center justify-center rounded-full bg-[#E5E7EB]">
          <CircleUserRound className="h-12 w-12 text-[#9CA3AF]" aria-hidden="true" />
        </div>

        <form className="mt-7 flex w-full flex-col gap-5 text-left" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-sub">ФИО</span>
            <input
              className="input h-12 rounded-xl text-sm font-medium"
              placeholder="Титова Тея Германовна"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            {errors.fullName && <span className="text-xs font-medium text-danger">{errors.fullName}</span>}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-sub">Email</span>
            <input
              type="email"
              className="input h-12 rounded-xl text-sm font-medium"
              placeholder="ivan@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email && <span className="text-xs font-medium text-danger">{errors.email}</span>}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-sub">Дата рождения</span>
            <input

              type="text"
              inputMode="numeric"
              placeholder="19.09.1990"

              className="input h-12 rounded-xl text-sm font-medium"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
            />
          </label>

          <button
            type="submit"

            className="mt-1 h-12 w-full rounded-full bg-blue-600 text-white text-sm font-semibold
             hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Сохраняем…" : "Сохранить"}
          </button>
        </form>
      </div>
    </Modal>
  );
}

function composeFullName(initial?: Partial<Admin>) {
  if (!initial) return "";
  const preferred = [initial.lastName, initial.firstName, initial.maidenName]
    .map((part) => part?.trim())
    .filter(Boolean);
  if (preferred.length > 0) {
    return preferred.join(" ");
  }
  const fallback = [initial.firstName, initial.lastName]
    .map((part) => part?.trim())
    .filter(Boolean);
  return fallback.join(" ");
}

function splitFullName(value: string) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    lastName: parts[0],
    firstName: parts.slice(1).join(" "),
  };
}
