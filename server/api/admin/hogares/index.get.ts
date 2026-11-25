import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin', 'supervisor'])
  const query = getQuery(event)

  const q = query.q ? String(query.q).trim().toLowerCase() : ''
  const sectorId = query.sectorId ? String(query.sectorId) : ''
  const estadoPago = query.estadoPago ? String(query.estadoPago) : ''
  const estadoCuenta = query.estadoCuenta ? String(query.estadoCuenta) : ''
  const page = Math.max(1, Number(query.page || 1))
  const pageSize = Math.min(100, Math.max(5, Number(query.pageSize || 10)))
  const exportCsv = query.export === 'csv'

  const ahora = new Date()
  const anioActual = ahora.getFullYear()
  const mesActual = ahora.getMonth() + 1

  const hogares = await prisma.hogar.findMany({
    where: {
      ...(sectorId ? { sectorId } : {}),
      ...(estadoCuenta ? { estado: estadoCuenta } : {})
    },
    include: {
      usuario: {
        select: {
          id: true,
          nombre: true,
          cedula: true,
          correo: true,
          telefono: true,
          estado: true
        }
      },
      sector: true,
      pagos: {
        where: { anio: anioActual, mes: mesActual },
        take: 1
      }
    },
    orderBy: { numeroCuenta: 'asc' }
  })

  let filtrados = hogares.map((h) => {
    const pagoMes = h.pagos[0] || null
    return {
      id: h.id,
      usuarioId: h.usuario.id,
      numeroCuenta: h.numeroCuenta,
      nombre: h.usuario.nombre,
      cedula: h.usuario.cedula,
      correo: h.usuario.correo,
      telefono: h.usuario.telefono,
      sectorId: h.sectorId,
      sector: h.sector.nombre,
      numeroCasa: h.numeroCasa,
      direccion: h.direccion,
      estadoCuenta: h.estado,
      pagoMesId: pagoMes?.id || null,
      estadoPago: pagoMes?.estado || 'pendiente',
      montoUsd: pagoMes?.montoUsd ?? 3.0,
      fechaPago: pagoMes?.fechaPago || null,
      referencia: pagoMes?.referencia || null
    }
  })

  if (q) {
    filtrados = filtrados.filter(
      (h) =>
        h.nombre.toLowerCase().includes(q) ||
        h.cedula.toLowerCase().includes(q) ||
        h.numeroCuenta.toLowerCase().includes(q) ||
        h.correo.toLowerCase().includes(q)
    )
  }

  if (estadoPago) {
    filtrados = filtrados.filter((h) => h.estadoPago === estadoPago)
  }

  if (exportCsv) {
    const headers = [
      'Cuenta',
      'Nombre',
      'Cedula',
      'Correo',
      'Telefono',
      'Sector',
      'Casa',
      'Estado Cuenta',
      'Estado Mes',
      'Monto USD',
      'Fecha Pago',
      'Referencia'
    ]
    const escapeCsv = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = filtrados.map((h) =>
      [
        h.numeroCuenta,
        h.nombre,
        h.cedula,
        h.correo,
        h.telefono,
        h.sector,
        h.numeroCasa,
        h.estadoCuenta,
        h.estadoPago,
        h.montoUsd.toFixed(2),
        h.fechaPago ? new Date(h.fechaPago).toISOString().slice(0, 10) : '',
        h.referencia || ''
      ]
        .map(escapeCsv)
        .join(',')
    )
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setHeader(event, 'Content-Disposition', 'attachment; filename="hogares-ayacucho.csv"')
    return csv
  }

  const total = filtrados.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const items = filtrados.slice(start, start + pageSize)

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  }
})
