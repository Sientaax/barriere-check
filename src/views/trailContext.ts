import { inject, type ComputedRef, type InjectionKey } from 'vue'
import type { Trail } from '../types'

export const TRAIL_KEY: InjectionKey<ComputedRef<Trail | undefined>> = Symbol('trail')

/** Liefert den aktuellen Lehrpfad (innerhalb von TrailShell immer vorhanden). */
export function useTrail(): ComputedRef<Trail> {
  return inject(TRAIL_KEY) as ComputedRef<Trail>
}
