import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { registrarAuditoria } from '~/server/utils/config'

const schema = z.object({
  nombre: z.string().min(3).optional(),
  rol: z.enum(['admin', 'supervisor']).optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
  nuevaPassword: z.string().min(6).optional()
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido.' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos inválidos.' })
  }

  if (id === admin.id && parsed.data.estado === 'inactivo') {
    throw createError({ statusCode: 400, statusMessage: 'No puedes desactivar tu propia cuenta.' })
  }

  const updateData: Record<string, any> = {}
  if (parsed.data.nombre) updateData.nombre = parsed.data.nombre.trim()
  if (parsed.data.rol) updateData.rol = parsed.data.rol
  if (parsed.data.estado) updateData.estado = parsed.data.estado
  if (parsed.data.nuevaPassword) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.nuevaPassword, 10)
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      nombre: true,
      cedula: true,
      correo: true,
      rol: true,
      estado: true,
      ultimoAcceso: true
    }
  })

  await registrarAuditoria({
    administradorId: admin.id,
    accion: 'ACTUALIZAR_ADMINISTRADOR',
    entidad: 'Usuario',
    entidadId: id,
    detalle: `Actualizado ${updated.correo}`
  })

  return { administrador: updated }
})
