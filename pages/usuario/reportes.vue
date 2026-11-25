<script setup lang="ts">
import {
  MapPin,
  Camera,
  Send,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CheckCircle2
} from 'lucide-vue-next'

definePageMeta({ layout: 'usuario' })

const { user } = useAuth()
const { data, refresh } = await useFetch<any>('/api/reportes')
const reportes = computed(() => data.value?.reportes || [])

const categorias = [
  'Recolección no realizada',
  'Unidad dañada',
  'Maltrato',
  'Sugerencia',
  'Otro'
]

const form = reactive({
  categoria: 'Recolección no realizada',
  descripcion: '',
  ubicacion: user.value?.hogar ? `${user.value.hogar.direccion}, ${user.value.hogar.sector.nombre}` : '',
  latitud: null as number | null,
  longitud: null as number | null,
  fotoBase64: null as string | null
})

const fotoNombre = ref('')
const gpsLoading = ref(false)
const enviando = ref(false)
const exitoMsg = ref('')
const errorMsg = ref('')
const expandedId = ref<string | null>(null)

const usarUbicacionActual = () => {
  if (!navigator.geolocation) {
    errorMsg.value = 'Tu navegador no soporta geolocalización.'
    return
  }
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.latitud = Number(pos.coords.latitude.toFixed(6))
      form.longitud = Number(pos.coords.longitude.toFixed(6))
      form.ubicacion = `GPS (${form.latitud}, ${form.longitud}) — ${user.value?.hogar?.sector?.nombre || 'Ayacucho'}`
      gpsLoading.value = false
    },
    () => {
      // Fallback amigable en demo si el teléfono niega permiso GPS
      form.latitud = user.value?.hogar?.sector?.latitud || 8.0314
      form.longitud = user.value?.hogar?.sector?.longitud || -72.2606
      form.ubicacion = `${user.value?.hogar?.direccion || 'Sector central'}, ${user.value?.hogar?.sector?.nombre || 'Ayacucho'}`
      gpsLoading.value = false
    }
  )
}

const onFotoChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 3 * 1024 * 1024) {
    errorMsg.value = 'La foto no puede superar los 3 MB.'
    return
  }
  fotoNombre.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    form.fotoBase64 = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

