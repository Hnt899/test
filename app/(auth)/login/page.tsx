"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      setLoading(true);
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Неверные учетные данные");
      }

      router.replace("/panel");
    } catch (e: any) {
      setErr(e?.message ?? "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-[#E9F3FF] relative">
      {/* ===== Мобильная шапка с логотипом ===== */}
      <div
        className="sm:hidden fixed top-0 left-0 w-full
                   bg-white rounded-b-[20px]
                   shadow-[0_2px_10px_rgba(20,30,55,0.08)]
                   border-b border-[#E6EAF2]
                   flex justify-center py-5 z-10"
      >
        <div className="text-[50px] font-extrabold tracking-wide text-[#0F62FE]">
          BTX
          <span
            className="inline-block translate-y-[-4px]"
            style={{ fontSize: "1em", lineHeight: 1 }}
          >
            •
          </span>
        </div>
      </div>

      {/* ===== Карточка ===== */}
      <div className="w-full max-w-[420px] sm:max-w-[565px] mt-[90px] sm:mt-0">
        <form
          onSubmit={onSubmit}
          className="
            w-full bg-white rounded-[20px]
            shadow-[0_2px_12px_rgba(20,30,55,.06)]
            border border-[#E6EAF2]
            px-5 py-6 sm:px-10 sm:py-8
            flex flex-col
          "
        >
          {/* Десктопный логотип */}
          <div className="hidden sm:block text-center mb-4">
            <div className="text-[28px] font-extrabold tracking-wide text-[#0F62FE]">
              BTX
              <span
                className="inline-block translate-y-[-4px]"
                style={{ fontSize: "1em", lineHeight: 1 }}
              >
                •
              </span>
            </div>
          </div>

          {/* Заголовок */}
          <h1
            className="font-inter font-semibold
                       text-[24px] leading-[30px]
                       sm:text-[36px] sm:leading-[40px]
                       text-[#0B1220] text-center
                       sm:whitespace-nowrap"
          >
            Панель администратора
          </h1>

          <p className="text-center text-[18px] text-[#6B7280] mt-2">
            Войдите в систему для продолжения
          </p>

          {/* Поля */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-[13px] text-[#6B7280] mb-1">
                Имя пользователя
              </label>
              <input
                name="username"
                type="text"
                placeholder="admin@example.com"
                className="
                  w-full h-12 px-4 rounded-[14px]
                  bg-[#EEF4FF] border border-[#E6EAF2]
                  outline-none focus:ring-2 focus:ring-[#0F62FE33]
                  placeholder:text-[#9AA3AF]
                "
                required
              />
            </div>

            <div>
              <label className="block text-[13px] text-[#6B7280] mb-1">
                Пароль
              </label>
              <input
                name="password"
                type="password"
                placeholder="Введите пароль"
                className="
                  w-full h-12 px-4 rounded-[14px]
                  bg-[#EEF4FF] border border-[#E6EAF2]
                  outline-none focus:ring-2 focus:ring-[#0F62FE33]
                  placeholder:text-[#9AA3AF]
                "
                required
              />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>

          {/* Кнопка */}
          <button
            disabled={loading}
            className="
              mt-5 w-full h-12 rounded-[14px]
              bg-[#0F62FE] text-white font-semibold
              hover:bg-[#0a56e6] transition
              disabled:opacity-60
            "
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}
