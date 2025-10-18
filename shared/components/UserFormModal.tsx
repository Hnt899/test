"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { User } from "@/shared/api-services/users";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function UserFormModal({
  open,
  onClose,
  mode,          // "create" | "edit"
  initial,
  onSubmit,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: Partial<User>;
  loading?: boolean;
  onSubmit: (data: Omit<User, "id">) => Promise<void> | void;
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFirstName(initial?.firstName ?? "");
      setLastName(initial?.lastName ?? "");
      setEmail(initial?.email ?? "");
      setPhone(initial?.phone ?? "");
      setErrors({});
    }
  }, [open, initial]);

  const title = useMemo(() => (mode === "create" ? "Создать пользователя" : "Редактировать пользователя"), [mode]);

  function validate() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Имя обязательно";
    if (!lastName.trim()) e.lastName = "Фамилия обязательна";
    if (!email.trim()) e.email = "Email обязателен";
    else if (!isEmail(email)) e.email = "Некорректный email";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    await onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() });
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm mb-1">Имя</label>
          <input className="w-full border rounded px-3 py-2" value={firstName} onChange={e => setFirstName(e.target.value)} />
          {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Фамилия</label>
          <input className="w-full border rounded px-3 py-2" value={lastName} onChange={e => setLastName(e.target.value)} />
          {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Телефон (необязательно)</label>
          <input className="w-full border rounded px-3 py-2" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        <div className="pt-2 flex gap-2 justify-end">
          <button type="button" className="px-3 py-2 border rounded" onClick={onClose}>Отмена</button>
          <button disabled={loading} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
            {loading ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
