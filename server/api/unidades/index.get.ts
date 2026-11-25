import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const query = getQuery(event)
  const simular = query.simular === '1' || query.simular === 'true'
  const config = useRuntimeConfig()

  let unidades = await prisma.unidad.findMany({
    orderBy: { identificador: 'asc' },
    include: {
      ubicaciones: {
        orderBy: { timestamp: 'desc' },
        take: 6
      }
    }
  })

  // En modo demostración, al pulsar refrescar podemos simular avance suave de las unidades en ruta
  if (simular && config.public.demoMode) {
    for (const u of unidades) {
      if (u.estado === 'en_ruta') {
        const dLat = (Math.random() - 0.5) * 0.0018
        const dLng = (Math.random() - 0.5) * 0.0018
        const newLat = Number(Math.max(8.015, Math.min(8.042, u.latitudActual + dLat)).toFixed(6))
        const newLng = Number(Math.max(-72.278, Math.min(-72.248, u.longitudActual + dLng)).toFixed(6))

        await prisma.unidad.update({
          where: { id: u.id },
          data: {
            latitudActual: newLat,
            longitudActual: newLng,
            ultimaActualizacion: new Date()
          }
        })

        await prisma.ubicacion.create({
          data: {
            unidadId: u.id,
            latitud: newLat,
            longitud: newLng,
            sectorNombre: u.sectoresAsignados.split(',')[0]?.trim() || 'Centro'
          }
        })
      }
    }

    unidades = await prisma.unidad.findMany({
      orderBy: { identificador: 'asc' },
      include: {
        ubicaciones: {
          orderBy: { timestamp: 'desc' },
          take: 6
        }
      }
    })
  }

  const historialUbicaciones = await prisma.ubicacion.findMany({
    orderBy: { timestamp: 'desc' },
    take: 20,
    include: {
      unidad: { select: { identificador: true } }
    }
  })

  return { unidades, historialUbicaciones }
})
