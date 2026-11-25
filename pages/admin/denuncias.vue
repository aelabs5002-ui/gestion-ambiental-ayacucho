<script setup lang="ts">
import { X, Send, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const filtros = reactive({
  categoria: 'todas',
  estado: 'todos'
})

const { data, refresh } = await useFetch<any>('/api/reportes', {
  query: filtros
})

const reportes = computed(() => data.value?.reportes || [])
const selected = ref<any>(null)
const respuestaMensaje = ref('')
const nuevoEstado = ref<'recibido' | 'en_proceso' | 'resuelto'>('en_proceso')
const guardando = ref(false)
const toast = ref('')

const abrirDrawer = (r: any) => {
  selected.value = r
  nuevoEstado.value = r.estado === 'recibido' ? 'en_proceso' : r.estado
  respuestaMensaje.value = ''
}

const guardarRespuesta = async () => {
  if (!selected.value || !respuestaMensaje.value.trim()) return
  guardando.value = true
  try {
    const res = await $fetch<any>(`/api/reportes/${selected.value.id}/responder`, {
      method: 'POST',
      body: {
        estado: nuevoEstado.value,
        mensaje: respuestaMensaje.value
      }
    })
    selected.value = res.reporte
    respuestaMensaje.value = ''
    toast.value = 'Respuesta guardada y notificación enviada al vecino.'
    setTimeout(() => (toast.value = ''), 3500)
    await refresh()
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Bandeja de Denuncias y Sugerencias</h1>
      <p class="text-sm text-[#616161]">
        Atiende reportes vecinales con respuesta directa y notificación inmediata.
      </p>
    </div>

    <div v-if="toast" class="rounded-lg bg-[#E8F5E9] px-4 py-3 text-sm text-[#2E7D32] flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{{ toast }}</span>
    </div>

    <!-- Filtros -->
    <div class="card-surface flex flex-wrap gap-3">
      <select v-model="filtros.categoria" class="input-field w-full sm:w-56">
        <option value="todas">Todas las categorías</option>
        <option value="Recolección no realizada">Recolección no realizada</option>
        <option value="Unidad dañada">Unidad dañada</option>
        <option value="Maltrato">Maltrato</option>
        <option value="Sugerencia">Sugerencia</option>
        <option value="Otro">Otro</option>
      </select>

      <select v-model="filtros.estado" class="input-field w-full sm:w-48">
        <option value="todos">Todos los estados</option>
        <option value="recibido">Recibido</option>
        <option value="en_proceso">En proceso</option>
        <option value="resuelto">Resuelto</option>
      </select>
    </div>

    <!-- Lista -->
    <div class="card-surface p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr class="bg-[#F5F7FA] text-xs font-semibold uppercase text-[#616161]">
              <th class="py-3 px-4">Usuario / Sector</th>
              <th class="py-3 px-4">Categoría</th>
              <th class="py-3 px-4">Descripción</th>
              <th class="py-3 px-4">Fecha</th>
              <th class="py-3 px-4">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#EEEEEE] text-sm">
            <tr
              v-for="r in reportes"
              :key="r.id"
              class="hover:bg-[#1565C0]/[0.04] cursor-pointer transition"
              @click="abrirDrawer(r)"
            >
              <td class="py-3.5 px-4">
                <div class="font-medium text-[#1A1A1A]">{{ r.usuario?.nombre }}</div>
                <div class="text-xs text-[#616161]">{{ r.sectorNombre }}</div>
              </td>
              <td class="py-3.5 px-4">
                <span class="badge-neutro">{{ r.categoria }}</span>
              </td>
              <td class="py-3.5 px-4 text-[#616161] max-w-xs truncate">{{ r.descripcion }}</td>
              <td class="py-3.5 px-4 text-xs text-[#616161]">
                {{ new Date(r.fechaCreacion).toLocaleDateString('es-VE') }}
              </td>
              <td class="py-3.5 px-4"><StatusBadge :status="r.estado" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Drawer lateral de atención -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-50 bg-black/40 flex justify-end" @click.self="selected = null">
        <div class="w-full max-w-lg bg-white h-full shadow-modal flex flex-col">
          <div class="px-5 py-4 bg-[#1565C0] text-white flex items-center justify-between">
            <div>
              <div class="text-xs text-[#DAE5FF]">{{ selected.categoria }}</div>
              <div class="font-bold">{{ selected.usuario?.nombre }} · {{ selected.sectorNombre }}</div>
            </div>
            <button class="p-1.5 rounded hover:bg-white/15" @click="selected = null">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <div class="flex items-center justify-between">
              <StatusBadge :status="selected.estado" />
              <span class="text-xs text-[#616161]">
                {{ new Date(selected.fechaCreacion).toLocaleString('es-VE') }}
              </span>
            </div>

            <div class="rounded-lg bg-[#F5F7FA] p-3.5 space-y-2 text-sm">
              <p class="text-[#1A1A1A]">{{ selected.descripcion }}</p>
              <div class="text-xs text-[#616161]"><strong>Ubicación:</strong> {{ selected.ubicacion }}</div>
              <div class="text-xs text-[#616161]"><strong>Teléfono:</strong> {{ selected.usuario?.telefono }}</div>
            </div>

            <img
              v-if="selected.fotoUrl"
              :src="selected.fotoUrl"
              alt="Foto adjunta"
              class="w-full rounded-lg border border-[#E0E4E8]"
            />

            <!-- Historial de respuestas -->
            <div class="space-y-2">
              <div class="text-xs font-semibold uppercase text-[#616161]">Respuestas anteriores</div>
              <div v-if="!selected.respuestas?.length" class="text-xs text-[#616161] italic">
                Sin respuestas aún.
              </div>
              <div
                v-for="resp in selected.respuestas"
                :key="resp.id"
                class="rounded-lg border border-[#E0E4E8] p-3 text-xs space-y-1"
              >
                <div class="font-semibold text-[#1565C0]">{{ resp.administrador?.nombre }}</div>
                <p class="text-[#1A1A1A]">{{ resp.mensaje }}</p>
                <div class="text-[10px] text-[#9E9E9E]">{{ new Date(resp.fecha).toLocaleString('es-VE') }}</div>
              </div>
            </div>

            <!-- Formulario respuesta -->
            <form class="space-y-3 pt-2 border-t border-[#EEEEEE]" @submit.prevent="guardarRespuesta">
              <div>
                <label class="block text-xs font-medium mb-1">Cambiar Estado</label>
                <select v-model="nuevoEstado" class="input-field">
                  <option value="recibido">Recibido</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="resuelto">Resuelto</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">Respuesta del administrador</label>
                <textarea
                  v-model="respuestaMensaje"
                  rows="3"
                  required
                  class="w-full rounded-lg border border-[#BDBDBD] p-3 text-sm focus:border-[#1565C0] focus:outline-none"
                  placeholder="Escribe la acción tomada para notificar al vecino..."
                />
              </div>
              <div class="flex gap-2 justify-end">
                <button type="button" class="btn-ghost" @click="selected = null">Cancelar</button>
                <button type="submit" class="btn-primary" :disabled="guardando">
                  <Send class="w-4 h-4" />
                  {{ guardando ? 'Guardando...' : 'Guardar y Notificar al Usuario' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
