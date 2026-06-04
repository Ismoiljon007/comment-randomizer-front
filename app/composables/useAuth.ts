import type { ApiResponse, AuthUser } from '~/types/api'

// Auth state + actions backed by the backend /auth endpoints.
// Token is stored in a cookie so it survives reloads and works during SSR.
export function useAuth() {
  const token = useCookie<string | null>('auth_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax'
  })
  const user = useState<AuthUser | null>('auth.user', () => null)
  const { $api } = useNuxtApp()

  const isLoggedIn = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const res = await $api<ApiResponse<{ user: AuthUser, token: string }>>('/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    token.value = res.data.token
    user.value = res.data.user
    return res
  }

  // Validates the stored token against /auth/me. Clears it if invalid/expired.
  async function fetchMe() {
    if (!token.value) {
      user.value = null
      return null
    }

    try {
      const res = await $api<ApiResponse<AuthUser>>('/auth/me')
      user.value = res.data
      return res.data
    } catch {
      token.value = null
      user.value = null
      return null
    }
  }

  async function logout() {
    token.value = null
    user.value = null
    await navigateTo('/login')
  }

  return { token, user, isLoggedIn, login, fetchMe, logout }
}
