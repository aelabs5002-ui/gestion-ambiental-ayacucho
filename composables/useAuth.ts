export interface AuthUser {
  id: string
  nombre: string
  cedula: string
  correo: string
  telefono: string
  rol: 'usuario' | 'admin' | 'supervisor'
  estado: string
  hogar?: {
    id: string
    numeroCasa: string
    direccion: string
    numeroCuenta: string
    sectorId: string
    estado: string
    sector: {
      id: string
      nombre: string
      horarioEstimado: string
      latitud: number
      longitud: number
    }
  } | null
}

export interface SystemSettings {
  tasaCambio: number
  montoMensualUsd: number
  nombreInstitucion: string
  demoMode: boolean
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth_user', () => null)
  const settings = useState<SystemSettings>('sys_settings', () => ({
    tasaCambio: 58.5,
    montoMensualUsd: 3.0,
    nombreInstitucion: 'Instituto Municipal de Gestión Ambiental — Ayacucho',
    demoMode: true
  }))
  const unreadCount = useState<number>('unread_notifications', () => 0)
  const loaded = useState<boolean>('auth_loaded', () => false)

  const fetchMe = async (force = false) => {
    if (loaded.value && !force) return user.value
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const data = await $fetch<{
        usuario: AuthUser | null
        settings: SystemSettings
        notificacionesNoLeidas: number
      }>('/api/auth/me', { headers })
      user.value = data.usuario
      if (data.settings) settings.value = data.settings
      unreadCount.value = data.notificacionesNoLeidas || 0
    } catch {
      user.value = null
    } finally {
      loaded.value = true
    }
    return user.value
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    unreadCount.value = 0
    await navigateTo('/login')
  }

  const homePathForRole = (rol?: string) => {
    if (rol === 'admin') return '/admin'
    if (rol === 'supervisor') return '/supervisor'
    return '/usuario'
  }

  return {
    user,
    settings,
    unreadCount,
    loaded,
    fetchMe,
    logout,
    homePathForRole
  }
}
