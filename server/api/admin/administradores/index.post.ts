import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireRole } from '~/server/utils/auth'
import { findDuplicateUser, normalizeCedula, parseCedulaInput } from '~/server/utils/cedula'
import { prisma } from '~/server/utils/prisma'
import { registrarAuditoria } from '~/server/utils/config'

const schema = z.object({
  nombre: z.string().trim().min(3),
  cedula: z.string().trim().min(5),
  correo: z.string().trim().email(),
  telefono: z.string().trim().min(7).default('0414-0000000'),
  password: z.string().min(6),
  rol: z.enum(['admin', 'supervisor'])
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['admin'])
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Datos inválidos.'
    })
  }

  if (!parseCedulaInput(parsed.data.cedula).isCedula) {
    throw createError({ statusCode: 400, statusMessage: 'Ingresa una cédula válida (ej. V-15000000).' })
  }

  const correoNorm = parsed.data.correo.trim().toLowerCase()
  const cedulaNorm = normalizeCedula(parsed.data.cedula)

  const duplicate = await findDuplicateUser(prisma, correoNorm, cedulaNorm)
  if (duplicate) {
    throw createError({ statusCode: 409, statusMessage: 'Ya existe un usuario con ese correo o cédula.' })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  const creado = await prisma.usuario.create({
    data: {
      nombre: parsed.data.nombre.trim(),
      cedula: cedulaNorm,
      correo: correoNorm,
      telefono: parsed.data.telefono.trim(),
      passwordHash,
      rol: parsed.data.rol,
      estado: 'activo'
    },
    select: {
      id: true,
      nombre: true,
      cedula: true,
      correo: true,
      telefono: true,
      rol: true,
      estado: true,
      ultimoAcceso: true
    }
  })

  await registrarAuditoria({
    administradorId: admin.id,
    accion: 'CREAR_ADMINISTRADOR',
    entidad: 'Usuario',
    entidadId: creado.id,
    detalle: `Creado ${creado.rol}: ${creado.correo}`
  })

  return { administrador: creado }
})
