import { inject, type ComputedRef, type InjectionKey } from 'vue'
import type { SectionDef, Trail, TrailDef } from '../types'

export interface SectionContext {
  /** Lehrpfad mit genau einem (dem aktuellen) Abschnitt inkl. Bewertung – für die Bewertungslogik */
  trail: Trail
  /** Vorgegebene Stammdaten des Lehrpfads (alle Abschnitte) */
  trailDef: TrailDef
  /** Vorgegebene Stammdaten des aktuellen Abschnitts */
  sectionDef: SectionDef
}

export const SECTION_KEY: InjectionKey<ComputedRef<SectionContext | undefined>> = Symbol('section')

/** Liefert den aktuellen Abschnitt (innerhalb von TrailShell immer vorhanden). */
export function useSectionView(): ComputedRef<SectionContext> {
  return inject(SECTION_KEY) as ComputedRef<SectionContext>
}
