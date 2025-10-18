"use client";

import Link from "next/link";
import { useUsers } from "@/shared/hooks/useUsers";
import { useAdmins } from "@/shared/hooks/useAdmins";
import { usePosts } from "@/shared/hooks/usePosts";

export default function PanelHome() {
  // берём “по чуть-чуть”, чтобы получить total и показать примеры
  const { data: users }  = useUsers({ limit: 5,  skip: 0 });
  const { data: admins } = useAdmins({ limit: 5,  skip: 0 });
  const { data: posts }  = usePosts({  limit: 5,  skip: 0 });

  const usersTotal  = users?.total  ?? 0;
  const adminsTotal = admins?.total ?? 0;
  const postsTotal  = posts?.total  ?? 0;

  const recentPosts = posts?.posts ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Главная</h1>

      {/* cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Пользователи" value={usersTotal} href="/panel/users" />
        <StatCard label="Администраторы" value={adminsTotal} href="/panel/admins" />
        <StatCard label="Публикации" value={postsTotal} href="/panel/posts" />
      </div>

      {/* быстрые действия */}
      <div className="flex flex-wrap gap-2">
        <Link href="/panel/users" className="px-4 py-2 rounded bg-black text-white">+ Создать пользователя</Link>
        <Link href="/panel/admins" className="px-4 py-2 rounded border">+ Создать администратора</Link>
        <Link href="/panel/posts" className="px-4 py-2 rounded border">Открыть публикации</Link>
      </div>

      {/* последние посты (пример таблицы) */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-medium">Последние публикации</div>
          <Link href="/panel/posts" className="text-sm text-blue-600 hover:underline">все публикации →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Заголовок</th>
              <th className="text-left p-3">Текст</th>
            </tr>
          </thead>
          <tbody>
            {recentPosts.length === 0 && (
              <tr><td colSpan={3} className="p-4 text-gray-500">Нет данных</td></tr>
            )}
            {recentPosts.map(p => (
              <tr key={p.id} className="border-t align-top">
                <td className="p-3">{p.id}</td>
                <td className="p-3 font-medium">{p.title}</td>
                <td className="p-3 max-w-[680px]"><div className="truncate">{p.body}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="block rounded-xl border bg-white p-5 hover:shadow-sm transition-shadow">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      <div className="mt-2 text-sm text-blue-600">перейти →</div>
    </Link>
  );
}
