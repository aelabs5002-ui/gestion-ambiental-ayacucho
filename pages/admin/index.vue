<script setup lang="ts">
import { Users, CheckCircle2, Clock, DollarSign, Save } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const { data, refresh } = await useFetch<any>('/api/admin/dashboard')
const kpis = computed(() => data.value?.kpis || {})
const tasaInput = ref<number>(58.5)
const savingTasa = ref(false)
const tasaMsg = ref('')

watchEffect(() => {
  if (data.value?.settings?.tasaCambio) {
    tasaInput.value = data.value.settings.tasaCambio
  }
})

const actualizarTasa = async () => {
  savingTasa.value = true
  tasaMsg.value = ''
  try {
    await $fetch('/api/admin/configuracion', {
      method: 'PUT',
      body: { tasaCambio: Number(tasaInput.value) }
    })
    tasaMsg.value = 'Tasa actualizada'
    await refresh()
  } finally {
    savingTasa.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado y tasa BCV editable -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[#1A1A1A]">Dashboard de Recaudación</h1>
        <p class="text-sm text-[#616161]">
          Resumen operativo y fiscal correspondiente a <strong>{{ data?.periodoActual }}</strong>
        </p>
      </div>

      <form
        class="flex items-center gap-2 bg-white border border-[#E0E4E8] rounded-lg px-3 py-2 shadow-card self-start"
        @submit.prevent="actualizarTasa"
      >
        <label class="text-xs font-medium text-[#616161] whitespace-nowrap">Tasa BCV (Bs/$):</label>
        <input
          v-model.number="tasaInput"
          type="number"
          step="0.01"
          min="1"
          class="w-24 h-8 rounded border border-[#BDBDBD] px-2 text-sm font-semibold text-[#1A1A1A]"
        />
        <button type="submit" class="btn-primary h-8 px-3 text-xs" :disabled="savingTasa">
          <Save class="w-3.5 h-3.5" />
          Guardar
        </button>
        <span v-if="tasaMsg" class="text-xs text-[#2E7D32] font-medium">{{ tasaMsg }}</span>
      </form>
    </div>

    <!-- 4 tarjetas de métricas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="card-surface space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[#616161]">Hogares Activos</span>
          <div class="w-9 h-9 rounded-lg bg-[#1565C0]/10 text-[#1565C0] flex items-center justify-center">
            <Users class="w-5 h-5" />
          </div>
        </div>
        <div class="text-2xl font-bold text-[#1A1A1A]">{{ kpis.hogaresActivos ?? 0 }}</div>
        <div class="text-xs text-[#616161]">Padrón registrado en 5 sectores</div>
      </div>

      <div class="card-surface space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[#616161]">Hogares Pagados</span>
          <span class="badge-pagado">{{ kpis.porcentajePagos ?? 0 }}%</span>
        </div>
        <div class="text-2xl font-bold text-[#2E7D32]">{{ kpis.hogaresPagados ?? 0 }}</div>
        <div class="text-xs text-[#616161] flex items-center gap-1">
          <CheckCircle2 class="w-3.5 h-3.5 text-[#2E7D32]" />
          Solventes en el mes actual
        </div>
      </div>

      <div class="card-surface space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[#616161]">Pendientes / Vencidos</span>
          <span class="badge-pendiente">{{ (kpis.hogaresPendientes ?? 0) + (kpis.hogaresVencidos ?? 0) }}</span>
        </div>
        <div class="text-2xl font-bold text-[#1A1A1A]">
          {{ kpis.hogaresPendientes ?? 0 }}
          <span class="text-sm font-semibold text-[#C62828]">({{ kpis.hogaresVencidos ?? 0 }} venc.)</span>
        </div>
        <div class="text-xs text-[#616161] flex items-center gap-1">
          <Clock class="w-3.5 h-3.5 text-[#8D5B00]" />
          Por cobrar: ${{ (kpis.montoPendienteUsd ?? 0).toFixed(2) }} USD
        </div>
      </div>

      <div class="card-surface space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[#616161]">Monto Recaudado USD</span>
          <div class="w-9 h-9 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
            <DollarSign class="w-5 h-5" />
          </div>
        </div>
        <div class="text-2xl font-bold text-[#1565C0]">
          ${{ (kpis.montoRecaudadoUsd ?? 0).toFixed(2) }}
        </div>
        <div class="text-xs text-[#616161]">
          Equiv. Bs. {{ (kpis.montoRecaudadoBs ?? 0).toFixed(2) }}
        </div>
      </div>
    </div>

    <!-- Gráficos -->
    <AdminCharts
      v-if="data"
      :pagos-por-mes="data.pagosPorMes || []"
      :pagos-por-sector="data.pagosPorSector || []"
    />

    <!-- Tabla resumen Últimos Pagos -->
    <section class="card-surface space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-[#1A1A1A]">Últimos Pagos Confirmados</h2>
        <NuxtLink to="/admin/hogares" class="text-xs font-semibold text-[#1565C0] hover:underline">
          Ver todos los hogares
        </NuxtLink>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#F5F7FA] text-xs font-semibold uppercase text-[#616161]">
              <th class="py-3 px-4">Hogar</th>
              <th class="py-3 px-4">Sector</th>
              <th class="py-3 px-4">Monto</th>
              <th class="py-3 px-4">Fecha</th>
              <th class="py-3 px-4">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#EEEEEE] text-sm">
            <tr v-for="p in data?.ultimosPagos || []" :key="p.id" class="hover:bg-[#FAFAFA]">
              <td class="py-3 px-4">
                <div class="font-medium text-[#1A1A1A]">{{ p.hogar }}</div>
                <div class="text-xs text-[#616161]">{{ p.numeroCuenta }}</div>
              </td>
              <td class="py-3 px-4 text-[#616161]">{{ p.sector }}</td>
              <td class="py-3 px-4 font-semibold text-[#1A1A1A]">
                ${{ p.montoUsd.toFixed(2) }} USD
                <span class="block text-xs font-normal text-[#616161]">Bs. {{ p.montoBs.toFixed(2) }}</span>
              </td>
              <td class="py-3 px-4 text-[#616161]">
                {{ p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-VE') : '—' }}
              </td>
              <td class="py-3 px-4"><StatusBadge :status="p.estado" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
