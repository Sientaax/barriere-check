<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTrails } from '../stores/trails'
import { buildExport, downloadFile, parseImport, slug } from '../lib/storage'
import { computeTrail, formatRange, progressOf } from '../lib/scoring'
import LevelBadge from '../components/LevelBadge.vue'
import type { Trail } from '../types'

const store = useTrails()
const router = useRouter()
const message = ref('')
const error = ref('')
const confirmDelete = ref<string | null>(null)

function createTrail() {
  const t = store.create()
  router.push(`/pfad/${t.id}/stammdaten`)
}

function result(t: Trail) {
  return computeTrail(t).total
}

async function exportTrails(list: Trail[], name: string) {
  const data = await buildExport(list)
  downloadFile(`${name}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2))
  message.value = 'Export wurde heruntergeladen.'
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  try {
    const list = await parseImport(await file.text())
    const n = store.importTrails(list)
    message.value = `${n} Lehrpfad(e) importiert.`
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Import fehlgeschlagen.'
  }
}

function duplicate(id: string) {
  const t = store.duplicate(id)
  if (t) message.value = `„${t.name}“ wurde angelegt.`
}

function remove(id: string) {
  store.remove(id)
  confirmDelete.value = null
  message.value = 'Lehrpfad gelöscht.'
}

function fmtDate(iso: string) {
  return iso ? new Date(iso).toLocaleDateString('de-DE') : ''
}
</script>

<template>
  <section class="intro card">
    <h1>Barrierefreiheit von Lehrpfaden bewerten</h1>
    <p>
      Mit diesem Werkzeug erfassen Sie den Zustand eines Lehrpfads in sieben Kategorien, machen Barrieren und
      Verbesserungspotenziale sichtbar und erhalten eine automatische Auswertung mit Handlungsempfehlungen –
      differenziert nach den Bedürfnissen unterschiedlicher Nutzergruppen.
    </p>
    <ol class="flow">
      <li>Lehrpfad anlegen</li>
      <li>Wegabschnitte festlegen</li>
      <li>Fragebogen bearbeiten</li>
      <li>Nachweise ergänzen</li>
      <li>Auswertung</li>
      <li>Probleme anzeigen</li>
      <li>Ergebnisbericht</li>
    </ol>
    <div class="btn-row">
      <button type="button" class="btn btn-primary" @click="createTrail">+ Neuen Lehrpfad anlegen</button>
      <label class="btn file-btn">
        Bewertung importieren (JSON)
        <input type="file" accept="application/json,.json" @change="onImport" />
      </label>
      <RouterLink to="/methodik" class="btn btn-ghost">Wie wird bewertet?</RouterLink>
    </div>
  </section>

  <div role="status" aria-live="polite">
    <p v-if="message" class="alert alert-info">{{ message }}</p>
  </div>
  <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>

  <section aria-labelledby="list-h">
    <div class="page-head">
      <h2 id="list-h">Meine Lehrpfade</h2>
      <button v-if="store.trails.length" type="button" class="btn btn-sm" @click="exportTrails(store.trails, 'barriere-check-alle')">
        Alle exportieren
      </button>
    </div>

    <p v-if="!store.trails.length" class="card muted">
      Noch keine Lehrpfade angelegt. Die Daten werden nur lokal in diesem Browser gespeichert – sichern oder teilen
      Sie Bewertungen über den JSON-Export.
    </p>

    <ul class="trail-list">
      <li v-for="t in store.trails" :key="t.id" class="card">
        <div class="head">
          <div>
            <h3>
              <RouterLink :to="`/pfad/${t.id}/stammdaten`">{{ t.name || 'Unbenannter Lehrpfad' }}</RouterLink>
            </h3>
            <p class="muted small">
              {{ t.location || 'Ohne Ortsangabe' }} · {{ t.sections.length }} Abschnitt(e) · zuletzt bearbeitet
              {{ fmtDate(t.updatedAt) }}
            </p>
          </div>
          <div class="score">
            <strong>{{ formatRange(result(t)) }}</strong>
            <LevelBadge :p-min="result(t).pMin" :p-max="result(t).pMax" />
            <span class="small muted">{{ Math.round(progressOf(t.sections).ratio * 100) }} % beantwortet</span>
          </div>
        </div>
        <div class="btn-row">
          <RouterLink :to="`/pfad/${t.id}/fragebogen`" class="btn btn-sm btn-primary">
            Bewerten<span class="sr-only">: {{ t.name }}</span>
          </RouterLink>
          <RouterLink :to="`/pfad/${t.id}/bericht`" class="btn btn-sm">
            Bericht<span class="sr-only">: {{ t.name }}</span>
          </RouterLink>
          <button type="button" class="btn btn-sm" @click="duplicate(t.id)">
            Duplizieren<span class="sr-only">: {{ t.name }}</span>
          </button>
          <button type="button" class="btn btn-sm" @click="exportTrails([t], slug(t.name))">
            Exportieren<span class="sr-only">: {{ t.name }}</span>
          </button>
          <template v-if="confirmDelete === t.id">
            <span class="small"><strong>Wirklich löschen?</strong></span>
            <button type="button" class="btn btn-sm btn-danger" @click="remove(t.id)">Ja, löschen</button>
            <button type="button" class="btn btn-sm btn-ghost" @click="confirmDelete = null">Abbrechen</button>
          </template>
          <button v-else type="button" class="btn btn-sm btn-danger" @click="confirmDelete = t.id">
            Löschen<span class="sr-only">: {{ t.name }}</span>
          </button>
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
.file-btn input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.file-btn:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.trail-list { list-style: none; padding: 0; margin: 0; }
.head { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.head h3 { margin-bottom: 0.15rem; }
.score { display: flex; flex-direction: column; align-items: flex-end; gap: 0.1rem; }
.score strong { font-size: 1.4rem; }
@media (max-width: 600px) { .score { align-items: flex-start; } }
</style>
