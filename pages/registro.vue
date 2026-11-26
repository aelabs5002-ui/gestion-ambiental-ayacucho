<script setup lang="ts">
import { ArrowLeft, Eye, EyeOff } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { fetchMe, setUser } = useAuth()
const { data: sectoresData } = await useFetch<{ sectores: any[] }>('/api/sectores')
const sectores = computed(() => sectoresData.value?.sectores || [])

const cedulaTipo = ref<'V' | 'E' | 'J' | 'P'>('V')
const cedulaNumero = ref('')
const confirmarPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

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

const onCedulaInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const raw = target.value.trim().toUpperCase()
  const prefixMatch = raw.match(/^([VEJP])/)
  if (prefixMatch) {
    cedulaTipo.value = prefixMatch[1] as 'V' | 'E' | 'J' | 'P'
  }
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 12)
  cedulaNumero.value = digits
  target.value = digits
}

const loading = ref(false)
const errorMsg = ref('')

const registrar = async () => {
  errorMsg.value = ''

  const digits = cedulaNumero.value.replace(/[^0-9]/g, '')
  if (digits.length < 5) {
    errorMsg.value = 'Ingresa un número de cédula válido (al menos 5 dígitos).'
    return
  }

  if (form.password !== confirmarPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden. Verifica ambos campos.'
    return
  }

  loading.value = true
  try {
    form.cedula = `${cedulaTipo.value}-${digits}`
    const res = await $fetch<{ usuario: any }>('/api/auth/register', {
      method: 'POST',
      body: {
        ...form,
        correo: form.correo.trim().toLowerCase(),
        cedula: form.cedula
      }
    })
    setUser(res.usuario)
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
                <div class="flex gap-1.5">
                  <select
                    v-model="cedulaTipo"
                    aria-label="Tipo de cédula"
                    class="input-field w-16 px-2 text-center font-semibold shrink-0"
                  >
                    <option value="V">V</option>
                    <option value="E">E</option>
                    <option value="J">J</option>
                    <option value="P">P</option>
                  </select>
                  <input
                    :value="cedulaNumero"
                    type="text"
                    inputmode="numeric"
                    required
                    autocapitalize="none"
                    autocorrect="off"
                    spellcheck="false"
                    class="input-field flex-1"
                    placeholder="18456123"
                    @input="onCedulaInput"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Teléfono (WhatsApp / Pago Móvil)</label>
                <input v-model="form.telefono" required class="input-field" placeholder="0414-7123456" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Correo electrónico</label>
              <input
                v-model="form.correo"
                type="email"
                required
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                class="input-field"
                placeholder="vecino@correo.ve"
              />
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

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Contraseña (mínimo 6 caracteres)</label>
                <div class="relative">
                  <input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    minlength="6"
                    required
                    autocomplete="new-password"
                    class="input-field pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    class="absolute right-2.5 top-2.5 p-0.5 text-[#616161] hover:text-[#1A1A1A]"
                    :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    @click="showPassword = !showPassword"
                  >
                    <EyeOff v-if="showPassword" class="w-4 h-4" />
                    <Eye v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Confirmar contraseña</label>
                <div class="relative">
                  <input
                    v-model="confirmarPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    minlength="6"
                    required
                    autocomplete="new-password"
                    class="input-field pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    class="absolute right-2.5 top-2.5 p-0.5 text-[#616161] hover:text-[#1A1A1A]"
                    :aria-label="showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <EyeOff v-if="showConfirmPassword" class="w-4 h-4" />
                    <Eye v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
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
