/**
 * Bewertungslogik.
 *
 * Formel: P = Σ(G · B / 4) / ΣG · 100
 *  - G = Gewicht der Frage, B = Bewertung 0–4
 *  - „Nicht zutreffend“ (na): Frage wird aus Zähler und Nenner entfernt.
 *  - „Nicht beurteilbar“ (unknown) und unbeantwortete Fragen bleiben im Nenner.
 *    Das Ergebnis wird als Spannweite ausgewiesen: pMin (B = 0) bis pMax (B = 4)
 *    und als unvollständig gekennzeichnet.
 */
import { CATEGORIES, QUESTIONS, type CategoryId, type Question } from '../config/criteria'
import { LEVELS, type AnswerValue, type Level, type Score } from '../config/rating'
import type { Answer, Section, Trail } from '../types'

export interface ScoreResult {
  /** Ergebnis in Prozent, nur gesetzt wenn vollständig (pMin === pMax) */
  p: number | null
  pMin: number | null
  pMax: number | null
  weightTotal: number
  rated: number
  na: number
  unknown: number
  open: number
  total: number
  incomplete: boolean
}

export type AnswerLookup = (q: Question) => AnswerValue

export function computeScore(questions: Question[], lookup: AnswerLookup): ScoreResult {
  let sumG = 0
  let sumMin = 0
  let sumMax = 0
  let rated = 0
  let na = 0
  let unknown = 0
  let open = 0

  for (const q of questions) {
    const v = lookup(q)
    if (v === 'na') {
      na++
      continue
    }
    sumG += q.weight
    if (v === 'unknown' || v === null || v === undefined) {
      if (v === 'unknown') unknown++
      else open++
      sumMax += q.weight // als 4 gewertet → G · 4/4
      continue
    }
    rated++
    const part = (q.weight * v) / 4
    sumMin += part
    sumMax += part
  }

  const incomplete = unknown + open > 0
  if (sumG === 0) {
    return { p: null, pMin: null, pMax: null, weightTotal: 0, rated, na, unknown, open, total: questions.length, incomplete }
  }
  const pMin = (sumMin / sumG) * 100
  const pMax = (sumMax / sumG) * 100
  return {
    p: incomplete ? null : pMin,
    pMin,
    pMax,
    weightTotal: sumG,
    rated,
    na,
    unknown,
    open,
    total: questions.length,
    incomplete,
  }
}

export function sectionLookup(section: Section): AnswerLookup {
  return (q) => section.answers[q.id]?.value ?? null
}

export interface SectionResult {
  section: Section
  total: ScoreResult
  categories: Record<CategoryId, ScoreResult>
}

export function computeSection(section: Section): SectionResult {
  const lookup = sectionLookup(section)
  const categories = {} as Record<CategoryId, ScoreResult>
  for (const c of CATEGORIES) {
    categories[c.id] = computeScore(
      QUESTIONS.filter((q) => q.category === c.id),
      lookup,
    )
  }
  return { section, total: computeScore(QUESTIONS, lookup), categories }
}

/** Gewichte der Abschnitte: Länge, falls für alle Abschnitte angegeben, sonst gleichgewichtet. */
export function sectionWeights(sections: Section[]): number[] {
  const allHaveLength = sections.length > 0 && sections.every((s) => (s.lengthM ?? 0) > 0)
  return sections.map((s) => (allHaveLength ? (s.lengthM as number) : 1))
}

export interface Aggregate {
  pMin: number | null
  pMax: number | null
  p: number | null
  incomplete: boolean
}

/** Gewichtetes Mittel mehrerer Ergebnisse; Ergebnisse ohne Wert (alles N/A) werden ignoriert. */
export function aggregate(results: ScoreResult[], weights: number[]): Aggregate {
  let w = 0
  let min = 0
  let max = 0
  let incomplete = false
  results.forEach((r, i) => {
    if (r.pMin === null || r.pMax === null) return
    w += weights[i]
    min += r.pMin * weights[i]
    max += r.pMax * weights[i]
    if (r.incomplete) incomplete = true
  })
  if (w === 0) return { p: null, pMin: null, pMax: null, incomplete }
  const pMin = min / w
  const pMax = max / w
  return { pMin, pMax, p: incomplete ? null : pMin, incomplete }
}

export interface TrailResult {
  sections: SectionResult[]
  weights: number[]
  lengthWeighted: boolean
  total: Aggregate
  categories: Record<CategoryId, Aggregate>
}

