import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  await prisma.notificacion.updateMany({
    where: { usuarioId: user.id, leida: false },
    data: { leida: true }
  })
  return { ok: true }
})
