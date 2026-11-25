<script setup lang="ts">
import { Plus, RefreshCw, Truck, X } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const { data, refresh } = await useFetch<any>('/api/unidades')
const unidades = computed(() => data.value?.unidades || [])
const historial = computed(() => data.value?.historialUbicaciones || [])
const selectedId = ref<string | null>(null)
const refreshing = ref(false)
const modalNueva = ref(false)

const nuevaForm = reactive({
  identificador: '',
  placa: '',
  chofer: '',
  estado: 'en_ruta',
  sectoresAsignados: '',
  horarioEstimado: 'Lun–Sáb · 7:00 AM – 4:00 PM'
})

const simularMovimiento = async () => {
  refreshing.value = true
  try {
    data.value = await $fetch<any>('/api/unidades?simular=1')
  } finally {
    refreshing.value = false
  }
}

const cambiarEstado = async (u: any, estado: string) => {
  await $fetch(`/api/unidades/${u.id}`, {
    method: 'PUT',
    body: { estado }
  })
  await refresh()
}

const crearUnidad = async () => {
  await $fetch('/api/unidades', { method: 'POST', body: nuevaForm })
  modalNueva.value = false
  nuevaForm.identificador = ''
  nuevaForm.placa = ''
  nuevaForm.chofer = ''
  nuevaForm.sectoresAsignados = ''
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[#1A1A1A]">Despacho y Gestión de Unidades</h1>
        <p class="text-sm text-[#616161]">Control en tiempo real de la flota de recolección del Municipio Ayacucho.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-outline" :disabled="refreshing" @click="simularMovimiento">
          <RefreshCw class="w-4 h-4" :class="refreshing ? 'animate-spin' : ''" />
          Simular avance GPS
        </button>
        <button class="btn-primary" @click="modalNueva = true">
          <Plus class="w-4 h-4" />
          Añadir Unidad
        </button>
      </div>
    </div>

    <!-- Layout 2 columnas 60% / 40% -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div class="card-surface p-2 lg:col-span-3">
        <UnitsMap
          :unidades="unidades"
          :selected-id="selectedId"
          height-class="h-[380px] lg:h-[460px]"
          @select="(id) => (selectedId = id)"
        />
      </div>

      <div class="lg:col-span-2 space-y-3">
        <div
          v-for="u in unidades"
          :key="u.id"
          class="card-surface space-y-3 cursor-pointer transition"
          :class="selectedId === u.id ? 'border-[#1565C0] ring-2 ring-[#1565C0]/20' : ''"
          @click="selectedId = u.id"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-lg bg-[#1565C0]/10 text-[#1565C0] flex items-center justify-center">
                <Truck class="w-5 h-5" />
              </div>
              <div>
                <div class="font-bold text-sm text-[#1A1A1A]">{{ u.identificador }} · {{ u.placa }}</div>
                <div class="text-xs text-[#616161]">Chofer: {{ u.chofer }}</div>
              </div>
            </div>
            <StatusBadge :status="u.estado" />
          </div>

          <div class="text-xs text-[#1A1A1A]">
            <strong>Sectores:</strong> {{ u.sectoresAsignados }}
          </div>

          <div class="flex items-center justify-between gap-2 pt-2 border-t border-[#EEEEEE]">
            <span class="text-[11px] text-[#616161]">
              Act.: {{ new Date(u.ultimaActualizacion).toLocaleTimeString('es-VE') }}
            </span>
            <select
              :value="u.estado"
              class="rounded border border-[#BDBDBD] text-xs px-2 py-1 bg-white"
              @click.stop
              @change="cambiarEstado(u, ($event.target as HTMLSelectElement).value)"
            >
              <option value="en_ruta">En ruta</option>
              <option value="detenida">Detenida</option>
              <option value="fuera_de_servicio">Fuera de servicio</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Historial de Ubicaciones -->
    <section class="card-surface space-y-3">
      <h2 class="text-lg font-semibold text-[#1A1A1A]">Historial de Ubicaciones GPS</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#F5F7FA] text-xs font-semibold uppercase text-[#616161]">
              <th class="py-2.5 px-4">Unidad</th>
              <th class="py-2.5 px-4">Fecha / Hora</th>
              <th class="py-2.5 px-4">Sector</th>
              <th class="py-2.5 px-4">Coordenadas</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#EEEEEE] text-xs">
            <tr v-for="loc in historial.slice(0, 10)" :key="loc.id">
              <td class="py-2.5 px-4 font-semibold text-[#1A1A1A]">{{ loc.unidad?.identificador }}</td>
              <td class="py-2.5 px-4 text-[#616161]">{{ new Date(loc.timestamp).toLocaleString('es-VE') }}</td>
              <td class="py-2.5 px-4 text-[#1A1A1A]">{{ loc.sectorNombre }}</td>
              <td class="py-2.5 px-4 font-mono text-[#616161]">
                {{ loc.latitud.toFixed(5) }}, {{ loc.longitud.toFixed(5) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modal añadir unidad -->
    <Teleport to="body">
      <div v-if="modalNueva" class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" @click.self="modalNueva = false">
        <div class="bg-white rounded-xl shadow-modal w-full max-w-md p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Añadir Unidad de Recolección</h3>
            <button class="p-1 rounded hover:bg-[#F5F7FA]" @click="modalNueva = false">
              <X class="w-5 h-5" />
            </button>
          </div>
          <form class="space-y-3" @submit.prevent="crearUnidad">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium mb-1">Identificador</label>
                <input v-model="nuevaForm.identificador" required class="input-field" placeholder="Unidad 4" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">Placa</label>
                <input v-model="nuevaForm.placa" required class="input-field" placeholder="A88XY2P" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Chofer asignado</label>
              <input v-model="nuevaForm.chofer" required class="input-field" placeholder="Nombre del conductor" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Sectores asignados</label>
              <input v-model="nuevaForm.sectoresAsignados" required class="input-field" placeholder="Ej. Centro, La Popa" />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn-ghost" @click="modalNueva = false">Cancelar</button>
              <button type="submit" class="btn-primary">Crear Unidad</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
