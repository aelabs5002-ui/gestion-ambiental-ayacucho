<script setup lang="ts">
interface UnidadMapItem {
  id: string
  identificador: string
  placa: string
  chofer: string
  estado: string
  sectoresAsignados: string
  horarioEstimado: string
  latitudActual: number
  longitudActual: number
  ultimaActualizacion: string
}

const props = defineProps<{
  unidades: UnidadMapItem[]
  selectedId?: string | null
  heightClass?: string
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const mapEl = ref<HTMLElement | null>(null)
const mapMode = ref<'streets' | 'satellite'>('streets')
const ready = ref(false)

let mapInstance: any = null
let markersLayer: any = null
let streetsLayer: any = null
let satelliteLayer: any = null
let LRef: any = null

const unitColors = ['#1565C0', '#2E7D32', '#C62828', '#6A1B9A', '#00838F']

const estadoLabel = (estado: string) => {
  if (estado === 'en_ruta') return 'En ruta'
  if (estado === 'detenida') return 'Detenida'
  return 'Fuera de servicio'
}

const renderMarkers = () => {
  if (!mapInstance || !markersLayer || !LRef) return
  markersLayer.clearLayers()

  props.unidades.forEach((u, idx) => {
    const color = unitColors[idx % unitColors.length]
    const isSelected = props.selectedId === u.id
    const icon = LRef.divIcon({
      className: 'custom-truck-pin',
      html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <div style="background:${color};color:#fff;font-family:Inter,sans-serif;font-size:11px;font-weight:700;padding:4px 9px;border-radius:9999px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.32);border:${isSelected ? '2.5px solid #1A1A1A' : '2px solid #FFFFFF'};">
          🚛 ${u.identificador}
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${color};margin-top:-1px;"></div>
      </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    })

    const gmapsUrl = `https://www.google.com/maps?q=${u.latitudActual},${u.longitudActual}`
    const marker = LRef.marker([u.latitudActual, u.longitudActual], { icon })
    marker.bindPopup(
      `<div style="font-family:Inter,sans-serif;min-width:190px;">
        <div style="font-weight:700;font-size:13px;color:#1A1A1A;">${u.identificador} (${u.placa})</div>
        <div style="font-size:12px;color:#616161;margin-top:3px;">Estado: <strong>${estadoLabel(u.estado)}</strong></div>
        <div style="font-size:12px;color:#616161;margin-top:2px;">Sectores: ${u.sectoresAsignados}</div>
        <div style="font-size:11px;color:#616161;margin-top:3px;">Chofer: ${u.chofer}</div>
        <a href="${gmapsUrl}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;font-size:11px;font-weight:600;color:#1565C0;text-decoration:underline;">Abrir en Google Maps ↗</a>
      </div>`
    )
    marker.on('click', () => emit('select', u.id))
    marker.addTo(markersLayer)
  })
}

const initMap = async (container: HTMLElement) => {
  if (!import.meta.client || mapInstance) return
  const leaflet = await import('leaflet')
  LRef = leaflet.default || leaflet

  mapInstance = LRef.map(container, {
    center: [8.0314, -72.2606], // San Juan de Colón, Municipio Ayacucho, Táchira
    zoom: 14,
    zoomControl: true
  })

  // Capa principal: Google Maps Calles (detallada en San Juan de Colón)
  streetsLayer = LRef.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps · Municipio Ayacucho',
    maxZoom: 20
  })

  // Capa alternativa: Google Maps Satélite Híbrido (con nombres de calles)
  satelliteLayer = LRef.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps · Satélite',
    maxZoom: 20
  })

  streetsLayer.addTo(mapInstance)
  markersLayer = LRef.layerGroup().addTo(mapInstance)
  renderMarkers()
  ready.value = true

  // Asegurar redimensionado correcto tras animación/render móvil
  setTimeout(() => mapInstance?.invalidateSize(), 250)
  setTimeout(() => mapInstance?.invalidateSize(), 700)
}

const setMode = (mode: 'streets' | 'satellite') => {
  mapMode.value = mode
  if (!mapInstance || !streetsLayer || !satelliteLayer) return
  if (mode === 'satellite') {
    if (mapInstance.hasLayer(streetsLayer)) mapInstance.removeLayer(streetsLayer)
    if (!mapInstance.hasLayer(satelliteLayer)) satelliteLayer.addTo(mapInstance)
  } else {
    if (mapInstance.hasLayer(satelliteLayer)) mapInstance.removeLayer(satelliteLayer)
    if (!mapInstance.hasLayer(streetsLayer)) streetsLayer.addTo(mapInstance)
  }
}

watch(
  mapEl,
  (el) => {
    if (el && !mapInstance) {
      initMap(el)
    }
  },
  { immediate: true }
)

watch(
  () => [props.unidades, props.selectedId],
  () => {
    renderMarkers()
    if (props.selectedId && mapInstance) {
      const target = props.unidades.find((u) => u.id === props.selectedId)
      if (target) {
        mapInstance.flyTo([target.latitudActual, target.longitudActual], 16, { duration: 0.6 })
      }
    }
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<template>
  <div class="relative w-full rounded-lg overflow-hidden border border-[#E0E4E8]" :class="heightClass || 'h-[360px] md:h-[480px]'">
    <!-- Selector rápido Google Calles / Satélite -->
    <div class="absolute top-2.5 right-2.5 z-[400] flex rounded-lg overflow-hidden shadow-popover border border-[#E0E4E8] bg-white text-xs font-semibold">
      <button
        type="button"
        class="px-2.5 py-1.5 transition"
        :class="mapMode === 'streets' ? 'bg-[#1565C0] text-white' : 'text-[#1A1A1A] hover:bg-[#F5F7FA]'"
        @click="setMode('streets')"
      >
        Calles
      </button>
      <button
        type="button"
        class="px-2.5 py-1.5 transition"
        :class="mapMode === 'satellite' ? 'bg-[#1565C0] text-white' : 'text-[#1A1A1A] hover:bg-[#F5F7FA]'"
        @click="setMode('satellite')"
      >
        Satélite
      </button>
    </div>

    <div ref="mapEl" class="w-full h-full z-0 bg-[#ECEEF1]" />

    <div
      v-if="!ready"
      class="absolute inset-0 flex items-center justify-center text-sm text-[#616161] bg-[#ECEEF1]/90 pointer-events-none"
    >
      Cargando mapa de San Juan de Colón, Ayacucho...
    </div>
  </div>
</template>
