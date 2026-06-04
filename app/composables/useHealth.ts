import type { ApiResponse } from '~/types/api'

// Checks whether the backend API is online (GET /health).
export function useHealth() {
  const { $api } = useNuxtApp()

  return {
    check: () => $api<ApiResponse<{ ok: boolean }>>('/health')
  }
}
