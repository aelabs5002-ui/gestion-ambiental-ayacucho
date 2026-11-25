import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { getSystemSettings } from '~/server/utils/config'
import { generarComprobantePagoPdf } from '~/server/utils/pdf'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de pago requerido.' })
  }

  const pago = await prisma.pago.findUnique({
    where: { id },
    include: {
      hogar: {
        include: {
          usuario: true,
          sector: true
        }
      }
    }
  })

  if (!pago || pago.estado !== 'pagado') {
    throw createError({ statusCode: 404, statusMessage: 'Comprobante no disponible.' })
  }

  // Solo el dueño del hogar o admin/supervisor pueden descargar
  if (user.rol === 'usuario' && pago.hogar.usuarioId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para descargar este comprobante.' })
  }

  const settings = await getSystemSettings()
  const pdfBytes = await generarComprobantePagoPdf({
    institucion: settings.nombreInstitucion,
    referencia: pago.referencia || `AYA-${pago.id.slice(-8).toUpperCase()}`,
    numeroCuenta: pago.hogar.numeroCuenta,
    nombreTitular: pago.hogar.usuario.nombre,
    cedula: pago.hogar.usuario.cedula,
    sector: pago.hogar.sector.nombre,
    direccion: pago.hogar.direccion,
    numeroCasa: pago.hogar.numeroCasa,
    anio: pago.anio,
    mes: pago.mes,
    montoUsd: pago.montoUsd,
    montoBs: pago.montoBs,
    tasaCambio: pago.tasaCambio,
    metodo: pago.metodo,
    fechaPago: pago.fechaPago || new Date(),
    esSimulado: pago.esSimulado
  })

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="Comprobante-${pago.hogar.numeroCuenta}-${pago.anio}-${String(pago.mes).padStart(2, '0')}.pdf"`
  )

  return Buffer.from(pdfBytes)
})
