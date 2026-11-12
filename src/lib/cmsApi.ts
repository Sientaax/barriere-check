import { CMS_API } from '../config/cms'
import type { TrailDef } from '../types'
import type { ValidationError } from './trailSchema'

const TOKEN_KEY = 'barriere-check-cms-token'

export class CmsError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: ValidationError[] = [],
  ) {
    super(message)
  }
}

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function setToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* privater Modus: Sitzung gilt dann nur bis zum Neuladen */
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  let res: Response
  try {
    res = await fetch(`${CMS_API}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new CmsError('Der CMS-Server ist nicht erreichbar. Bitte Internetverbindung prüfen.', 0)
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: ValidationError[] }
  if (!res.ok) {
    if (res.status === 401 && path !== '/login') setToken(null)
    throw new CmsError(data.error ?? `Fehler ${res.status}`, res.status, data.errors ?? [])
  }
  return data as T
}

export async function login(username: string, password: string): Promise<void> {
  const { token } = await request<{ token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setToken(token)
}

export function logout() {
  setToken(null)
}

export function loadContent(): Promise<{ trails: TrailDef[]; sha: string }> {
  return request('/content')
}

export function saveContent(trails: TrailDef[], sha: string): Promise<{ sha: string }> {
  return request('/content', { method: 'PUT', body: JSON.stringify({ trails, sha }) })
}
