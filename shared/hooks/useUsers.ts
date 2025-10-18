import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, deleteUser, fetchUsers, updateUser, User } from "@/shared/api-services/users";
import { socket } from "@/shared/lib/socket"; // ← добавили импорт

export function useUsers(params: { q?: string; limit: number; skip: number }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => fetchUsers(params),
  });
}

export function useUserMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: Omit<User, "id">) => createUser(payload),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      socket.emit("user:created", user); // ← эмитим событие
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<User, "id">> }) => updateUser(id, data),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      socket.emit("user:updated", user); // ← эмитим событие
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: (_ok, id) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      socket.emit("user:deleted", id); // ← эмитим событие
    },
  });

  return { create, update, remove };
}
