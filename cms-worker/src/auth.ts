/**
 * Anmeldung für das CMS: gemeinsamer Benutzer/Passwort, Sitzung als HMAC-signiertes Token.
 * Nur Web-Standard-APIs (crypto.subtle) – läuft im Cloudflare Worker und in Node (Tests).
 */

export const SESSION_HOURS = 8

const enc = new TextEncoder()

function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

/** Vergleich in konstanter Zeit (über HMAC, damit auch die Länge nicht verraten wird). */
export async function safeEqual(a: string, b: string, secret: string): Promise<boolean> {
  const [x, y] = await Promise.all([hmac(secret, a), hmac(secret, b)])
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

export async function checkCredentials(
  username: unknown,
  password: unknown,
  env: { CMS_USER: string; CMS_PASSWORD: string; SESSION_SECRET: string },
): Promise<boolean> {
  if (typeof username !== 'string' || typeof password !== 'string') return false
  if (!env.CMS_USER || !env.CMS_PASSWORD) return false
  const [u, p] = await Promise.all([
    safeEqual(username, env.CMS_USER, env.SESSION_SECRET),
    safeEqual(password, env.CMS_PASSWORD, env.SESSION_SECRET),
  ])
  return u && p
}

export async function signToken(secret: string, now = Date.now(), hours = SESSION_HOURS): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ exp: now + hours * 3600_000 })))
  const sig = b64url(await hmac(secret, payload))
  return `${payload}.${sig}`
}

export async function verifyToken(token: string | null | undefined, secret: string, now = Date.now()): Promise<boolean> {
  if (!token || !secret) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const expected = b64url(await hmac(secret, payload))
  if (!(await safeEqual(sig, expected, secret))) return false
  try {
    const { exp } = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { exp?: unknown }
    return typeof exp === 'number' && exp > now
  } catch {
    return false
  }
}
