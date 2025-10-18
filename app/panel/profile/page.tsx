"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useMe } from "@/shared/hooks/useMe";
import { updateUser } from "@/shared/api-services/users";
import ChangePasswordModal from "@/shared/components/ChangePasswordModal";

/* utils */
function formatBirthDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU");
}
function toIsoFromRu(dateRu: string) {
  const m = dateRu.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
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
function splitFullName(full: string) {
  const parts = full.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

/* role mapping */
const ROLE_UI_TO_API: Record<string, "admin" | "user"> = {
  Администратор: "admin",
  Пользователь: "user",
};
const ROLE_API_TO_UI: Record<string, "Администратор" | "Пользователь"> = {
  admin: "Администратор",
  user: "Пользователь",
};

export default function ProfilePage() {
  const { data: me } = useMe();
  const qc = useQueryClient();

  const initialFullName = useMemo(
    () =>
      [me?.firstName, me?.lastName].filter(Boolean).join(" ") ||
      me?.username ||
      me?.email ||
      "",
    [me]
  );
  const initialEmail = me?.email || "";
  const initialBirthRu = formatBirthDate(me?.birthDate);

  const initialRoleUi =
    (me as any)?.role && ROLE_API_TO_UI[(me as any).role]
      ? ROLE_API_TO_UI[(me as any).role]
      : ((me as any)?.role as string) || "Пользователь";

  const [form, setForm] = useState({
    fullName: initialFullName,
    email: initialEmail,
    birthRu: initialBirthRu,
  });
  const [role, setRole] = useState<string>(initialRoleUi);
  const [saving, setSaving] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [openPwd, setOpenPwd] = useState(false);

  const changed =
    form.fullName !== initialFullName ||
    form.email !== initialEmail ||
    form.birthRu !== initialBirthRu;

  const avatarUrl = (me as any)?.image || (me as any)?.avatar || "";
  const age = calcAge(me?.birthDate);

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((s) => ({ ...s, [key]: e.target.value }));
    };

  async function onSave() {
    if (!me?.id || !changed) return;
    try {
      setSaving(true);
      const payload: Record<string, any> = {};

      if (form.fullName !== initialFullName) {
        const { firstName, lastName } = splitFullName(form.fullName);
        payload.firstName = firstName;
        payload.lastName = lastName;
      }
      if (form.email !== initialEmail) payload.email = form.email;
      if (form.birthRu !== initialBirthRu && form.birthRu) {
        const iso = toIsoFromRu(form.birthRu);
        if (!iso) {
          toast.error("Неверный формат даты. Используйте дд.мм.гггг");
          setSaving(false);
          return;
        }
        payload.birthDate = iso;
      }

      await updateUser(me.id, payload);
      toast.success("Изменения сохранены");
      await qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e: any) {
      toast.error(e?.message || "Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  }

  // роль — автосейв
  async function onChangeRole(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!me?.id) return;
    const prevRoleUi = role;
    const nextRoleUi = e.target.value;
    const nextRoleApi = ROLE_UI_TO_API[nextRoleUi] ?? "user";

    setRole(nextRoleUi);
    try {
      setRoleSaving(true);
      await updateUser(me.id, { role: nextRoleApi } as any);
      toast.success("Роль обновлена");
      await qc.invalidateQueries({ queryKey: ["me"] });
    } catch (err: any) {
      toast.error(err?.message || "Не удалось изменить роль");
      setRole(prevRoleUi);
    } finally {
      setRoleSaving(false);
    }
  }

  const rolePill = role || "Пользователь";

  return (
    <div className="space-y-7 sm:space-y-9">
      {/* ===== DESKTOP HEADER (как было: слева-направо, НЕ по центру) ===== */}
      <section className="hidden sm:block rounded-2xl bg-white border border-[#E6EAF2] p-8 shadow-sm">
        <div className="flex items-start gap-6">
          {/* avatar */}
          {avatarUrl ? (
            <Image src={avatarUrl} alt={form.fullName} width={96} height={96} className="rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#C6DCFF] grid place-items-center text-[#0F62FE] text-xl font-bold">
              {form.fullName.split(" ").map(w=>w?.[0]).filter(Boolean).join("").slice(0,2)}
            </div>
          )}

          {/* text block, left aligned */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span
                className={
                  rolePill === "Администратор"
                    ? "inline-block text-xs px-3 py-1 rounded-full bg-[#FFF2C6] text-[#8F5A00]"
                    : "inline-block text-xs px-3 py-1 rounded-full bg-[#EAF3FF] text-[#0F62FE]"
                }
              >
                {rolePill}
              </span>

              {/* ссылка “Изменить пароль” справа */}
              <button
                onClick={() => setOpenPwd(true)}
                className="ml-auto text-[#0F62FE] hover:underline"
              >
                Изменить пароль
              </button>
            </div>

            <h1 className="text-[24px] font-semibold mt-2">{form.fullName}</h1>

            {!!form.email && (
              <a href={`mailto:${form.email}`} className="text-[#0F62FE] block mt-1">
                {form.email}
              </a>
            )}

            {me?.birthDate && (
              <div className="text-gray-600 mt-1">
                {formatBirthDate(me.birthDate)}
                {age !== undefined ? ` (${age} лет)` : ""}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== MOBILE HEADER (вертикально по центру, шрифт крупнее) ===== */}
      <section className="sm:hidden rounded-2xl bg-white border border-[#E6EAF2] p-6 shadow-sm">
        <div className="flex flex-col items-center text-center gap-3 text-[15px]">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={form.fullName} width={96} height={96} className="rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#C6DCFF] grid place-items-center text-[#0F62FE] text-xl font-bold">
              {form.fullName.split(" ").map(w=>w?.[0]).filter(Boolean).join("").slice(0,2)}
            </div>
          )}

          <span
            className={
              rolePill === "Администратор"
                ? "inline-block text-[13px] px-3 py-1 rounded-full bg-[#FFF2C6] text-[#8F5A00]"
                : "inline-block text-[13px] px-3 py-1 rounded-full bg-[#EAF3FF] text-[#0F62FE]"
            }
          >
            {rolePill}
          </span>

          <h1 className="text-[22px] font-semibold leading-tight">{form.fullName}</h1>

          {!!form.email && (
            <a href={`mailto:${form.email}`} className="text-[#0F62FE] break-all">
              {form.email}
            </a>
          )}

          {me?.birthDate && (
            <div className="text-gray-600">
              {formatBirthDate(me.birthDate)}
              {age !== undefined ? ` (${age} лет)` : ""}
            </div>
          )}

          <button
            onClick={() => setOpenPwd(true)}
            className="text-[#0F62FE] mt-1 hover:underline"
          >
            Изменить пароль
          </button>
        </div>
      </section>

      {/* ===== Форма (общая) ===== */}
      <section className="rounded-2xl bg-white border border-[#E6EAF2] p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl sm:text-[22px] font-semibold mb-6 sm:mb-7">Личные данные</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <div className="space-y-1.5">
            <label className="text-[12.5px] sm:text-sm text-gray-500">ФИО</label>
            <input
              value={form.fullName}
              onChange={onChange("fullName")}
              className="w-full h-12 sm:h-[50px] px-3.5 rounded-xl border border-[#E6EAF2] bg-white text-[15px] outline-none focus:ring-2 focus:ring-[#0F62FE]/25"
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] sm:text-sm text-gray-500">Дата рождения</label>
            <input
              value={form.birthRu}
              onChange={onChange("birthRu")}
              className="w-full h-12 sm:h-[50px] px-3.5 rounded-xl border border-[#E6EAF2] bg-white text-[15px] outline-none focus:ring-2 focus:ring-[#0F62FE]/25"
              placeholder="дд.мм.гггг"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] sm:text-sm text-gray-500">Email</label>
            <input
              value={form.email}
              onChange={onChange("email")}
              type="email"
              className="w-full h-12 sm:h-[50px] px-3.5 rounded-xl border border-[#E6EAF2] bg-white text-[15px] outline-none focus:ring-2 focus:ring-[#0F62FE]/25"
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] sm:text-sm text-gray-500">Роль</label>
            <select
              value={role}
              onChange={onChangeRole}
              disabled={roleSaving}
              className="w-full h-12 sm:h-[50px] px-3.5 rounded-xl border border-[#E6EAF2] bg-white text-[15px] outline-none focus:ring-2 focus:ring-[#0F62FE]/25 disabled:opacity-60"
            >
              <option>Администратор</option>
              <option>Пользователь</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onSave}
            disabled={!changed || saving}
            className={[
              "h-11 px-5 rounded-xl transition-colors",
              !changed || saving
                ? "bg-[#D9D9D9] text-ink cursor-not-allowed"
                : "bg-[#0F62FE] text-white hover:bg-[#0E56E1]",
            ].join(" ")}
          >
            {saving ? "Сохраняем..." : "Сохранить изменения"}
          </button>
        </div>
      </section>

      <ChangePasswordModal open={openPwd} onClose={() => setOpenPwd(false)} />
    </div>
  );
}
