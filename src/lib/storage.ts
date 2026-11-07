import { get, set, del, createStore, keys } from 'idb-keyval'
import type { Trail } from '../types'
import { blobToDataUrl, dataUrlToBlob } from './image'

const db = createStore('barriere-check', 'data')
const TRAILS_KEY = 'trails'
const PHOTO_PREFIX = 'photo:'

export async function loadTrails(): Promise<Trail[]> {
  return (await get<Trail[]>(TRAILS_KEY, db)) ?? []
}

export async function saveTrails(trails: Trail[]): Promise<void> {
  // Proxies entfernen, damit IndexedDB die Daten klonen kann
  await set(TRAILS_KEY, JSON.parse(JSON.stringify(trails)), db)
}

export async function savePhoto(id: string, blob: Blob): Promise<void> {
  await set(PHOTO_PREFIX + id, blob, db)
}

export async function loadPhoto(id: string): Promise<Blob | undefined> {
  return get<Blob>(PHOTO_PREFIX + id, db)
}

export async function deletePhoto(id: string): Promise<void> {
  await del(PHOTO_PREFIX + id, db)
}

/** Entfernt Fotos, die von keinem Lehrpfad mehr referenziert werden. */
export async function cleanupPhotos(trails: Trail[]): Promise<void> {
  const used = new Set(photoIdsOf(trails))
  for (const k of await keys(db)) {
    const key = String(k)
    if (key.startsWith(PHOTO_PREFIX) && !used.has(key.slice(PHOTO_PREFIX.length))) await del(key, db)
  }
}

export function photoIdsOf(trails: Trail[]): string[] {
  return trails.flatMap((t) => t.sections.flatMap((s) => Object.values(s.answers).flatMap((a) => a.photoIds)))
}

// ---------------------------------------------------------------------------
// Export / Import

export const EXPORT_FORMAT = 'barriere-check'
export const EXPORT_VERSION = 1

export interface ExportFile {
  format: typeof EXPORT_FORMAT
  version: number
  exportedAt: string
  trails: Trail[]
  photos: Record<string, string> // id → data URL
}

export async function buildExport(trails: Trail[]): Promise<ExportFile> {
  const photos: Record<string, string> = {}
  for (const id of photoIdsOf(trails)) {
    const blob = await loadPhoto(id)
    if (blob) photos[id] = await blobToDataUrl(blob)
  }
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    trails: JSON.parse(JSON.stringify(trails)),
    photos,
  }
}

export async function parseImport(text: string): Promise<Trail[]> {
  const data = JSON.parse(text) as Partial<ExportFile>
  if (data.format !== EXPORT_FORMAT || !Array.isArray(data.trails)) {
    throw new Error('Die Datei ist kein gültiger Barriere-Check-Export.')
  }
  for (const [id, url] of Object.entries(data.photos ?? {})) {
    await savePhoto(id, await dataUrlToBlob(url))
  }
  return data.trails
}

export function downloadFile(filename: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'lehrpfad'
  )
}
