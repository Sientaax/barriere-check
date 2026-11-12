/**
 * CMS-Worker für „Barriere-Check Lehrpfade“.
 *
 * Türsteher zwischen CMS-Oberfläche und GitHub: prüft Benutzer/Passwort, hält den GitHub-Token
 * geheim, validiert die Inhalte und darf ausschließlich die Inhaltsdatei (CONTENT_PATH) ändern.
 * Jede Speicherung ist ein Commit → GitHub Pages baut die App automatisch neu.
 */
import { checkCredentials, signToken, verifyToken, SESSION_HOURS } from './auth'
import { normalizeTrails, validateTrails } from '../../src/lib/trailSchema'
import type { TrailDef } from '../../src/types'

export interface Env {
  // Geheimnisse (wrangler secret put …)
  CMS_USER: string
  CMS_PASSWORD: string
  SESSION_SECRET: string
  GITHUB_TOKEN: string
  // Variablen (wrangler.toml)
  REPO: string
  BRANCH: string
  CONTENT_PATH: string
  ALLOWED_ORIGINS: string
  /** Nur für lokale Tests mit einer Attrappe; Standard: https://api.github.com */
  GITHUB_API?: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  if (!allowed.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(req: Request, env: Env, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders(req, env) },
  })
}

function error(req: Request, env: Env, status: number, message: string, extra: Record<string, unknown> = {}) {
  return json(req, env, { error: message, ...extra }, status)
}

// --- GitHub ------------------------------------------------------------------

function ghUrl(env: Env) {
  const path = env.CONTENT_PATH.split('/').map(encodeURIComponent).join('/')
  const base = (env.GITHUB_API || 'https://api.github.com').replace(/\/+$/, '')
  return `${base}/repos/${env.REPO}/contents/${path}`
}

function ghHeaders(env: Env): HeadersInit {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'barriere-check-cms',
  }
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

async function readContent(env: Env): Promise<{ trails: unknown; sha: string }> {
  const res = await fetch(`${ghUrl(env)}?ref=${encodeURIComponent(env.BRANCH)}`, { headers: ghHeaders(env) })
  if (!res.ok) throw new Error(`GitHub-Lesefehler ${res.status}`)
  const data = (await res.json()) as { content: string; sha: string }
  return { trails: JSON.parse(base64ToUtf8(data.content)), sha: data.sha }
}

async function writeContent(env: Env, trails: TrailDef[], sha: string): Promise<{ status: number; sha?: string }> {
  const res = await fetch(ghUrl(env), {
    method: 'PUT',
    headers: { ...ghHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'CMS: Lehrpfade aktualisiert',
      content: utf8ToBase64(JSON.stringify(trails, null, 2) + '\n'),
      sha,
      branch: env.BRANCH,
    }),
  })
  if (!res.ok) return { status: res.status }
  const data = (await res.json()) as { content?: { sha?: string } }
  return { status: res.status, sha: data.content?.sha }
}

// --- Routen ------------------------------------------------------------------

async function isAuthorized(req: Request, env: Env) {
  const auth = req.headers.get('Authorization') ?? ''
  return verifyToken(auth.startsWith('Bearer ') ? auth.slice(7) : null, env.SESSION_SECRET)
}

async function handle(req: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(req.url)

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req, env) })

  if (pathname === '/login' && req.method === 'POST') {
    const body = (await req.json().catch(() => ({}))) as { username?: unknown; password?: unknown }
    if (!(await checkCredentials(body.username, body.password, env))) {
      await sleep(1000) // bremst automatisches Durchprobieren
      return error(req, env, 401, 'Benutzername oder Passwort ist falsch.')
    }
    return json(req, env, { token: await signToken(env.SESSION_SECRET), expiresInHours: SESSION_HOURS })
  }

  if (pathname === '/content') {
    if (!(await isAuthorized(req, env))) return error(req, env, 401, 'Bitte erneut anmelden.')

    if (req.method === 'GET') {
      return json(req, env, await readContent(env))
    }

    if (req.method === 'PUT') {
      const body = (await req.json().catch(() => null)) as { trails?: unknown; sha?: unknown } | null
      if (!body || typeof body.sha !== 'string') return error(req, env, 400, 'Ungültige Anfrage.')
      const result = validateTrails(body.trails)
      if (!result.ok) return error(req, env, 422, 'Die Inhalte sind ungültig.', { errors: result.errors })
      const written = await writeContent(env, normalizeTrails(body.trails as TrailDef[]), body.sha)
      if (written.status === 409 || written.status === 422) {
        return error(req, env, 409, 'Die Inhalte wurden zwischenzeitlich von jemand anderem geändert. Bitte neu laden.')
      }
      if (!written.sha) return error(req, env, 502, `Speichern bei GitHub fehlgeschlagen (${written.status}).`)
      return json(req, env, { sha: written.sha })
    }
  }

  return error(req, env, 404, 'Nicht gefunden.')
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      return await handle(req, env)
    } catch (e) {
      return error(req, env, 500, e instanceof Error ? e.message : 'Interner Fehler.')
    }
  },
}
