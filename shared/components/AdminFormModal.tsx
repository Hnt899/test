"use client";

import React, { Fragment, useEffect, useMemo, useState } from "react";
import { CircleUserRound, X } from "lucide-react";
import Modal from "./Modal";
import type { Admin } from "@/shared/api-services/admins";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizeDateInput(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
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

  const headingLines = useMemo(
    () => (mode === "create" ? ["Добавить", "админа"] : ["Редактировать", "админа"]),
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
      birthDate: birthDate || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideHeader
      dialogClassName="card max-w-md rounded-[24px] border-none shadow-2xl"
      contentClassName="p-8"
    >
      <div className="relative flex flex-col items-center text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-sub transition-colors hover:text-ink"
          aria-label="Закрыть модальное окно"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-2xl font-semibold leading-tight text-ink">
          {headingLines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </h2>

        <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
          <CircleUserRound className="h-8 w-8 text-brand" aria-hidden="true" />
        </div>

        <form className="mt-6 flex w-full flex-col gap-4 text-left" onSubmit={handleSubmit}>
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
              type="date"
              className="input h-12 rounded-xl text-sm font-medium"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
            />
          </label>

          <button
            type="submit"
            className="btn-primary mt-2 h-12 w-full rounded-full text-sm font-semibold disabled:opacity-60"
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
