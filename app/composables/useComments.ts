import type { ApiResponse, Comment, CommentStats, Sentiment } from '~/types/api'

export interface StatsQuery {
  categoryId?: string
  sentiment?: Sentiment
  q?: string
}

export interface CommentQuery {
  page?: number
  pageSize?: number
  categoryId?: string
  sentiment?: Sentiment
  q?: string
  random?: boolean
}

export interface BulkCopyOptions {
  categoryId?: string
  sentiment?: Sentiment
  limit?: number
  random?: boolean
}

// Typed wrappers around the /comments endpoints.
// The backend already returns the standard envelope, so responses pass through.
// `list` responses also carry a `pagination` block.
export function useComments() {
  const { $api } = useNuxtApp()

  return {
    list: (query: CommentQuery = {}) =>
      $api<ApiResponse<Comment[]>>('/comments', { query }),

    stats: (query: StatsQuery = {}) =>
      $api<ApiResponse<CommentStats>>('/comments/stats', { query }),

    get: (id: string) =>
      $api<ApiResponse<Comment>>(`/comments/${id}`),

    create: (body: { categoryId: string, text: string, sentiment: Sentiment }) =>
      $api<ApiResponse<Comment>>('/comments', { method: 'POST', body }),

    update: (id: string, body: { categoryId?: string, text?: string, sentiment?: Sentiment }) =>
      $api<ApiResponse<Comment>>(`/comments/${id}`, { method: 'PATCH', body }),

    remove: async (id: string) => {
      await $api(`/comments/${id}`, { method: 'DELETE' })
      return apiSuccess<null>(null)
    },

    bulkCopy: (body: BulkCopyOptions = {}) =>
      $api<ApiResponse<{ count: number, text: string, total: number }>>('/comments/bulk-copy', { method: 'POST', body })
  }
}
