import { prisma } from '~/server/utils/prisma'
import { getPaymentAdapter } from '~/server/utils/payments'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const firma = getHeader(event, 'x-ubii-signature') || undefined

  const adapter = getPaymentAdapter()
  const result = await adapter.procesarWebhook(body || {}, firma)

  if (!result.valido || !result.pagoId) {
    throw createError({ statusCode: 400, statusMessage: 'Webhook inválido.' })
  }

  if (result.estado === 'aprobado') {
    await prisma.pago.update({
      where: { id: result.pagoId },
      data: {
        estado: 'pagado',
        fechaPago: new Date(),
        referencia: result.referencia || undefined,
        comprobanteUrl: `/api/pagos/${result.pagoId}/comprobante`
      }
    })
  }

  return { recibido: true, estado: result.estado }
})
