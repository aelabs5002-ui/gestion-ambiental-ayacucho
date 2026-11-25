<script setup lang="ts">
import {
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  FileDown,
  ShieldCheck
} from 'lucide-vue-next'

definePageMeta({ layout: 'usuario' })

const { fetchMe } = useAuth()
const anioFiltro = ref<string>('')
const { data, refresh } = await useFetch<any>('/api/pagos/resumen', {
  query: computed(() => (anioFiltro.value ? { anio: anioFiltro.value } : {}))
})

const selectedIds = ref<string[]>([])
const metodo = ref('Ubii Pagos (Pago Móvil)')
const telefonoPagoMovil = ref('0414-7123456')
const bancoOrigen = ref('0102 — Banco de Venezuela')
const procesando = ref(false)
const errorMsg = ref('')
const pagoExitoso = ref<any>(null)

const bancosVenezuela = [
  '0102 — Banco de Venezuela',
  '0105 — Banco Mercantil',
  '0108 — BBVA Provincial',
  '0134 — Banesco',
  '0191 — BNC (Banco Nacional de Crédito)',
  '0172 — Bancamiga'
]

const pendientes = computed(() => data.value?.pendientes || [])
const historial = computed(() => data.value?.historial || [])
const settings = computed(() => data.value?.settings)

watchEffect(() => {
  if (pendientes.value.length > 0 && selectedIds.value.length === 0) {
    selectedIds.value = pendientes.value.map((p: any) => p.id)
  }
})

const totalSeleccionadoUsd = computed(() =>
  pendientes.value
    .filter((p: any) => selectedIds.value.includes(p.id))
    .reduce((acc: number, p: any) => acc + p.montoUsd, 0)
)

const totalSeleccionadoBs = computed(() =>
  Number((totalSeleccionadoUsd.value * (settings.value?.tasaCambio || 58.5)).toFixed(2))
)

const togglePeriodo = (id: string) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

