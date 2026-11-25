import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { generateAssistantReply } from '~/server/utils/ai'

const chatSchema = z.object({
  mensaje: z.string().min(1).max(1000)
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Escribe un mensaje válido.' })
  }

  let conversacion = await prisma.conversacionChat.findFirst({
    where: { usuarioId: user.id },
    orderBy: { fechaUltimoMensaje: 'desc' },
    include: {
      mensajes: { orderBy: { timestamp: 'asc' }, take: 20 }
    }
  })

  if (!conversacion) {
    conversacion = await prisma.conversacionChat.create({
      data: { usuarioId: user.id },
      include: { mensajes: true }
    })
  }

  const msgUser = await prisma.mensajeChat.create({
    data: {
      conversacionId: conversacion.id,
      rol: 'user',
      contenido: parsed.data.mensaje.trim()
    }
  })

  // Contexto operativo en tiempo real
  const ahora = new Date()
  let estadoPagoActual = 'Sin registro'
  if (user.hogar) {
    const pago = await prisma.pago.findUnique({
      where: {
        hogarId_anio_mes: {
          hogarId: user.hogar.id,
          anio: ahora.getFullYear(),
          mes: ahora.getMonth() + 1
        }
      }
    })
    if (pago) estadoPagoActual = pago.estado.toUpperCase()
  }

  const unidades = await prisma.unidad.findMany({ orderBy: { identificador: 'asc' } })
  const unidadesResumen = unidades
    .map((u) => `${u.identificador} (${u.estado.replace('_', ' ')} en ${u.sectoresAsignados})`)
    .join('; ')

  const reply = await generateAssistantReply({
    mensajeUsuario: parsed.data.mensaje.trim(),
    historial: conversacion.mensajes.map((m) => ({
      rol: m.rol as 'user' | 'assistant',
      contenido: m.contenido
    })),
    nombreUsuario: user.nombre,
    sectorUsuario: user.hogar?.sector?.nombre || 'Municipio Ayacucho',
    estadoPagoActual,
    unidadesResumen
  })

  const msgAssistant = await prisma.mensajeChat.create({
    data: {
      conversacionId: conversacion.id,
      rol: 'assistant',
      contenido: reply.texto
    }
  })

  await prisma.conversacionChat.update({
    where: { id: conversacion.id },
    data: { fechaUltimoMensaje: new Date() }
  })

  return {
    mensajeUsuario: msgUser,
    mensajeAsistente: msgAssistant,
    proveedor: reply.proveedor
  }
})
