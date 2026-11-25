import { prisma } from './prisma'

export const MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
]

export function nombreMes(mes: number): string {
  return MESES_ES[(mes - 1 + 12) % 12] || 'Mes'
}

export function formatPeriodo(anio: number, mes: number): string {
  return `${nombreMes(mes)} ${anio}`
}

export async function getSystemSettings() {
  const runtime = useRuntimeConfig()
  const rows = await prisma.configuracion.findMany()
  const map = new Map(rows.map((r) => [r.clave, r.valor]))

  const tasaCambio = Number(map.get('tasa_cambio_usd_bs') || runtime.public.defaultExchangeRate || 58.5)
  const montoMensualUsd = Number(map.get('monto_mensual_usd') || 3.0)
  const nombreInstitucion =
    map.get('nombre_institucion') ||
    String(runtime.public.institutionName || 'Instituto Municipal de Gestión Ambiental — Ayacucho')

  return {
    tasaCambio: Number.isFinite(tasaCambio) && tasaCambio > 0 ? tasaCambio : 58.5,
    montoMensualUsd: Number.isFinite(montoMensualUsd) && montoMensualUsd > 0 ? montoMensualUsd : 3.0,
    nombreInstitucion,
    demoMode: Boolean(runtime.public.demoMode)
  }
}

export async function registrarAuditoria(params: {
  administradorId: string
  accion: string
  entidad: string
  entidadId: string
  detalle?: string
}) {
  await prisma.auditoria.create({
    data: {
      administradorId: params.administradorId,
      accion: params.accion,
      entidad: params.entidad,
      entidadId: params.entidadId,
      detalle: params.detalle || null
    }
  })
}
