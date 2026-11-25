import { z } from 'zod'
import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { getSystemSettings, registrarAuditoria } from '~/server/utils/config'

const schema = z.object({
  tasaCambio: z.number().positive().max(100000).optional(),
  montoMensualUsd: z.number().positive().max(1000).optional()
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['admin'])
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Valores de configuración inválidos.' })
  }

  if (parsed.data.tasaCambio) {
    await prisma.configuracion.upsert({
      where: { clave: 'tasa_cambio_usd_bs' },
      update: { valor: parsed.data.tasaCambio.toFixed(2) },
      create: {
        clave: 'tasa_cambio_usd_bs',
        valor: parsed.data.tasaCambio.toFixed(2),
        descripcion: 'Tasa oficial referencial BCV (Bs. por 1 USD)'
      }
    })
    await registrarAuditoria({
      administradorId: admin.id,
      accion: 'ACTUALIZAR_TASA_CAMBIO',
      entidad: 'Configuracion',
      entidadId: 'tasa_cambio_usd_bs',
      detalle: `Nueva tasa: Bs. ${parsed.data.tasaCambio.toFixed(2)}/USD`
    })
  }

  if (parsed.data.montoMensualUsd) {
    await prisma.configuracion.upsert({
      where: { clave: 'monto_mensual_usd' },
      update: { valor: parsed.data.montoMensualUsd.toFixed(2) },
      create: {
        clave: 'monto_mensual_usd',
        valor: parsed.data.montoMensualUsd.toFixed(2),
        descripcion: 'Tarifa mensual del servicio de recolección (USD)'
      }
    })
  }

  const settings = await getSystemSettings()
  return { ok: true, settings }
})
