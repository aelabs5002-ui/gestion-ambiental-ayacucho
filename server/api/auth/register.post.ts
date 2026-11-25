import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { createSessionToken, sanitizeUser, setAuthCookie } from '~/server/utils/auth'
import { getSystemSettings } from '~/server/utils/config'

const registerSchema = z.object({
  nombre: z.string().min(3, 'Ingresa tu nombre completo'),
  cedula: z.string().min(5, 'Ingresa una cédula válida'),
  telefono: z.string().min(7, 'Ingresa un número de teléfono válido'),
  correo: z.string().email('Correo electrónico inválido'),
  sectorId: z.string().min(1, 'Selecciona tu sector'),
  numeroCasa: z.string().min(1, 'Indica el número de casa'),
  direccion: z.string().min(5, 'Indica la dirección exacta'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Datos de registro inválidos.'
    throw createError({ statusCode: 400, statusMessage: firstMsg })
  }

  const data = parsed.data
  const correoNorm = data.correo.trim().toLowerCase()
  const cedulaNorm = data.cedula.trim().toUpperCase()

  const exists = await prisma.usuario.findFirst({
    where: { OR: [{ correo: correoNorm }, { cedula: cedulaNorm }] }
  })
  if (exists) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya existe una cuenta registrada con ese correo o cédula.'
    })
  }

  const sector = await prisma.sector.findUnique({ where: { id: data.sectorId } })
  if (!sector) {
    throw createError({ statusCode: 400, statusMessage: 'El sector seleccionado no es válido.' })
  }

  const totalHogares = await prisma.hogar.count()
  const numeroCuenta = `AYA-${String(1001 + totalHogares + Math.floor(Math.random() * 50)).padStart(5, '0')}`
  const passwordHash = await bcrypt.hash(data.password, 10)
  const settings = await getSystemSettings()
  const now = new Date()
  const anio = now.getFullYear()
  const mes = now.getMonth() + 1

  const usuario = await prisma.usuario.create({
    data: {
      nombre: data.nombre.trim(),
      cedula: cedulaNorm,
      correo: correoNorm,
      telefono: data.telefono.trim(),
      passwordHash,
      rol: 'usuario',
      estado: 'activo',
      ultimoAcceso: now,
      hogar: {
        create: {
          sectorId: sector.id,
          numeroCasa: data.numeroCasa.trim(),
          direccion: data.direccion.trim(),
          numeroCuenta,
          estado: 'activo',
          pagos: {
            create: {
              anio,
              mes,
              montoUsd: settings.montoMensualUsd,
              montoBs: Number((settings.montoMensualUsd * settings.tasaCambio).toFixed(2)),
              tasaCambio: settings.tasaCambio,
              fechaVenc: new Date(anio, mes - 1, 28),
              estado: 'pendiente',
              esSimulado: settings.demoMode
            }
          }
        }
      },
      notificaciones: {
        create: {
          titulo: '¡Bienvenido al Portal de Gestión Ambiental Ayacucho!',
          mensaje: `Tu cuenta ${numeroCuenta} fue creada con éxito en el sector ${sector.nombre}.`,
          tipo: 'aviso',
          enlace: '/usuario'
        }
      }
    },
    include: { hogar: { include: { sector: true } } }
  })

  const token = await createSessionToken({
    userId: usuario.id,
    rol: 'usuario',
    correo: usuario.correo,
    nombre: usuario.nombre
  })
  setAuthCookie(event, token)

  return { usuario: sanitizeUser(usuario) }
})
