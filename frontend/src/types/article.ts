export interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  category_id?: string;
  category?: Category;
  tags?: Tag[];
  status: 'draft' | 'published';
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  category_id?: string;
  category?: Category;
  tags?: Tag[];
  view_count: number;
  published_at?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  article_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  article_count?: number;
  created_at: string;
}
