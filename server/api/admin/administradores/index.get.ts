import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const administradores = await prisma.usuario.findMany({
    where: { rol: { in: ['admin', 'supervisor'] } },
    orderBy: { fechaRegistro: 'desc' },
    select: {
      id: true,
      nombre: true,
      cedula: true,
      correo: true,
      telefono: true,
      rol: true,
      estado: true,
      ultimoAcceso: true,
      fechaRegistro: true
    }
  })
  return { administradores }
})
