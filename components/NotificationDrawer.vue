<script setup lang="ts">
import { Bell, X, CheckCheck } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
}>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const { unreadCount } = useAuth()
const loading = ref(false)
const notificaciones = ref<any[]>([])

const cargar = async () => {
  loading.value = true
  try {
    const res = await $fetch<{ notificaciones: any[] }>('/api/notificaciones')
    notificaciones.value = res.notificaciones
  } finally {
    loading.value = false
  }
}

const marcarLeidas = async () => {
  await $fetch('/api/notificaciones/leer', { method: 'POST' })
  unreadCount.value = 0
  notificaciones.value = notificaciones.value.map((n) => ({ ...n, leida: true }))
}

const abrirEnlace = async (n: any) => {
  emit('close')
  if (n.enlace) {
    await navigateTo(n.enlace)
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) cargar()
  }
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex justify-end bg-black/40" @click.self="emit('close')">
      <div class="w-full max-w-md bg-white h-full shadow-modal flex flex-col">
        <div class="px-4 py-3.5 border-b border-[#EEEEEE] flex items-center justify-between bg-[#1565C0] text-white">
          <div class="flex items-center gap-2 font-semibold">
            <Bell class="w-5 h-5" />
            <span>Notificaciones</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="unreadCount > 0"
              class="text-xs bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
              @click="marcarLeidas"
            >
              <CheckCheck class="w-3.5 h-3.5" />
              Leer todo
            </button>
            <button class="p-1.5 rounded-lg hover:bg-white/15" aria-label="Cerrar" @click="emit('close')">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto divide-y divide-[#EEEEEE]">
          <div v-if="loading" class="p-6 text-center text-sm text-[#616161]">
            Cargando notificaciones...
          </div>
          <div v-else-if="notificaciones.length === 0" class="p-8 text-center text-sm text-[#616161]">
            No tienes notificaciones todavía.
          </div>
          <button
            v-for="n in notificaciones"
            :key="n.id"
            class="w-full text-left p-4 hover:bg-[#F5F7FA] transition flex flex-col gap-1"
            :class="!n.leida ? 'bg-[#1565C0]/[0.04]' : ''"
            @click="abrirEnlace(n)"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="text-sm font-semibold text-[#1A1A1A]">{{ n.titulo }}</span>
              <span v-if="!n.leida" class="w-2 h-2 rounded-full bg-[#1565C0] mt-1.5 shrink-0" />
            </div>
            <p class="text-xs text-[#616161] leading-relaxed">{{ n.mensaje }}</p>
            <span class="text-[11px] text-[#9E9E9E] mt-1">
              {{ new Date(n.fechaCreacion).toLocaleString('es-VE') }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
