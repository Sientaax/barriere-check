import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Answer, Section, Trail } from '../types'
import { uid } from '../lib/id'
import { cleanupPhotos, loadTrails, saveTrails } from '../lib/storage'

export function emptyAnswer(): Answer {
  return { value: null, comment: '', measurements: [], photoIds: [] }
}

export function newSection(name = 'Gesamtstrecke'): Section {
  return { id: uid(), name, lengthM: null, startDesc: '', endDesc: '', answers: {} }
}

export function newTrail(): Trail {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name: '',
    location: '',
    lengthKm: null,
    description: '',
    topic: '',
    operator: '',
    assessor: '',
    date: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
    sections: [newSection()],
  }
}

export const useTrails = defineStore('trails', () => {
  const trails = ref<Trail[]>([])
  const loaded = ref(false)
  const saveError = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function load() {
    if (loaded.value) return
    try {
      trails.value = await loadTrails()
    } catch (e) {
      saveError.value = 'Gespeicherte Daten konnten nicht geladen werden (Privater Modus?).'
    }
    loaded.value = true
    watch(
      trails,
      () => {
        clearTimeout(timer)
        timer = setTimeout(persist, 300)
      },
      { deep: true },
    )
  }

  async function persist() {
    try {
      await saveTrails(trails.value)
      saveError.value = null
    } catch (e) {
      saveError.value = 'Speichern fehlgeschlagen. Bitte Daten als JSON exportieren.'
    }
  }

  function get(id: string): Trail | undefined {
    return trails.value.find((t) => t.id === id)
  }

  function touch(trail: Trail) {
    trail.updatedAt = new Date().toISOString()
  }

  function create(): Trail {
    const t = newTrail()
    trails.value.unshift(t)
    return trails.value[0]
  }

  function remove(id: string) {
    trails.value = trails.value.filter((t) => t.id !== id)
    persist().then(() => cleanupPhotos(trails.value))
  }

  /** Kopiert einen Lehrpfad (z. B. als Vorlage für eine Folgebewertung); Fotos werden geteilt. */
  function duplicate(id: string): Trail | undefined {
    const src = get(id)
    if (!src) return
    const copy: Trail = JSON.parse(JSON.stringify(src))
    const now = new Date().toISOString()
    copy.id = uid()
    copy.name = `${src.name || 'Lehrpfad'} (Kopie)`
    copy.createdAt = now
    copy.updatedAt = now
    copy.sections.forEach((s) => (s.id = uid()))
    trails.value.unshift(copy)
    return trails.value[0]
  }

  function importTrails(list: Trail[]): number {
    for (const t of list) {
      const idx = trails.value.findIndex((x) => x.id === t.id)
      if (idx >= 0) trails.value[idx] = t
      else trails.value.push(t)
    }
    return list.length
  }

  function answer(section: Section, questionId: string): Answer {
    if (!section.answers[questionId]) section.answers[questionId] = emptyAnswer()
    return section.answers[questionId]
  }

  return { trails, loaded, saveError, load, persist, get, touch, create, remove, duplicate, importTrails, answer }
})
