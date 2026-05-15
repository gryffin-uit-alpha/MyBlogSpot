export interface Tag {
  id: string;
  name: string;
  slug: string;
  article_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TagWithArticles extends Tag {
  articles?: Array<{
    id: string;
    title: string;
    slug: string;
    summary?: string;
    published_at: string;
  }>;
}
