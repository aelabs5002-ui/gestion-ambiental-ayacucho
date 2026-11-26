import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { createSessionToken, sanitizeUser, setAuthCookie } from '~/server/utils/auth'
import { findDuplicateUser, normalizeCedula, parseCedulaInput } from '~/server/utils/cedula'
import { getSystemSettings } from '~/server/utils/config'

const registerSchema = z.object({
  nombre: z.string().trim().min(3, 'Ingresa tu nombre completo'),
  cedula: z.string().trim().min(5, 'Ingresa una cédula válida'),
  telefono: z.string().trim().min(7, 'Ingresa un número de teléfono válido'),
  correo: z.string().trim().email('Correo electrónico inválido'),
  sectorId: z.string().min(1, 'Selecciona tu sector'),
  numeroCasa: z.string().trim().min(1, 'Indica el número de casa'),
  direccion: z.string().trim().min(5, 'Indica la dirección exacta'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

async function generarNumeroCuentaUnico(): Promise<string> {
  const totalHogares = await prisma.hogar.count()
  let consecutivo = 1001 + totalHogares
  for (let intento = 0; intento < 25; intento++) {
    const candidato = `AYA-${String(consecutivo + intento).padStart(5, '0')}`
    const existe = await prisma.hogar.findUnique({ where: { numeroCuenta: candidato }, select: { id: true } })
    if (!existe) return candidato
  }
  return `AYA-${Date.now().toString().slice(-6)}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Datos de registro inválidos.'
    throw createError({ statusCode: 400, statusMessage: firstMsg })
  }

  const data = parsed.data
  const parsedCedula = parseCedulaInput(data.cedula)
  if (!parsedCedula.isCedula) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ingresa una cédula válida (ej. V-18456123 o 18456123).'
    })
  }

  const correoNorm = data.correo.trim().toLowerCase()
  const cedulaNorm = normalizeCedula(data.cedula)

  const duplicate = await findDuplicateUser(prisma, correoNorm, cedulaNorm)
  if (duplicate) {
    throw createError({
      statusCode: 409,
      statusMessage:
        duplicate.reason === 'correo'
          ? 'Ya existe una cuenta registrada con ese correo electrónico.'
          : 'Ya existe una cuenta registrada con esa cédula.'
    })
  }

  const sector = await prisma.sector.findUnique({ where: { id: data.sectorId } })
  if (!sector) {
    throw createError({ statusCode: 400, statusMessage: 'El sector seleccionado no es válido.' })
  }

  const numeroCuenta = await generarNumeroCuentaUnico()
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
