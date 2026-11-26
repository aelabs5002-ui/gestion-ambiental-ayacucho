import type { PrismaClient } from '@prisma/client'

const CEDULA_PREFIXES = ['V', 'E', 'J', 'P', 'G'] as const
type CedulaPrefix = (typeof CEDULA_PREFIXES)[number]

export interface ParsedCedula {
  isCedula: boolean
  prefix: CedulaPrefix | null
  digits: string
  normalized: string
  candidates: string[]
}

/**
 * Normaliza una cédula venezolana a formato estándar `V-18456123` (o `E-`, `J-`, `P-`, `G-`).
 * Elimina espacios, puntos y guiones extra. Si solo contiene dígitos, antepone `V-`.
 */
export function normalizeCedula(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[\s.,_]+/g, '')
  const match = cleaned.match(/^([VEJPG])-?(\d{5,12})$/)
  if (match) {
    return `${match[1]}-${match[2]}`
  }

  const onlyDigits = cleaned.replace(/[^0-9]/g, '')
  if (/^\d{5,12}$/.test(cleaned)) {
    return `V-${cleaned}`
  }
  if (/^[VEJPG]-?\d{5,12}$/.test(cleaned.replace(/[^A-Z0-9-]/g, ''))) {
    const m2 = cleaned.replace(/[^A-Z0-9-]/g, '').match(/^([VEJPG])-?(\d{5,12})$/)
    if (m2) return `${m2[1]}-${m2[2]}`
  }
  if (onlyDigits.length >= 5 && onlyDigits.length <= 12 && !cleaned.includes('@') && !/[A-DF-IK-OQ-UW-Z]/.test(cleaned)) {
    const prefixMatch = cleaned.match(/^([VEJPG])/)
    const prefix = prefixMatch ? prefixMatch[1] : 'V'
    return `${prefix}-${onlyDigits}`
  }

  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Analiza un identificador ingresado por el usuario y genera variantes de búsqueda si parece una cédula.
 */
export function parseCedulaInput(raw: string): ParsedCedula {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.includes('@')) {
    return {
      isCedula: false,
      prefix: null,
      digits: '',
      normalized: '',
      candidates: []
    }
  }

  const compact = trimmed.toUpperCase().replace(/[\s.,_]+/g, '')
  const withPrefix = compact.match(/^([VEJPG])-?(\d{5,12})$/)
  const onlyDigits = compact.match(/^(\d{5,12})$/)

  if (!withPrefix && !onlyDigits) {
    return {
      isCedula: false,
      prefix: null,
      digits: '',
      normalized: trimmed.toUpperCase(),
      candidates: [trimmed, trimmed.toUpperCase()]
    }
  }

  const prefix = (withPrefix ? withPrefix[1] : null) as CedulaPrefix | null
  const digits = withPrefix ? withPrefix[2] : onlyDigits![1]
  const normalized = `${prefix || 'V'}-${digits}`

  const set = new Set<string>([
    trimmed,
    trimmed.toUpperCase(),
    normalized,
    digits,
    `${prefix || 'V'}${digits}`,
    `${prefix || 'V'}- ${digits}`
  ])

  if (!prefix) {
    for (const p of CEDULA_PREFIXES) {
      set.add(`${p}-${digits}`)
      set.add(`${p}${digits}`)
      set.add(`${p}- ${digits}`)
    }
  }

  return {
    isCedula: true,
    prefix,
    digits,
    normalized,
    candidates: Array.from(set)
  }
}

/**
 * Busca un usuario por correo electrónico o cédula (tolerando cualquier formato:
 * con/sin prefijo V-/E-, con/sin guion, con puntos o espacios).
 */
export async function findUserByIdentifier(prisma: PrismaClient, rawIdentifier: string) {
  const cleanId = rawIdentifier.trim()
  if (!cleanId) return null

  const include = { hogar: { include: { sector: true } } }

  // 1. Si parece correo electrónico, buscar de forma insensible a mayúsculas
  if (cleanId.includes('@')) {
    return await prisma.usuario.findFirst({
      where: {
        correo: {
          equals: cleanId.toLowerCase(),
          mode: 'insensitive'
        }
      },
      include
    })
  }

  // 2. Si parece cédula, buscar por variantes directas
  const parsed = parseCedulaInput(cleanId)
  if (parsed.isCedula) {
    const direct = await prisma.usuario.findFirst({
      where: {
        cedula: { in: parsed.candidates }
      },
      include
    })
    if (direct) return direct

    // 3. Fallback robusto en PostgreSQL para registros heredados con espacios/puntos (ej. "V- 15644534" o "V-15.644.534")
    const compactTarget = parsed.prefix ? `${parsed.prefix}${parsed.digits}` : null
    const rows = compactTarget
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id
          FROM "Usuario"
          WHERE REGEXP_REPLACE(UPPER(cedula), '[^A-Z0-9]', '', 'g') = ${compactTarget}
             OR (
               ${parsed.prefix === 'V'}
               AND REGEXP_REPLACE(UPPER(cedula), '[^A-Z0-9]', '', 'g') = ${parsed.digits}
             )
          LIMIT 1
        `
      : await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id
          FROM "Usuario"
          WHERE REGEXP_REPLACE(cedula, '[^0-9]', '', 'g') = ${parsed.digits}
          ORDER BY CASE WHEN UPPER(cedula) LIKE 'V%' THEN 0 ELSE 1 END
          LIMIT 1
        `

    if (rows[0]?.id) {
      return await prisma.usuario.findUnique({
        where: { id: rows[0].id },
        include
      })
    }
  }

  // 4. Respaldo final por coincidencia literal de correo o cédula
  return await prisma.usuario.findFirst({
    where: {
      OR: [
        { correo: { equals: cleanId.toLowerCase(), mode: 'insensitive' } },
        { cedula: { equals: cleanId, mode: 'insensitive' } }
      ]
    },
    include
  })
}

/**
 * Verifica si ya existe un usuario con el mismo correo o la misma cédula (en cualquier formato).
 */
export async function findDuplicateUser(prisma: PrismaClient, correoNorm: string, rawCedula: string) {
  const byEmail = await prisma.usuario.findFirst({
    where: {
      correo: {
        equals: correoNorm,
        mode: 'insensitive'
      }
    },
    select: { id: true, correo: true, cedula: true }
  })
  if (byEmail) return { reason: 'correo' as const, usuario: byEmail }

  const byCedula = await findUserByIdentifier(prisma, rawCedula)
  if (byCedula) return { reason: 'cedula' as const, usuario: byCedula }

  return null
}
