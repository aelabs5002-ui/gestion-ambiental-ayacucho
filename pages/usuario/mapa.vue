<script setup lang="ts">
import { RefreshCw, Truck, Clock, MapPin } from 'lucide-vue-next'

definePageMeta({ layout: 'usuario' })

const { data, refresh } = await useFetch<any>('/api/unidades')
const unidades = computed(() => data.value?.unidades || [])
const selectedId = ref<string | null>(null)
const refreshing = ref(false)

const actualizarEnVivo = async () => {
  refreshing.value = true
  try {
    const res = await $fetch<any>('/api/unidades?simular=1')
    data.value = res
  } finally {
    refreshing.value = false
  }
}

const unitBadges = ['bg-[#1565C0]', 'bg-[#2E7D32]', 'bg-[#C62828]']
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[#1A1A1A]">Seguimiento de Unidades</h1>
        <p class="text-xs sm:text-sm text-[#616161]">
          Ubicación de las 3 unidades de recolección en San Juan de Colón, Ayacucho.
        </p>
      </div>
      <button class="btn-primary h-10 shrink-0" :disabled="refreshing" @click="actualizarEnVivo">
        <RefreshCw class="w-4 h-4" :class="refreshing ? 'animate-spin' : ''" />
        <span class="hidden sm:inline">Actualizar GPS</span>
      </button>
    </div>

    <!-- Mapa interactivo -->
    <div class="card-surface p-2">
      <UnitsMap
        :unidades="unidades"
        :selected-id="selectedId"
        height-class="h-[340px] sm:h-[420px]"
        @select="(id) => (selectedId = id)"
      />
    </div>

    <!-- Panel de estado de las 3 unidades -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <button
        v-for="(u, idx) in unidades"
        :key="u.id"
        type="button"
        class="card-surface text-left transition space-y-2.5"
        :class="selectedId === u.id ? 'border-[#1565C0] ring-2 ring-[#1565C0]/20' : 'hover:border-[#1565C0]/50'"
        @click="selectedId = u.id"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span
              class="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0"
              :class="unitBadges[idx % unitBadges.length]"
            >
              <Truck class="w-4 h-4" />
            </span>
            <div>
              <div class="font-bold text-sm text-[#1A1A1A]">{{ u.identificador }}</div>
              <div class="text-[11px] text-[#616161]">Placa {{ u.placa }}</div>
            </div>
          </div>
          <StatusBadge :status="u.estado" />
        </div>

        <div class="text-xs text-[#1A1A1A] flex items-start gap-1.5">
          <MapPin class="w-3.5 h-3.5 text-[#1565C0] shrink-0 mt-0.5" />
          <span><strong>Sectores:</strong> {{ u.sectoresAsignados }}</span>
        </div>

        <div class="text-xs text-[#616161] flex items-start gap-1.5">
          <Clock class="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{{ u.horarioEstimado }}</span>
        </div>

        <div class="text-[11px] text-[#9E9E9E] pt-1 border-t border-[#EEEEEE]">
          Última actualización: {{ new Date(u.ultimaActualizacion).toLocaleTimeString('es-VE') }}
        </div>
      </button>
    </section>
  </div>
</template>
