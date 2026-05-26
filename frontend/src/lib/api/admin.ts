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
  return apiClient<ApiResponse<LoginResponse>>('/admin/login', {
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
    `/admin/articles?page=${page}&per_page=${perPage}`,
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
  return apiClient<ApiResponse<Article>>(`/admin/articles/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function createArticle(
  data: CreateArticleRequest,
  token: string
): Promise<ApiResponse<Article>> {
  return apiClient<ApiResponse<Article>>('/admin/articles', {
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
  return apiClient<ApiResponse<Article>>(`/admin/articles/${id}`, {
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
    `/admin/articles/${id}`,
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
    `/admin/comments?page=${page}&per_page=${perPage}`,
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
    `/admin/comments/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}

export interface CreateTagRequest {
  name: string
  slug: string
}

export interface UpdateTagRequest extends CreateTagRequest {}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export async function createTag(
  data: CreateTagRequest,
  token: string
): Promise<ApiResponse<Tag>> {
  return apiClient<ApiResponse<Tag>>('/admin/tags', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function updateTag(
  id: string,
  data: UpdateTagRequest,
  token: string
): Promise<ApiResponse<Tag>> {
  return apiClient<ApiResponse<Tag>>(`/admin/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function deleteTag(
  id: string,
  token: string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient<ApiResponse<{ message: string }>>(
    `/admin/tags/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}
