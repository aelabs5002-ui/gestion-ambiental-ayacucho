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
let mapInstance: any = null
let markersLayer: any = null
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
        <div style="background:${color};color:#fff;font-family:Inter,sans-serif;font-size:11px;font-weight:700;padding:4px 8px;border-radius:9999px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.28);border:${isSelected ? '2.5px solid #1A1A1A' : '2px solid #FFFFFF'};">
          🚛 ${u.identificador}
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${color};margin-top:-1px;"></div>
      </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    })

    const marker = LRef.marker([u.latitudActual, u.longitudActual], { icon })
    marker.bindPopup(
      `<div style="font-family:Inter,sans-serif;min-width:180px;">
        <div style="font-weight:700;font-size:13px;color:#1A1A1A;">${u.identificador} (${u.placa})</div>
        <div style="font-size:12px;color:#616161;margin-top:2px;">Estado: <strong>${estadoLabel(u.estado)}</strong></div>
        <div style="font-size:12px;color:#616161;margin-top:2px;">Sectores: ${u.sectoresAsignados}</div>
        <div style="font-size:11px;color:#616161;margin-top:4px;">Chofer: ${u.chofer}</div>
      </div>`
    )
    marker.on('click', () => emit('select', u.id))
    marker.addTo(markersLayer)
  })
}

onMounted(async () => {
  if (!mapEl.value) return
  const leaflet = await import('leaflet')
  LRef = leaflet.default || leaflet

  mapInstance = LRef.map(mapEl.value, {
    center: [8.0305, -72.2615], // San Juan de Colón, Municipio Ayacucho
    zoom: 14,
    zoomControl: true
  })

  LRef.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(mapInstance)

  markersLayer = LRef.layerGroup().addTo(mapInstance)
  renderMarkers()
})

watch(
  () => [props.unidades, props.selectedId],
  () => {
    renderMarkers()
    if (props.selectedId && mapInstance) {
      const target = props.unidades.find((u) => u.id === props.selectedId)
      if (target) {
        mapInstance.flyTo([target.latitudActual, target.longitudActual], 15, { duration: 0.6 })
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
  <ClientOnly>
    <div
      ref="mapEl"
      class="w-full rounded-lg overflow-hidden border border-[#E0E4E8] z-0"
      :class="heightClass || 'h-[360px] md:h-[480px]'"
    />
    <template #fallback>
      <div
        class="w-full rounded-lg bg-[#ECEEF1] flex items-center justify-center text-sm text-[#616161]"
        :class="heightClass || 'h-[360px] md:h-[480px]'"
      >
        Cargando mapa de San Juan de Colón, Ayacucho...
      </div>
    </template>
  </ClientOnly>
</template>
