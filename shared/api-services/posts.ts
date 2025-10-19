import { clientGet } from "./http";

export type PostReactions =
  | number
  | {
      likes?: number;
      dislikes?: number;
      comments?: number;
      [key: string]: number | undefined;
    };

export interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
  views?: number;
  reactions?: PostReactions;
  likes?: number;
  comments?: number;
  [key: string]: unknown;
}

export interface PostsResponse { posts: Post[]; total: number; skip?: number; limit?: number; }

export async function fetchPosts(params?: {
  q?: string;
  limit?: number;
  skip?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.skip != null) qs.set("skip", String(params.skip));
  if (params?.sortBy) qs.set("sortBy", params.sortBy);
  if (params?.order) qs.set("order", params.order);

  const path = params?.q
    ? `/posts/search?${qs}`
    : (qs.toString() ? `/posts?${qs}` : `/posts`);

  return clientGet<PostsResponse>(path);
}

export async function fetchPostById(id: number) {
  return clientGet<Post>(`/posts/${id}`);
}
