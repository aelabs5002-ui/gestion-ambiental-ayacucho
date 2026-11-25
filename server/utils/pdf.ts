import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatPeriodo } from './config'

function cleanAscii(text: string): string {
  // Standard PDF fonts (Helvetica) soportan WinAnsi; reemplazamos caracteres raros por seguridad
  return text
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/•/g, '*')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
}

export async function generarComprobantePagoPdf(params: {
  institucion: string
  referencia: string
  numeroCuenta: string
  nombreTitular: string
  cedula: string
  sector: string
  direccion: string
  numeroCasa: string
  anio: number
  mes: number
  montoUsd: number
  montoBs: number
  tasaCambio: number
  metodo: string
  fechaPago: Date
  esSimulado: boolean
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const azul = rgb(21 / 255, 101 / 255, 192 / 255) // #1565C0
  const oscuro = rgb(26 / 255, 26 / 255, 26 / 255) // #1A1A1A
  const gris = rgb(97 / 255, 97 / 255, 97 / 255) // #616161
  const borde = rgb(224 / 255, 228 / 255, 232 / 255)
  const fondoSuave = rgb(245 / 255, 247 / 255, 250 / 255)
  const verdeFondo = rgb(232 / 255, 245 / 255, 233 / 255)
  const verdeTexto = rgb(46 / 255, 125 / 255, 50 / 255)
  const ambarFondo = rgb(255 / 255, 248 / 255, 225 / 255)
  const ambarTexto = rgb(141 / 255, 91 / 255, 0)

  // Cabecera azul institucional
  page.drawRectangle({ x: 0, y: height - 110, width, height: 110, color: azul })
  page.drawText(cleanAscii(params.institucion.toUpperCase()), {
    x: 42,
    y: height - 46,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1)
  })
  page.drawText('COMPROBANTE OFICIAL DE PAGO - ASEO URBANO Y RECOLECCION', {
    x: 42,
    y: height - 68,
    size: 10,
    font: fontRegular,
    color: rgb(0.86, 0.91, 1)
  })
  page.drawText(`N. Referencia: ${cleanAscii(params.referencia)}`, {
    x: 42,
    y: height - 90,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1)
  })

  // Badge PAGADO
  page.drawRectangle({ x: width - 140, y: height - 76, width: 98, height: 28, color: verdeFondo })
  page.drawText('PAGADO', {
    x: width - 115,
    y: height - 66,
    size: 12,
    font: fontBold,
    color: verdeTexto
  })

  let y = height - 145

  // Banner modo demostración si aplica
  if (params.esSimulado) {
    page.drawRectangle({ x: 42, y: y - 22, width: width - 84, height: 28, color: ambarFondo, borderColor: ambarTexto, borderWidth: 0.8 })
    page.drawText('MODO DEMOSTRACION: Comprobante generado con transaccion simulada (Ubii Pagos Demo).', {
      x: 54,
      y: y - 12,
      size: 9,
      font: fontBold,
      color: ambarTexto
    })
    y -= 48
  }

  // Resumen principal
  page.drawRectangle({ x: 42, y: y - 82, width: width - 84, height: 82, color: fondoSuave, borderColor: borde, borderWidth: 1 })
  page.drawText('PERIODO CANCELADO', { x: 58, y: y - 24, size: 9, font: fontBold, color: gris })
  page.drawText(cleanAscii(formatPeriodo(params.anio, params.mes)), {
    x: 58,
    y: y - 46,
    size: 16,
    font: fontBold,
    color: oscuro
  })
  page.drawText(`Fecha de pago: ${params.fechaPago.toLocaleString('es-VE')}`, {
    x: 58,
    y: y - 66,
    size: 9.5,
    font: fontRegular,
    color: gris
  })

  page.drawText('MONTO TOTAL PAGADO', { x: width - 210, y: y - 24, size: 9, font: fontBold, color: gris })
  page.drawText(`$${params.montoUsd.toFixed(2)} USD`, {
    x: width - 210,
    y: y - 48,
    size: 18,
    font: fontBold,
    color: azul
  })
  page.drawText(`Bs. ${params.montoBs.toFixed(2)} (Tasa: ${params.tasaCambio.toFixed(2)} Bs/$)`, {
    x: width - 210,
    y: y - 66,
    size: 9,
    font: fontRegular,
    color: gris
  })

  y -= 115

  // Datos del contribuyente
  page.drawText('DATOS DEL HOGAR Y CONTRIBUYENTE', { x: 42, y, size: 11, font: fontBold, color: azul })
  page.drawLine({ start: { x: 42, y: y - 6 }, end: { x: width - 42, y: y - 6 }, thickness: 1, color: borde })
  y -= 28

  const filasHogar: Array<[string, string]> = [
    ['Jefe de Familia:', params.nombreTitular],
    ['Cedula de Identidad:', params.cedula],
    ['Numero de Cuenta:', params.numeroCuenta],
    ['Sector:', params.sector],
    ['Direccion:', `${params.direccion}, Casa ${params.numeroCasa}`]
  ]

  for (const [label, val] of filasHogar) {
    page.drawText(cleanAscii(label), { x: 42, y, size: 10, font: fontBold, color: gris })
    page.drawText(cleanAscii(val), { x: 185, y, size: 10, font: fontRegular, color: oscuro })
    y -= 22
  }

  y -= 16

  // Detalle de la transacción
  page.drawText('DETALLE DE LA TRANSACCION', { x: 42, y, size: 11, font: fontBold, color: azul })
  page.drawLine({ start: { x: 42, y: y - 6 }, end: { x: width - 42, y: y - 6 }, thickness: 1, color: borde })
  y -= 28

  const filasTx: Array<[string, string]> = [
    ['Concepto:', `Tarifa mensual de recoleccion de desechos solidos (${formatPeriodo(params.anio, params.mes)})`],
    ['Pasarela / Metodo:', params.metodo],
    ['Referencia:', params.referencia],
    ['Monto en Divisas:', `$${params.montoUsd.toFixed(2)} USD`],
    ['Equivalente en Bolivares:', `Bs. ${params.montoBs.toFixed(2)} (Tasa BCV ref.: Bs. ${params.tasaCambio.toFixed(2)})`],
    ['Estado Fiscal:', 'PAGADO Y SOLVENTE']
  ]

  for (const [label, val] of filasTx) {
    page.drawText(cleanAscii(label), { x: 42, y, size: 10, font: fontBold, color: gris })
    page.drawText(cleanAscii(val), { x: 185, y, size: 10, font: fontRegular, color: oscuro })
    y -= 22
  }

  // Pie de página
  page.drawLine({ start: { x: 42, y: 78 }, end: { x: width - 42, y: 78 }, thickness: 1, color: borde })
  page.drawText(
    'Documento emitido electronicamente por el Portal de Gestion Ambiental del Municipio Ayacucho.',
    { x: 42, y: 58, size: 8.5, font: fontRegular, color: gris }
  )
  page.drawText(
    'Conserve este comprobante para cualquier tramite de solvencia municipal o auditoria fiscal.',
    { x: 42, y: 44, size: 8.5, font: fontRegular, color: gris }
  )

  return await pdfDoc.save()
}