const confirmarPago = async () => {
  errorMsg.value = ''
  if (selectedIds.value.length === 0) {
    errorMsg.value = 'Selecciona al menos un período pendiente.'
    return
  }
  procesando.value = true
  try {
    const res = await $fetch<any>('/api/pagos/crear', {
      method: 'POST',
      body: {
        pagoIds: selectedIds.value,
        metodo: metodo.value,
        telefonoPagoMovil: telefonoPagoMovil.value,
        bancoOrigen: bancoOrigen.value
      }
    })
    pagoExitoso.value = res
    selectedIds.value = []
    await refresh()
    await fetchMe(true)
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'No se pudo procesar el pago.'
  } finally {
    procesando.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Pagos e Historial</h1>
      <p class="text-sm text-[#616161]">
        Cancela tu tarifa mensual de $3.00 USD con Ubii Pagos y descarga tus comprobantes en PDF.
      </p>
    </div>

    <!-- Confirmación de pago exitoso -->
    <div
      v-if="pagoExitoso"
      class="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/30 p-5 space-y-3"
      role="status"
    >
      <div class="flex items-start gap-3">
        <CheckCircle2 class="w-6 h-6 text-[#2E7D32] shrink-0 mt-0.5" />
        <div class="space-y-1">
          <h2 class="text-base font-bold text-[#2E7D32]">¡Pago confirmado exitosamente!</h2>
          <p class="text-sm text-[#1A1A1A]">
            {{ pagoExitoso.resultado?.mensaje }}
          </p>
          <p class="text-xs font-mono text-[#2E7D32]">
            Referencia Ubii: <strong>{{ pagoExitoso.resultado?.referencia }}</strong>
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <a
          v-for="p in pagoExitoso.pagosActualizados"
          :key="p.id"
          :href="`/api/pagos/${p.id}/comprobante`"
          target="_blank"
          class="btn-primary text-xs h-9"
        >
          <FileDown class="w-4 h-4" />
          Descargar Comprobante PDF
        </a>
        <button class="btn-ghost text-xs h-9" @click="pagoExitoso = null">
          Ocultar aviso
        </button>
      </div>
    </div>

    <!-- Sección Checkout Ubii Pagos -->
    <section v-if="pendientes.length > 0" class="card-surface space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EEEEEE]">
        <div>
          <h2 class="text-lg font-semibold text-[#1A1A1A]">Checkout — Ubii Pagos</h2>
          <p class="text-xs text-[#616161]">
            Tasa de cambio referencial: Bs. {{ settings?.tasaCambio?.toFixed(2) }} / USD
          </p>
        </div>
        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#1565C0] bg-[#1565C0]/10 px-2.5 py-1 rounded-full">
          <ShieldCheck class="w-4 h-4" />
          Pasarela segura Ubii
        </span>
      </div>

      <!-- Selección de períodos pendientes -->
      <div class="space-y-2">
        <div class="text-xs font-semibold uppercase tracking-wide text-[#616161]">
          1. Períodos por cancelar
        </div>
        <label
          v-for="p in pendientes"
          :key="p.id"
          class="flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition"
          :class="
            selectedIds.includes(p.id)
              ? 'border-[#1565C0] bg-[#1565C0]/[0.04]'
              : 'border-[#E0E4E8] hover:bg-[#F5F7FA]'
          "
        >
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              :checked="selectedIds.includes(p.id)"
              class="w-5 h-5 accent-[#1565C0] rounded"
              @change="togglePeriodo(p.id)"
            />
            <div>
              <div class="text-sm font-semibold text-[#1A1A1A]">{{ p.periodoLabel }}</div>
              <div class="text-xs text-[#616161]">
                Vence {{ new Date(p.fechaVenc).toLocaleDateString('es-VE') }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-[#1A1A1A]">${{ p.montoUsd.toFixed(2) }} USD</div>
            <div class="text-xs text-[#616161]">Bs. {{ p.montoBsActual.toFixed(2) }}</div>
            <StatusBadge :status="p.estado" class="mt-1" />
          </div>
        </label>
      </div>

      <!-- Selector de método Ubii -->
      <div class="space-y-2">
        <div class="text-xs font-semibold uppercase tracking-wide text-[#616161]">
          2. Método de pago en Ubii Pagos
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            class="p-3 rounded-lg border text-left flex items-center gap-2.5 transition"
            :class="
              metodo === 'Ubii Pagos (Pago Móvil)'
                ? 'border-[#1565C0] bg-[#1565C0]/[0.06] text-[#1565C0]'
                : 'border-[#E0E4E8] text-[#1A1A1A]'
            "
            @click="metodo = 'Ubii Pagos (Pago Móvil)'"
          >
            <Smartphone class="w-5 h-5 shrink-0" />
            <div>
              <div class="text-sm font-semibold">Pago Móvil</div>
              <div class="text-[11px] text-[#616161]">Confirmación inmediata</div>
            </div>
          </button>

          <button
            type="button"
            class="p-3 rounded-lg border text-left flex items-center gap-2.5 transition"
            :class="
              metodo === 'Ubii Pagos (Débito)'
                ? 'border-[#1565C0] bg-[#1565C0]/[0.06] text-[#1565C0]'
                : 'border-[#E0E4E8] text-[#1A1A1A]'
            "
            @click="metodo = 'Ubii Pagos (Débito)'"
          >
            <CreditCard class="w-5 h-5 shrink-0" />
            <div>
              <div class="text-sm font-semibold">Tarjeta Débito</div>
              <div class="text-[11px] text-[#616161]">Nacional / Ubii</div>
            </div>
          </button>

          <button
            type="button"
            class="p-3 rounded-lg border text-left flex items-center gap-2.5 transition"
            :class="
              metodo === 'Ubii Pagos (Transferencia)'
                ? 'border-[#1565C0] bg-[#1565C0]/[0.06] text-[#1565C0]'
                : 'border-[#E0E4E8] text-[#1A1A1A]'
            "
            @click="metodo = 'Ubii Pagos (Transferencia)'"
          >
            <Building2 class="w-5 h-5 shrink-0" />
            <div>
              <div class="text-sm font-semibold">Transferencia</div>
              <div class="text-[11px] text-[#616161]">Bancos nacionales</div>
            </div>
          </button>
        </div>

        <div v-if="metodo === 'Ubii Pagos (Pago Móvil)'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Banco emisor</label>
            <select v-model="bancoOrigen" class="input-field">
              <option v-for="b in bancosVenezuela" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Teléfono Pago Móvil</label>
            <input v-model="telefonoPagoMovil" class="input-field" placeholder="0414-7123456" />
          </div>
        </div>
      </div>

      <!-- Resumen y botón confirmar -->
      <div class="rounded-lg bg-[#F5F7FA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="text-xs text-[#616161]">Total a pagar</div>
          <div class="text-2xl font-bold text-[#1A1A1A]">
            ${{ totalSeleccionadoUsd.toFixed(2) }} USD
          </div>
          <div class="text-xs text-[#616161]">
            Equivalente: <strong class="text-[#1A1A1A]">Bs. {{ totalSeleccionadoBs.toFixed(2) }}</strong>
          </div>
        </div>

        <button
          class="btn-primary h-12 px-6 text-base"
          :disabled="procesando || selectedIds.length === 0"
          @click="confirmarPago"
        >
          <CreditCard class="w-5 h-5" />
          {{ procesando ? 'Procesando en Ubii...' : 'Confirmar pago ahora' }}
        </button>
      </div>

      <div v-if="errorMsg" class="text-xs text-[#C62828] font-medium">{{ errorMsg }}</div>
    </section>

    <section v-else class="card-surface bg-[#E8F5E9]/60 border-[#2E7D32]/30 flex items-center gap-3">
      <CheckCircle2 class="w-6 h-6 text-[#2E7D32] shrink-0" />
      <div>
        <div class="text-sm font-semibold text-[#2E7D32]">No tienes pagos pendientes</div>
        <div class="text-xs text-[#1A1A1A]">Tu hogar se encuentra al día con el servicio de recolección.</div>
      </div>
    </section>

    <!-- Historial de últimos 12 meses -->
    <section class="card-surface space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-[#1A1A1A]">Historial de pagos (12 meses)</h2>
        <select v-model="anioFiltro" class="input-field w-36 h-9 text-xs">
          <option value="">Todos los años</option>
          <option v-for="a in data?.aniosDisponibles || []" :key="a" :value="String(a)">
            Año {{ a }}
          </option>
        </select>
      </div>

      <!-- Vista tabla en escritorio -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#F5F7FA] text-xs font-semibold uppercase text-[#616161]">
              <th class="py-3 px-4">Período</th>
              <th class="py-3 px-4">Monto</th>
              <th class="py-3 px-4">Fecha de Pago</th>
              <th class="py-3 px-4">Método</th>
              <th class="py-3 px-4">Referencia</th>
              <th class="py-3 px-4">Estado</th>
              <th class="py-3 px-4 text-right">Recibo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#EEEEEE] text-sm">
            <tr v-for="p in historial" :key="p.id" class="hover:bg-[#FAFAFA]">
              <td class="py-3.5 px-4 font-medium text-[#1A1A1A]">{{ p.periodoLabel }}</td>
              <td class="py-3.5 px-4">
                <div class="font-semibold">${{ p.montoUsd.toFixed(2) }} USD</div>
                <div class="text-xs text-[#616161]">Bs. {{ p.montoBsActual.toFixed(2) }}</div>
              </td>
              <td class="py-3.5 px-4 text-[#616161]">
                {{ p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-VE') : '—' }}
              </td>
              <td class="py-3.5 px-4 text-[#616161]">{{ p.metodo }}</td>
              <td class="py-3.5 px-4 font-mono text-xs text-[#616161]">{{ p.referencia || '—' }}</td>
              <td class="py-3.5 px-4"><StatusBadge :status="p.estado" /></td>
              <td class="py-3.5 px-4 text-right">
                <a
                  v-if="p.estado === 'pagado'"
                  :href="`/api/pagos/${p.id}/comprobante`"
                  target="_blank"
                  class="inline-flex items-center gap-1 text-xs font-semibold text-[#1565C0] hover:underline"
                >
                  <FileDown class="w-4 h-4" />
                  PDF
                </a>
                <span v-else class="text-xs text-[#9E9E9E]">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Reflow a tarjetas en móvil (< md) -->
      <div class="md:hidden space-y-3">
        <div
          v-for="p in historial"
          :key="p.id"
          class="rounded-lg border border-[#E0E4E8] p-3.5 space-y-2"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-sm text-[#1A1A1A]">{{ p.periodoLabel }}</span>
            <StatusBadge :status="p.estado" />
          </div>
          <div class="flex items-center justify-between text-xs text-[#616161]">
            <span>Monto: <strong class="text-[#1A1A1A]">${{ p.montoUsd.toFixed(2) }} USD</strong> (Bs. {{ p.montoBsActual.toFixed(2) }})</span>
            <span>{{ p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-VE') : 'Sin pagar' }}</span>
          </div>
          <div v-if="p.referencia" class="text-[11px] font-mono text-[#616161]">
            Ref: {{ p.referencia }} · {{ p.metodo }}
          </div>
          <a
            v-if="p.estado === 'pagado'"
            :href="`/api/pagos/${p.id}/comprobante`"
            target="_blank"
            class="btn-outline w-full h-9 text-xs"
          >
            <FileDown class="w-4 h-4" />
            Descargar comprobante PDF
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
