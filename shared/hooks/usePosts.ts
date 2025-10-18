import { useQuery } from "@tanstack/react-query";
import { fetchPosts } from "@/shared/api-services/posts";

export function usePosts(params: { q?: string; limit: number; skip: number }) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => fetchPosts(params),
  });
}
