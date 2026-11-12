<script setup lang="ts">
import { ref } from 'vue'
import { sectionTrail, useTrails } from '../stores/trails'
import { allSections, difficultyLabel } from '../config/trails'
import { applyImportPhotos, parseImport, type ParsedImport } from '../lib/storage'
import { computeTrail, formatRange, progressOf } from '../lib/scoring'
import LevelBadge from '../components/LevelBadge.vue'
import SaveMenu from '../components/SaveMenu.vue'
import ImportDialog from '../components/ImportDialog.vue'

const store = useTrails()
const message = ref('')
const error = ref('')
const sections = allSections()
const pending = ref<ParsedImport | null>(null)
const importInput = ref<HTMLInputElement | null>(null)

function trailOf(sectionId: string) {
  return sectionTrail(sectionId, store.peek(sectionId))!
}
function result(sectionId: string) {
  return computeTrail(trailOf(sectionId)).total
}
function progress(sectionId: string) {
  return progressOf(trailOf(sectionId).sections)
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  message.value = ''
  try {
    // Erst lesen und prüfen – übernommen wird erst nach Bestätigung im Dialog
    pending.value = parseImport(await file.text())
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Import fehlgeschlagen.'
  }
}

async function confirmImport() {
  const data = pending.value
  if (!data) return
  pending.value = null
  try {
    await applyImportPhotos(data.photos)
    const { imported, skipped } = store.importAssessments(data.assessments)
    const names = data.assessments
      .map((a) => sections.find((r) => r.section.id === a?.sectionId)?.section.name)
      .filter(Boolean)
      .map((n) => `„${n}“`)
      .join(', ')
    message.value =
      (imported === 1 ? `Bewertung für ${names} importiert.` : `${imported} Bewertungen importiert (${names}).`) +
      (skipped ? ` ${skipped} Eintrag/Einträge zu unbekannten Abschnitten übersprungen.` : '')
  } catch {
    error.value = 'Import fehlgeschlagen.'
  }
  importInput.value?.focus()
}

function cancelImport() {
  pending.value = null
  message.value = 'Import abgebrochen – es wurde nichts geändert.'
  importInput.value?.focus()
}
</script>

<template>
  <section class="intro card">
    <h1>Barrierefreiheit von Lehrpfaden bewerten</h1>
    <p>
      Mit diesem Werkzeug erfassen Sie den Zustand eines Streckenabschnitts in sieben Kategorien, machen Barrieren
      und Verbesserungspotenziale sichtbar und erhalten eine automatische Auswertung mit Handlungsempfehlungen –
      differenziert nach den Bedürfnissen unterschiedlicher Nutzergruppen.
    </p>
    <ol class="flow">
      <li>Fragebogen bearbeiten</li>
      <li>Nachweise ergänzen</li>
      <li>Auswertung</li>
      <li>Probleme anzeigen</li>
      <li>Ergebnisbericht</li>
    </ol>
    <div class="btn-row">
      <label class="btn file-btn">
        Bewertung importieren (JSON)
        <input ref="importInput" type="file" accept="application/json,.json" aria-describedby="import-help" @change="onImport" />
      </label>
      <RouterLink to="/methodik" class="btn btn-ghost">Wie wird bewertet?</RouterLink>
    </div>
    <p id="import-help" class="small muted import-help">
      Der Import ersetzt die vorhandene Bewertung des Abschnitts aus der Datei. Vorher wird angezeigt, welcher
      Abschnitt betroffen ist.
    </p>
  </section>

  <div role="status" aria-live="polite">
    <p v-if="message" class="alert alert-info">{{ message }}</p>
  </div>
  <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
  <ImportDialog :data="pending" @confirm="confirmImport" @cancel="cancelImport" />

  <section aria-labelledby="list-h">
    <h2 id="list-h">Streckenabschnitte / Wanderrouten</h2>
    <p class="small muted">
      Bewertungen werden nur lokal in diesem Browser gespeichert – sichern oder teilen Sie sie über „Speichern“.
    </p>

    <p v-if="!sections.length" class="card muted">Derzeit sind noch keine Streckenabschnitte veröffentlicht.</p>
    <ul class="tiles">
      <li v-for="{ trail, section } in sections" :key="section.id" class="card">
        <div class="head">
          <div>
            <p class="trail small muted">{{ trail.name }}</p>
            <h3>
              <RouterLink :to="`/abschnitt/${section.id}/bewertung`">{{ section.name }}</RouterLink>
            </h3>
            <p class="muted small">
              <template v-if="section.lengthM">{{ section.lengthM.toLocaleString('de-DE') }} m · </template>
              Schwierigkeit: {{ difficultyLabel(section.difficulty) }}
              <template v-if="trail.location"> · {{ trail.location }}</template>
            </p>
          </div>
          <div class="score">
            <strong>{{ formatRange(result(section.id)) }}</strong>
            <LevelBadge :p-min="result(section.id).pMin" :p-max="result(section.id).pMax" />
            <span class="small muted">{{ Math.round(progress(section.id).ratio * 100) }} % beantwortet</span>
          </div>
        </div>
        <div class="btn-row">
          <RouterLink :to="`/abschnitt/${section.id}/bewertung`" class="btn btn-sm btn-primary">
            Bewerten<span class="sr-only">: {{ section.name }}</span>
          </RouterLink>
          <RouterLink :to="`/abschnitt/${section.id}/bericht`" class="btn btn-sm">
            Bericht<span class="sr-only">: {{ section.name }}</span>
          </RouterLink>
          <SaveMenu :section-id="section.id" small />
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.intro h1 { font-size: 1.6rem; }
.flow { display: flex; flex-wrap: wrap; gap: 0.4rem 0.4rem; padding: 0; margin: 0 0 1.25rem; list-style: none; counter-reset: s; }
.flow li { counter-increment: s; background: var(--surface-2); border-radius: 999px; padding: 0.2rem 0.75rem; font-size: 0.9rem; }
.flow li::before { content: counter(s) '. '; font-weight: 700; color: var(--primary-strong); }
.file-btn { position: relative; }
.import-help { margin: 0.6rem 0 0; }
.file-btn input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.file-btn:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.tiles { list-style: none; padding: 0; margin: 0; }
.head { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.head h3 { font-size: 1.3rem; margin-bottom: 0.15rem; }
.trail { margin: 0 0 0.1rem; }
.score { display: flex; flex-direction: column; align-items: flex-end; gap: 0.1rem; }
.score strong { font-size: 1.4rem; }
@media (max-width: 600px) { .score { align-items: flex-start; } }
</style>
