"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Admin } from "@/shared/api-services/admins";
import type { User } from "@/shared/api-services/users";
import { socket } from "@/shared/lib/socket";

type UserEventPayload = Partial<User> | undefined;
type AdminEventPayload = Partial<Admin> | undefined;
type EntityIdentifier = number | string | undefined;

export default function SocketEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onUserCreate = (payload: UserEventPayload) => {
      toast.success(`Пользователь создан: ${payload?.email ?? payload?.id ?? ""}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    };
    const onUserUpdate = (payload: UserEventPayload) => {
      toast.success(`Пользователь обновлён: ${payload?.email ?? payload?.id ?? ""}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    };
    const onUserDelete = (id: EntityIdentifier) => {
      toast.success(`Пользователь удалён: ${id}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    };

    socket.on("user:created", onUserCreate);
    socket.on("user:updated", onUserUpdate);
    socket.on("user:deleted", onUserDelete);
    
    const onAdminCreate = (payload: AdminEventPayload) => {
      toast.success(`Админ создан: ${payload?.email ?? payload?.id ?? ""}`);
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    };
    const onAdminUpdate = (payload: AdminEventPayload) => {
      toast.success(`Админ обновлён: ${payload?.email ?? payload?.id ?? ""}`);
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    };
    const onAdminDelete = (id: EntityIdentifier) => {
      toast.success(`Админ удалён: ${id}`);
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    };

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
  }, [queryClient]);

  return null;
}
