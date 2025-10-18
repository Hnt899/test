"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useMe } from "@/shared/hooks/useMe";

export default function ProfileCard() {
  const router = useRouter();
  const { data: me } = useMe();

  const name =
    [me?.firstName, me?.lastName].filter(Boolean).join(" ") ||
    me?.username || me?.email || "Пользователь";

  const handle = me?.username ? `@${me.username}` : (me?.email || "");
  const avatarUrl = (me as any)?.image || (me as any)?.avatar || "";

  function openProfile() {
    router.push("/panel/profile");
  }

  async function onLogout(e: React.MouseEvent) {
    e.stopPropagation();            // ← не даём всплыть клику на карточку
    try { await fetch("/api/logout", { method: "POST" }); } catch {}
    router.replace("/login");
  }

  return (
    <div
      onClick={openProfile}
      className="rounded-[14px] border border-[#DDEBFF] bg-[#EAF3FF] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.5)]
                 cursor-pointer select-none"
      role="button"
      aria-label="Открыть профиль"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openProfile()}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#C6DCFF] grid place-items-center text-[#0F62FE] font-semibold">
              {name.split(" ").map(w => w?.[0]).filter(Boolean).join("").slice(0,2)}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="font-medium truncate">{name}</div>
          {handle && <div className="text-xs text-[#0F62FE] truncate">{handle}</div>}
        </div>
      </div>

      <button
        onClick={onLogout}
        className="mt-3 w-full h-9 rounded-[12px] bg-white/70 hover:bg-white transition
                   border border-[#DDEBFF] text-[#0F62FE] text-sm font-medium
                   inline-flex items-center justify-center gap-2"
      >
        <LogOut size={16} className="text-[#0F62FE]" />
        Выход
      </button>
    </div>
  );
}
