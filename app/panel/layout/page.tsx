import Link from "next/link";
import React from "react";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="body-wrap">
      <aside className="hidden md:block border-r p-4">
        <div className="font-semibold mb-4">Admin Panel</div>
        <nav className="grid gap-2">
          <Link href="/panel">Главная</Link>
          <Link href="/panel/admins">Администраторы</Link>
          <Link href="/panel/users">Пользователи</Link>
          <Link href="/panel/posts">Публикации</Link>
          <Link href="/panel/profile">Профиль</Link>
        </nav>
      </aside>
      <main className="p-4">{children}</main>
    </div>
  );
}