export function computeTrail(trail: Trail): TrailResult {
  const sections = trail.sections.map(computeSection)
  const weights = sectionWeights(trail.sections)
  const categories = {} as Record<CategoryId, Aggregate>
  for (const c of CATEGORIES) {
    categories[c.id] = aggregate(
      sections.map((s) => s.categories[c.id]),
      weights,
    )
  }
  return {
    sections,
    weights,
    lengthWeighted: trail.sections.length > 0 && trail.sections.every((s) => (s.lengthM ?? 0) > 0),
    total: aggregate(
      sections.map((s) => s.total),
      weights,
    ),
    categories,
  }
}

export function levelFor(p: number | null): Level | null {
  if (p === null) return null
  const r = Math.round(p)
  return LEVELS.find((l) => r >= l.min && r <= l.max) ?? null
}

export function formatPercent(p: number | null): string {
  return p === null ? '–' : `${Math.round(p)} %`
}

/** Ergebnis als Text: „72 %“ oder „55–80 %“ */
export function formatRange(r: { pMin: number | null; pMax: number | null }): string {
  if (r.pMin === null || r.pMax === null) return '–'
  const a = Math.round(r.pMin)
  const b = Math.round(r.pMax)
  return a === b ? `${a} %` : `${a}–${b} %`
}

// ---------------------------------------------------------------------------
// Probleme & Empfehlungen

export type IssueKind = 'critical' | 'unknown' | 'open'

export interface Issue {
  kind: IssueKind
  question: Question
  section: Section
  answer: Answer | undefined
}

export function isCritical(q: Question, v: AnswerValue): boolean {
  return typeof v === 'number' && v < q.criticalBelow
}

export function findIssues(trail: Trail): Issue[] {
  const issues: Issue[] = []
  for (const section of trail.sections) {
    for (const q of QUESTIONS) {
      const answer = section.answers[q.id]
      const v = answer?.value ?? null
      if (isCritical(q, v)) issues.push({ kind: 'critical', question: q, section, answer })
      else if (v === 'unknown') issues.push({ kind: 'unknown', question: q, section, answer })
      else if (v === null) issues.push({ kind: 'open', question: q, section, answer })
    }
  }
  return issues
}

export interface Recommendation {
  question: Question
  /** betroffene Abschnitte mit Bewertung */
  affected: { section: Section; value: number }[]
  worst: number
  critical: boolean
  /** Priorität = Gewicht × gewichtetes Defizit (0 … Gewicht) */
  priority: number
  priorityLabel: 'Hoch' | 'Mittel' | 'Niedrig'
}

/** Empfehlungen für alle Fragen, die in mindestens einem Abschnitt mit ≤ 2 bewertet wurden. */
export function buildRecommendations(trail: Trail, threshold = 2): Recommendation[] {
  const weights = sectionWeights(trail.sections)
  const totalW = weights.reduce((a, b) => a + b, 0) || 1
  const recs: Recommendation[] = []

  for (const q of QUESTIONS) {
    const affected: { section: Section; value: number }[] = []
    let deficit = 0
    trail.sections.forEach((s, i) => {
      const v = s.answers[q.id]?.value
      if (typeof v === 'number' && v <= threshold) {
        affected.push({ section: s, value: v })
        deficit += ((4 - v) / 4) * (weights[i] / totalW)
      }
    })
    if (!affected.length) continue
    const worst = Math.min(...affected.map((a) => a.value))
    const critical = affected.some((a) => isCritical(q, a.value as Score))
    const priority = q.weight * deficit
    recs.push({ question: q, affected, worst, critical, priority, priorityLabel: 'Niedrig' })
  }

  recs.sort((a, b) => Number(b.critical) - Number(a.critical) || b.priority - a.priority)
  for (const r of recs) {
    const rel = r.priority / r.question.weight // 0..1 Anteil des Defizits
    r.priorityLabel = r.critical || rel >= 0.5 ? 'Hoch' : rel >= 0.25 ? 'Mittel' : 'Niedrig'
  }
  return recs
}

// ---------------------------------------------------------------------------
// Nutzergruppen & Fortschritt

/** Ergebnis nur über die für eine Nutzergruppe relevanten Fragen (gleiche Formel). */
export function computeUserGroup(trail: Trail, groupId: string): Aggregate {
  const qs = QUESTIONS.filter((q) => q.userGroups.includes(groupId as never))
  return aggregate(
    trail.sections.map((s) => computeScore(qs, sectionLookup(s))),
    sectionWeights(trail.sections),
  )
}

export function progressOf(sections: Section[], questions: Question[] = QUESTIONS) {
  const total = sections.length * questions.length
  let done = 0
  for (const s of sections) for (const q of questions) if ((s.answers[q.id]?.value ?? null) !== null) done++
  return { done, total, ratio: total ? done / total : 0 }
}
