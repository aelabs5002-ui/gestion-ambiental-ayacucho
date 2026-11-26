import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { createSessionToken, sanitizeUser, setAuthCookie } from '~/server/utils/auth'
import { findUserByIdentifier } from '~/server/utils/cedula'

const loginSchema = z.object({
  identificador: z.string().trim().min(3, 'Ingresa tu correo o cédula.').optional(),
  password: z.string().min(4, 'Ingresa tu contraseña.').optional(),
  demoRole: z.enum(['usuario', 'admin', 'supervisor']).optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Datos de inicio de sesión inválidos.'
    throw createError({ statusCode: 400, statusMessage: firstMsg })
  }

  const config = useRuntimeConfig()
  const { identificador, password, demoRole } = parsed.data

  let usuario: any = null

  if (demoRole && config.public.demoMode) {
    const demoEmails: Record<string, string> = {
      usuario: 'vecino@ayacucho.gob.ve',
      admin: 'admin@ayacucho.gob.ve',
      supervisor: 'supervisor@ayacucho.gob.ve'
    }
    usuario = await prisma.usuario.findUnique({
      where: { correo: demoEmails[demoRole] },
      include: { hogar: { include: { sector: true } } }
    })
  } else {
    if (!identificador || !password) {
      throw createError({ statusCode: 400, statusMessage: 'Ingresa tu correo o cédula y tu contraseña.' })
    }

    usuario = await findUserByIdentifier(prisma, identificador)

    if (!usuario) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciales incorrectas. Verifica tu correo o cédula y tu contraseña.'
      })
    }

    const valid = await bcrypt.compare(password, usuario.passwordHash)
    if (!valid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciales incorrectas. Verifica tu correo o cédula y tu contraseña.'
      })
    }
  }

  if (!usuario) {
    throw createError({ statusCode: 404, statusMessage: 'Cuenta no encontrada. Verifica el seed de la base de datos.' })
  }

  if (usuario.estado !== 'activo') {
    throw createError({ statusCode: 403, statusMessage: 'Tu cuenta se encuentra inactiva. Contacta a la administración.' })
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAcceso: new Date() }
  })

  const token = await createSessionToken({
    userId: usuario.id,
    rol: usuario.rol,
    correo: usuario.correo,
    nombre: usuario.nombre
  })
  setAuthCookie(event, token)

  return {
    usuario: sanitizeUser(usuario)
  }
})
