<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useTrail } from './trailContext'
import { newSection, useTrails } from '../stores/trails'
import { progressOf } from '../lib/scoring'

const trail = useTrail()
const store = useTrails()
const confirmId = ref<string | null>(null)
const status = ref('')

const sumM = computed(() => trail.value.sections.reduce((a, s) => a + (s.lengthM ?? 0), 0))
const missingLength = computed(() => trail.value.sections.some((s) => !(s.lengthM && s.lengthM > 0)))

function num(v: string): number | null {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

async function add() {
  const s = newSection(`Abschnitt ${trail.value.sections.length + 1}`)
  trail.value.sections.push(s)
  store.touch(trail.value)
  status.value = `${s.name} hinzugefügt.`
  await nextTick()
  document.getElementById(`s-${s.id}-name`)?.focus()
}

function move(i: number, d: -1 | 1) {
  const arr = trail.value.sections
  const j = i + d
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  status.value = `${arr[j].name} nach Position ${j + 1} verschoben.`
}

function remove(id: string) {
  const s = trail.value.sections.find((x) => x.id === id)
  trail.value.sections = trail.value.sections.filter((x) => x.id !== id)
  confirmId.value = null
  status.value = `${s?.name ?? 'Abschnitt'} gelöscht.`
}
</script>

<template>
  <section aria-labelledby="h1">
    <div class="card">
      <h1 id="h1">2. Wegabschnitte festlegen</h1>
      <p class="muted">
        Unterteilen Sie die Gesamtstrecke in Abschnitte mit ähnlichen Eigenschaften (z. B. Belag, Steigung,
        Stationen). Jeder Abschnitt wird einzeln bewertet. Sind für alle Abschnitte Längen angegeben, fließen die
        Abschnitte längengewichtet in das Gesamtergebnis ein – sonst zu gleichen Teilen.
      </p>
      <p class="small">
        Summe der Abschnittslängen: <strong>{{ sumM.toLocaleString('de-DE') }} m</strong>
        <template v-if="trail.lengthKm"> · Gesamtlänge laut Stammdaten: {{ (trail.lengthKm * 1000).toLocaleString('de-DE') }} m</template>
        <span v-if="missingLength" class="badge badge-warn">Nicht alle Längen angegeben → gleichgewichtet</span>
      </p>
    </div>

    <p class="sr-only" role="status" aria-live="polite">{{ status }}</p>

    <ol class="sections">
      <li v-for="(s, i) in trail.sections" :key="s.id" class="card">
        <div class="shead">
          <h2 class="h3">Abschnitt {{ i + 1 }}</h2>
          <span class="badge">{{ progressOf([s]).done }} / {{ progressOf([s]).total }} Fragen beantwortet</span>
        </div>
        <div class="form-grid">
          <div class="field">
            <label :for="`s-${s.id}-name`">Bezeichnung</label>
            <input :id="`s-${s.id}-name`" v-model="s.name" type="text" />
          </div>
          <div class="field">
            <label :for="`s-${s.id}-len`">Länge (m)</label>
            <input
              :id="`s-${s.id}-len`"
              type="text"
              inputmode="decimal"
              :value="s.lengthM ?? ''"
              @input="s.lengthM = num(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="field">
            <label :for="`s-${s.id}-start`">Beginn</label>
            <input :id="`s-${s.id}-start`" v-model="s.startDesc" type="text" placeholder="z. B. Parkplatz / Station 1" />
          </div>
          <div class="field">
            <label :for="`s-${s.id}-end`">Ende</label>
            <input :id="`s-${s.id}-end`" v-model="s.endDesc" type="text" placeholder="z. B. Aussichtspunkt" />
          </div>
        </div>
        <div class="btn-row actions">
          <RouterLink :to="`/pfad/${trail.id}/fragebogen/${s.id}`" class="btn btn-sm btn-primary">
            Bewerten<span class="sr-only">: {{ s.name }}</span>
          </RouterLink>
          <button type="button" class="btn btn-sm" :disabled="i === 0" @click="move(i, -1)">
            ↑ Nach oben<span class="sr-only">: {{ s.name }}</span>
          </button>
          <button type="button" class="btn btn-sm" :disabled="i === trail.sections.length - 1" @click="move(i, 1)">
            ↓ Nach unten<span class="sr-only">: {{ s.name }}</span>
          </button>
          <template v-if="trail.sections.length > 1">
            <template v-if="confirmId === s.id">
              <strong class="small">Abschnitt inkl. Bewertungen löschen?</strong>
              <button type="button" class="btn btn-sm btn-danger" @click="remove(s.id)">Ja, löschen</button>
              <button type="button" class="btn btn-sm btn-ghost" @click="confirmId = null">Abbrechen</button>
            </template>
            <button v-else type="button" class="btn btn-sm btn-danger" @click="confirmId = s.id">
              Löschen<span class="sr-only">: {{ s.name }}</span>
            </button>
          </template>
        </div>
      </li>
    </ol>

    <div class="btn-row no-print">
      <button type="button" class="btn" @click="add">+ Abschnitt hinzufügen</button>
      <RouterLink :to="`/pfad/${trail.id}/fragebogen`" class="btn btn-primary">Weiter: Fragebogen →</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.sections { list-style: none; padding: 0; margin: 0 0 1rem; }
.shead { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.h3 { font-size: 1.1rem; margin: 0; }
.actions { margin-top: 1rem; }
</style>
