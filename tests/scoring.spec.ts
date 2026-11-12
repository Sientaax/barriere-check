import { describe, it, expect } from 'vitest'
import { CATEGORIES, QUESTIONS, questionsOf } from '../src/config/criteria'
import type { AnswerValue } from '../src/config/rating'
import {
  computeScore, computeTrail, levelFor, findIssues, buildRecommendations, formatRange,
} from '../src/lib/scoring'
import type { Section, Trail } from '../src/types'

function section(values: Record<string, AnswerValue>, lengthM: number | null = null, id = 's'): Section {
  const answers: Section['answers'] = {}
  for (const [k, v] of Object.entries(values)) answers[k] = { value: v, comment: '', measurements: [], photoIds: [] }
  return { id, name: id, lengthM, startDesc: '', endDesc: '', difficulty: 'leicht', notes: '', answers }
}
function all(v: AnswerValue): Record<string, AnswerValue> {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, v]))
}
function trail(sections: Section[]): Trail {
  return { id: 't', name: 't', location: '', lengthKm: null, description: '', topic: '', subject: '', sections }
}

describe('Konfiguration', () => {
  it('Kategoriegewichte ergeben 100 %', () => {
    expect(CATEGORIES.reduce((a, c) => a + c.weight, 0)).toBe(100)
  })
  it('Fragengewichte ergeben 100', () => {
    expect(QUESTIONS.reduce((a, q) => a + q.weight, 0)).toBeCloseTo(100)
  })
  it('enthält 28 Fragen', () => expect(QUESTIONS).toHaveLength(28))
})

describe('computeScore', () => {
  it('alles 4 → 100 %, alles 0 → 0 %, alles 2 → 50 %', () => {
    expect(computeScore(QUESTIONS, () => 4).p).toBeCloseTo(100)
    expect(computeScore(QUESTIONS, () => 0).p).toBeCloseTo(0)
    expect(computeScore(QUESTIONS, () => 2).p).toBeCloseTo(50)
  })

  it('wendet die Formel P = Σ(G·B/4)/ΣG·100 an', () => {
    const qs = questionsOf('A') // je Gewicht 3,75
    const vals: Record<string, AnswerValue> = { A1: 4, A2: 2, A3: 1, A4: 0 }
    const r = computeScore(qs, (q) => vals[q.id])
    // (3,75·1 + 3,75·0,5 + 3,75·0,25 + 0) / 15 · 100 = 43,75
    expect(r.p).toBeCloseTo(43.75)
  })

  it('N/A wird aus Zähler und Nenner entfernt', () => {
    const qs = questionsOf('A')
    const vals: Record<string, AnswerValue> = { A1: 4, A2: 'na', A3: 2, A4: 'na' }
    const r = computeScore(qs, (q) => vals[q.id])
    expect(r.p).toBeCloseTo(75)
    expect(r.na).toBe(2)
    expect(r.weightTotal).toBeCloseTo(7.5)
  })

  it('Nicht beurteilbar ergibt Spannweite und unvollständig', () => {
    const qs = questionsOf('A')
    const vals: Record<string, AnswerValue> = { A1: 4, A2: 4, A3: 'unknown', A4: 0 }
    const r = computeScore(qs, (q) => vals[q.id])
    expect(r.incomplete).toBe(true)
    expect(r.p).toBeNull()
    expect(r.pMin).toBeCloseTo(50)
    expect(r.pMax).toBeCloseTo(75)
    expect(formatRange(r)).toBe('50–75 %')
  })

  it('unbeantwortete Fragen zählen als offen und unvollständig', () => {
    const r = computeScore(questionsOf('G'), () => null)
    expect(r.open).toBe(2)
    expect(r.pMin).toBe(0)
    expect(r.pMax).toBe(100)
  })

  it('nur N/A → kein Ergebnis', () => {
    const r = computeScore(questionsOf('E'), () => 'na')
    expect(r.p).toBeNull()
    expect(r.pMin).toBeNull()
  })
})

describe('levelFor', () => {
  it.each([
    [0, 'Sehr gering'], [20, 'Sehr gering'], [20.4, 'Sehr gering'], [21, 'Gering'], [40, 'Gering'],
    [41, 'Mittel'], [60, 'Mittel'], [61, 'Hoch'], [80, 'Hoch'], [81, 'Sehr hoch'], [100, 'Sehr hoch'],
  ])('%s %% → %s', (p, label) => {
    expect(levelFor(p)?.label).toBe(label)
  })
  it('null → null', () => expect(levelFor(null)).toBeNull())
})

describe('computeTrail', () => {
  it('mittelt Abschnitte längengewichtet', () => {
    const t = trail([section(all(4), 300, 'a'), section(all(0), 100, 'b')])
    const r = computeTrail(t)
    expect(r.lengthWeighted).toBe(true)
    expect(r.total.p).toBeCloseTo(75)
    expect(r.categories.B.p).toBeCloseTo(75)
  })
  it('mittelt gleichgewichtet, wenn Längen fehlen', () => {
    const t = trail([section(all(4), 300, 'a'), section(all(0), null, 'b')])
    const r = computeTrail(t)
    expect(r.lengthWeighted).toBe(false)
    expect(r.total.p).toBeCloseTo(50)
  })
  it('ignoriert Kategorien, die in einem Abschnitt komplett N/A sind', () => {
    const b = all(0)
    for (const q of questionsOf('A')) b[q.id] = 'na'
    const t = trail([section(all(4), 100, 'a'), section(b, 100, 'b')])
    expect(computeTrail(t).categories.A.p).toBeCloseTo(100)
  })
})

describe('Probleme und Empfehlungen', () => {
  it('erkennt kritische Barrieren je nach Schwelle', () => {
    const v = all(3)
    v.A1 = 0 // kritisch (Schwelle 1)
    v.A2 = 1 // nicht kritisch (Schwelle 1)
    v.B1 = 1 // kritisch (Schwelle 2)
    v.C1 = 'unknown'
    const issues = findIssues(trail([section(v)]))
    const crit = issues.filter((i) => i.kind === 'critical').map((i) => i.question.id)
    expect(crit).toEqual(['A1', 'B1'])
    expect(issues.filter((i) => i.kind === 'unknown').map((i) => i.question.id)).toEqual(['C1'])
  })
  it('erstellt Empfehlungen für Bewertungen ≤ 2, kritische zuerst', () => {
    const v = all(4)
    v.D1 = 2
    v.A1 = 0
    const recs = buildRecommendations(trail([section(v)]))
    expect(recs.map((r) => r.question.id)).toEqual(['A1', 'D1'])
    expect(recs[0].priorityLabel).toBe('Hoch')
    expect(recs[1].priorityLabel).toBe('Hoch') // Defizit 50 %
  })
})
