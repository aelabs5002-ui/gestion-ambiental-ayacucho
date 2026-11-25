import { getSessionUser, sanitizeUser } from '~/server/utils/auth'
import { getSystemSettings } from '~/server/utils/config'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const usuario = await getSessionUser(event)
  const settings = await getSystemSettings()

  let notificacionesNoLeidas = 0
  if (usuario) {
    notificacionesNoLeidas = await prisma.notificacion.count({
      where: { usuarioId: usuario.id, leida: false }
    })
  }

  return {
    usuario: sanitizeUser(usuario),
    settings,
    notificacionesNoLeidas
  }
})
