import { z } from 'zod'
import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { registrarAuditoria } from '~/server/utils/config'

const updateSchema = z.object({
  nombre: z.string().min(3).optional(),
  telefono: z.string().min(7).optional(),
  sectorId: z.string().min(1).optional(),
  numeroCasa: z.string().min(1).optional(),
  direccion: z.string().min(4).optional(),
  estadoCuenta: z.enum(['activo', 'inactivo']).optional()
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID de hogar requerido.' })

  const body = await readBody(event)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos inválidos.' })
  }

  const hogar = await prisma.hogar.findUnique({ where: { id }, include: { usuario: true } })
  if (!hogar) throw createError({ statusCode: 404, statusMessage: 'Hogar no encontrado.' })

  const d = parsed.data

  if (d.nombre || d.telefono || d.estadoCuenta) {
    await prisma.usuario.update({
      where: { id: hogar.usuarioId },
      data: {
        ...(d.nombre ? { nombre: d.nombre.trim() } : {}),
        ...(d.telefono ? { telefono: d.telefono.trim() } : {}),
        ...(d.estadoCuenta ? { estado: d.estadoCuenta } : {})
      }
    })
  }

  const updated = await prisma.hogar.update({
    where: { id },
    data: {
      ...(d.sectorId ? { sectorId: d.sectorId } : {}),
      ...(d.numeroCasa ? { numeroCasa: d.numeroCasa.trim() } : {}),
      ...(d.direccion ? { direccion: d.direccion.trim() } : {}),
      ...(d.estadoCuenta ? { estado: d.estadoCuenta } : {})
    }
  })

  await registrarAuditoria({
    administradorId: admin.id,
    accion: 'ACTUALIZAR_HOGAR',
    entidad: 'Hogar',
    entidadId: id,
    detalle: `Actualización de hogar ${hogar.numeroCuenta}`
  })

  return { ok: true, hogar: updated }
})
