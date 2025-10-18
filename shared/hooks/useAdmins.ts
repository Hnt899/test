import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Admin, AdminsResponse, createAdmin, deleteAdmin, fetchAdmins, updateAdmin } from "@/shared/api-services/admins";
import { socket } from "@/shared/lib/socket";

export function useAdmins(params: { q?: string; limit: number; skip: number }) {
  return useQuery<AdminsResponse>({
    queryKey: ["admins", params],
    queryFn: () => fetchAdmins(params),
  });
}

export function useAdminMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: Omit<Admin, "id">) => createAdmin(payload),
    onSuccess: (admin) => {
      qc.invalidateQueries({ queryKey: ["admins"] });
      socket.emit("admin:created", admin);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Admin, "id">> }) => updateAdmin(id, data),
    onSuccess: (admin) => {
      qc.invalidateQueries({ queryKey: ["admins"] });
      socket.emit("admin:updated", admin);
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteAdmin(id),
    onSuccess: (_ok, id) => {
      qc.invalidateQueries({ queryKey: ["admins"] });
      socket.emit("admin:deleted", id);
    },
  });

  return { create, update, remove };
}
