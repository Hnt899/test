"use client";
import { useEffect } from "react";
import { socket } from "@/shared/lib/socket";
import { toast } from "sonner";

export default function SocketEvents() {
  useEffect(() => {
    // USERS
    const onUserCreate = (p: any) => toast.success(`Пользователь создан: ${p?.email ?? p?.id ?? ""}`);
    const onUserUpdate = (p: any) => toast.success(`Пользователь обновлён: ${p?.email ?? p?.id ?? ""}`);
    const onUserDelete = (id: any) => toast.success(`Пользователь удалён: ${id}`);

    socket.on("user:created", onUserCreate);
    socket.on("user:updated", onUserUpdate);
    socket.on("user:deleted", onUserDelete);

    // ADMINS
    const onAdminCreate = (p: any) => toast.success(`Админ создан: ${p?.email ?? p?.id ?? ""}`);
    const onAdminUpdate = (p: any) => toast.success(`Админ обновлён: ${p?.email ?? p?.id ?? ""}`);
    const onAdminDelete = (id: any) => toast.success(`Админ удалён: ${id}`);

    socket.on("admin:created", onAdminCreate);
    socket.on("admin:updated", onAdminUpdate);
    socket.on("admin:deleted", onAdminDelete);

    return () => {
      socket.off("user:created", onUserCreate);
      socket.off("user:updated", onUserUpdate);
      socket.off("user:deleted", onUserDelete);
      socket.off("admin:created", onAdminCreate);
      socket.off("admin:updated", onAdminUpdate);
      socket.off("admin:deleted", onAdminDelete);
    };
  }, []);

  return null;
}
