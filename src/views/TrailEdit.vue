<script setup lang="ts">
import { watch } from 'vue'
import { useTrail } from './trailContext'
import { useTrails } from '../stores/trails'

const trail = useTrail()
const store = useTrails()
watch(
  () => [trail.value.name, trail.value.location, trail.value.lengthKm, trail.value.description, trail.value.topic, trail.value.operator, trail.value.assessor, trail.value.date],
  () => store.touch(trail.value),
)

function num(v: string): number | null {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
</script>

<template>
  <section class="card" aria-labelledby="h1">
    <h1 id="h1">1. Lehrpfad anlegen</h1>
    <p class="muted">Allgemeine Angaben zum Lehrpfad und zur Bewertung. Änderungen werden automatisch gespeichert.</p>
    <form class="form-grid" @submit.prevent>
      <div class="field full">
        <label for="t-name">Name des Lehrpfads <span aria-hidden="true">*</span></label>
        <input id="t-name" v-model="trail.name" type="text" required aria-required="true" autocomplete="off" />
      </div>
      <div class="field">
        <label for="t-loc">Lage / Ort</label>
        <input id="t-loc" v-model="trail.location" type="text" placeholder="Gemeinde, Landkreis, Startpunkt" />
      </div>
      <div class="field">
        <label for="t-len">Gesamtlänge (km)</label>
        <input
          id="t-len"
          type="text"
          inputmode="decimal"
          :value="trail.lengthKm ?? ''"
          @input="trail.lengthKm = num(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="field">
        <label for="t-topic">Thema / Schwerpunkt</label>
        <input id="t-topic" v-model="trail.topic" type="text" placeholder="z. B. Kulturlandschaft, Wald, Moor" />
      </div>
      <div class="field">
        <label for="t-op">Betreiber / Träger</label>
        <input id="t-op" v-model="trail.operator" type="text" />
      </div>
      <div class="field">
        <label for="t-as">Bewertet von</label>
        <input id="t-as" v-model="trail.assessor" type="text" placeholder="Name(n), ggf. Prüfgruppe" />
      </div>
      <div class="field">
        <label for="t-date">Datum der Begehung</label>
        <input id="t-date" v-model="trail.date" type="date" />
      </div>
      <div class="field full">
        <label for="t-desc">Allgemeine Informationen</label>
        <textarea id="t-desc" v-model="trail.description" rows="5" placeholder="Beschreibung, Anzahl Stationen, Besonderheiten, Wetter bei der Begehung …"></textarea>
      </div>
    </form>
  </section>
  <div class="btn-row no-print">
    <RouterLink :to="`/pfad/${trail.id}/abschnitte`" class="btn btn-primary">Weiter: Wegabschnitte →</RouterLink>
  </div>
</template>
