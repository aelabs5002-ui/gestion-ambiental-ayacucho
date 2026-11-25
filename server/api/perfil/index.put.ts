import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireAuth, sanitizeUser } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

const perfilSchema = z.object({
  nombre: z.string().min(3).optional(),
  telefono: z.string().min(7).optional(),
  direccion: z.string().min(4).optional(),
  numeroCasa: z.string().min(1).optional(),
  sectorId: z.string().min(1).optional(),
  passwordActual: z.string().optional(),
  passwordNueva: z.string().min(6).optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const parsed = perfilSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message || 'Datos inválidos.' })
  }

  const data = parsed.data
  const updateData: Record<string, any> = {}

  if (data.nombre) updateData.nombre = data.nombre.trim()
  if (data.telefono) updateData.telefono = data.telefono.trim()

  if (data.passwordNueva) {
    if (!data.passwordActual) {
      throw createError({ statusCode: 400, statusMessage: 'Debes ingresar tu contraseña actual.' })
    }
    const ok = await bcrypt.compare(data.passwordActual, user.passwordHash)
    if (!ok) {
      throw createError({ statusCode: 400, statusMessage: 'La contraseña actual es incorrecta.' })
    }
    updateData.passwordHash = await bcrypt.hash(data.passwordNueva, 10)
  }

  await prisma.usuario.update({
    where: { id: user.id },
    data: updateData
  })

  if (user.hogar && (data.direccion || data.numeroCasa || data.sectorId)) {
    await prisma.hogar.update({
      where: { id: user.hogar.id },
      data: {
        ...(data.direccion ? { direccion: data.direccion.trim() } : {}),
        ...(data.numeroCasa ? { numeroCasa: data.numeroCasa.trim() } : {}),
        ...(data.sectorId ? { sectorId: data.sectorId } : {})
      }
    })
  }

  const refreshed = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { hogar: { include: { sector: true } } }
  })

  return { usuario: sanitizeUser(refreshed) }
})
