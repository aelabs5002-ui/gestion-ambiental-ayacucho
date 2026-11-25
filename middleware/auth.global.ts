export default defineNuxtRouteMiddleware(async (to) => {
  const { fetchMe, homePathForRole } = useAuth()
  const user = await fetchMe()

  const publicRoutes = ['/', '/login', '/registro', '/recuperar']

  if (to.path === '/') {
    if (user) return navigateTo(homePathForRole(user.rol))
    return navigateTo('/login')
  }

  if (publicRoutes.includes(to.path)) {
    if (user && (to.path === '/login' || to.path === '/registro')) {
      return navigateTo(homePathForRole(user.rol))
    }
    return
  }

  if (!user) {
    return navigateTo('/login')
  }

  if (to.path.startsWith('/admin') && user.rol !== 'admin') {
    return navigateTo(homePathForRole(user.rol))
  }

  if (to.path.startsWith('/supervisor') && !['supervisor', 'admin'].includes(user.rol)) {
    return navigateTo(homePathForRole(user.rol))
  }

  if (to.path.startsWith('/usuario') && user.rol !== 'usuario') {
    return navigateTo(homePathForRole(user.rol))
  }
})
