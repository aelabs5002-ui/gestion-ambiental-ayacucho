import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  correo: z.string().email('Ingresa un correo electrónico válido')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ingresa un correo electrónico válido.' })
  }

  const user = await prisma.usuario.findUnique({
    where: { correo: parsed.data.correo.trim().toLowerCase() }
  })

  // Por seguridad nunca revelamos si el correo existe o no
  if (user) {
    await prisma.notificacion.create({
      data: {
        usuarioId: user.id,
        titulo: 'Solicitud de recuperación de contraseña',
        mensaje: 'Se solicitó un enlace de restablecimiento de contraseña para tu cuenta.',
        tipo: 'aviso'
      }
    })
  }

  return {
    ok: true,
    mensaje:
      'Si el correo está registrado, hemos enviado las instrucciones para restablecer tu contraseña (en modo demostración se registra en el historial del sistema).'
  }
})
