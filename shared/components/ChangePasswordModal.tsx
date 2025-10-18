"use client";

import { useState } from "react";

export default function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const form = e.currentTarget;
    const current = (form.elements.namedItem("current") as HTMLInputElement).value;
    const next = (form.elements.namedItem("next") as HTMLInputElement).value;

    if (next.length < 6) {
      setErr("Пароль должен быть не короче 6 символов.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось изменить пароль");
      }
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* затемнение */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* модальное окно */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <form
          onSubmit={onSubmit}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-[#E6EAF2] p-6 sm:p-8"
        >
          {/* крестик */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute right-3 top-3 h-9 w-9 grid place-items-center rounded-full hover:bg-black/5"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>

          {/* заголовок */}
          <h3 className="text-center text-[22px] sm:text-2xl font-semibold mb-6">
            Изменение пароля
          </h3>

          {/* поля */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Текущий пароль</label>
              <input
                name="current"
                type="password"
                placeholder="Введите текущий пароль"
                className="w-full h-11 px-3 rounded-xl border border-[#E6EAF2] bg-white outline-none focus:ring-2 focus:ring-[#0F62FE]/30"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">Новый пароль</label>
              <input
                name="next"
                type="password"
                placeholder="Введите новый пароль"
                className="w-full h-11 px-3 rounded-xl border border-[#E6EAF2] bg-white outline-none focus:ring-2 focus:ring-[#0F62FE]/30"
                required
                minLength={6}
              />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>

          {/* кнопки по центру */}
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-6 rounded-xl bg-[#D9D9D9] text-ink hover:bg-[#cfcfcf]"
            >
              Отмена
            </button>
            <button
              disabled={loading}
              className="h-10 px-6 rounded-xl bg-[#0F62FE] text-white hover:bg-[#0E56E1] disabled:opacity-60"
            >
              {loading ? "Сохраняю..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
