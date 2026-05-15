export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  article_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithArticles extends Category {
  articles?: Array<{
    id: string;
    title: string;
    slug: string;
    summary?: string;
    published_at: string;
  }>;
}
