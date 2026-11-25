import { z } from 'zod'
import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { formatPeriodo, getSystemSettings, registrarAuditoria } from '~/server/utils/config'

const manualSchema = z.object({
  metodo: z.string().min(2).default('Pago en Taquilla / Manual'),
  referencia: z.string().min(3).optional()
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID de hogar requerido.' })

  const body = await readBody(event)
  const parsed = manualSchema.safeParse(body || {})
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos inválidos.' })
  }

  const hogar = await prisma.hogar.findUnique({ where: { id }, include: { usuario: true } })
  if (!hogar) throw createError({ statusCode: 404, statusMessage: 'Hogar no encontrado.' })

  const settings = await getSystemSettings()
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1
  const montoBs = Number((settings.montoMensualUsd * settings.tasaCambio).toFixed(2))
  const referencia =
    parsed.data.referencia?.trim() ||
    `MAN-${anio}${String(mes).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`

  const pago = await prisma.pago.upsert({
    where: {
      hogarId_anio_mes: {
        hogarId: hogar.id,
        anio,
        mes
      }
    },
    update: {
      estado: 'pagado',
      fechaPago: ahora,
      montoUsd: settings.montoMensualUsd,
      montoBs,
      tasaCambio: settings.tasaCambio,
      metodo: parsed.data.metodo,
      referencia,
      esSimulado: settings.demoMode
    },
    create: {
      hogarId: hogar.id,
      anio,
      mes,
      montoUsd: settings.montoMensualUsd,
      montoBs,
      tasaCambio: settings.tasaCambio,
      fechaPago: ahora,
      fechaVenc: new Date(anio, mes - 1, 28),
      metodo: parsed.data.metodo,
      referencia,
      estado: 'pagado',
      esSimulado: settings.demoMode
    }
  })

  await prisma.pago.update({
    where: { id: pago.id },
    data: { comprobanteUrl: `/api/pagos/${pago.id}/comprobante` }
  })

  await prisma.notificacion.create({
    data: {
      usuarioId: hogar.usuarioId,
      titulo: 'Pago manual registrado',
      mensaje: `La administración registró tu pago de ${formatPeriodo(anio, mes)} ($${settings.montoMensualUsd.toFixed(2)} USD). Ref: ${referencia}.`,
      tipo: 'pago',
      enlace: '/usuario/pagos'
    }
  })

  await registrarAuditoria({
    administradorId: admin.id,
    accion: 'REGISTRAR_PAGO_MANUAL',
    entidad: 'Pago',
    entidadId: pago.id,
    detalle: `Hogar ${hogar.numeroCuenta} - Ref ${referencia}`
  })

  return { ok: true, pago }
})
