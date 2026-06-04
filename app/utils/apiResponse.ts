import type { ApiResponse } from '~/types/api'

// Builds a success envelope locally. Used for 204 (no-body) responses such as
// DELETE, where the backend returns nothing but callers still expect the
// standard { status, data, message } shape.
export function apiSuccess<T>(data: T): ApiResponse<T> {
  return {
    status: 'success',
    data,
    message: ''
  }
}