export async function generarReporteSupervisionPdf(params: {
  institucion: string
  periodo: string
  totalHogares: number
  hogaresPagados: number
  hogaresPendientes: number
  hogaresVencidos: number
  porcentajeRecaudacion: number
  montoRecaudadoUsd: number
  tasaCambio: number
  denunciasAbiertas: number
  unidades: Array<{ identificador: string; estado: string; sectoresAsignados: string }>
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const azul = rgb(21 / 255, 101 / 255, 192 / 255)
  const oscuro = rgb(26 / 255, 26 / 255, 26 / 255)
  const gris = rgb(97 / 255, 97 / 255, 97 / 255)
  const borde = rgb(224 / 255, 228 / 255, 232 / 255)

  page.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: azul })
  page.drawText(cleanAscii(params.institucion.toUpperCase()), {
    x: 42,
    y: height - 40,
    size: 12.5,
    font: fontBold,
    color: rgb(1, 1, 1)
  })
  page.drawText(`REPORTE EJECUTIVO DE SUPERVISION MUNICIPAL - ${cleanAscii(params.periodo)}`, {
    x: 42,
    y: height - 62,
    size: 10,
    font: fontRegular,
    color: rgb(0.86, 0.91, 1)
  })
  page.drawText(`Generado el: ${new Date().toLocaleString('es-VE')}`, {
    x: 42,
    y: height - 80,
    size: 9,
    font: fontRegular,
    color: rgb(0.9, 0.94, 1)
  })

  let y = height - 135
  page.drawText('INDICADORES CONSOLIDADOS DE RECAUDACION', { x: 42, y, size: 11, font: fontBold, color: azul })
  page.drawLine({ start: { x: 42, y: y - 6 }, end: { x: width - 42, y: y - 6 }, thickness: 1, color: borde })
  y -= 28

  const metricas: Array<[string, string]> = [
    ['Total de hogares activos:', `${params.totalHogares}`],
    ['Hogares solventes (Pagados):', `${params.hogaresPagados} (${params.porcentajeRecaudacion.toFixed(1)}%)`],
    ['Hogares pendientes:', `${params.hogaresPendientes}`],
    ['Hogares vencidos:', `${params.hogaresVencidos}`],
    ['Monto recaudado del mes:', `$${params.montoRecaudadoUsd.toFixed(2)} USD (Bs. ${(params.montoRecaudadoUsd * params.tasaCambio).toFixed(2)})`],
    ['Denuncias y reportes abiertos:', `${params.denunciasAbiertas}`]
  ]

  for (const [k, v] of metricas) {
    page.drawText(cleanAscii(k), { x: 42, y, size: 10.5, font: fontBold, color: gris })
    page.drawText(cleanAscii(v), { x: 250, y, size: 10.5, font: fontRegular, color: oscuro })
    y -= 24
  }

  y -= 20
  page.drawText('ESTADO DE UNIDADES DE RECOLECCION', { x: 42, y, size: 11, font: fontBold, color: azul })
  page.drawLine({ start: { x: 42, y: y - 6 }, end: { x: width - 42, y: y - 6 }, thickness: 1, color: borde })
  y -= 28

  for (const u of params.unidades) {
    const estadoLegible =
      u.estado === 'en_ruta'
        ? 'EN RUTA'
        : u.estado === 'detenida'
          ? 'DETENIDA'
          : 'FUERA DE SERVICIO'
    page.drawText(cleanAscii(`${u.identificador} [${estadoLegible}]`), {
      x: 42,
      y,
      size: 10.5,
      font: fontBold,
      color: oscuro
    })
    page.drawText(cleanAscii(`Sectores: ${u.sectoresAsignados}`), {
      x: 220,
      y,
      size: 10,
      font: fontRegular,
      color: gris
    })
    y -= 22
  }

  return await pdfDoc.save()
}
