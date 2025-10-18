"use client";

import Image from "next/image";
import { useMe } from "@/shared/hooks/useMe";

function formatBirthDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU");
}
function calcAge(iso?: string) {
  if (!iso) return undefined;
  const b = new Date(iso);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

export default function ProfilePage() {
  const { data: me } = useMe();

  const fullName =
    [me?.firstName, me?.lastName].filter(Boolean).join(" ") ||
    me?.username ||
    me?.email ||
    "Пользователь";

  const emailOrHandle = me?.email || (me?.username ? `@${me.username}` : "");
  const avatarUrl = (me as any)?.image || (me as any)?.avatar || "";
  const birth = formatBirthDate(me?.birthDate);
  const age = calcAge(me?.birthDate);

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <section className="rounded-2xl bg-white border border-[#E6EAF2] p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4 sm:gap-6">
          <div className="shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                width={96}
                height={96}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#C6DCFF] grid place-items-center text-[#0F62FE] text-2xl font-semibold">
                {fullName.split(" ").map(w => w?.[0]).filter(Boolean).join("").slice(0,2)}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[28px] font-bold text-ink truncate">
              {fullName}
            </h1>
            {emailOrHandle && (
              <a
                href={me?.email ? `mailto:${me.email}` : undefined}
                className="text-[14px] text-[#0F62FE] break-all"
              >
                {emailOrHandle}
              </a>
            )}

            {/* Дата рождения + возраст под email, если есть */}
            {birth && (
              <div className="text-sm text-gray-600 mt-1">
                {birth}{age !== undefined ? ` (${age} лет)` : ""}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Форма / карточка с полями */}
      <section className="rounded-2xl bg-white border border-[#E6EAF2] p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Личные данные</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">ФИО</label>
            <input
              className="w-full h-10 px-3 rounded-xl border border-[#E6EAF2] bg-[#F7F8FA]"
              value={fullName}
              readOnly
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Email</label>
            <input
              className="w-full h-10 px-3 rounded-xl border border-[#E6EAF2] bg-[#F7F8FA]"
              value={me?.email || ""}
              readOnly
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Имя пользователя</label>
            <input
              className="w-full h-10 px-3 rounded-xl border border-[#E6EAF2] bg-[#F7F8FA]"
              value={me?.username || ""}
              readOnly
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Дата рождения</label>
            <input
              className="w-full h-10 px-3 rounded-xl border border-[#E6EAF2] bg-[#F7F8FA]"
              value={birth || ""}
              readOnly
            />
          </div>
        </div>
      </section>
    </div>
  );
}
