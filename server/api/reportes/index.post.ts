import { z } from 'zod'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

const reporteSchema = z.object({
  categoria: z.enum([
    'Recolección no realizada',
    'Unidad dañada',
    'Maltrato',
    'Sugerencia',
    'Otro'
  ]),
  descripcion: z.string().min(10, 'Describe el reporte con al menos 10 caracteres').max(1500),
  ubicacion: z.string().min(3, 'Indica la ubicación o referencia'),
  latitud: z.number().optional().nullable(),
  longitud: z.number().optional().nullable(),
  fotoBase64: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const parsed = reporteSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Datos de reporte inválidos.'
    })
  }

  let fotoUrl: string | null = null

  if (parsed.data.fotoBase64 && parsed.data.fotoBase64.startsWith('data:image/')) {
    const match = parsed.data.fotoBase64.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/)
    if (match) {
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
      const buffer = Buffer.from(match[2], 'base64')
      // Limite 3MB
      if (buffer.length <= 3 * 1024 * 1024) {
        const filename = `rep-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`
        const uploadsDir = join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadsDir, { recursive: true })
        await writeFile(join(uploadsDir, filename), buffer)
        fotoUrl = `/uploads/${filename}`
      }
    }
  }

  const reporte = await prisma.reporte.create({
    data: {
      usuarioId: user.id,
      sectorNombre: user.hogar?.sector?.nombre || 'Centro — Plaza Bolívar',
      categoria: parsed.data.categoria,
      descripcion: parsed.data.descripcion.trim(),
      ubicacion: parsed.data.ubicacion.trim(),
      latitud: parsed.data.latitud ?? null,
      longitud: parsed.data.longitud ?? null,
      fotoUrl,
      estado: 'recibido'
    },
    include: {
      respuestas: true
    }
  })

  // Notificar a los administradores activos
  const admins = await prisma.usuario.findMany({
    where: { rol: 'admin', estado: 'activo' },
    select: { id: true }
  })
  if (admins.length > 0) {
    await prisma.notificacion.createMany({
      data: admins.map((a) => ({
        usuarioId: a.id,
        titulo: `Nuevo reporte: ${reporte.categoria}`,
        mensaje: `${user.nombre} (${reporte.sectorNombre}) envió un nuevo reporte.`,
        tipo: 'reporte',
        enlace: '/admin/denuncias'
      }))
    })
  }

  return { reporte }
})
