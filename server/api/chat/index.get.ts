import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  let conversacion = await prisma.conversacionChat.findFirst({
    where: { usuarioId: user.id },
    orderBy: { fechaUltimoMensaje: 'desc' },
    include: {
      mensajes: {
        orderBy: { timestamp: 'asc' },
        take: 50
      }
    }
  })

  if (!conversacion) {
    conversacion = await prisma.conversacionChat.create({
      data: {
        usuarioId: user.id,
        mensajes: {
          create: {
            rol: 'assistant',
            contenido: `¡Hola ${user.nombre.split(' ')[0]}! Soy el Asistente Virtual de Gestión Ambiental Ayacucho. Puedo informarte sobre tu pago mensual ($3.00 USD vía Ubii Pagos), horarios de recolección en tu sector y cómo registrar denuncias o sugerencias. ¿En qué te ayudo hoy?`
          }
        }
      },
      include: {
        mensajes: { orderBy: { timestamp: 'asc' } }
      }
    })
  }

  return { conversacion }
})
