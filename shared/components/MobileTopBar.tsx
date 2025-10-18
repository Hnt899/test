"use client";

import Link from "next/link";
import Image from "next/image";
import { useMe } from "@/shared/hooks/useMe";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w.trim()[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MobileTopBar() {
  const { data: me } = useMe();

  const fullName =
    [me?.firstName, me?.lastName].filter(Boolean).join(" ") ||
    me?.username ||
    me?.email ||
    "Профиль";

  const subline = me?.email ?? (me?.username ? `@${me.username}` : "");
  const avatar = (me as any)?.image || (me as any)?.avatar || "";

  async function onLogout() {
    try {
      await fetch("/api/logout", { method: "POST" }).catch(() => {});
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      {/* Лого */}
      <div className="text-2xl font-extrabold text-[#0F62FE]">BTX•</div>

      {/* Чип пользователя — ТАП ОТКРЫВАЕТ ПРОФИЛЬ */}
      <Link
        href="/panel/profile"
        className="min-w-0 flex items-center gap-2 rounded-full px-3 py-2 bg-white shadow border border-[#E8EEF6] active:scale-[.98]"
        aria-label="Открыть профиль"
      >
        {avatar ? (
          <Image
            src={avatar}
            alt={fullName}
            width={24}
            height={24}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#C6DCFF] grid place-items-center text-[10px] font-bold text-[#0F62FE]">
            {initials(fullName)}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[13px] font-medium leading-4 truncate">
            {fullName}
          </div>
          {subline && (
            <div className="text-[11px] text-gray-500 leading-3 truncate">
              {subline}
            </div>
          )}
        </div>
      </Link>

      {/* Выход */}
      <button
        onClick={onLogout}
        aria-label="Выйти"
        className="p-2 rounded-full border border-[#E6EAF2] bg-white active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M16 12H4m0 0l3-3m-3 3l3 3"
            stroke="#0F62FE"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 7V5a2 2 0 012-2h8v18h-8a2 2 0 01-2-2v-2"
            stroke="#0F62FE"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
