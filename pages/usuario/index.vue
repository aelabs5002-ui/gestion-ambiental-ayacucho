<script setup lang="ts">
import {
  CreditCard,
  MapPin,
  MessageSquare,
  AlertTriangle,
  CalendarClock,
  FileDown,
  CheckCircle2,
  ArrowRight
} from 'lucide-vue-next'

definePageMeta({ layout: 'usuario' })

const { user } = useAuth()
const { data, refresh, pending } = await useFetch<any>('/api/pagos/resumen')

const pagoActual = computed(() => data.value?.pagoActual)
const totalDeudaUsd = computed(() => data.value?.totalDeudaUsd || 0)
const totalDeudaBs = computed(() => data.value?.totalDeudaBs || 0)
const settings = computed(() => data.value?.settings)
</script>

<template>
  <div class="space-y-6">
    <!-- Saludo y cuenta -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h1 class="text-2xl font-bold text-[#1A1A1A]">
          Hola, {{ user?.nombre?.split(' ')[0] }}
        </h1>
        <p class="text-sm text-[#616161]">
          Cuenta <strong>{{ user?.hogar?.numeroCuenta }}</strong> · {{ user?.hogar?.sector?.nombre }} (Casa {{ user?.hogar?.numeroCasa }})
        </p>
      </div>
      <div class="text-xs text-[#616161] bg-white border border-[#E0E4E8] rounded-lg px-3 py-2 self-start">
        Tasa BCV ref.: <strong class="text-[#1A1A1A]">Bs. {{ settings?.tasaCambio?.toFixed(2) || '58.50' }} / USD</strong>
      </div>
    </div>

    <!-- Tarjeta principal de Estado de Cuenta -->
    <section class="bg-white rounded-xl border border-[#E0E4E8] shadow-card overflow-hidden">
      <div class="bg-[#1565C0] text-white px-5 py-4 flex items-center justify-between gap-3">
        <div>
          <div class="text-xs uppercase tracking-wider text-[#DAE5FF] font-medium">
            Estado de Cuenta · {{ pagoActual?.periodoLabel || 'Mes actual' }}
          </div>
          <div class="text-sm font-semibold mt-0.5">Servicio Mensual de Recolección</div>
        </div>
        <StatusBadge v-if="pagoActual" :status="pagoActual.estado" />
      </div>

      <div class="p-5 space-y-4">
        <div v-if="pending" class="text-sm text-[#616161] py-4">Cargando estado de cuenta...</div>

        <template v-else-if="pagoActual">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div class="text-xs text-[#616161]">
                {{ totalDeudaUsd > 0 ? 'Saldo pendiente por cancelar' : 'Tarifa mensual cancelada' }}
              </div>
              <div class="text-3xl font-bold text-[#1A1A1A] mt-0.5">
                ${{ (totalDeudaUsd > 0 ? totalDeudaUsd : pagoActual.montoUsd).toFixed(2) }}
                <span class="text-base font-semibold text-[#616161]">USD</span>
              </div>
              <div class="text-sm text-[#616161] mt-0.5">
                Equivalente referencial:
                <strong class="text-[#1A1A1A]">
                  Bs. {{ (totalDeudaUsd > 0 ? totalDeudaBs : pagoActual.montoBsActual).toFixed(2) }}
                </strong>
              </div>
            </div>

            <div class="text-xs text-[#616161] space-y-1 sm:text-right">
              <div>
                Vencimiento:
                <strong class="text-[#1A1A1A]">
                  {{ new Date(pagoActual.fechaVenc).toLocaleDateString('es-VE') }}
                </strong>
              </div>
              <div v-if="pagoActual.estado === 'pagado' && pagoActual.referencia">
                Referencia: <strong class="text-[#2E7D32]">{{ pagoActual.referencia }}</strong>
              </div>
            </div>
          </div>

          <div class="pt-2 flex flex-col sm:flex-row gap-3">
            <NuxtLink
              v-if="totalDeudaUsd > 0"
              to="/usuario/pagos"
              class="btn-primary flex-1 text-base h-12"
            >
              <CreditCard class="w-5 h-5" />
              Pagar ahora con Ubii Pagos
              <ArrowRight class="w-4 h-4" />
            </NuxtLink>

            <template v-else>
              <div class="flex-1 rounded-lg bg-[#E8F5E9] px-4 py-3 text-sm text-[#2E7D32] font-medium flex items-center gap-2">
                <CheckCircle2 class="w-5 h-5 shrink-0" />
                ¡Tu hogar está solvente este mes!
              </div>
              <a
                :href="`/api/pagos/${pagoActual.id}/comprobante`"
                target="_blank"
                class="btn-outline h-12"
              >
                <FileDown class="w-4 h-4" />
                Descargar comprobante PDF
              </a>
            </template>
          </div>
        </template>
      </div>
    </section>

    <!-- Horario del sector -->
    <section v-if="user?.hogar?.sector" class="card-surface flex items-start gap-3">
      <div class="w-10 h-10 rounded-lg bg-[#1565C0]/10 text-[#1565C0] flex items-center justify-center shrink-0">
        <CalendarClock class="w-5 h-5" />
      </div>
      <div>
        <div class="text-sm font-semibold text-[#1A1A1A]">
          Horario estimado en {{ user.hogar.sector.nombre }}
        </div>
        <div class="text-sm text-[#616161] mt-0.5">
          {{ user.hogar.sector.horarioEstimado }}
        </div>
      </div>
    </section>

    <!-- Accesos rápidos (mobile friendly 2x2) -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-[#1A1A1A]">Accesos rápidos</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <NuxtLink
          to="/usuario/mapa"
          class="card-surface hover:border-[#1565C0] transition flex flex-col gap-2"
        >
          <div class="w-10 h-10 rounded-lg bg-[#1565C0]/10 text-[#1565C0] flex items-center justify-center">
            <MapPin class="w-5 h-5" />
          </div>
          <div class="font-semibold text-sm text-[#1A1A1A]">Seguimiento de Unidades</div>
          <div class="text-xs text-[#616161]">Ver los 3 camiones en el mapa en vivo</div>
        </NuxtLink>

        <NuxtLink
          to="/usuario/chat"
          class="card-surface hover:border-[#1565C0] transition flex flex-col gap-2"
        >
          <div class="w-10 h-10 rounded-lg bg-[#1565C0]/10 text-[#1565C0] flex items-center justify-center">
            <MessageSquare class="w-5 h-5" />
          </div>
          <div class="font-semibold text-sm text-[#1A1A1A]">Chat con IA</div>
          <div class="text-xs text-[#616161]">Consulta horarios, pagos y reglamento</div>
        </NuxtLink>

        <NuxtLink
          to="/usuario/reportes"
          class="card-surface hover:border-[#1565C0] transition flex flex-col gap-2"
        >
          <div class="w-10 h-10 rounded-lg bg-[#FFEBEE] text-[#C62828] flex items-center justify-center">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <div class="font-semibold text-sm text-[#1A1A1A]">Denuncias y Sugerencias</div>
          <div class="text-xs text-[#616161]">Reporta incidencias con foto y GPS</div>
        </NuxtLink>

        <NuxtLink
          to="/usuario/pagos"
          class="card-surface hover:border-[#1565C0] transition flex flex-col gap-2"
        >
          <div class="w-10 h-10 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
            <FileDown class="w-5 h-5" />
          </div>
          <div class="font-semibold text-sm text-[#1A1A1A]">Historial y PDFs</div>
          <div class="text-xs text-[#616161]">Descarga tus recibos de los últimos 12 meses</div>
        </NuxtLink>
      </div>
    </section>

    <!-- Últimos 3 pagos -->
    <section v-if="data?.historial?.length" class="card-surface space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-[#1A1A1A]">Movimientos recientes</h2>
        <NuxtLink to="/usuario/pagos" class="text-xs font-semibold text-[#1565C0] hover:underline">
          Ver historial completo
        </NuxtLink>
      </div>
      <div class="divide-y divide-[#EEEEEE]">
        <div
          v-for="p in data.historial.slice(0, 3)"
          :key="p.id"
          class="py-3 flex items-center justify-between gap-3"
        >
          <div>
            <div class="text-sm font-medium text-[#1A1A1A]">{{ p.periodoLabel }}</div>
            <div class="text-xs text-[#616161]">
              ${{ p.montoUsd.toFixed(2) }} USD · Bs. {{ p.montoBsActual.toFixed(2) }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge :status="p.estado" />
            <a
              v-if="p.estado === 'pagado'"
              :href="`/api/pagos/${p.id}/comprobante`"
              target="_blank"
              class="p-2 rounded-lg text-[#1565C0] hover:bg-[#1565C0]/10"
              title="Descargar PDF"
            >
              <FileDown class="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
