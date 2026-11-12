/**
 * Vorgegebene Lehrpfade und Wegabschnitte.
 *
 * Lehrpfade und Abschnitte werden über das CMS (#/cms) gepflegt und liegen in `src/content/trails.json`.
 * Nutzende der App können sie nicht anlegen, ändern oder löschen. Bewertungen werden lokal pro Abschnitt gespeichert und über
 * die Abschnitts-`id` zugeordnet – IDs daher nach Veröffentlichung NICHT mehr ändern.
 *
 * Regeln: siehe `src/lib/trailSchema.ts` (u. a. ≥ 1 Abschnitt je Lehrpfad, eindeutige IDs).
 */
import type { Difficulty, SectionDef, TrailDef } from '../types'
import trailsJson from '../content/trails.json'

export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'leicht', label: 'Leicht' },
  { id: 'mittel', label: 'Mittel' },
  { id: 'schwer', label: 'Schwer' },
]

export function difficultyLabel(d: Difficulty): string {
  return DIFFICULTIES.find((x) => x.id === d)?.label ?? d
}

// Inhalte werden über das CMS gepflegt (src/content/trails.json) und beim Build eingebunden.
// Die Gültigkeit stellen tests/trails.spec.ts (vor jedem Deploy) und der CMS-Worker sicher.
export const TRAILS = trailsJson as TrailDef[]

export interface SectionRef {
  trail: TrailDef
  section: SectionDef
}

export function allSections(trails: TrailDef[] = TRAILS): SectionRef[] {
  return trails.flatMap((trail) => trail.sections.map((section) => ({ trail, section })))
}

export function findSection(id: string, trails: TrailDef[] = TRAILS): SectionRef | undefined {
  return allSections(trails).find((r) => r.section.id === id)
}
