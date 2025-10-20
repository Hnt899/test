"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/panel/posts", label: "Публикации", icon: PostsIcon },
  { href: "/panel/admins", label: "Администраторы", icon: ShieldIcon },
  { href: "/panel/users", label: "Пользователи", icon: UsersIcon },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E6EAF2]">
      <ul className="grid grid-cols-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className="flex flex-col items-center justify-center gap-1 py-2.5 text-[12px]"
              >
                <Icon active={active} />
                <span className={active ? "text-[#0F62FE] font-medium" : "text-gray-600"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function PostsIcon({ active }: { active?: boolean }) {
  const c = active ? "#0F62FE" : "#6B7280";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="3" stroke={c} strokeWidth="1.8"/>
      <path d="M7 8h10M7 12h10M7 16h6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function ShieldIcon({ active }: { active?: boolean }) {
  const c = active ? "#0F62FE" : "#6B7280";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function UsersIcon({ active }: { active?: boolean }) {
  const c = active ? "#0F62FE" : "#6B7280";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="8" r="3" stroke={c} strokeWidth="1.8"/>
      <circle cx="16" cy="8" r="3" stroke={c} strokeWidth="1.8"/>
      <path d="M4 19a4 4 0 014-4h0a4 4 0 014 4v1H4v-1z" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 19a4 4 0 014-4h0a4 4 0 014 4v1h-8v-1z" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
