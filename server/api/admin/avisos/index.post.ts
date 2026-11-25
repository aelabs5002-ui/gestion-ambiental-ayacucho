import { z } from 'zod'
import { requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { formatPeriodo, registrarAuditoria } from '~/server/utils/config'

const avisoSchema = z.object({
  asunto: z.string().min(4, 'Escribe un asunto'),
  mensaje: z.string().min(10, 'Escribe un mensaje'),
  tipoDestinatario: z.enum(['pendientes', 'vencidos', 'manual']),
  usuarioIds: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['admin'])
  const body = await readBody(event)
  const parsed = avisoSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Datos de aviso inválidos.'
    })
  }

  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1
  const periodoTexto = formatPeriodo(anio, mes)

  let destinatarios: Array<{ id: string; nombre: string }> = []

  if (parsed.data.tipoDestinatario === 'manual') {
    if (!parsed.data.usuarioIds || parsed.data.usuarioIds.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Selecciona al menos un destinatario.' })
    }
    destinatarios = await prisma.usuario.findMany({
      where: { id: { in: parsed.data.usuarioIds }, estado: 'activo' },
      select: { id: true, nombre: true }
    })
  } else {
    const estadoFiltro = parsed.data.tipoDestinatario === 'pendientes' ? 'pendiente' : 'vencido'
    const pagos = await prisma.pago.findMany({
      where: { anio, mes, estado: estadoFiltro },
      include: { hogar: { include: { usuario: { select: { id: true, nombre: true, estado: true } } } } }
    })
    destinatarios = pagos
      .filter((p) => p.hogar.usuario.estado === 'activo')
      .map((p) => ({ id: p.hogar.usuario.id, nombre: p.hogar.usuario.nombre }))
  }

  const uniqueMap = new Map(destinatarios.map((d) => [d.id, d]))
  const listaFinal = Array.from(uniqueMap.values())

  if (listaFinal.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No hay hogares que coincidan con el criterio de destinatarios seleccionado.'
    })
  }

  const aviso = await prisma.aviso.create({
    data: {
      asunto: parsed.data.asunto.trim(),
      mensaje: parsed.data.mensaje.trim(),
      tipoDestinatario: parsed.data.tipoDestinatario,
      totalDestinatarios: listaFinal.length,
      destinatariosJson: JSON.stringify(listaFinal.map((d) => d.id)),
      estado: 'enviado',
      creadoPorId: admin.id
    }
  })

  // Crear notificaciones personalizadas en la app (sustituye [Nombre] y [Mes])
  await prisma.notificacion.createMany({
    data: listaFinal.map((d) => ({
      usuarioId: d.id,
      titulo: parsed.data.asunto.trim(),
      mensaje: parsed.data.mensaje
        .trim()
        .replace(/\[Nombre\]/gi, d.nombre)
        .replace(/\[Mes\]/gi, periodoTexto),
      tipo: 'aviso',
      enlace: '/usuario/pagos'
    }))
  })

  await registrarAuditoria({
    administradorId: admin.id,
    accion: 'ENVIAR_AVISO_COBRO',
    entidad: 'Aviso',
    entidadId: aviso.id,
    detalle: `Enviado a ${listaFinal.length} hogares (${parsed.data.tipoDestinatario})`
  })

  return { ok: true, aviso, totalEnviados: listaFinal.length }
})
