"use client";

import { useState } from "react";
import { changePassword } from "@/shared/api-services/profile";
import { toast } from "sonner";

export default function ProfilePage() {
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [newPassword2, setNew2] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword || !newPassword2)
      return toast.error("Заполните все поля");
    if (newPassword !== newPassword2)
      return toast.error("Пароли не совпадают");

    try {
      setLoading(true);
      await changePassword({ oldPassword, newPassword });
      toast.success("Пароль успешно изменён");
      setOld(""); setNew(""); setNew2("");
    } catch (err) {
      toast.error("Не удалось изменить пароль");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="max-w-md space-y-8">
      <h1 className="text-2xl font-semibold">Профиль</h1>

      {/* форма смены пароля */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 space-y-3">
        <div className="font-medium">Смена пароля</div>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Текущий пароль"
          value={oldPassword}
          onChange={(e) => setOld(e.target.value)}
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Новый пароль"
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Повторите новый пароль"
          value={newPassword2}
          onChange={(e) => setNew2(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {loading ? "Сохраняем…" : "Сменить пароль"}
          </button>
        </div>
      </form>

      {/* кнопка выхода */}
      <button
        onClick={logout}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
      >
        {loading ? "Выходим…" : "Выйти из аккаунта"}
      </button>
    </div>
  );
}
