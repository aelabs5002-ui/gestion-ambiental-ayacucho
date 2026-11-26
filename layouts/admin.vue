<script setup lang="ts">
import {
  LayoutDashboard,
  Users,
  Mail,
  MessageSquareWarning,
  Truck,
  ShieldCheck,
  Eye,
  Bell,
  LogOut,
  Menu,
  X,
  Recycle
} from 'lucide-vue-next'

const route = useRoute()
const { user, unreadCount, logout } = useAuth()
const drawerOpen = ref(false)
const mobileMenuOpen = ref(false)

const isSupervisor = computed(() => user.value?.rol === 'supervisor')

const navItems = computed(() => {
  if (isSupervisor.value) {
    return [{ to: '/supervisor', label: 'Supervisión', icon: Eye }]
  }
  return [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/hogares', label: 'Hogares', icon: Users },
    { to: '/admin/avisos', label: 'Avisos de Cobro', icon: Mail },
    { to: '/admin/denuncias', label: 'Denuncias', icon: MessageSquareWarning },
    { to: '/admin/unidades', label: 'Unidades', icon: Truck },
    { to: '/admin/administradores', label: 'Administradores', icon: ShieldCheck },
    { to: '/supervisor', label: 'Vista Supervisor', icon: Eye }
  ]
})

const fechaHoy = computed(() =>
  new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
)

const isActive = (path: string) => {
  if (path === '/admin' || path === '/supervisor') return route.path === path
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-[#F5F7FA] flex flex-col">
    <DemoBanner />

    <div class="flex-1 flex">
      <!-- Sidebar fija desktop -->
      <aside class="hidden lg:flex lg:flex-col lg:w-64 bg-[#1565C0] text-white shrink-0">
        <div class="p-4 border-b border-white/15 flex flex-col items-center gap-2">
          <img
            src="/images/logo-alcaldia-ayacucho.png"
            alt="Alcaldía Bolivariana del Municipio Ayacucho"
            class="w-full max-w-[210px] h-auto object-contain"
          />
          <div class="text-[11px] font-medium text-[#DAE5FF] tracking-wide uppercase">
            Panel Institucional · Aseo Urbano
          </div>
        </div>

        <nav class="flex-1 p-3 space-y-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition"
            :class="
              isActive(item.to)
                ? 'bg-white text-[#1565C0] shadow-sm'
                : 'text-white/90 hover:bg-white/10'
            "
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <div class="p-4 border-t border-white/15">
          <div class="text-xs text-[#DAE5FF] uppercase tracking-wider mb-0.5">
            {{ isSupervisor ? 'Supervisor Municipal' : 'Administrador' }}
          </div>
          <div class="text-sm font-semibold truncate mb-3">{{ user?.nombre }}</div>
          <button
            class="w-full flex items-center justify-center gap-2 rounded-lg bg-white/15 hover:bg-white/25 py-2 text-xs font-medium text-white transition"
            @click="logout"
          >
            <LogOut class="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- Drawer móvil/tablet -->
      <Teleport to="body">
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-0 z-50 flex lg:hidden bg-black/40"
          @click.self="mobileMenuOpen = false"
        >
          <aside class="w-72 bg-[#1565C0] text-white h-full flex flex-col shadow-modal">
            <div class="p-4 border-b border-white/15 flex items-center justify-between gap-2">
              <img
                src="/images/logo-alcaldia-ayacucho.png"
                alt="Alcaldía de Ayacucho"
                class="h-10 w-auto object-contain"
              />
              <button class="p-1.5 rounded-lg hover:bg-white/15 shrink-0" @click="mobileMenuOpen = false">
                <X class="w-5 h-5" />
              </button>
            </div>
            <nav class="flex-1 p-3 space-y-1">
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium"
                :class="
                  isActive(item.to)
                    ? 'bg-white text-[#1565C0]'
                    : 'text-white/90 hover:bg-white/10'
                "
                @click="mobileMenuOpen = false"
              >
                <component :is="item.icon" class="w-5 h-5" />
                <span>{{ item.label }}</span>
              </NuxtLink>
            </nav>
            <div class="p-4 border-t border-white/15">
              <div class="text-sm font-semibold mb-2">{{ user?.nombre }}</div>
              <button
                class="w-full flex items-center justify-center gap-2 rounded-lg bg-white/15 py-2 text-xs font-medium"
                @click="logout"
              >
                <LogOut class="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      </Teleport>

      <!-- Contenido -->
      <div class="flex-1 flex flex-col min-w-0">
        <header class="sticky top-0 z-30 bg-white border-b border-[#E0E4E8] px-4 lg:px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <button
              class="lg:hidden p-2 rounded-lg text-[#1A1A1A] hover:bg-[#F5F7FA]"
              aria-label="Abrir menú"
              @click="mobileMenuOpen = true"
            >
              <Menu class="w-5 h-5" />
            </button>
            <div class="min-w-0">
              <div class="text-sm md:text-base font-bold text-[#1A1A1A] truncate">
                Instituto Municipal de Gestión Ambiental — Ayacucho
              </div>
              <div class="text-xs text-[#616161] capitalize truncate">{{ fechaHoy }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="relative p-2 rounded-lg hover:bg-[#F5F7FA] text-[#1A1A1A]"
              aria-label="Notificaciones"
              @click="drawerOpen = true"
            >
              <Bell class="w-5 h-5" />
              <span
                v-if="unreadCount > 0"
                class="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C62828] text-white text-[10px] font-bold flex items-center justify-center"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </button>
          </div>
        </header>

        <main class="flex-1 w-full max-w-[1440px] mx-auto p-4 lg:p-6">
          <slot />
        </main>
      </div>
    </div>

    <NotificationDrawer :open="drawerOpen" @close="drawerOpen = false" />
  </div>
</template>
