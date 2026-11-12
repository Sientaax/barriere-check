import { get, set, del, createStore } from 'idb-keyval'
import type { Assessment } from '../types'
import { blobToDataUrl, dataUrlToBlob } from './image'

const db = createStore('barriere-check', 'data')
// Hinweis: Der frühere Schlüssel 'trails' (Version 1, selbst angelegte Lehrpfade) wird nicht mehr
// gelesen, aber auch nicht gelöscht.
const ASSESSMENTS_KEY = 'assessments'
const PHOTO_PREFIX = 'photo:'

export async function loadAssessments(): Promise<Record<string, Assessment>> {
  return (await get<Record<string, Assessment>>(ASSESSMENTS_KEY, db)) ?? {}
}

export async function saveAssessments(assessments: Record<string, Assessment>): Promise<void> {
  // Proxies entfernen, damit IndexedDB die Daten klonen kann
  await set(ASSESSMENTS_KEY, JSON.parse(JSON.stringify(assessments)), db)
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

export function photoIdsOf(assessments: Assessment[]): string[] {
  return assessments.flatMap((a) => Object.values(a.answers).flatMap((x) => x.photoIds))
}

// ---------------------------------------------------------------------------
// Export / Import

export const EXPORT_FORMAT = 'barriere-check'
/**
 * Version 1: selbst angelegte Lehrpfade (`trails`) – wird nicht mehr importiert.
 * Version 2: Bewertungen je vorgegebenem Abschnitt (`assessments`).
 */
export const EXPORT_VERSION = 2

export interface ExportFile {
  format: typeof EXPORT_FORMAT
  version: number
  exportedAt: string
  assessments: Assessment[]
  photos: Record<string, string> // id → data URL
}

export async function buildExport(assessments: Assessment[]): Promise<ExportFile> {
  const photos: Record<string, string> = {}
  for (const id of photoIdsOf(assessments)) {
    const blob = await loadPhoto(id)
    if (blob) photos[id] = await blobToDataUrl(blob)
  }
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    assessments: JSON.parse(JSON.stringify(assessments)),
    photos,
  }
}

export interface ParsedImport {
  assessments: Assessment[]
  photos: Record<string, string>
}

/** Liest und prüft eine Exportdatei, ohne etwas zu speichern (Bestätigung erfolgt im Import-Dialog). */
export function parseImport(text: string): ParsedImport {
  let data: Partial<ExportFile> & { trails?: unknown }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Die Datei ist kein gültiger Barriere-Check-Export.')
  }
  if (data.format !== EXPORT_FORMAT) {
    throw new Error('Die Datei ist kein gültiger Barriere-Check-Export.')
  }
  if (!Array.isArray(data.assessments)) {
    if (Array.isArray(data.trails)) {
      throw new Error(
        'Die Datei stammt aus einer älteren Version (selbst angelegte Lehrpfade) und kann nicht mehr importiert werden – Lehrpfade und Abschnitte sind jetzt vorgegeben.',
      )
    }
    throw new Error('Die Datei ist kein gültiger Barriere-Check-Export.')
  }
  return { assessments: data.assessments, photos: data.photos ?? {} }
}

/** Speichert die Fotos einer bestätigten Importdatei. */
export async function applyImportPhotos(photos: Record<string, string>): Promise<void> {
  for (const [id, url] of Object.entries(photos)) {
    await savePhoto(id, await dataUrlToBlob(url))
  }
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
