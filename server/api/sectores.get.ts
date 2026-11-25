import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const sectores = await prisma.sector.findMany({
    orderBy: { nombre: 'asc' }
  })
  return { sectores }
})
