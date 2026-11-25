import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { formatPeriodo, getSystemSettings } from '~/server/utils/config'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (!user.hogar) {
    throw createError({ statusCode: 400, statusMessage: 'Tu cuenta no tiene un hogar asociado.' })
  }

  const query = getQuery(event)
  const anioFiltro = query.anio ? Number(query.anio) : undefined
  const settings = await getSystemSettings()

  const ahora = new Date()
  const anioActual = ahora.getFullYear()
  const mesActual = ahora.getMonth() + 1

  // Asegurar que exista el cargo del mes actual
  await prisma.pago.upsert({
    where: {
      hogarId_anio_mes: {
        hogarId: user.hogar.id,
        anio: anioActual,
        mes: mesActual
      }
    },
    update: {},
    create: {
      hogarId: user.hogar.id,
      anio: anioActual,
      mes: mesActual,
      montoUsd: settings.montoMensualUsd,
      montoBs: Number((settings.montoMensualUsd * settings.tasaCambio).toFixed(2)),
      tasaCambio: settings.tasaCambio,
      fechaVenc: new Date(anioActual, mesActual - 1, 28),
      estado: 'pendiente',
      esSimulado: settings.demoMode
    }
  })

  const todosPagos = await prisma.pago.findMany({
    where: { hogarId: user.hogar.id },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    take: 24
  })

  const pagoActual =
    todosPagos.find((p) => p.anio === anioActual && p.mes === mesActual) || todosPagos[0]
  const pendientesOVencidos = todosPagos.filter((p) => p.estado !== 'pagado')
  const totalDeudaUsd = pendientesOVencidos.reduce((acc, p) => acc + p.montoUsd, 0)

  const historial = (anioFiltro ? todosPagos.filter((p) => p.anio === anioFiltro) : todosPagos)
    .slice(0, 12)
    .map((p) => ({
      ...p,
      periodoLabel: formatPeriodo(p.anio, p.mes),
      montoBsActual:
        p.estado === 'pagado'
          ? p.montoBs
          : Number((p.montoUsd * settings.tasaCambio).toFixed(2))
    }))

  const aniosDisponibles = Array.from(new Set(todosPagos.map((p) => p.anio))).sort((a, b) => b - a)

  return {
    hogar: user.hogar,
    settings,
    pagoActual: pagoActual
      ? {
          ...pagoActual,
          periodoLabel: formatPeriodo(pagoActual.anio, pagoActual.mes),
          montoBsActual:
            pagoActual.estado === 'pagado'
              ? pagoActual.montoBs
              : Number((pagoActual.montoUsd * settings.tasaCambio).toFixed(2))
        }
      : null,
    pendientes: pendientesOVencidos.map((p) => ({
      ...p,
      periodoLabel: formatPeriodo(p.anio, p.mes),
      montoBsActual: Number((p.montoUsd * settings.tasaCambio).toFixed(2))
    })),
    totalDeudaUsd,
    totalDeudaBs: Number((totalDeudaUsd * settings.tasaCambio).toFixed(2)),
    historial,
    aniosDisponibles
  }
})
