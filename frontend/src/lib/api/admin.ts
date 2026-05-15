import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { Article } from '@/types/article'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  admin: {
    id: string
    username: string
    email: string
    created_at: string
    updated_at: string
  }
}

export interface CreateArticleRequest {
  title: string
  slug: string
  summary?: string
  content: string
  category_id?: string
  tags?: string[]
  status: 'draft' | 'published'
}

export interface UpdateArticleRequest extends CreateArticleRequest {}

export interface CommentWithArticle {
  id: string
  article_id: string
  article_title: string
  article_slug: string
  nickname: string
  content: string
  created_at: string
}

export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return apiClient<ApiResponse<LoginResponse>>('/api/v1/admin/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function listAllArticles(
  page: number = 1,
  perPage: number = 20,
  token: string
): Promise<ApiResponse<Article[]>> {
  return apiClient<ApiResponse<Article[]>>(
    `/api/v1/admin/articles?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}

export async function getArticleById(
  id: string,
  token: string
): Promise<ApiResponse<Article>> {
  return apiClient<ApiResponse<Article>>(`/api/v1/admin/articles/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function createArticle(
  data: CreateArticleRequest,
  token: string
): Promise<ApiResponse<Article>> {
  return apiClient<ApiResponse<Article>>('/api/v1/admin/articles', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function updateArticle(
  id: string,
  data: UpdateArticleRequest,
  token: string
): Promise<ApiResponse<Article>> {
  return apiClient<ApiResponse<Article>>(`/api/v1/admin/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function deleteArticle(
  id: string,
  token: string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient<ApiResponse<{ message: string }>>(
    `/api/v1/admin/articles/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}

export async function listAllComments(
  page: number = 1,
  perPage: number = 20,
  token: string
): Promise<ApiResponse<CommentWithArticle[]>> {
  return apiClient<ApiResponse<CommentWithArticle[]>>(
    `/api/v1/admin/comments?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}

export async function deleteComment(
  id: string,
  token: string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient<ApiResponse<{ message: string }>>(
    `/api/v1/admin/comments/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}
