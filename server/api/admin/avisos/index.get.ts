import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin', 'supervisor'])
  const avisos = await prisma.aviso.findMany({
    orderBy: { fechaEnvio: 'desc' },
    take: 30,
    include: {
      creadoPor: { select: { nombre: true } }
    }
  })
  return { avisos }
})
