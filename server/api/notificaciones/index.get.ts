import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const notificaciones = await prisma.notificacion.findMany({
    where: { usuarioId: user.id },
    orderBy: { fechaCreacion: 'desc' },
    take: 25
  })
  return { notificaciones }
})
