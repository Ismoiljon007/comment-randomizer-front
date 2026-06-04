// Types matching the comment-randomizer backend API contract.
// The backend always responds with a standard envelope.

export type Role = 'USER' | 'ADMIN'
export type Sentiment = 'POSITIVE' | 'FUNNY' | 'CRITICAL'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
  commentCount: number
}

export interface CommentCategory {
  id: string
  name: string
  slug: string
}

export interface CommentStats {
  // Respects the applied filters (categoryId, sentiment, q).
  total_comments: number
  // Always the global category count, regardless of filters.
  total_categories: number
}

export interface Comment {
  id: string
  text: string
  sentiment: Sentiment
  categoryId: string
  createdById: string | null
  category: CommentCategory
  createdAt: string
  updatedAt: string
}

// --- Standard response envelope (matches the backend exactly) ---

export interface ApiPagination {
  next: string | null
  previous: string | null
  current_page: number
  total_pages: number
  total_items: number
}

export interface ApiResponse<T> {
  status: 'success'
  data: T
  message: string
  // Only present on list endpoints.
  pagination?: ApiPagination
}

export interface ApiError {
  status: 'error'
  data: null
  message: string
  errors?: Array<{
    field: string
    message: string
  }>
}
