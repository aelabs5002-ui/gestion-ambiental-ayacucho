import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const gpsSchema = z.object({
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  sectorNombre: z.string().optional(),
  estado: z.enum(['en_ruta', 'detenida', 'fuera_de_servicio']).optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID de unidad requerido.' })

  const body = await readBody(event)
  const parsed = gpsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Coordenadas GPS inválidas.' })
  }

  const unidad = await prisma.unidad.findUnique({ where: { id } })
  if (!unidad) throw createError({ statusCode: 404, statusMessage: 'Unidad no encontrada.' })

  const updated = await prisma.unidad.update({
    where: { id },
    data: {
      latitudActual: parsed.data.latitud,
      longitudActual: parsed.data.longitud,
      estado: parsed.data.estado || unidad.estado,
      ultimaActualizacion: new Date()
    }
  })

  const ubicacion = await prisma.ubicacion.create({
    data: {
      unidadId: id,
      latitud: parsed.data.latitud,
      longitud: parsed.data.longitud,
      sectorNombre: parsed.data.sectorNombre || unidad.sectoresAsignados.split(',')[0]?.trim() || 'En ruta'
    }
  })

  return { ok: true, unidad: updated, ubicacion }
})
