import { useQuery } from "@tanstack/react-query";
import { fetchCommentsByPost } from "@/shared/api-services/comments";

export function useComments(postId: number | null) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchCommentsByPost(postId as number),
    enabled: !!postId,
  });
}
