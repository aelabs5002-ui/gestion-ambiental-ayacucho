<script setup lang="ts">
const props = defineProps<{
  status: string
}>()

const map = computed(() => {
  const s = (props.status || '').toLowerCase()
  switch (s) {
    case 'pagado':
      return { label: 'Pagado', cls: 'badge-pagado' }
    case 'pendiente':
      return { label: 'Pendiente', cls: 'badge-pendiente' }
    case 'vencido':
      return { label: 'Vencido', cls: 'badge-vencido' }
    case 'en_ruta':
      return { label: 'En ruta', cls: 'badge-pagado' }
    case 'detenida':
      return { label: 'Detenida', cls: 'badge-pendiente' }
    case 'fuera_de_servicio':
      return { label: 'Fuera de servicio', cls: 'badge-vencido' }
    case 'recibido':
      return { label: 'Recibido', cls: 'badge-neutro' }
    case 'en_proceso':
      return { label: 'En proceso', cls: 'badge-pendiente' }
    case 'resuelto':
      return { label: 'Resuelto', cls: 'badge-pagado' }
    case 'activo':
      return { label: 'Activo', cls: 'badge-pagado' }
    case 'inactivo':
      return { label: 'Inactivo', cls: 'badge-vencido' }
    default:
      return { label: props.status, cls: 'badge-neutro' }
  }
})
</script>

<template>
  <span :class="map.cls">{{ map.label }}</span>
</template>
