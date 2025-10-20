import { clientGet } from "./http";

export interface Comment {
  id: number;
  body: string;
  postId: number;
  user: { id: number; username?: string; fullName?: string; };
}

export async function fetchCommentsByPost(postId: number) {
  // у тест-API совместимая схема: /posts/{id}/comments
  return clientGet<{ comments: Comment[] }>(`/posts/${postId}/comments`);
}
