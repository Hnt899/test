"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

import MobileTopBar from "@/shared/components/MobileTopBar";
import MobileTabBar from "@/shared/components/MobileTabBar";
import SidebarProfileCard from "@/shared/components/SidebarProfileCard";

export default function PanelLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#E6F1FE]">
      {/* ===== MOBILE TOP BAR ===== */}
      <div className="sm:hidden sticky top-0 z-40 bg-[#E6F1FE]/80 backdrop-blur supports-[backdrop-filter]:bg-[#E6F1FE]/60">
        <MobileTopBar />
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="hidden sm:grid sm:grid-cols-[260px_1fr] min-h-screen">
        {/* Sidebar */}
        <aside className="sidebar h-screen sticky top-0 border-r bg-white px-6 pt-6 pb-3 flex flex-col">
          <div className="text-xl font-bold mb-8 text-[#0F62FE]">BTX•</div>

          {/* В меню убрал "Главная" по макету */}
          <nav className="flex flex-col gap-3 text-sm font-medium">
            <Link
              href="/panel/admins"
              className={navClass(pathname.startsWith("/panel/admins"))}
            >
              Администраторы
            </Link>
            <Link
              href="/panel/users"
              className={navClass(pathname.startsWith("/panel/users"))}
            >
              Пользователи
            </Link>
            <Link
              href="/panel/posts"
              className={navClass(pathname.startsWith("/panel/posts"))}
            >
              Публикации
            </Link>
          </nav>

          {/* spacer чтобы карточка уехала вниз */}
          <div className="flex-1" />

          {/* компактная карточка профиля внизу сайдбара */}
          <SidebarProfileCard />
        </aside>

        {/* Content */}
        <main className="p-8 lg:p-10">{children}</main>
      </div>

      {/* ===== MOBILE CONTENT ===== */}
      <div className="sm:hidden pb-[64px]">
        {/* чуть увеличенный базовый шрифт для мобилки */}
        <main className="p-4 text-[15px] leading-[1.45]">{children}</main>
      </div>

      {/* ===== MOBILE TAB BAR ===== */}
      <MobileTabBar />
    </div>
  );
}

function navClass(active: boolean) {
  return [
    "block rounded-lg px-3 py-2 transition-colors",
    active ? "bg-[#EAF3FF] text-[#0F62FE]" : "hover:text-[#0F62FE]",
  ].join(" ");
}
