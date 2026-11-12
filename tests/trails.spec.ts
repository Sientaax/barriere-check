import { describe, it, expect } from 'vitest'
import { DIFFICULTIES, TRAILS, allSections, findSection } from '../src/config/trails'
import { sectionTrail, emptyAssessment } from '../src/stores/trails'
import { validateTrails } from '../src/lib/trailSchema'

describe('Lehrpfad-Inhalte (src/content/trails.json)', () => {
  it('sind gültig laut trailSchema', () => {
    const r = validateTrails(TRAILS)
    expect(r.errors.map((e) => e.message)).toEqual([])
  })

  it('jeder Lehrpfad hat einen Namen und mindestens einen Abschnitt', () => {
    for (const t of TRAILS) {
      expect(t.name.trim(), t.id).not.toBe('')
      expect(t.sections.length, t.id).toBeGreaterThanOrEqual(1)
    }
  })

  it('Lehrpfad-IDs und Abschnitts-IDs sind eindeutig', () => {
    const trailIds = TRAILS.map((t) => t.id)
    expect(new Set(trailIds).size).toBe(trailIds.length)
    const sectionIds = allSections().map((r) => r.section.id)
    expect(new Set(sectionIds).size).toBe(sectionIds.length)
  })

  it('jeder Abschnitt hat Namen und gültige Schwierigkeitsstufe', () => {
    const valid = DIFFICULTIES.map((d) => d.id)
    for (const { section } of allSections()) {
      expect(section.name.trim(), section.id).not.toBe('')
      expect(valid, section.id).toContain(section.difficulty)
    }
  })
})

describe('sectionTrail', () => {
  it.skipIf(allSections().length === 0)('baut einen Lehrpfad mit genau dem gewählten Abschnitt', () => {
    const { trail, section } = allSections()[0]
    const t = sectionTrail(section.id, emptyAssessment(section.id))!
    expect(t.name).toBe(trail.name)
    expect(t.sections).toHaveLength(1)
    expect(t.sections[0].id).toBe(section.id)
  })
  it('liefert undefined für unbekannte Abschnitte', () => {
    expect(findSection('gibt-es-nicht')).toBeUndefined()
    expect(sectionTrail('gibt-es-nicht', emptyAssessment('x'))).toBeUndefined()
  })
})
