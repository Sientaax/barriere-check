import { describe, it, expect } from 'vitest'
import { validateTrails, normalizeTrails } from '../src/lib/trailSchema'
import type { TrailDef } from '../src/types'

function section(id: string, over: Record<string, unknown> = {}) {
  return { id, name: `Abschnitt ${id}`, lengthM: 100, startDesc: '', endDesc: '', difficulty: 'leicht', notes: '', ...over }
}
function trail(id: string, sections: unknown[] = [section(`${id}-s1`)], over: Record<string, unknown> = {}) {
  return { id, name: `Lehrpfad ${id}`, location: '', lengthKm: null, topic: '', subject: '', description: '', sections, ...over }
}
const messages = (d: unknown) => validateTrails(d).errors.map((e) => e.message)

describe('validateTrails', () => {
  it('akzeptiert gültige Inhalte und eine leere Liste', () => {
    expect(validateTrails([trail('a'), trail('b')]).ok).toBe(true)
    expect(validateTrails([]).ok).toBe(true)
  })
  it('lehnt Nicht-Listen ab', () => {
    expect(validateTrails({}).ok).toBe(false)
    expect(validateTrails(null).ok).toBe(false)
  })
  it('verlangt mindestens einen Abschnitt', () => {
    const r = validateTrails([trail('a', [])])
    expect(r.ok).toBe(false)
    expect(r.errors[0].path).toBe('0.sections')
    expect(r.errors[0].message).toContain('mindestens einen Abschnitt')
  })
  it('verlangt Namen für Lehrpfad und Abschnitt', () => {
    const r = validateTrails([trail('a', [section('s', { name: '  ' })], { name: '' })])
    expect(r.errors.map((e) => e.path)).toEqual(['0.name', '0.sections.0.name'])
    expect(r.errors[1].message).toBe('Lehrpfad 1 › Abschnitt 1 – Name: fehlt.')
  })
  it('erkennt doppelte IDs – auch abschnittsübergreifend zwischen Lehrpfaden', () => {
    expect(messages([trail('a'), trail('a', [section('x')])]).join()).toContain('doppelt')
    expect(messages([trail('a', [section('x')]), trail('b', [section('x')])]).join()).toContain('doppelt')
  })
  it('prüft Schwierigkeit, Zahlen, Textlängen und ID-Format', () => {
    expect(messages([trail('a', [section('s', { difficulty: 'extrem' })])]).join()).toContain('Schwierigkeit')
    expect(messages([trail('a', [section('s', { lengthM: -1 })])]).join()).toContain('Länge')
    expect(messages([trail('a', undefined, { lengthKm: '3' })]).join()).toContain('Gesamtlänge')
    expect(messages([trail('a', undefined, { location: 'x'.repeat(201) })]).join()).toContain('zu lang')
    expect(messages([trail('a b')]).join()).toContain('ID')
  })
})

describe('normalizeTrails', () => {
  it('entfernt unbekannte Felder und trimmt Texte', () => {
    const input = [{ ...trail('a', [section('s', { name: ' X ', evil: 1 })]), extra: '<script>' }] as unknown as TrailDef[]
    const out = normalizeTrails(input)
    expect(out[0]).not.toHaveProperty('extra')
    expect(out[0].sections[0]).not.toHaveProperty('evil')
    expect(out[0].sections[0].name).toBe('X')
  })
})
