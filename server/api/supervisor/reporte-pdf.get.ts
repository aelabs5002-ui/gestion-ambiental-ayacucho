import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { formatPeriodo, getSystemSettings } from '~/server/utils/config'
import { generarReporteSupervisionPdf } from '~/server/utils/pdf'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin', 'supervisor'])
  const settings = await getSystemSettings()
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1

  const [totalHogares, pagosMes, unidades, denunciasAbiertas] = await Promise.all([
    prisma.hogar.count({ where: { estado: 'activo' } }),
    prisma.pago.findMany({ where: { anio, mes } }),
    prisma.unidad.findMany({ orderBy: { identificador: 'asc' } }),
    prisma.reporte.count({ where: { estado: { in: ['recibido', 'en_proceso'] } } })
  ])

  const hogaresPagados = pagosMes.filter((p) => p.estado === 'pagado').length
  const hogaresPendientes = pagosMes.filter((p) => p.estado === 'pendiente').length
  const hogaresVencidos = pagosMes.filter((p) => p.estado === 'vencido').length
  const montoRecaudadoUsd = pagosMes
    .filter((p) => p.estado === 'pagado')
    .reduce((acc, p) => acc + p.montoUsd, 0)
  const porcentajeRecaudacion = totalHogares > 0 ? (hogaresPagados / totalHogares) * 100 : 0

  const pdfBytes = await generarReporteSupervisionPdf({
    institucion: settings.nombreInstitucion,
    periodo: formatPeriodo(anio, mes),
    totalHogares,
    hogaresPagados,
    hogaresPendientes,
    hogaresVencidos,
    porcentajeRecaudacion,
    montoRecaudadoUsd,
    tasaCambio: settings.tasaCambio,
    denunciasAbiertas,
    unidades
  })

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="Reporte-Supervision-Ayacucho-${anio}-${String(mes).padStart(2, '0')}.pdf"`
  )
  return Buffer.from(pdfBytes)
})
