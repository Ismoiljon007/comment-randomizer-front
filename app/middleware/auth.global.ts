// Protects every route: unauthenticated users are sent to /login,
// authenticated users are kept off /login.
const PUBLIC_ROUTES = ['/login']

export default defineNuxtRouteMiddleware(async (to) => {
  const { token, user, fetchMe } = useAuth()
  const isPublic = PUBLIC_ROUTES.includes(to.path)

  // Validate the token once per session (may clear it if expired).
  if (token.value && !user.value) {
    await fetchMe()
  }

  if (!token.value && !isPublic) {
    return navigateTo('/login')
  }

  if (token.value && isPublic) {
    return navigateTo('/')
  }
})
