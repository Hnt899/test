"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BTXLogo from "@/shared/components/BTXLogo";
import ProfileCard from "@/shared/components/ProfileCard";
import { Menu as MenuIcon, X as XIcon, FileText, Users, Shield } from "lucide-react";

const NAV = [
  { href: "/panel/posts", label: "Публикации", icon: FileText },
  { href: "/panel/admins", label: "Администраторы", icon: Shield },
  { href: "/panel/users", label: "Пользователи", icon: Users },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Mobile topbar */}
      <div className="sm:hidden sticky top-0 z-40 bg-white border-b border-line h-14 flex items-center justify-between px-4">
        <BTXLogo className="text-[22px]" />
        <button className="p-2 rounded-lg border border-line active:scale-95" onClick={() => setOpen(true)} aria-label="Открыть меню">
          <MenuIcon size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr]">
        {/* ===== Desktop sidebar (изменено: flex-col + mt-auto для профиля) ===== */}
        <aside className="hidden sm:flex h-screen sticky top-0 bg-white border-r border-line p-6 flex-col">
          <BTXLogo className="text-[22px] mb-6" />
          <NavList pathname={pathname} />

          {/* spacer */}
          <div className="mt-auto" />

          {/* профиль у самого низа */}
          
        </aside>

        {/* ===== Mobile drawer ===== */}
        {open && <div className="sm:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />}
        <div className={`sm:hidden fixed z-50 top-0 left-0 h-full w-[78%] max-w-[320px]
                         bg-white border-r border-line p-4 flex flex-col
                         transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between mb-4">
            <BTXLogo className="text-[22px]" />
            <button className="p-2 rounded-lg border border-line active:scale-95" onClick={() => setOpen(false)} aria-label="Закрыть меню">
              <XIcon size={18} />
            </button>
          </div>

          <NavList pathname={pathname} />

          {/* spacer чтобы карточка уехала вниз */}
          <div className="flex-1" />

          {/* профиль внизу бургер-меню */}
          
        </div>

        {/* ===== Content ===== */}
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

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
              active ? "bg-[#DDEBFF] text-[#0F62FE] font-semibold" : "hover:bg-gray-50",
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
