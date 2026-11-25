<script setup lang="ts">
import { Send, Bot, Sparkles } from 'lucide-vue-next'

definePageMeta({ layout: 'usuario' })

const { data } = await useFetch<any>('/api/chat')
const mensajes = ref<any[]>(data.value?.conversacion?.mensajes || [])
const texto = ref('')
const enviando = ref(false)
const scrollBox = ref<HTMLElement | null>(null)

const sugerencias = [
  '¿Cuánto debo pagar este mes en Bs?',
  '¿Cuándo pasa el camión por mi sector?',
  '¿Cómo descargo mi comprobante PDF?',
  'Quiero reportar que no pasó el camión'
]

const bajarScroll = () => {
  nextTick(() => {
    if (scrollBox.value) {
      scrollBox.value.scrollTop = scrollBox.value.scrollHeight
    }
  })
}

onMounted(bajarScroll)

const enviar = async (customText?: string) => {
  const contenido = (customText ?? texto.value).trim()
  if (!contenido || enviando.value) return

  texto.value = ''
  enviando.value = true
  const tempId = `temp-${Date.now()}`
  mensajes.value.push({
    id: tempId,
    rol: 'user',
    contenido,
    timestamp: new Date().toISOString()
  })
  bajarScroll()

  try {
    const res = await $fetch<any>('/api/chat', {
      method: 'POST',
      body: { mensaje: contenido }
    })
    mensajes.value = mensajes.value.filter((m) => m.id !== tempId)
    mensajes.value.push(res.mensajeUsuario, res.mensajeAsistente)
    bajarScroll()
  } catch {
    mensajes.value.push({
      id: `err-${Date.now()}`,
      rol: 'assistant',
      contenido: 'Lo siento, ocurrió un problema al responder. Intenta nuevamente.',
      timestamp: new Date().toISOString()
    })
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-11.5rem)] lg:h-[calc(100vh-7.5rem)] bg-white rounded-xl border border-[#E0E4E8] shadow-card overflow-hidden">
    <!-- Aviso fijo superior obligatorio -->
    <div class="bg-[#1565C0] text-white px-4 py-3 flex items-center justify-between gap-2 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
          <Bot class="w-5 h-5" />
        </div>
        <div>
          <div class="text-sm font-bold leading-tight">Asistente Virtual Ayacucho</div>
          <div class="text-[11px] text-[#DAE5FF] flex items-center gap-1">
            <Sparkles class="w-3 h-3" />
            Las respuestas son generadas por IA
          </div>
        </div>
      </div>
    </div>

    <!-- Mensajes -->
    <div ref="scrollBox" class="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F7FA]">
      <div
        v-for="m in mensajes"
        :key="m.id"
        class="flex"
        :class="m.rol === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line shadow-sm"
          :class="
            m.rol === 'user'
              ? 'bg-[#1565C0] text-white rounded-br-sm'
              : 'bg-white text-[#1A1A1A] border border-[#E0E4E8] rounded-bl-sm'
          "
        >
          {{ m.contenido }}
          <div
            class="text-[10px] mt-1 text-right"
            :class="m.rol === 'user' ? 'text-[#DAE5FF]' : 'text-[#9E9E9E]'"
          >
            {{ new Date(m.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) }}
          </div>
        </div>
      </div>

      <div v-if="enviando" class="flex justify-start">
        <div class="bg-white border border-[#E0E4E8] rounded-2xl px-4 py-2.5 text-xs text-[#616161]">
          Escribiendo respuesta...
        </div>
      </div>
    </div>

    <!-- Preguntas rápidas (cómodas en teléfono) -->
    <div class="px-3 py-2 bg-white border-t border-[#EEEEEE] flex gap-2 overflow-x-auto shrink-0">
      <button
        v-for="s in sugerencias"
        :key="s"
        type="button"
        class="text-xs whitespace-nowrap rounded-full border border-[#1565C0]/30 bg-[#1565C0]/[0.04] text-[#1565C0] px-3 py-1.5 hover:bg-[#1565C0]/10 transition"
        :disabled="enviando"
        @click="enviar(s)"
      >
        {{ s }}
      </button>
    </div>

    <!-- Barra de entrada -->
    <form class="p-3 bg-white border-t border-[#E0E4E8] flex items-center gap-2 shrink-0" @submit.prevent="enviar()">
      <input
        v-model="texto"
        type="text"
        placeholder="Escribe tu consulta sobre pagos, horarios o servicio..."
        class="input-field flex-1"
        :disabled="enviando"
      />
      <button type="submit" class="btn-primary px-4 shrink-0" :disabled="enviando || !texto.trim()" aria-label="Enviar mensaje">
        <Send class="w-4 h-4" />
      </button>
    </form>
  </div>
</template>
