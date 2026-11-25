import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const categoria = query.categoria ? String(query.categoria) : undefined
  const estado = query.estado ? String(query.estado) : undefined

  const where: Record<string, any> = {}
  if (user.rol === 'usuario') {
    where.usuarioId = user.id
  }
  if (categoria && categoria !== 'todas') {
    where.categoria = categoria
  }
  if (estado && estado !== 'todos') {
    where.estado = estado
  }

  const reportes = await prisma.reporte.findMany({
    where,
    orderBy: { fechaCreacion: 'desc' },
    include: {
      usuario: {
        select: { id: true, nombre: true, cedula: true, telefono: true }
      },
      respuestas: {
        orderBy: { fecha: 'asc' },
        include: {
          administrador: { select: { nombre: true, rol: true } }
        }
      }
    }
  })

  return { reportes }
})
