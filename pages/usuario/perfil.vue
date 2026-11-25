<script setup lang="ts">
import { Save, Lock, LogOut, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'usuario' })

const { user, fetchMe, logout } = useAuth()
const { data: sectoresData } = await useFetch<{ sectores: any[] }>('/api/sectores')
const sectores = computed(() => sectoresData.value?.sectores || [])

const form = reactive({
  nombre: user.value?.nombre || '',
  telefono: user.value?.telefono || '',
  sectorId: user.value?.hogar?.sectorId || '',
  numeroCasa: user.value?.hogar?.numeroCasa || '',
  direccion: user.value?.hogar?.direccion || ''
})

const passForm = reactive({
  passwordActual: '',
  passwordNueva: ''
})

const saving = ref(false)
const savingPass = ref(false)
const msg = ref('')
const err = ref('')

const guardarDatos = async () => {
  msg.value = ''
  err.value = ''
  saving.value = true
  try {
    await $fetch('/api/perfil', { method: 'PUT', body: form })
    await fetchMe(true)
    msg.value = 'Datos personales actualizados correctamente.'
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'Error al actualizar datos.'
  } finally {
    saving.value = false
  }
}

const cambiarPassword = async () => {
  msg.value = ''
  err.value = ''
  savingPass.value = true
  try {
    await $fetch('/api/perfil', { method: 'PUT', body: passForm })
    passForm.passwordActual = ''
    passForm.passwordNueva = ''
    msg.value = 'Contraseña actualizada correctamente.'
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No se pudo cambiar la contraseña.'
  } finally {
    savingPass.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <div>
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Mi Perfil</h1>
      <p class="text-sm text-[#616161]">
        Cuenta {{ user?.hogar?.numeroCuenta }} · Cédula {{ user?.cedula }} · {{ user?.correo }}
      </p>
    </div>

    <div v-if="msg" class="rounded-lg bg-[#E8F5E9] p-3 text-xs text-[#2E7D32] flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{{ msg }}</span>
    </div>
    <div v-if="err" class="rounded-lg bg-[#FFEBEE] p-3 text-xs text-[#C62828]">
      {{ err }}
    </div>

    <section class="card-surface space-y-4">
      <h2 class="text-lg font-semibold text-[#1A1A1A]">Datos del Hogar</h2>
      <form class="space-y-3" @submit.prevent="guardarDatos">
        <div>
          <label class="block text-xs font-medium mb-1">Nombre completo</label>
          <input v-model="form.nombre" required class="input-field" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium mb-1">Teléfono</label>
            <input v-model="form.telefono" required class="input-field" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">Número de casa</label>
            <input v-model="form.numeroCasa" required class="input-field" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1">Sector</label>
          <select v-model="form.sectorId" class="input-field">
            <option v-for="s in sectores" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1">Dirección</label>
          <input v-model="form.direccion" required class="input-field" />
        </div>
        <button type="submit" class="btn-primary" :disabled="saving">
          <Save class="w-4 h-4" />
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </form>
    </section>

    <section class="card-surface space-y-4">
      <h2 class="text-lg font-semibold text-[#1A1A1A]">Cambiar contraseña</h2>
      <form class="space-y-3" @submit.prevent="cambiarPassword">
        <div>
          <label class="block text-xs font-medium mb-1">Contraseña actual</label>
          <input v-model="passForm.passwordActual" type="password" required class="input-field" />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1">Nueva contraseña (mín. 6 caracteres)</label>
          <input v-model="passForm.passwordNueva" type="password" minlength="6" required class="input-field" />
        </div>
        <button type="submit" class="btn-outline" :disabled="savingPass">
          <Lock class="w-4 h-4" />
          {{ savingPass ? 'Actualizando...' : 'Actualizar contraseña' }}
        </button>
      </form>
    </section>

    <section class="card-surface flex items-center justify-between">
      <div>
        <div class="text-sm font-semibold text-[#1A1A1A]">Sesión actual</div>
        <div class="text-xs text-[#616161]">Cierra sesión de forma segura en este dispositivo.</div>
      </div>
      <button class="btn-danger" @click="logout">
        <LogOut class="w-4 h-4" />
        Cerrar sesión
      </button>
    </section>
  </div>
</template>
