<script setup lang="ts">
import {
  Search,
  Download,
  RotateCcw,
  DollarSign,
  Edit3,
  Power,
  Mail,
  X,
  CheckCircle2
} from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const { data: sectoresData } = await useFetch<{ sectores: any[] }>('/api/sectores')
const sectores = computed(() => sectoresData.value?.sectores || [])

const filtros = reactive({
  q: '',
  sectorId: '',
  estadoPago: '',
  estadoCuenta: '',
  page: 1
})

const { data, refresh } = await useFetch<any>('/api/admin/hogares', {
  query: filtros
})

const items = computed(() => data.value?.items || [])
const pagination = computed(() => data.value?.pagination || { page: 1, totalPages: 1, total: 0 })

const toast = ref('')
const showToast = (msg: string) => {
  toast.value = msg
  setTimeout(() => {
    toast.value = ''
  }, 3500)
}

const limpiarFiltros = () => {
  filtros.q = ''
  filtros.sectorId = ''
  filtros.estadoPago = ''
  filtros.estadoCuenta = ''
  filtros.page = 1
}

const exportUrl = computed(() => {
  const params = new URLSearchParams({ export: 'csv' })
  if (filtros.q) params.set('q', filtros.q)
  if (filtros.sectorId) params.set('sectorId', filtros.sectorId)
  if (filtros.estadoPago) params.set('estadoPago', filtros.estadoPago)
  if (filtros.estadoCuenta) params.set('estadoCuenta', filtros.estadoCuenta)
  return `/api/admin/hogares?${params.toString()}`
})

// Modal editar hogar
const editTarget = ref<any>(null)
const editForm = reactive({
  nombre: '',
  telefono: '',
  sectorId: '',
  numeroCasa: '',
  direccion: ''
})

const abrirEditar = (h: any) => {
  editTarget.value = h
  editForm.nombre = h.nombre
  editForm.telefono = h.telefono
  editForm.sectorId = h.sectorId
  editForm.numeroCasa = h.numeroCasa
  editForm.direccion = h.direccion
}

const guardarEdicion = async () => {
  if (!editTarget.value) return
  await $fetch(`/api/admin/hogares/${editTarget.value.id}`, {
    method: 'PUT',
    body: editForm
  })
  editTarget.value = null
  showToast('Hogar actualizado correctamente.')
  await refresh()
}

const toggleEstadoCuenta = async (h: any) => {
  const nuevo = h.estadoCuenta === 'activo' ? 'inactivo' : 'activo'
  await $fetch(`/api/admin/hogares/${h.id}`, {
    method: 'PUT',
    body: { estadoCuenta: nuevo }
  })
  showToast(`Cuenta ${h.numeroCuenta} marcada como ${nuevo}.`)
  await refresh()
}

const registrarPagoManual = async (h: any) => {
  await $fetch(`/api/admin/hogares/${h.id}/pago-manual`, {
    method: 'POST',
    body: { metodo: 'Pago en Taquilla / Manual' }
  })
  showToast(`Pago manual registrado para ${h.nombre}.`)
  await refresh()
}

