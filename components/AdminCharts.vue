<script setup lang="ts">
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

const props = defineProps<{
  pagosPorMes: Array<{ label: string; pagados: number; recaudadoUsd: number }>
  pagosPorSector: Array<{ sector: string; pagados: number }>
}>()

const barData = computed(() => ({
  labels: props.pagosPorMes.map((m) => m.label),
  datasets: [
    {
      label: 'Hogares Pagados',
      backgroundColor: '#1565C0',
      borderRadius: 6,
      data: props.pagosPorMes.map((m) => m.pagados)
    }
  ]
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { precision: 0 }
    }
  }
}

const doughnutData = computed(() => ({
  labels: props.pagosPorSector.map((s) => s.sector),
  datasets: [
    {
      backgroundColor: ['#1565C0', '#2E7D32', '#F9A825', '#005DB7', '#C62828'],
      data: props.pagosPorSector.map((s) => s.pagados)
    }
  ]
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { boxWidth: 12, font: { size: 11 } }
    }
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="card-surface lg:col-span-2 space-y-3">
      <div>
        <h2 class="text-base font-semibold text-[#1A1A1A]">Pagos por Mes (Últimos 6 meses)</h2>
        <p class="text-xs text-[#616161]">Cantidad de hogares solventes registrados mensualmente</p>
      </div>
      <ClientOnly>
        <div class="h-64">
          <Bar :data="barData" :options="barOptions" />
        </div>
      </ClientOnly>
    </div>

    <div class="card-surface space-y-3">
      <div>
        <h2 class="text-base font-semibold text-[#1A1A1A]">Pagos por Sector</h2>
        <p class="text-xs text-[#616161]">Distribución de solvencia en el mes actual</p>
      </div>
      <ClientOnly>
        <div class="h-64">
          <Doughnut :data="doughnutData" :options="doughnutOptions" />
        </div>
      </ClientOnly>
    </div>
  </div>
</template>
