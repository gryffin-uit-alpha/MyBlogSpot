import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface Comment {
  id: string
  article_id: string
  nickname: string
  content: string
  parent_id?: string
  approved: boolean
  replies?: Comment[]
  created_at: string
}

export interface CreateCommentRequest {
  nickname: string
  content: string
  parent_id?: string
}

export async function listComments(
  slug: string,
  page: number = 1,
  perPage: number = 20
): Promise<ApiResponse<Comment[]>> {
  // Add timestamp to prevent caching
  const timestamp = Date.now();
  return apiClient<ApiResponse<Comment[]>>(
    `/articles/${slug}/comments?page=${page}&per_page=${perPage}&_t=${timestamp}`
  )
}

export async function createComment(
  slug: string,
  data: CreateCommentRequest
): Promise<ApiResponse<Comment>> {
  return apiClient<ApiResponse<Comment>>(`/articles/${slug}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
