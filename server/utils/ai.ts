import { getSystemSettings } from './config'

interface ChatTurn {
  rol: 'user' | 'assistant'
  contenido: string
}

export async function generateAssistantReply(params: {
  mensajeUsuario: string
  historial: ChatTurn[]
  nombreUsuario: string
  sectorUsuario: string
  estadoPagoActual: string
  unidadesResumen: string
}): Promise<{ texto: string; proveedor: 'gemini' | 'simulado' }> {
  const config = useRuntimeConfig()
  const settings = await getSystemSettings()
  const montoBs = (settings.montoMensualUsd * settings.tasaCambio).toFixed(2)

  const systemPrompt = `Eres el Asistente Virtual oficial del ${settings.nombreInstitucion} (Municipio Ayacucho, Venezuela).
Responde siempre en español claro, institucional, cordial y conciso (máximo 120 palabras).
Datos reales del servicio:
- Tarifa mensual por jefe de familia: $${settings.montoMensualUsd.toFixed(2)} USD (equivalente referencial: Bs. ${montoBs} a tasa Bs. ${settings.tasaCambio.toFixed(2)}/USD).
- Pasarela de pago habilitada: Ubii Pagos (Pago Móvil, débito y crédito).
- Al confirmar el pago, el sistema emite automáticamente un comprobante oficial en PDF.
- Sectores y horarios:
  * Centro — Plaza Bolívar: Lunes y Jueves, 7:00 AM a 10:30 AM (Unidad 1).
  * El Topón: Lunes y Jueves, 1:00 PM a 4:30 PM (Unidad 1).
  * La Popa: Martes y Viernes, 7:30 AM a 11:00 AM (Unidad 2).
  * Las Flores: Martes y Viernes, 1:30 PM a 5:00 PM (Unidad 2).
  * San Félix: Miércoles y Sábado, 8:00 AM a 12:00 PM (Unidad 3).
- Estado actual de unidades: ${params.unidadesResumen}
- Contexto del vecino que escribe: ${params.nombreUsuario}, Sector ${params.sectorUsuario}, estado del mes actual: ${params.estadoPagoActual}.
- Para denuncias o sugerencias, indícale que puede usar la sección "Reportes" para seguimiento con número de caso y respuesta oficial.`

  if (config.geminiApiKey) {
    try {
      const contents = [
        ...params.historial.slice(-8).map((m) => ({
          role: m.rol === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.contenido }]
        })),
        { role: 'user', parts: [{ text: params.mensajeUsuario }] }
      ]

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          config.geminiApiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.4, maxOutputTokens: 350 }
          })
        }
      )

      if (res.ok) {
        const data: any = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          return { texto: text.trim(), proveedor: 'gemini' }
        }
      }
    } catch (err) {
      console.warn('Gemini API fallback activado:', err)
    }
  }

  // Respaldo inteligente en español cuando GEMINI_API_KEY no está configurada (ideal para demostración)
  const q = params.mensajeUsuario.toLowerCase()

  if (q.includes('pag') || q.includes('cuanto') || q.includes('cuánto') || q.includes('ubii') || q.includes('bs') || q.includes('bolivar') || q.includes('tasa')) {
    return {
      texto: `Hola ${params.nombreUsuario}. La tarifa mensual del servicio de recolección es de $${settings.montoMensualUsd.toFixed(2)} USD (aprox. Bs. ${montoBs} a la tasa referencial de Bs. ${settings.tasaCambio.toFixed(2)}/USD). Actualmente tu estado del mes figura como "${params.estadoPagoActual}". Puedes cancelar en segundos desde la pestaña "Pagos" usando Ubii Pagos (Pago Móvil o débito) y descargar de inmediato tu comprobante oficial en PDF.`,
      proveedor: 'simulado'
    }
  }

  if (q.includes('camion') || q.includes('camión') || q.includes('unidad') || q.includes('hora') || q.includes('cuando') || q.includes('cuándo') || q.includes('ruta') || q.includes('pasa')) {
    return {
      texto: `Para tu sector (${params.sectorUsuario}), puedes ver la ubicación en vivo de las 3 unidades en la pestaña "Mapa". Horarios regulares: Centro y El Topón (Lun/Jue), La Popa y Las Flores (Mar/Vie), y San Félix (Mié/Sáb). Estado actual de flota: ${params.unidadesResumen}.`,
      proveedor: 'simulado'
    }
  }

  if (q.includes('denuncia') || q.includes('queja') || q.includes('reclamo') || q.includes('sugerencia') || q.includes('basura') || q.includes('no paso') || q.includes('no pasó')) {
    return {
      texto: `Si deseas reportar una recolección no realizada, unidad averiada o enviar una sugerencia, ingresa a la sección "Reportes" en el menú. Podrás adjuntar una foto y tu ubicación actual; recibirás notificaciones cuando el administrador atienda y responda tu caso.`,
      proveedor: 'simulado'
    }
  }

  if (q.includes('comprobante') || q.includes('recibo') || q.includes('pdf') || q.includes('solvencia')) {
    return {
      texto: `Todos tus comprobantes oficiales en PDF están disponibles en la sección "Pagos" → "Historial de pagos". Solo haz clic en el ícono de descarga junto al mes cancelado para obtener tu constancia con número de referencia Ubii.`,
      proveedor: 'simulado'
    }
  }

  return {
    texto: `¡Hola ${params.nombreUsuario}! Soy el asistente virtual del ${settings.nombreInstitucion}. Puedo ayudarte con:\n• Estado de cuenta y pagos con Ubii Pagos ($${settings.montoMensualUsd.toFixed(2)} USD / Bs. ${montoBs}).\n• Horarios y ubicación en vivo de las 3 unidades de recolección.\n• Cómo registrar denuncias, sugerencias y descargar comprobantes PDF.\n\n¿Sobre cuál de estos temas deseas consultar?`,
    proveedor: 'simulado'
  }
}
