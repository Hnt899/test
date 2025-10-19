"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { Crown, Newspaper, Users } from "lucide-react";

import MobileTopBar from "@/shared/components/MobileTopBar";
import MobileTabBar from "@/shared/components/MobileTabBar";
import SidebarProfileCard from "@/shared/components/SidebarProfileCard";

const navItems = [
  {
    href: "/panel/posts",
    label: "Публикации",
    icon: Newspaper,
  },
  {
    href: "/panel/admins",
    label: "Администраторы",
    icon: Crown,
  },
  {
    href: "/panel/users",
    label: "Пользователи",
    icon: Users,
  },
];

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
          <div className="mb-8 text-center text-2xl font-extrabold text-[#0F62FE]">BTX•</div>

          {/* В меню убрал "Главная" по макету */}
          <nav className="flex flex-col gap-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);

              return (
                <Link key={href} href={href} className={navClass(active)}>
                  <Icon className={iconClass(active)} />
                  {label}
                </Link>
              );
            })}
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
  const base = "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors";
  const activeClasses = active
    ? "bg-[#E3EEFF] text-[#0F62FE]"
    : "text-[#24324D] hover:bg-[#E3EEFF] hover:text-[#0F62FE]";

  return `${base} ${activeClasses}`;
}

function iconClass(active: boolean) {
  const base = "h-5 w-5 transition-colors";

  if (active) {
    return `${base} text-[#0F62FE]`;
  }

  return `${base} text-[#9AA4B2] group-hover:text-[#0F62FE]`;
}