const enviarReporte = async () => {
  errorMsg.value = ''
  exitoMsg.value = ''
  enviando.value = true
  try {
    await $fetch('/api/reportes', { method: 'POST', body: form })
    exitoMsg.value = 'Tu reporte fue recibido con éxito. Te notificaremos cuando la administración responda.'
    form.descripcion = ''
    form.fotoBase64 = null
    fotoNombre.value = ''
    await refresh()
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'No se pudo enviar el reporte.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Denuncias y Sugerencias</h1>
      <p class="text-sm text-[#616161]">
        Envía reportes con trazabilidad directa y recibe respuesta oficial del equipo administrativo.
      </p>
    </div>

    <!-- Formulario nuevo reporte -->
    <section class="card-surface space-y-4">
      <h2 class="text-lg font-semibold text-[#1A1A1A]">Nuevo reporte</h2>

      <div v-if="exitoMsg" class="rounded-lg bg-[#E8F5E9] p-3 text-xs text-[#2E7D32] flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 shrink-0" />
        <span>{{ exitoMsg }}</span>
      </div>
      <div v-if="errorMsg" class="rounded-lg bg-[#FFEBEE] p-3 text-xs text-[#C62828]">
        {{ errorMsg }}
      </div>

      <form class="space-y-3.5" @submit.prevent="enviarReporte">
        <div>
          <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Categoría</label>
          <select v-model="form.categoria" class="input-field">
            <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Descripción detallada</label>
          <textarea
            v-model="form.descripcion"
            rows="3"
            required
            minlength="10"
            class="w-full rounded-lg border border-[#BDBDBD] bg-white p-3 text-sm text-[#1A1A1A] focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20"
            placeholder="Cuéntanos qué ocurrió, calle exacta o tu sugerencia de mejora..."
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Ubicación</label>
          <div class="flex flex-col sm:flex-row gap-2">
            <input v-model="form.ubicacion" required class="input-field flex-1" placeholder="Calle, esquina o referencia" />
            <button
              type="button"
              class="btn-outline shrink-0 text-xs"
              :disabled="gpsLoading"
              @click="usarUbicacionActual"
            >
              <MapPin class="w-4 h-4" />
              {{ gpsLoading ? 'Ubicando...' : 'Usar mi ubicación actual' }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-[#1A1A1A] mb-1">Adjuntar foto (opcional)</label>
          <label class="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#BDBDBD] bg-[#F5F7FA] p-3 text-xs text-[#616161] cursor-pointer hover:border-[#1565C0]">
            <Camera class="w-4 h-4 text-[#1565C0]" />
            <span>{{ fotoNombre || 'Tomar foto o seleccionar desde tu teléfono (máx. 3 MB)' }}</span>
            <input type="file" accept="image/*" capture="environment" class="hidden" @change="onFotoChange" />
          </label>
        </div>

        <button type="submit" class="btn-primary w-full sm:w-auto" :disabled="enviando">
          <Send class="w-4 h-4" />
          {{ enviando ? 'Enviando reporte...' : 'Enviar reporte' }}
        </button>
      </form>
    </section>

    <!-- Lista de reportes enviados -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-[#1A1A1A]">Mis reportes enviados ({{ reportes.length }})</h2>

      <div v-if="reportes.length === 0" class="card-surface text-sm text-[#616161] text-center py-8">
        Aún no has enviado denuncias ni sugerencias.
      </div>

      <div v-for="r in reportes" :key="r.id" class="card-surface p-0 overflow-hidden">
        <button
          type="button"
          class="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-[#FAFAFA] transition"
          @click="expandedId = expandedId === r.id ? null : r.id"
        >
          <div class="space-y-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold text-sm text-[#1A1A1A]">{{ r.categoria }}</span>
              <StatusBadge :status="r.estado" />
            </div>
            <p class="text-xs text-[#616161] line-clamp-2">{{ r.descripcion }}</p>
            <div class="text-[11px] text-[#9E9E9E]">
              {{ new Date(r.fechaCreacion).toLocaleString('es-VE') }} · {{ r.ubicacion }}
            </div>
          </div>
          <component
            :is="expandedId === r.id ? ChevronUp : ChevronDown"
            class="w-5 h-5 text-[#616161] shrink-0 mt-0.5"
          />
        </button>

        <div v-if="expandedId === r.id" class="px-4 pb-4 pt-2 border-t border-[#EEEEEE] bg-[#F5F7FA]/60 space-y-3">
          <p class="text-sm text-[#1A1A1A]">{{ r.descripcion }}</p>
          <img
            v-if="r.fotoUrl"
            :src="r.fotoUrl"
            alt="Evidencia adjunta"
            class="w-full max-w-xs rounded-lg border border-[#E0E4E8]"
          />

          <div class="space-y-2">
            <div class="text-xs font-semibold text-[#1565C0] flex items-center gap-1.5">
              <MessageCircle class="w-4 h-4" />
              Respuestas de la administración
            </div>
            <div v-if="!r.respuestas?.length" class="text-xs text-[#616161] italic">
              Tu reporte está en revisión. Recibirás una notificación al recibir respuesta.
            </div>
            <div
              v-for="resp in r.respuestas"
              :key="resp.id"
              class="rounded-lg bg-white border border-[#E0E4E8] p-3 text-xs space-y-1"
            >
              <div class="font-semibold text-[#1A1A1A]">
                {{ resp.administrador?.nombre || 'Administración' }}
              </div>
              <p class="text-[#1A1A1A] leading-relaxed">{{ resp.mensaje }}</p>
              <div class="text-[10px] text-[#9E9E9E]">
                {{ new Date(resp.fecha).toLocaleString('es-VE') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
