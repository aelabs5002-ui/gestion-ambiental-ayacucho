/**
 * Adaptador desacoplado para Ubii Pagos (Venezuela).
 * Permite trabajar en DEMO_MODE=true con simulación completa
 * y cambiar a producción sustituyendo solo la implementación real sin tocar la app.
 */

export interface CrearPagoInput {
  pagoId: string
  numeroCuenta: string
  nombreCliente: string
  cedula: string
  montoUsd: number
  montoBs: number
  tasaCambio: number
  metodoSeleccionado: string
  telefonoPagoMovil?: string
  bancoOrigen?: string
}

export interface CrearPagoResult {
  referencia: string
  estado: 'aprobado' | 'pendiente' | 'rechazado'
  esSimulado: boolean
  checkoutUrl?: string
  mensaje: string
}

export interface VerificarPagoResult {
  referencia: string
  estado: 'aprobado' | 'pendiente' | 'rechazado'
  fechaConfirmacion: Date
}

export interface WebhookResult {
  valido: boolean
  pagoId?: string
  referencia?: string
  estado?: 'aprobado' | 'rechazado'
}

export interface PaymentAdapter {
  crearPago(input: CrearPagoInput): Promise<CrearPagoResult>
  verificarPago(referencia: string): Promise<VerificarPagoResult>
  procesarWebhook(payload: Record<string, any>, firma?: string): Promise<WebhookResult>
}

class DemoUbiiAdapter implements PaymentAdapter {
  async crearPago(input: CrearPagoInput): Promise<CrearPagoResult> {
    const suffix = Math.floor(100000 + Math.random() * 900000)
    const now = new Date()
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const referencia = `UBII-DEMO-${yyyymm}-${suffix}`

    return {
      referencia,
      estado: 'aprobado',
      esSimulado: true,
      mensaje: 'Transacción simulada exitosamente en Modo Demostración (Ubii Pagos).'
    }
  }

  async verificarPago(referencia: string): Promise<VerificarPagoResult> {
    return {
      referencia,
      estado: 'aprobado',
      fechaConfirmacion: new Date()
    }
  }

  async procesarWebhook(payload: Record<string, any>): Promise<WebhookResult> {
    return {
      valido: true,
      pagoId: payload.pagoId ? String(payload.pagoId) : undefined,
      referencia: payload.referencia ? String(payload.referencia) : undefined,
      estado: payload.estado === 'rechazado' ? 'rechazado' : 'aprobado'
    }
  }
}

class RealUbiiAdapter implements PaymentAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly secret: string
  ) {}

  async crearPago(input: CrearPagoInput): Promise<CrearPagoResult> {
    if (!this.apiKey || !this.secret) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Credenciales reales de Ubii Pagos (UBII_API_KEY / UBII_SECRET) no configuradas.'
      })
    }
    // Punto de integración oficial con el API de Ubii Pagos en Venezuela.
    // Al recibir las credenciales y endpoint productivo de Ubii, se realiza el POST firmado aquí.
    throw createError({
      statusCode: 501,
      statusMessage: 'Integración productiva de Ubii Pagos pendiente de credenciales de comercio.'
    })
  }

  async verificarPago(referencia: string): Promise<VerificarPagoResult> {
    return {
      referencia,
      estado: 'pendiente',
      fechaConfirmacion: new Date()
    }
  }

  async procesarWebhook(payload: Record<string, any>, firma?: string): Promise<WebhookResult> {
    if (!firma || !this.secret) {
      return { valido: false }
    }
    return {
      valido: true,
      pagoId: payload.order_id ? String(payload.order_id) : undefined,
      referencia: payload.reference ? String(payload.reference) : undefined,
      estado: payload.status === 'approved' ? 'aprobado' : 'rechazado'
    }
  }
}

export function getPaymentAdapter(): PaymentAdapter {
  const config = useRuntimeConfig()
  if (config.public.demoMode || !config.ubiiApiKey) {
    return new DemoUbiiAdapter()
  }
  return new RealUbiiAdapter(config.ubiiApiKey, config.ubiiSecret)
}
