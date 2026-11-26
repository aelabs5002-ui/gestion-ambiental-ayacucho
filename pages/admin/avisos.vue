<script setup lang="ts">
import { Send, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const { data: avisosData, refresh } = await useFetch<any>('/api/admin/avisos')
const { data: hogaresData } = await useFetch<any>('/api/admin/hogares', {
  query: { pageSize: 50 }
})

const avisos = computed(() => avisosData.value?.avisos || [])
const hogares = computed(() => hogaresData.value?.items || [])

const form = reactive({
  asunto: 'Recordatorio de pago mensual — Servicio de Recolección Ayacucho',
  mensaje:
    'Estimado(a) [Nombre], le recordamos que su pago del servicio de recolección correspondiente al mes de [Mes] por un monto de $3.00 USD se encuentra pendiente. Puede cancelar en segundos en línea desde el portal.',
  tipoDestinatario: 'pendientes' as 'pendientes' | 'vencidos' | 'manual',
  usuarioIds: [] as string[]
})

const enviando = ref(false)
const exito = ref('')
const errorMsg = ref('')

const toggleUsuario = (id: string) => {
  if (form.usuarioIds.includes(id)) {
    form.usuarioIds = form.usuarioIds.filter((x) => x !== id)
  } else {
    form.usuarioIds.push(id)
  }
}

const enviarAviso = async () => {
  exito.value = ''
  errorMsg.value = ''
  enviando.value = true
  try {
    const res = await $fetch<any>('/api/admin/avisos', { method: 'POST', body: form })
    exito.value = `Aviso enviado con éxito a ${res.totalEnviados} hogares (notificación in-app + correo en cola).`
    await refresh()
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'No se pudo enviar el aviso.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Avisos de Cobro</h1>
      <p class="text-sm text-[#616161]">
        Envía recordatorios masivos o selectivos personalizados con variables <code>[Nombre]</code> y <code>[Mes]</code>.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- Formulario -->
      <section class="card-surface lg:col-span-3 space-y-4">
        <h2 class="text-lg font-semibold text-[#1A1A1A]">Redactar Aviso</h2>

        <div v-if="exito" class="rounded-lg bg-[#E8F5E9] p-3 text-xs text-[#2E7D32] flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          <span>{{ exito }}</span>
        </div>
        <div v-if="errorMsg" class="rounded-lg bg-[#FFEBEE] p-3 text-xs text-[#C62828]">
          {{ errorMsg }}
        </div>

        <form class="space-y-4" @submit.prevent="enviarAviso">
          <div>
            <label class="block text-xs font-medium mb-1">Destinatarios</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                class="p-2.5 rounded-lg border text-xs font-semibold transition"
                :class="
                  form.tipoDestinatario === 'pendientes'
                    ? 'border-[#1565C0] bg-[#1565C0] text-white'
                    : 'border-[#E0E4E8] text-[#1A1A1A]'
                "
                @click="form.tipoDestinatario = 'pendientes'"
              >
                Todos los pendientes
              </button>
              <button
                type="button"
                class="p-2.5 rounded-lg border text-xs font-semibold transition"
                :class="
                  form.tipoDestinatario === 'vencidos'
                    ? 'border-[#C62828] bg-[#C62828] text-white'
                    : 'border-[#E0E4E8] text-[#1A1A1A]'
                "
                @click="form.tipoDestinatario = 'vencidos'"
              >
                Todos los vencidos
              </button>
              <button
                type="button"
                class="p-2.5 rounded-lg border text-xs font-semibold transition"
                :class="
                  form.tipoDestinatario === 'manual'
                    ? 'border-[#1565C0] bg-[#1565C0] text-white'
                    : 'border-[#E0E4E8] text-[#1A1A1A]'
                "
                @click="form.tipoDestinatario = 'manual'"
              >
                Seleccionar manualmente
              </button>
            </div>
          </div>

          <div v-if="form.tipoDestinatario === 'manual'" class="border border-[#E0E4E8] rounded-lg max-h-44 overflow-y-auto divide-y divide-[#EEEEEE]">
            <label
              v-for="h in hogares"
              :key="h.usuarioId"
              class="flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-[#F5F7FA]"
            >
              <span class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="form.usuarioIds.includes(h.usuarioId)"
                  class="accent-[#1565C0]"
                  @change="toggleUsuario(h.usuarioId)"
                />
                <strong>{{ h.nombre }}</strong> ({{ h.sector }})
              </span>
              <StatusBadge :status="h.estadoPago" />
            </label>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Asunto</label>
            <input v-model="form.asunto" required class="input-field" />
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Mensaje (editable)</label>
            <textarea
              v-model="form.mensaje"
              rows="5"
              required
              class="w-full rounded-lg border border-[#BDBDBD] p-3 text-sm focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20"
            />
          </div>

          <button type="submit" class="btn-primary" :disabled="enviando">
            <Send class="w-4 h-4" />
            {{ enviando ? 'Enviando...' : 'Enviar Aviso' }}
          </button>
        </form>
      </section>

      <!-- Historial de avisos -->
      <section class="card-surface lg:col-span-2 space-y-3">
        <h2 class="text-lg font-semibold text-[#1A1A1A]">Historial de Avisos Enviados</h2>
        <div class="divide-y divide-[#EEEEEE]">
          <div v-for="a in avisos" :key="a.id" class="py-3 space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-semibold text-[#1A1A1A]">{{ a.asunto }}</span>
              <span class="badge-pagado shrink-0">{{ a.totalDestinatarios }} envíos</span>
            </div>
            <div class="text-xs text-[#616161]">
              Criterio: <strong>{{ a.tipoDestinatario }}</strong> · Por {{ a.creadoPor?.nombre }}
            </div>
            <div class="text-[11px] text-[#9E9E9E]">
              {{ new Date(a.fechaEnvio).toLocaleString('es-VE') }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
