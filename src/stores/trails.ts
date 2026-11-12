import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Answer, Assessment, Section, Trail } from '../types'
import { findSection } from '../config/trails'
import { loadAssessments, saveAssessments } from '../lib/storage'

export function emptyAnswer(): Answer {
  return { value: null, comment: '', measurements: [], photoIds: [] }
}

export function emptyAssessment(sectionId: string): Assessment {
  return { sectionId, answers: {}, updatedAt: '' }
}

/** Baut aus den vorgegebenen Stammdaten und der Bewertung einen Lehrpfad mit genau einem Abschnitt. */
export function sectionTrail(sectionId: string, assessment: Assessment): Trail | undefined {
  const ref = findSection(sectionId)
  if (!ref) return
  const { sections: _sections, ...meta } = ref.trail
  const section: Section = { ...ref.section, answers: assessment.answers }
  return { ...meta, sections: [section] }
}

export const useTrails = defineStore('trails', () => {
  /** Bewertungen je Abschnitts-ID */
  const assessments = ref<Record<string, Assessment>>({})
  const loaded = ref(false)
  const saveError = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function load() {
    if (loaded.value) return
    try {
      assessments.value = await loadAssessments()
    } catch (e) {
      saveError.value = 'Gespeicherte Daten konnten nicht geladen werden (Privater Modus?).'
    }
    loaded.value = true
    watch(
      assessments,
      () => {
        clearTimeout(timer)
        timer = setTimeout(persist, 300)
      },
      { deep: true },
    )
  }

  async function persist() {
    try {
      await saveAssessments(assessments.value)
      saveError.value = null
    } catch (e) {
      saveError.value = 'Speichern fehlgeschlagen. Bitte Bewertungen als JSON speichern.'
    }
  }

  /** Liefert die Bewertung eines Abschnitts (ohne sie anzulegen). */
  function peek(sectionId: string): Assessment {
    return assessments.value[sectionId] ?? emptyAssessment(sectionId)
  }

  /** Liefert die Bewertung eines Abschnitts und legt sie bei Bedarf an. */
  function assessmentFor(sectionId: string): Assessment {
    if (!assessments.value[sectionId]) assessments.value[sectionId] = emptyAssessment(sectionId)
    return assessments.value[sectionId]
  }

  function touch(sectionId: string) {
    assessmentFor(sectionId).updatedAt = new Date().toISOString()
  }

  /** Übernimmt importierte Bewertungen; unbekannte Abschnitte werden übersprungen. */
  function importAssessments(list: Assessment[]): { imported: number; skipped: number } {
    let imported = 0
    let skipped = 0
    for (const a of list) {
      if (!a || typeof a.sectionId !== 'string' || !findSection(a.sectionId)) {
        skipped++
        continue
      }
      assessments.value[a.sectionId] = { sectionId: a.sectionId, answers: a.answers ?? {}, updatedAt: a.updatedAt ?? '' }
      imported++
    }
    return { imported, skipped }
  }

  return { assessments, loaded, saveError, load, persist, peek, assessmentFor, touch, importAssessments }
})
