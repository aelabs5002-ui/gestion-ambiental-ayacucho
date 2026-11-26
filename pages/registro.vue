<script setup lang="ts">
import { Recycle, ArrowLeft } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { fetchMe } = useAuth()
const { data: sectoresData } = await useFetch<{ sectores: any[] }>('/api/sectores')
const sectores = computed(() => sectoresData.value?.sectores || [])

const form = reactive({
  nombre: '',
  cedula: '',
  telefono: '',
  correo: '',
  sectorId: '',
  numeroCasa: '',
  direccion: '',
  password: ''
})

watchEffect(() => {
  if (!form.sectorId && sectores.value.length > 0) {
    form.sectorId = sectores.value[0].id
  }
})

const loading = ref(false)
const errorMsg = ref('')

const registrar = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: form })
    await fetchMe(true)
    await navigateTo('/usuario')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'No se pudo completar el registro.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F5F7FA] flex flex-col">
    <DemoBanner />

    <div class="flex-1 flex items-center justify-center p-4 py-6">
      <div class="w-full max-w-lg space-y-4">
        <NuxtLink to="/login" class="inline-flex items-center gap-1.5 text-sm font-medium text-[#1565C0] hover:underline">
          <ArrowLeft class="w-4 h-4" />
          Volver al inicio de sesión
        </NuxtLink>

        <div class="card-surface space-y-4">
          <div class="flex items-center gap-3">
            <img
              src="/images/isotipo-alcaldia-ayacucho.png"
              alt="Alcaldía de Ayacucho"
              class="w-12 h-12 object-contain shrink-0"
            />
            <div>
              <h1 class="text-xl font-bold text-[#1A1A1A]">Registro de Hogar</h1>
              <p class="text-xs text-[#616161]">Crea tu cuenta única de servicio municipal ($3.00 USD/mes)</p>
            </div>
          </div>

          <div
            v-if="errorMsg"
            class="rounded-lg bg-[#FFEBEE] border border-[#C62828]/30 px-3 py-2.5 text-xs font-medium text-[#C62828]"
          >
            {{ errorMsg }}
          </div>

          <form class="space-y-3" @submit.prevent="registrar">
            <div>
              <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Nombre completo (Jefe de familia)</label>
              <input v-model="form.nombre" required class="input-field" placeholder="Ej. María Elena Contreras" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Cédula</label>
                <input v-model="form.cedula" required class="input-field" placeholder="V-18456123" />
              </div>
              <div>
                <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Teléfono (WhatsApp / Pago Móvil)</label>
                <input v-model="form.telefono" required class="input-field" placeholder="0414-7123456" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Correo electrónico</label>
              <input v-model="form.correo" type="email" required class="input-field" placeholder="vecino@correo.ve" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Sector</label>
                <select v-model="form.sectorId" required class="input-field">
                  <option v-for="s in sectores" :key="s.id" :value="s.id">{{ s.nombre }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Número de casa / apto</label>
                <input v-model="form.numeroCasa" required class="input-field" placeholder="Ej. C-14" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Dirección exacta</label>
              <input v-model="form.direccion" required class="input-field" placeholder="Carrera 4 con Calle 5, referencia..." />
            </div>

            <div>
              <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Contraseña (mínimo 6 caracteres)</label>
              <input v-model="form.password" type="password" minlength="6" required class="input-field" placeholder="••••••••" />
            </div>

            <button type="submit" class="btn-primary w-full mt-2" :disabled="loading">
              {{ loading ? 'Creando cuenta...' : 'Crear mi cuenta de hogar' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
