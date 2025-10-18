"use client";

import Image from "next/image";
import Link from "next/link";
import { useMe } from "@/shared/hooks/useMe";

export default function SidebarProfileCard() {
  const { data: me } = useMe();

  // Берём ФИО либо username/email, как раньше
  const fullName =
    [me?.firstName, me?.lastName].filter(Boolean).join(" ") ||
    me?.username ||
    me?.email ||
    "Профиль";

  const handle =
    (me?.username && `@${me.username}`) ||
    me?.email ||
    "";

  const avatar = (me as any)?.image || (me as any)?.avatar || "";

  async function onLogout() {
    try {
      // дергаем API-logout, а затем явно уходим на /login
      await fetch("/api/logout", { method: "POST" }).catch(() => {});
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="rounded-xl border border-[#E6EAF2] bg-[#F7FBFF] p-3 shadow-sm">
      {/* Весь блок с аватаром/именем кликабелен и ведёт в профиль */}
      <Link href="/panel/profile" className="flex items-center gap-3 group">
        {avatar ? (
          <Image
            src={avatar}
            alt={fullName}
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#C6DCFF] grid place-items-center text-[#0F62FE] text-xs font-bold">
            {fullName
              .split(" ")
              .map((w) => w?.[0])
              .filter(Boolean)
              .join("")
              .slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium truncate group-hover:text-[#0F62FE]">
            {fullName}
          </div>
          {handle && (
            <div className="text-[11px] text-gray-500 truncate">{handle}</div>
          )}
        </div>
      </Link>

      <button
        onClick={onLogout}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#DFE6F0] bg-white px-3 py-2 text-[12.5px] text-[#0F62FE] hover:bg-[#F4F8FF]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M16 12H4m0 0l3-3m-3 3l3 3"
            stroke="#0F62FE"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 7V5a2 2 0 012-2h8v18h-8a2 2 0 01-2-2v-2"
            stroke="#0F62FE"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        Выход
      </button>
    </div>
  );
}
