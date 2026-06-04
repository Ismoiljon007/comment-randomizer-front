import type { ApiResponse, Category } from '~/types/api'

export interface CategoryQuery {
  page?: number
  pageSize?: number
  q?: string
}

// Typed wrappers around the /categories endpoints.
// The backend already returns the standard envelope, so responses pass through.
// `list` is paginated; pass a large pageSize to fetch every category at once.
export function useCategories() {
  const { $api } = useNuxtApp()

  return {
    list: (query: CategoryQuery = {}) =>
      $api<ApiResponse<Category[]>>('/categories', { query }),

    get: (id: string) =>
      $api<ApiResponse<Category>>(`/categories/${id}`),

    create: (body: { name: string, description?: string }) =>
      $api<ApiResponse<Category>>('/categories', { method: 'POST', body }),

    update: (id: string, body: { name?: string, description?: string | null }) =>
      $api<ApiResponse<Category>>(`/categories/${id}`, { method: 'PATCH', body }),

    remove: async (id: string) => {
      await $api(`/categories/${id}`, { method: 'DELETE' })
      return apiSuccess<null>(null)
    }
  }
}
