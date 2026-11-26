import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { formatPeriodo, getSystemSettings } from '~/server/utils/config'
import { getPaymentAdapter } from '~/server/utils/payments'

const crearPagoSchema = z.object({
  pagoIds: z.array(z.string().min(1)).min(1, 'Selecciona al menos un período a pagar'),
  metodo: z.string().min(2).default('Pago Móvil'),
  telefonoPagoMovil: z.string().optional(),
  bancoOrigen: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (!user.hogar) {
    throw createError({ statusCode: 400, statusMessage: 'Tu cuenta no tiene un hogar asociado.' })
  }

  const body = await readBody(event)
  const parsed = crearPagoSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message || 'Datos de pago inválidos.' })
  }

  const pagosPendientes = await prisma.pago.findMany({
    where: {
      id: { in: parsed.data.pagoIds },
      hogarId: user.hogar.id,
      estado: { not: 'pagado' }
    }
  })

  if (pagosPendientes.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Los períodos seleccionados ya se encuentran pagados.' })
  }

  const settings = await getSystemSettings()
  const totalUsd = pagosPendientes.reduce((acc, p) => acc + p.montoUsd, 0)
  const totalBs = Number((totalUsd * settings.tasaCambio).toFixed(2))

  const adapter = getPaymentAdapter()
  const resultado = await adapter.crearPago({
    pagoId: pagosPendientes[0].id,
    numeroCuenta: user.hogar.numeroCuenta,
    nombreCliente: user.nombre,
    cedula: user.cedula,
    montoUsd: totalUsd,
    montoBs: totalBs,
    tasaCambio: settings.tasaCambio,
    metodoSeleccionado: parsed.data.metodo,
    telefonoPagoMovil: parsed.data.telefonoPagoMovil,
    bancoOrigen: parsed.data.bancoOrigen
  })

  const ahora = new Date()
  const actualizados = []

  if (resultado.estado === 'aprobado') {
    for (const pago of pagosPendientes) {
      const montoBs = Number((pago.montoUsd * settings.tasaCambio).toFixed(2))
      const updated = await prisma.pago.update({
        where: { id: pago.id },
        data: {
          estado: 'pagado',
          fechaPago: ahora,
          montoBs,
          tasaCambio: settings.tasaCambio,
          metodo: parsed.data.metodo,
          referencia: resultado.referencia,
          comprobanteUrl: `/api/pagos/${pago.id}/comprobante`,
          esSimulado: resultado.esSimulado
        }
      })
      actualizados.push(updated)
    }

    const periodosTexto = pagosPendientes.map((p) => formatPeriodo(p.anio, p.mes)).join(', ')

    await prisma.notificacion.create({
      data: {
        usuarioId: user.id,
        titulo: 'Pago confirmado — Comprobante disponible',
        mensaje: `Recibimos tu pago de $${totalUsd.toFixed(2)} USD (Bs. ${totalBs.toFixed(2)}) para ${periodosTexto}. Ref: ${resultado.referencia}.`,
        tipo: 'pago',
        enlace: '/usuario/pagos'
      }
    })
  }

  return {
    ok: true,
    resultado,
    pagosActualizados: actualizados
  }
})
