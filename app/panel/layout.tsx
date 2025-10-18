"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, X as XIcon, FileText, Shield, Users } from "lucide-react";

import BTXLogo from "@/shared/components/BTXLogo";
import ProfileCard from "@/shared/components/ProfileCard";

// навигация панели
const NAV = [
  { href: "/panel/posts", label: "Публикации", icon: FileText },
  { href: "/panel/admins", label: "Администраторы", icon: Shield },
  { href: "/panel/users", label: "Пользователи", icon: Users },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // закрывать бургер при смене роута
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* ===== Mobile topbar (логотип + бургер) ===== */}
      <div className="sm:hidden sticky top-0 z-40 bg-white border-b border-line h-14 flex items-center justify-between px-4">
        <BTXLogo className="text-[22px]" />
        <button
          aria-label="Открыть меню"
          className="p-2 rounded-lg border border-line active:scale-95"
          onClick={() => setOpen(true)}
        >
          <MenuIcon size={20} />
        </button>
      </div>

      {/* ===== Основная сетка: сайдбар + контент ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr]">
        {/* ===== Desktop sidebar ===== */}
        <aside className="hidden sm:flex h-dvh sticky top-0 bg-white border-r border-line p-6 flex-col">
          <BTXLogo className="text-[22px] mb-6" />

          <NavList pathname={pathname} />

          {/* раздел при необходимости
          <div className="mt-6 pt-6 border-t border-line">
            <Link href="/panel/profile" className="text-sm hover:text-brand">Профиль</Link>
          </div> */}

          {/* spacer чтобы профиль уехал к низу */}
          <div className="mt-auto" />

          {/* карточка профиля — данные берутся из API */}
          <ProfileCard />
        </aside>

        {/* ===== Mobile drawer (off-canvas) ===== */}
        {open && (
          <div
            className="sm:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
        )}
        <div
          className={`sm:hidden fixed z-50 top-0 left-0 h-full w-[78%] max-w-[320px]
                      bg-white border-r border-line p-4 flex flex-col
                      transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between mb-4">
            <BTXLogo className="text-[22px]" />
            <button
              aria-label="Закрыть меню"
              className="p-2 rounded-lg border border-line active:scale-95"
              onClick={() => setOpen(false)}
            >
              <XIcon size={18} />
            </button>
          </div>

          <NavList pathname={pathname} />

          {/* spacer → профиль прилипает к низу */}
          <div className="flex-1" />

          <ProfileCard />
        </div>

        {/* ===== Content ===== */}
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

/* ===== Нав-лист с «пилюлями» иконками ===== */
function NavList({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-2">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex items-center gap-2 px-3 h-10 rounded-full text-sm transition-colors",
              active
                ? "bg-[#DDEBFF] text-[#0F62FE] font-semibold"
                : "hover:bg-gray-50",
            ].join(" ")}
          >
            <Icon size={18} className={active ? "text-[#0F62FE]" : "text-ink"} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
