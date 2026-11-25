import { z } from 'zod'
import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { registrarAuditoria } from '~/server/utils/config'

const createSchema = z.object({
  identificador: z.string().min(2),
  placa: z.string().min(3),
  chofer: z.string().min(3),
  estado: z.enum(['en_ruta', 'detenida', 'fuera_de_servicio']).default('en_ruta'),
  sectoresAsignados: z.string().min(2),
  horarioEstimado: z.string().min(2).default('Lun–Sáb · 7:00 AM – 4:00 PM'),
  latitudActual: z.number().default(8.0314),
  longitudActual: z.number().default(-72.2606)
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['admin'])
  const body = await readBody(event)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message || 'Datos inválidos.' })
  }

  const unidad = await prisma.unidad.create({
    data: {
      ...parsed.data,
      ultimaActualizacion: new Date()
    }
  })

  await prisma.ubicacion.create({
    data: {
      unidadId: unidad.id,
      latitud: unidad.latitudActual,
      longitud: unidad.longitudActual,
      sectorNombre: unidad.sectoresAsignados.split(',')[0]?.trim() || 'Centro'
    }
  })

  await registrarAuditoria({
    administradorId: admin.id,
    accion: 'CREAR_UNIDAD',
    entidad: 'Unidad',
    entidadId: unidad.id,
    detalle: `Unidad creada: ${unidad.identificador} (${unidad.placa})`
  })

  return { unidad }
})
