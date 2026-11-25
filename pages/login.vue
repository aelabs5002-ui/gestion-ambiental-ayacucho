<script setup lang="ts">
import { Recycle, ShieldCheck, User, Eye, ArrowRight, Lock, Mail } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { fetchMe, homePathForRole, settings } = useAuth()
const identificador = ref('')
const password = ref('')
const loading = ref(false)
const demoLoading = ref<string | null>(null)
const errorMsg = ref('')

const iniciarSesion = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await $fetch<{ usuario: any }>('/api/auth/login', {
      method: 'POST',
      body: { identificador: identificador.value, password: password.value }
    })
    await fetchMe(true)
    await navigateTo(homePathForRole(res.usuario.rol))
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'No se pudo iniciar sesión. Verifica tus datos.'
  } finally {
    loading.value = false
  }
}

const accesoRapidoDemo = async (demoRole: 'usuario' | 'admin' | 'supervisor') => {
  errorMsg.value = ''
  demoLoading.value = demoRole
  try {
    const res = await $fetch<{ usuario: any }>('/api/auth/login', {
      method: 'POST',
      body: { demoRole }
    })
    await fetchMe(true)
    await navigateTo(homePathForRole(res.usuario.rol))
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'Error en acceso demo.'
  } finally {
    demoLoading.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F5F7FA] flex flex-col">
    <DemoBanner />

    <div class="flex-1 flex items-center justify-center p-4 py-8">
      <div class="w-full max-w-md space-y-5">
        <!-- Encabezado institucional -->
        <div class="text-center space-y-2">
          <div class="w-14 h-14 mx-auto rounded-xl bg-[#1565C0] text-white flex items-center justify-center shadow-card">
            <Recycle class="w-8 h-8" />
          </div>
          <h1 class="text-2xl font-bold text-[#1A1A1A] leading-tight">
            Gestión Ambiental Ayacucho
          </h1>
          <p class="text-sm text-[#616161]">
            Portal oficial de recolección de desechos sólidos y pagos con Ubii Pagos
          </p>
        </div>

        <!-- Acceso rápido 1-clic en Modo Demostración -->
        <div v-if="settings.demoMode" class="card-surface border-[#1565C0]/30 bg-white space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wide text-[#1565C0]">
              Acceso rápido para demostración
            </span>
            <span class="badge-pendiente">1 clic</span>
          </div>
          <p class="text-xs text-[#616161]">
            Prueba cualquier perfil al instante sin escribir contraseñas:
          </p>
          <div class="grid grid-cols-1 gap-2">
            <button
              class="btn-primary w-full justify-between"
              :disabled="!!demoLoading"
              @click="accesoRapidoDemo('usuario')"
            >
              <span class="flex items-center gap-2">
                <User class="w-4 h-4" />
                Entrar como Vecino (Jefe de Familia)
              </span>
              <ArrowRight class="w-4 h-4" />
            </button>
            <div class="grid grid-cols-2 gap-2">
              <button
                class="btn-outline w-full text-xs px-2.5"
                :disabled="!!demoLoading"
                @click="accesoRapidoDemo('admin')"
              >
                <ShieldCheck class="w-4 h-4 shrink-0" />
                Administrador
              </button>
              <button
                class="btn-outline w-full text-xs px-2.5"
                :disabled="!!demoLoading"
                @click="accesoRapidoDemo('supervisor')"
              >
                <Eye class="w-4 h-4 shrink-0" />
                Supervisor
              </button>
            </div>
          </div>
        </div>

        <!-- Formulario tradicional -->
        <div class="card-surface space-y-4">
          <h2 class="text-base font-semibold text-[#1A1A1A]">Iniciar sesión con tu cuenta</h2>

          <div
            v-if="errorMsg"
            class="rounded-lg bg-[#FFEBEE] border border-[#C62828]/30 px-3 py-2.5 text-xs font-medium text-[#C62828]"
            role="alert"
          >
            {{ errorMsg }}
          </div>

          <form class="space-y-3.5" @submit.prevent="iniciarSesion">
            <div>
              <label for="identificador" class="block text-xs font-medium text-[#1A1A1A] mb-1">
                Correo electrónico o Cédula
              </label>
              <div class="relative">
                <Mail class="w-4 h-4 text-[#616161] absolute left-3 top-3" />
                <input
                  id="identificador"
                  v-model="identificador"
                  type="text"
                  required
                  autocomplete="username"
                  placeholder="ejemplo@correo.ve o V-18456123"
                  class="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="password" class="block text-xs font-medium text-[#1A1A1A]">
                  Contraseña
                </label>
                <NuxtLink to="/recuperar" class="text-xs font-medium text-[#1565C0] hover:underline">
                  ¿Olvidaste tu contraseña?
                </NuxtLink>
              </div>
              <div class="relative">
                <Lock class="w-4 h-4 text-[#616161] absolute left-3 top-3" />
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  required
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="input-field pl-9"
                />
              </div>
            </div>

            <button type="submit" class="btn-primary w-full" :disabled="loading">
              {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
            </button>
          </form>

          <div class="pt-3 border-t border-[#EEEEEE] text-center text-sm text-[#616161]">
            ¿Eres jefe de familia y aún no tienes cuenta?
            <NuxtLink to="/registro" class="font-semibold text-[#1565C0] hover:underline ml-1">
              Registra tu hogar
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
