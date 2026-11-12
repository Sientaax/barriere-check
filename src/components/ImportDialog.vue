<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { ParsedImport } from '../lib/storage'
import { findSection } from '../config/trails'
import { sectionTrail, useTrails, emptyAssessment } from '../stores/trails'
import { progressOf } from '../lib/scoring'

const props = defineProps<{ data: ParsedImport | null }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const store = useTrails()
const dialog = ref<HTMLDialogElement | null>(null)
const cancelBtn = ref<HTMLButtonElement | null>(null)

function answered(sectionId: string, answers: Record<string, unknown> | undefined) {
  const t = sectionTrail(sectionId, { ...emptyAssessment(sectionId), answers: (answers ?? {}) as never })
  return t ? progressOf(t.sections) : { done: 0, total: 0 }
}

const entries = computed(() =>
  (props.data?.assessments ?? []).flatMap((a) => {
    const ref = a && typeof a.sectionId === 'string' ? findSection(a.sectionId) : undefined
    if (!ref) return []
    const existing = store.assessments[a.sectionId]
    const existingProgress = existing ? answered(a.sectionId, existing.answers) : null
    return [
      {
        id: a.sectionId,
        trailName: ref.trail.name,
        sectionName: ref.section.name,
        incoming: answered(a.sectionId, a.answers),
        // Nur als „vorhanden“ werten, wenn tatsächlich etwas beantwortet wurde
        existing: existingProgress && existingProgress.done > 0 ? { ...existingProgress, updatedAt: existing!.updatedAt } : null,
      },
    ]
  }),
)
const skipped = computed(() => (props.data?.assessments.length ?? 0) - entries.value.length)
const overwrites = computed(() => entries.value.some((e) => e.existing))

function fmtDate(iso: string) {
  return iso ? new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) : 'unbekannt'
}

watch(
  () => props.data,
  async (d) => {
    await nextTick()
    if (d && dialog.value && !dialog.value.open) {
      dialog.value.showModal()
      cancelBtn.value?.focus()
    } else if (!d && dialog.value?.open) {
      dialog.value.close()
    }
  },
)

function onCancel(e: Event) {
  e.preventDefault()
  emit('cancel')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="import-dialog"
    aria-labelledby="import-h"
    aria-describedby="import-desc"
    @cancel="onCancel"
  >
    <h2 id="import-h">Bewertung importieren?</h2>
    <p id="import-desc">
      Die Datei enthält Bewertungen für die folgenden Streckenabschnitte. Beim Import wird die Bewertung des
      jeweiligen Abschnitts in diesem Browser <strong>vollständig ersetzt</strong> – inklusive Kommentare,
      Messwerte und Fotos.
    </p>

    <p v-if="!entries.length" class="alert alert-warn">
      Die Datei enthält keine Bewertung zu einem bekannten Streckenabschnitt.
    </p>
    <ul v-else class="entries">
      <li v-for="e in entries" :key="e.id">
        <p class="small muted name-trail">{{ e.trailName }}</p>
        <p class="name">{{ e.sectionName }}</p>
        <p class="small">In der Datei: {{ e.incoming.done }} von {{ e.incoming.total }} Fragen beantwortet</p>
        <p v-if="e.existing" class="alert alert-danger small">
          <strong>Vorhandene Bewertung wird überschrieben</strong>
          ({{ e.existing.done }} von {{ e.existing.total }} beantwortet, zuletzt bearbeitet {{ fmtDate(e.existing.updatedAt) }}).
        </p>
        <p v-else class="small muted">Noch keine Bewertung vorhanden – es geht nichts verloren.</p>
      </li>
    </ul>
    <p v-if="skipped > 0" class="small muted">
      {{ skipped }} Eintrag/Einträge gehören zu unbekannten Abschnitten und werden übersprungen.
    </p>

    <div class="btn-row">
      <button
        v-if="entries.length"
        type="button"
        class="btn"
        :class="overwrites ? 'btn-danger' : 'btn-primary'"
        @click="emit('confirm')"
      >
        {{ overwrites ? 'Überschreiben und importieren' : 'Importieren' }}
      </button>
      <button ref="cancelBtn" type="button" class="btn btn-ghost" @click="emit('cancel')">Abbrechen</button>
    </div>
  </dialog>
</template>

<style scoped>
.import-dialog {
  max-width: min(560px, calc(100vw - 32px)); width: 100%;
  border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem;
  background: var(--surface); color: var(--text); box-shadow: 0 10px 40px rgb(0 0 0 / 0.25);
}
.import-dialog::backdrop { background: rgb(31 33 34 / 0.55); }
.entries { list-style: none; padding: 0; margin: 0 0 1rem; display: grid; gap: 0.75rem; }
.entries li { border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 0.9rem; }
.entries p { margin: 0 0 0.3rem; }
.entries .alert { margin: 0.4rem 0 0; }
.name { font-weight: 700; font-size: 1.1rem; }
.name-trail { margin: 0; }
.btn-danger { background: var(--danger); color: #fff; }
.btn-danger:hover { background: #962244; }
</style>
