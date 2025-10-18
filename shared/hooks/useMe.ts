import { useQuery } from "@tanstack/react-query";

export type Me = {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  image?: string;   // dummyjson
  avatar?: string;  // возможное поле другого API
  guest?: boolean;
};

export function useMe() {
  return useQuery<Me>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load me");
      return res.json();
    },
  });
}
