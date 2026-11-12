/**
 * Validierung der Lehrpfad-Inhalte (`src/content/trails.json`).
 *
 * Einzige Quelle für die Inhaltsregeln – genutzt von den Tests (Build/Deploy), der CMS-Oberfläche
 * und dem CMS-Worker (serverseitig vor jedem Speichern). Keine Abhängigkeiten, nur reines TS.
 */
import type { Difficulty, TrailDef } from '../types'

export const DIFFICULTY_IDS: Difficulty[] = ['leicht', 'mittel', 'schwer']

export const LIMITS = {
  shortText: 200,
  longText: 5000,
  maxTrails: 500,
  maxSectionsPerTrail: 200,
  maxBytes: 1_000_000,
}

export interface ValidationError {
  /** Maschinenlesbarer Pfad, z. B. `0.sections.1.name` (für die Zuordnung zu Formularfeldern) */
  path: string
  /** Deutsche Meldung inkl. Position, z. B. „Lehrpfad 1 › Abschnitt 2 – Name: fehlt.“ */
  message: string
  /** Kurzform für die Anzeige direkt am Feld, z. B. „Name fehlt.“ */
  short: string
}

export interface ValidationResult {
  ok: boolean
  errors: ValidationError[]
}

const TRAIL_TEXT_FIELDS = ['location', 'topic', 'subject'] as const
const SECTION_TEXT_FIELDS = ['startDesc', 'endDesc'] as const

const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  name: 'Name',
  location: 'Lage / Ort',
  lengthKm: 'Gesamtlänge',
  topic: 'Thema / Schwerpunkt',
  subject: 'Studiumsfach',
  description: 'Allgemeine Informationen',
  sections: 'Abschnitte',
  lengthM: 'Länge',
  startDesc: 'Beginn',
  endDesc: 'Ende',
  difficulty: 'Schwierigkeit',
  notes: 'Besonderheiten',
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function validateTrails(data: unknown): ValidationResult {
  const errors: ValidationError[] = []
  const add = (path: string, where: string, field: string | null, msg: string) =>
    errors.push({
      path,
      message: `${where}${field ? ` – ${FIELD_LABELS[field] ?? field}` : ''}: ${msg}`,
      short: field ? `${FIELD_LABELS[field] ?? field}: ${msg}` : msg,
    })

  if (!Array.isArray(data)) {
    const message = 'Die Inhalte müssen eine Liste von Lehrpfaden sein.'
    return { ok: false, errors: [{ path: '', message, short: message }] }
  }
  try {
    if (new TextEncoder().encode(JSON.stringify(data)).length > LIMITS.maxBytes) {
      add('', 'Inhalte', null, 'zu groß (max. 1 MB).')
    }
  } catch {
    add('', 'Inhalte', null, 'lassen sich nicht als JSON speichern.')
  }
  if (data.length > LIMITS.maxTrails) add('', 'Inhalte', null, `höchstens ${LIMITS.maxTrails} Lehrpfade erlaubt.`)

  const trailIds = new Set<string>()
  const sectionIds = new Set<string>()

  const checkId = (v: unknown, path: string, where: string, seen: Set<string>) => {
    if (typeof v !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(v)) add(path, where, 'id', 'ungültig.')
    else if (seen.has(v)) add(path, where, 'id', `„${v}“ ist doppelt vergeben.`)
    else seen.add(v)
  }
  const checkText = (v: unknown, path: string, where: string, field: string, max: number, required = false) => {
    if (typeof v !== 'string') return add(path, where, field, 'muss ein Text sein.')
    if (required && !v.trim()) return add(path, where, field, 'fehlt.')
    if (v.length > max) add(path, where, field, `zu lang (max. ${max} Zeichen).`)
  }
  const checkNumber = (v: unknown, path: string, where: string, field: string) => {
    if (v === null) return
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) add(path, where, field, 'muss eine Zahl ≥ 0 sein oder leer bleiben.')
  }

  data.forEach((t, i) => {
    const where = `Lehrpfad ${i + 1}${isObject(t) && typeof t.name === 'string' && t.name.trim() ? ` („${t.name.trim()}“)` : ''}`
    const p = `${i}`
    if (!isObject(t)) return add(p, where, null, 'ungültiger Eintrag.')
    checkId(t.id, `${p}.id`, where, trailIds)
    checkText(t.name, `${p}.name`, where, 'name', LIMITS.shortText, true)
    for (const f of TRAIL_TEXT_FIELDS) checkText(t[f], `${p}.${f}`, where, f, LIMITS.shortText)
    checkText(t.description, `${p}.description`, where, 'description', LIMITS.longText)
    checkNumber(t.lengthKm, `${p}.lengthKm`, where, 'lengthKm')

    if (!Array.isArray(t.sections) || t.sections.length === 0) {
      return add(`${p}.sections`, where, null, 'Ein Lehrpfad braucht mindestens einen Abschnitt.')
    }
    if (t.sections.length > LIMITS.maxSectionsPerTrail) {
      add(`${p}.sections`, where, null, `höchstens ${LIMITS.maxSectionsPerTrail} Abschnitte erlaubt.`)
    }
    t.sections.forEach((s, j) => {
      const sw = `${where} › Abschnitt ${j + 1}${isObject(s) && typeof s.name === 'string' && s.name.trim() ? ` („${s.name.trim()}“)` : ''}`
      const sp = `${p}.sections.${j}`
      if (!isObject(s)) return add(sp, sw, null, 'ungültiger Eintrag.')
      checkId(s.id, `${sp}.id`, sw, sectionIds)
      checkText(s.name, `${sp}.name`, sw, 'name', LIMITS.shortText, true)
      for (const f of SECTION_TEXT_FIELDS) checkText(s[f], `${sp}.${f}`, sw, f, LIMITS.shortText)
      checkText(s.notes, `${sp}.notes`, sw, 'notes', LIMITS.longText)
      checkNumber(s.lengthM, `${sp}.lengthM`, sw, 'lengthM')
      if (!DIFFICULTY_IDS.includes(s.difficulty as Difficulty)) add(`${sp}.difficulty`, sw, 'difficulty', 'bitte leicht, mittel oder schwer wählen.')
    })
  })

  return { ok: errors.length === 0, errors }
}

/** Entfernt unbekannte Felder (z. B. aus manipulierten Anfragen) und liefert saubere Daten. */
export function normalizeTrails(data: TrailDef[]): TrailDef[] {
  return data.map((t) => ({
    id: t.id,
    name: t.name.trim(),
    location: t.location.trim(),
    lengthKm: t.lengthKm,
    topic: t.topic.trim(),
    subject: t.subject.trim(),
    description: t.description.trim(),
    sections: t.sections.map((s) => ({
      id: s.id,
      name: s.name.trim(),
      lengthM: s.lengthM,
      startDesc: s.startDesc.trim(),
      endDesc: s.endDesc.trim(),
      difficulty: s.difficulty,
      notes: s.notes.trim(),
    })) as TrailDef['sections'],
  }))
}
