import { z } from 'zod'
import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { registrarAuditoria } from '~/server/utils/config'

const responderSchema = z.object({
  estado: z.enum(['recibido', 'en_proceso', 'resuelto']),
  mensaje: z.string().min(3, 'Escribe una respuesta para el vecino').max(1500)
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID de reporte requerido.' })

  const body = await readBody(event)
  const parsed = responderSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Respuesta inválida.'
    })
  }

  const existente = await prisma.reporte.findUnique({ where: { id } })
  if (!existente) throw createError({ statusCode: 404, statusMessage: 'Reporte no encontrado.' })

  await prisma.respuestaReporte.create({
    data: {
      reporteId: id,
      administradorId: admin.id,
      mensaje: parsed.data.mensaje.trim()
    }
  })

  const reporte = await prisma.reporte.update({
    where: { id },
    data: { estado: parsed.data.estado },
    include: {
      usuario: { select: { id: true, nombre: true, cedula: true, telefono: true } },
      respuestas: {
        orderBy: { fecha: 'asc' },
        include: { administrador: { select: { nombre: true, rol: true } } }
      }
    }
  })

  const estadoTexto =
    parsed.data.estado === 'resuelto'
      ? 'Resuelto'
      : parsed.data.estado === 'en_proceso'
        ? 'En proceso'
        : 'Recibido'

  await prisma.notificacion.create({
    data: {
      usuarioId: existente.usuarioId,
      titulo: `Tu reporte pasó a "${estadoTexto}"`,
      mensaje: `Respuesta oficial: ${parsed.data.mensaje.trim().slice(0, 140)}`,
      tipo: 'reporte',
      enlace: '/usuario/reportes'
    }
  })

  await registrarAuditoria({
    administradorId: admin.id,
    accion: 'RESPONDER_REPORTE',
    entidad: 'Reporte',
    entidadId: id,
    detalle: `Cambio de estado a ${parsed.data.estado}`
  })

  return { reporte }
})
