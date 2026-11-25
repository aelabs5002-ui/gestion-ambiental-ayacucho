import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { formatPeriodo, getSystemSettings, nombreMes } from '~/server/utils/config'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin', 'supervisor'])
  const settings = await getSystemSettings()

  const ahora = new Date()
  const anioActual = ahora.getFullYear()
  const mesActual = ahora.getMonth() + 1

  const [hogaresActivos, pagosMesActual, sectores, unidades, denunciasAbiertas, ultimosPagos] =
    await Promise.all([
      prisma.hogar.count({ where: { estado: 'activo' } }),
      prisma.pago.findMany({
        where: { anio: anioActual, mes: mesActual },
        include: { hogar: { include: { sector: true } } }
      }),
      prisma.sector.findMany({ orderBy: { nombre: 'asc' } }),
      prisma.unidad.findMany({ orderBy: { identificador: 'asc' } }),
      prisma.reporte.count({ where: { estado: { in: ['recibido', 'en_proceso'] } } }),
      prisma.pago.findMany({
        where: { estado: 'pagado' },
        orderBy: { fechaPago: 'desc' },
        take: 5,
        include: {
          hogar: {
            include: {
              usuario: { select: { nombre: true, cedula: true } },
              sector: { select: { nombre: true } }
            }
          }
        }
      })
    ])

  const hogaresPagados = pagosMesActual.filter((p) => p.estado === 'pagado').length
  const hogaresPendientes = pagosMesActual.filter((p) => p.estado === 'pendiente').length
  const hogaresVencidos = pagosMesActual.filter((p) => p.estado === 'vencido').length
  const montoRecaudadoUsd = pagosMesActual
    .filter((p) => p.estado === 'pagado')
    .reduce((acc, p) => acc + p.montoUsd, 0)
  const montoPendienteUsd = pagosMesActual
    .filter((p) => p.estado !== 'pagado')
    .reduce((acc, p) => acc + p.montoUsd, 0)
  const porcentajePagos =
    hogaresActivos > 0 ? Number(((hogaresPagados / hogaresActivos) * 100).toFixed(1)) : 0

  // Serie de 6 meses para gráfico de barras "Pagos por Mes"
  const pagosPorMes: Array<{ label: string; pagados: number; recaudadoUsd: number }> = []
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(anioActual, mesActual - 1 - offset, 1)
    const anio = d.getFullYear()
    const mes = d.getMonth() + 1
    const pagosM = await prisma.pago.findMany({
      where: { anio, mes, estado: 'pagado' },
      select: { montoUsd: true }
    })
    pagosPorMes.push({
      label: `${nombreMes(mes).slice(0, 3)} ${String(anio).slice(-2)}`,
      pagados: pagosM.length,
      recaudadoUsd: Number(pagosM.reduce((a, b) => a + b.montoUsd, 0).toFixed(2))
    })
  }

  // Gráfico circular "Pagos por Sector" (mes actual)
  const pagosPorSector = sectores.map((s) => {
    const pagadosSector = pagosMesActual.filter(
      (p) => p.hogar.sectorId === s.id && p.estado === 'pagado'
    ).length
    return {
      sector: s.nombre,
      pagados: pagadosSector
    }
  })

  return {
    periodoActual: formatPeriodo(anioActual, mesActual),
    settings,
    kpis: {
      hogaresActivos,
      hogaresPagados,
      hogaresPendientes,
      hogaresVencidos,
      montoRecaudadoUsd: Number(montoRecaudadoUsd.toFixed(2)),
      montoRecaudadoBs: Number((montoRecaudadoUsd * settings.tasaCambio).toFixed(2)),
      montoPendienteUsd: Number(montoPendienteUsd.toFixed(2)),
      porcentajePagos,
      denunciasAbiertas
    },
    pagosPorMes,
    pagosPorSector,
    ultimosPagos: ultimosPagos.map((p) => ({
      id: p.id,
      hogar: p.hogar.usuario.nombre,
      numeroCuenta: p.hogar.numeroCuenta,
      sector: p.hogar.sector.nombre,
      montoUsd: p.montoUsd,
      montoBs: p.montoBs,
      fechaPago: p.fechaPago,
      referencia: p.referencia,
      estado: p.estado
    })),
    unidades
  }
})
