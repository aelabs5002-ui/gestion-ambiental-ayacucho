<script setup lang="ts">
import {
  Home,
  CreditCard,
  MapPin,
  MessageSquare,
  AlertTriangle,
  User,
  Bell,
  LogOut,
  Recycle
} from 'lucide-vue-next'

const route = useRoute()
const { user, unreadCount, logout } = useAuth()
const drawerOpen = ref(false)

const navItems = [
  { to: '/usuario', label: 'Inicio', icon: Home },
  { to: '/usuario/pagos', label: 'Pagos', icon: CreditCard },
  { to: '/usuario/mapa', label: 'Mapa', icon: MapPin },
  { to: '/usuario/chat', label: 'Chat IA', icon: MessageSquare },
  { to: '/usuario/reportes', label: 'Reportes', icon: AlertTriangle },
  { to: '/usuario/perfil', label: 'Perfil', icon: User }
]

const mobileItems = navItems.slice(0, 5)

const isActive = (path: string) => {
  if (path === '/usuario') return route.path === '/usuario'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-[#F5F7FA] flex flex-col">
    <DemoBanner />

    <div class="flex-1 flex">
      <!-- Sidebar fija escritorio (lg+) -->
      <aside class="hidden lg:flex lg:flex-col lg:w-64 bg-[#1565C0] text-white shrink-0">
        <div class="p-5 border-b border-white/15 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <Recycle class="w-6 h-6 text-white" />
          </div>
          <div class="min-w-0">
            <div class="font-bold text-sm leading-tight">Gestión Ambiental</div>
            <div class="text-xs text-[#DAE5FF] truncate">Municipio Ayacucho</div>
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
          <div class="text-xs text-[#DAE5FF] mb-0.5">Cuenta {{ user?.hogar?.numeroCuenta }}</div>
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

      <!-- Contenido principal -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header institucional mobile-first -->
        <header class="sticky top-0 z-30 bg-[#1565C0] lg:bg-white text-white lg:text-[#1A1A1A] border-b border-[#E0E4E8] px-4 h-14 flex items-center justify-between">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="lg:hidden w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Recycle class="w-5 h-5 text-white" />
            </div>
            <div class="min-w-0">
              <div class="text-sm font-bold leading-tight truncate">
                Gestión Ambiental Ayacucho
              </div>
              <div class="text-[11px] text-[#DAE5FF] lg:text-[#616161] truncate">
                {{ user?.hogar?.sector?.nombre || 'Portal del Vecino' }} · {{ user?.hogar?.numeroCuenta }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              class="relative p-2 rounded-lg hover:bg-white/15 lg:hover:bg-[#F5F7FA] transition"
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
            <NuxtLink
              to="/usuario/perfil"
              class="lg:hidden p-2 rounded-lg hover:bg-white/15 transition"
              aria-label="Mi Perfil"
            >
              <User class="w-5 h-5" />
            </NuxtLink>
          </div>
        </header>

        <!-- Cuerpo con padding inferior en móvil para la bottom nav -->
        <main class="flex-1 w-full max-w-[1100px] mx-auto px-4 py-5 pb-24 lg:pb-8">
          <slot />
        </main>
      </div>
    </div>

    <!-- Navegación inferior fija en móvil y tablet (< lg) -->
    <nav
      class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E0E4E8] shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
      aria-label="Navegación principal móvil"
    >
      <div class="grid grid-cols-5 h-16 max-w-lg mx-auto">
        <NuxtLink
          v-for="item in mobileItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition"
          :class="isActive(item.to) ? 'text-[#1565C0]' : 'text-[#616161]'"
        >
          <div
            class="px-3 py-1 rounded-full transition"
            :class="isActive(item.to) ? 'bg-[#1565C0]/12' : ''"
          >
            <component :is="item.icon" class="w-5 h-5" />
          </div>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <NotificationDrawer :open="drawerOpen" @close="drawerOpen = false" />
  </div>
</template>
