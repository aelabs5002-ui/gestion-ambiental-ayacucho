<script setup lang="ts">
import { FlaskConical } from 'lucide-vue-next'
const { settings } = useAuth()
</script>

<template>
  <div
    v-if="settings.demoMode"
    class="bg-[#FFF8E1] border-b border-[#F9A825]/40 text-[#8D5B00] px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-2 text-center"
    role="status"
  >
    <FlaskConical class="w-3.5 h-3.5 shrink-0" />
    <span>MODO DEMOSTRACIÓN: las transacciones de Ubii Pagos y el GPS son simulados.</span>
  </div>
</template>
