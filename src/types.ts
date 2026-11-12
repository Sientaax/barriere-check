import type { AnswerValue } from './config/rating'

export interface Measurement {
  id: string
  label: string
  value: string
  unit: string
}

export interface Answer {
  value: AnswerValue
  comment: string
  measurements: Measurement[]
  photoIds: string[]
}

export type Difficulty = 'leicht' | 'mittel' | 'schwer'

/** Vorgegebener Wegabschnitt (Stammdaten aus `src/config/trails.ts`). */
export interface SectionDef {
  id: string
  name: string
  lengthM: number | null
  startDesc: string
  endDesc: string
  difficulty: Difficulty
  /** Besonderheiten */
  notes: string
}

/** Vorgegebener Lehrpfad; hat immer mindestens einen Abschnitt. */
export interface TrailDef {
  id: string
  name: string
  location: string
  lengthKm: number | null
  topic: string
  /** Studiumsfach */
  subject: string
  /** Allgemeine Informationen */
  description: string
  sections: [SectionDef, ...SectionDef[]]
}

/** Abschnitt inkl. Bewertung – Eingabe für die Bewertungslogik. */
export interface Section extends SectionDef {
  answers: Record<string, Answer>
}

/** Lehrpfad mit bewerteten Abschnitten – Eingabe für die Bewertungslogik. */
export interface Trail extends Omit<TrailDef, 'sections'> {
  sections: Section[]
}

/** Lokal gespeicherte Bewertung eines Abschnitts. */
export interface Assessment {
  sectionId: string
  answers: Record<string, Answer>
  updatedAt: string
}
