<script setup lang="ts">
import { ArrowLeft, MailCheck } from 'lucide-vue-next'

definePageMeta({ layout: false })

const correo = ref('')
const loading = ref(false)
const mensaje = ref('')
const errorMsg = ref('')

const enviar = async () => {
  errorMsg.value = ''
  mensaje.value = ''
  loading.value = true
  try {
    const res = await $fetch<{ mensaje: string }>('/api/auth/recover', {
      method: 'POST',
      body: { correo: correo.value }
    })
    mensaje.value = res.mensaje
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'Error al procesar solicitud.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F5F7FA] flex flex-col">
    <DemoBanner />
    <div class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-md space-y-4">
        <NuxtLink to="/login" class="inline-flex items-center gap-1.5 text-sm font-medium text-[#1565C0] hover:underline">
          <ArrowLeft class="w-4 h-4" />
          Volver al inicio de sesión
        </NuxtLink>

        <div class="card-surface space-y-4">
          <div>
            <h1 class="text-xl font-bold text-[#1A1A1A]">Recuperar contraseña</h1>
            <p class="text-xs text-[#616161] mt-1">
              Ingresa tu correo registrado para recibir instrucciones de restablecimiento.
            </p>
          </div>

          <div v-if="mensaje" class="rounded-lg bg-[#E8F5E9] p-3 text-xs text-[#2E7D32] flex items-start gap-2">
            <MailCheck class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{{ mensaje }}</span>
          </div>

          <div v-if="errorMsg" class="rounded-lg bg-[#FFEBEE] p-3 text-xs text-[#C62828]">
            {{ errorMsg }}
          </div>

          <form class="space-y-3" @submit.prevent="enviar">
            <div>
              <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Correo electrónico</label>
              <input v-model="correo" type="email" required class="input-field" placeholder="vecino@ayacucho.gob.ve" />
            </div>
            <button type="submit" class="btn-primary w-full" :disabled="loading">
              {{ loading ? 'Enviando...' : 'Enviar instrucciones' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