const enviarAvisoRapido = async (h: any) => {
  await $fetch('/api/admin/avisos', {
    method: 'POST',
    body: {
      asunto: 'Recordatorio de pago — Aseo Urbano Ayacucho',
      mensaje:
        'Estimado(a) [Nombre], le recordamos que su pago del servicio de recolección correspondiente al mes de [Mes] por un monto de $3.00 USD se encuentra pendiente. Puede pagar rápidamente en el portal.',
      tipoDestinatario: 'manual',
      usuarioIds: [h.usuarioId]
    }
  })
  showToast(`Aviso de cobro enviado a ${h.nombre}.`)
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[#1A1A1A]">Gestión de Hogares</h1>
        <p class="text-sm text-[#616161]">
          {{ pagination.total }} hogares encontrados en el padrón municipal.
        </p>
      </div>
      <a :href="exportUrl" class="btn-primary self-start">
        <Download class="w-4 h-4" />
        Exportar a Excel/CSV
      </a>
    </div>

    <div v-if="toast" class="rounded-lg bg-[#E8F5E9] border border-[#2E7D32]/30 px-4 py-3 text-sm text-[#2E7D32] flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{{ toast }}</span>
    </div>

    <!-- Filtros -->
    <div class="card-surface grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div class="relative lg:col-span-2">
        <Search class="w-4 h-4 text-[#616161] absolute left-3 top-3" />
        <input
          v-model="filtros.q"
          class="input-field pl-9"
          placeholder="Buscar por nombre, cédula o cuenta..."
          @input="filtros.page = 1"
        />
      </div>

      <select v-model="filtros.sectorId" class="input-field" @change="filtros.page = 1">
        <option value="">Todos los sectores</option>
        <option v-for="s in sectores" :key="s.id" :value="s.id">{{ s.nombre }}</option>
      </select>

      <select v-model="filtros.estadoPago" class="input-field" @change="filtros.page = 1">
        <option value="">Estado de pago (todos)</option>
        <option value="pagado">Pagado</option>
        <option value="pendiente">Pendiente</option>
        <option value="vencido">Vencido</option>
      </select>

      <div class="flex gap-2">
        <select v-model="filtros.estadoCuenta" class="input-field flex-1" @change="filtros.page = 1">
          <option value="">Cuenta (todas)</option>
          <option value="activo">Activa</option>
          <option value="inactivo">Inactiva</option>
        </select>
        <button class="btn-ghost px-2.5 border border-[#E0E4E8]" title="Limpiar filtros" @click="limpiarFiltros">
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Tabla de hogares -->
    <div class="card-surface p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr class="bg-[#F5F7FA] text-xs font-semibold uppercase text-[#616161]">
              <th class="py-3 px-4">Nombre / Cuenta</th>
              <th class="py-3 px-4">Cédula</th>
              <th class="py-3 px-4">Sector / Casa</th>
              <th class="py-3 px-4">Teléfono</th>
              <th class="py-3 px-4">Estado Mes</th>
              <th class="py-3 px-4">Monto</th>
              <th class="py-3 px-4">Fecha Pago</th>
              <th class="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#EEEEEE] text-sm">
            <tr v-for="h in items" :key="h.id" class="hover:bg-[#FAFAFA]">
              <td class="py-3 px-4">
                <div class="font-medium text-[#1A1A1A] flex items-center gap-1.5">
                  {{ h.nombre }}
                  <span v-if="h.estadoCuenta === 'inactivo'" class="badge-vencido">Inactivo</span>
                </div>
                <div class="text-xs text-[#616161]">{{ h.numeroCuenta }}</div>
              </td>
              <td class="py-3 px-4 text-[#616161]">{{ h.cedula }}</td>
              <td class="py-3 px-4">
                <div class="text-[#1A1A1A]">{{ h.sector }}</div>
                <div class="text-xs text-[#616161]">Casa {{ h.numeroCasa }}</div>
              </td>
              <td class="py-3 px-4 text-[#616161]">{{ h.telefono }}</td>
              <td class="py-3 px-4"><StatusBadge :status="h.estadoPago" /></td>
              <td class="py-3 px-4 font-semibold">${{ h.montoUsd.toFixed(2) }}</td>
              <td class="py-3 px-4 text-[#616161]">
                {{ h.fechaPago ? new Date(h.fechaPago).toLocaleDateString('es-VE') : '—' }}
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center justify-end gap-1">
                  <button
                    v-if="h.estadoPago !== 'pagado'"
                    class="p-1.5 rounded-lg text-[#2E7D32] hover:bg-[#E8F5E9]"
                    title="Registrar pago manual"
                    @click="registrarPagoManual(h)"
                  >
                    <DollarSign class="w-4 h-4" />
                  </button>
                  <button
                    v-if="h.estadoPago !== 'pagado'"
                    class="p-1.5 rounded-lg text-[#1565C0] hover:bg-[#1565C0]/10"
                    title="Enviar aviso de cobro"
                    @click="enviarAvisoRapido(h)"
                  >
                    <Mail class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1.5 rounded-lg text-[#616161] hover:bg-[#ECEEF1]"
                    title="Editar hogar"
                    @click="abrirEditar(h)"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1.5 rounded-lg hover:bg-[#FFEBEE]"
                    :class="h.estadoCuenta === 'activo' ? 'text-[#C62828]' : 'text-[#2E7D32]'"
                    :title="h.estadoCuenta === 'activo' ? 'Desactivar cuenta' : 'Activar cuenta'"
                    @click="toggleEstadoCuenta(h)"
                  >
                    <Power class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="px-4 py-3 border-t border-[#EEEEEE] flex items-center justify-between text-xs text-[#616161]">
        <span>Página {{ pagination.page }} de {{ pagination.totalPages }} ({{ pagination.total }} registros)</span>
        <div class="flex gap-2">
          <button
            class="btn-outline h-8 px-3 text-xs"
            :disabled="pagination.page <= 1"
            @click="filtros.page--"
          >
            Anterior
          </button>
          <button
            class="btn-outline h-8 px-3 text-xs"
            :disabled="pagination.page >= pagination.totalPages"
            @click="filtros.page++"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Modal editar -->
    <Teleport to="body">
      <div v-if="editTarget" class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" @click.self="editTarget = null">
        <div class="bg-white rounded-xl shadow-modal w-full max-w-md p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-[#1A1A1A]">Editar Hogar ({{ editTarget.numeroCuenta }})</h3>
            <button class="p-1 rounded hover:bg-[#F5F7FA]" @click="editTarget = null">
              <X class="w-5 h-5" />
            </button>
          </div>
          <form class="space-y-3" @submit.prevent="guardarEdicion">
            <div>
              <label class="block text-xs font-medium mb-1">Nombre</label>
              <input v-model="editForm.nombre" required class="input-field" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium mb-1">Teléfono</label>
                <input v-model="editForm.telefono" required class="input-field" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">N° Casa</label>
                <input v-model="editForm.numeroCasa" required class="input-field" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Sector</label>
              <select v-model="editForm.sectorId" class="input-field">
                <option v-for="s in sectores" :key="s.id" :value="s.id">{{ s.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Dirección</label>
              <input v-model="editForm.direccion" required class="input-field" />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn-ghost" @click="editTarget = null">Cancelar</button>
              <button type="submit" class="btn-primary">Guardar cambios</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
