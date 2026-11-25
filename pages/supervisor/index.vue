<script setup lang="ts">
import { FileDown, Eye, Users, Percent, Truck, AlertTriangle } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const { data } = await useFetch<any>('/api/admin/dashboard')
const kpis = computed(() => data.value?.kpis || {})
const unidades = computed(() => data.value?.unidades || [])
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] bg-[#1565C0]/10 px-2.5 py-1 rounded-full mb-1">
          <Eye class="w-3.5 h-3.5" />
          Modo Supervisión Municipal (Solo Lectura)
        </div>
        <h1 class="text-2xl font-bold text-[#1A1A1A]">Supervisión Consolidada — Ayacucho</h1>
        <p class="text-sm text-[#616161]">
          Métricas globales de recaudación, cobertura operativa y atención ciudadana ({{ data?.periodoActual }}).
        </p>
      </div>

      <a href="/api/supervisor/reporte-pdf" target="_blank" class="btn-primary self-start">
        <FileDown class="w-4 h-4" />
        Exportar Reporte PDF
      </a>
    </div>

    <!-- Métricas globales -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card-surface space-y-1.5">
        <div class="flex items-center justify-between text-xs text-[#616161]">
          <span>Total de Hogares</span>
          <Users class="w-4 h-4 text-[#1565C0]" />
        </div>
        <div class="text-2xl font-bold text-[#1A1A1A]">{{ kpis.hogaresActivos ?? 0 }}</div>
        <div class="text-xs text-[#616161]">Activos en plataforma</div>
      </div>

      <div class="card-surface space-y-1.5">
        <div class="flex items-center justify-between text-xs text-[#616161]">
          <span>Cumplimiento de Pagos</span>
          <Percent class="w-4 h-4 text-[#2E7D32]" />
        </div>
        <div class="text-2xl font-bold text-[#2E7D32]">{{ kpis.porcentajePagos ?? 0 }}%</div>
        <div class="text-xs text-[#616161]">
          ${{ (kpis.montoRecaudadoUsd ?? 0).toFixed(2) }} USD recaudados
        </div>
      </div>

      <div class="card-surface space-y-1.5">
        <div class="flex items-center justify-between text-xs text-[#616161]">
          <span>Unidades en Ruta</span>
          <Truck class="w-4 h-4 text-[#1565C0]" />
        </div>
        <div class="text-2xl font-bold text-[#1A1A1A]">
          {{ unidades.filter((u: any) => u.estado === 'en_ruta').length }} / {{ unidades.length }}
        </div>
        <div class="text-xs text-[#616161]">Flota municipal activa</div>
      </div>

      <div class="card-surface space-y-1.5">
        <div class="flex items-center justify-between text-xs text-[#616161]">
          <span>Denuncias Abiertas</span>
          <AlertTriangle class="w-4 h-4 text-[#C62828]" />
        </div>
        <div class="text-2xl font-bold text-[#C62828]">{{ kpis.denunciasAbiertas ?? 0 }}</div>
        <div class="text-xs text-[#616161]">En seguimiento administrativo</div>
      </div>
    </div>

    <!-- Mapa general de las 3 unidades -->
    <section class="card-surface space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-[#1A1A1A]">Mapa General de Unidades de Recolección</h2>
        <span class="text-xs text-[#616161]">San Juan de Colón, Ayacucho</span>
      </div>
      <UnitsMap :unidades="unidades" height-class="h-[360px]" />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div v-for="u in unidades" :key="u.id" class="rounded-lg border border-[#E0E4E8] p-3 flex items-center justify-between">
          <div>
            <div class="font-semibold text-sm text-[#1A1A1A]">{{ u.identificador }}</div>
            <div class="text-xs text-[#616161]">{{ u.sectoresAsignados }}</div>
          </div>
          <StatusBadge :status="u.estado" />
        </div>
      </div>
    </section>

    <!-- Gráficos de solo lectura -->
    <AdminCharts
      v-if="data"
      :pagos-por-mes="data.pagosPorMes || []"
      :pagos-por-sector="data.pagosPorSector || []"
    />
  </div>
</template>
