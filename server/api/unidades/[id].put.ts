import { z } from 'zod'
import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { registrarAuditoria } from '~/server/utils/config'

const updateSchema = z.object({
  placa: z.string().min(3).optional(),
  chofer: z.string().min(3).optional(),
  estado: z.enum(['en_ruta', 'detenida', 'fuera_de_servicio']).optional(),
  sectoresAsignados: z.string().min(2).optional(),
  horarioEstimado: z.string().min(2).optional()
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido.' })

  const body = await readBody(event)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos inválidos.' })
  }

  const unidad = await prisma.unidad.update({
    where: { id },
    data: {
      ...parsed.data,
      ultimaActualizacion: new Date()
    }
  })

  await registrarAuditoria({
    administradorId: admin.id,
    accion: 'ACTUALIZAR_UNIDAD',
    entidad: 'Unidad',
    entidadId: unidad.id,
    detalle: `Estado/datos actualizados para ${unidad.identificador}: ${unidad.estado}`
  })

  return { unidad }
})
