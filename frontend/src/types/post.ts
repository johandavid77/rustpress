export type PostStatus = 'draft' | 'published' | 'archived';
export type PostType = 'post' | 'page' | 'custom';

export interface Post {
  id: string; title: string; slug: string; content: string | null;
  excerpt: string | null; post_type: PostType; status: PostStatus;
  author_id: string; meta: Record<string, unknown>;
  published_at: string | null; created_at: string; updated_at: string;
}
export interface CreatePostDto {
  title: string; slug?: string; content?: string;
  excerpt?: string; post_type?: PostType; meta?: Record<string, unknown>;
}
export interface UpdatePostDto extends Partial<CreatePostDto> { status?: PostStatus; }
export interface PostListResponse {
  data: Post[]; total: number; page: number; per_page: number; total_pages: number;
}
