import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'
import { prisma } from './prisma'

export const AUTH_COOKIE = 'aya_session'

export interface SessionPayload {
  userId: string
  rol: 'usuario' | 'admin' | 'supervisor'
  correo: string
  nombre: string
}

function getSecretKey() {
  const config = useRuntimeConfig()
  return new TextEncoder().encode(config.jwtSecret)
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return {
      userId: String(payload.userId),
      rol: payload.rol as SessionPayload['rol'],
      correo: String(payload.correo),
      nombre: String(payload.nombre)
    }
  } catch {
    return null
  }
}

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, AUTH_COOKIE, { path: '/' })
}

export async function getSessionUser(event: H3Event) {
  const token = getCookie(event, AUTH_COOKIE)
  if (!token) return null
  const payload = await verifySessionToken(token)
  if (!payload) return null

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.userId },
    include: {
      hogar: {
        include: { sector: true }
      }
    }
  })

  if (!usuario || usuario.estado !== 'activo') return null
  return usuario
}

export async function requireAuth(event: H3Event) {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado. Inicia sesión para continuar.' })
  }
  return user
}

export async function requireRole(event: H3Event, roles: Array<'usuario' | 'admin' | 'supervisor'>) {
  const user = await requireAuth(event)
  if (!roles.includes(user.rol as 'usuario' | 'admin' | 'supervisor')) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permisos para acceder a este recurso.' })
  }
  return user
}

export function sanitizeUser(user: any) {
  if (!user) return null
  const { passwordHash, ...safe } = user
  return safe
}
