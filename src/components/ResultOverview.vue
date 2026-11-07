<script setup lang="ts">
import { computed } from 'vue'
import type { Trail } from '../types'
import { CATEGORIES, USER_GROUPS } from '../config/criteria'
import { computeTrail, computeUserGroup, formatRange, progressOf } from '../lib/scoring'
import ScoreBar from './ScoreBar.vue'
import LevelBadge from './LevelBadge.vue'

const props = defineProps<{ trail: Trail; headingLevel?: 2 | 3 }>()
const h = computed(() => `h${props.headingLevel ?? 2}`)
const res = computed(() => computeTrail(props.trail))
const progress = computed(() => progressOf(props.trail.sections))
const groups = computed(() => USER_GROUPS.map((g) => ({ g, r: computeUserGroup(props.trail, g.id) })))
const counts = computed(() =>
  res.value.sections.reduce(
    (a, s) => ({ unknown: a.unknown + s.total.unknown, open: a.open + s.total.open, na: a.na + s.total.na }),
    { unknown: 0, open: 0, na: 0 },
  ),
)
</script>

<template>
  <div class="card total">
    <component :is="h">Gesamtergebnis</component>
    <div class="big">
      <span class="pct">{{ formatRange(res.total) }}</span>
      <LevelBadge :p-min="res.total.pMin" :p-max="res.total.pMax" />
    </div>
    <ScoreBar :p-min="res.total.pMin" :p-max="res.total.pMax" label="Gesamtergebnis" />
    <div v-if="res.total.incomplete" class="alert alert-warn small">
      <p>
        <strong>Bewertung unvollständig.</strong>
        {{ counts.unknown }} Kriterium/Kriterien „nicht beurteilbar“, {{ counts.open }} noch offen.
        Das Ergebnis wird daher als Spannweite angegeben: Der untere Wert entsteht, wenn diese Kriterien als
        „nicht erfüllt“ (0) gewertet werden, der obere Wert bei „vollständig erfüllt“ (4).
      </p>
    </div>
    <p class="small muted">
      {{ progress.done }} von {{ progress.total }} Einzelbewertungen erfasst · {{ counts.na }} × nicht zutreffend ·
      {{ trail.sections.length }} Abschnitt(e),
      {{ res.lengthWeighted ? 'längengewichtet gemittelt' : 'gleichgewichtet gemittelt (nicht alle Längen angegeben)' }}
    </p>
  </div>

  <div class="card">
    <component :is="h">Ergebnisse nach Kategorie</component>
    <div class="table-wrap">
      <table>
        <caption class="sr-only">Ergebnisse je Kategorie für den gesamten Lehrpfad</caption>
        <thead>
          <tr>
            <th scope="col">Kategorie</th>
            <th scope="col" class="num">Gewicht</th>
            <th scope="col" class="barcol">Ergebnis</th>
            <th scope="col">Einstufung</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in CATEGORIES" :key="c.id">
            <th scope="row">{{ c.id }}. {{ c.title }}</th>
            <td class="num">{{ c.weight }} %</td>
            <td><ScoreBar :p-min="res.categories[c.id].pMin" :p-max="res.categories[c.id].pMax" :label="c.title" /></td>
            <td><LevelBadge :p-min="res.categories[c.id].pMin" :p-max="res.categories[c.id].pMax" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-if="trail.sections.length > 1" class="card">
    <component :is="h">Ergebnisse nach Wegabschnitt</component>
    <div class="table-wrap">
      <table class="matrix">
        <caption class="sr-only">Ergebnisse je Wegabschnitt und Kategorie in Prozent</caption>
        <thead>
          <tr>
            <th scope="col">Abschnitt</th>
            <th scope="col" class="num">Länge</th>
            <th v-for="c in CATEGORIES" :key="c.id" scope="col" class="num">
              <abbr :title="c.title">{{ c.id }}</abbr>
            </th>
            <th scope="col" class="num">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in res.sections" :key="s.section.id">
            <th scope="row">{{ s.section.name }}</th>
            <td class="num">{{ s.section.lengthM ? `${s.section.lengthM} m` : '–' }}</td>
            <td v-for="c in CATEGORIES" :key="c.id" class="num" :class="{ inc: s.categories[c.id].incomplete }">
              {{ formatRange(s.categories[c.id]) }}
            </td>
            <td class="num"><strong>{{ formatRange(s.total) }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="small muted">Spannweiten (z. B. 40–60 %) kennzeichnen unvollständige Bewertungen.</p>
  </div>

  <div class="card">
    <component :is="h">Ergebnisse nach Nutzergruppe</component>
    <p class="small muted">
      Berechnet nur über die Kriterien, die für die jeweilige Gruppe besonders relevant sind. So wird sichtbar, für
      wen der Lehrpfad gut nutzbar ist und für wen Barrieren bestehen.
    </p>
    <div class="table-wrap">
      <table>
        <caption class="sr-only">Ergebnisse je Nutzergruppe</caption>
        <thead>
          <tr>
            <th scope="col">Nutzergruppe</th>
            <th scope="col" class="barcol">Ergebnis</th>
            <th scope="col">Einstufung</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="{ g, r } in groups" :key="g.id">
            <th scope="row">{{ g.label }}</th>
            <td><ScoreBar :p-min="r.pMin" :p-max="r.pMax" :label="g.label" /></td>
            <td><LevelBadge :p-min="r.pMin" :p-max="r.pMax" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.big { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.pct { font-size: 2.6rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.1; }
.total .alert { margin-top: 1rem; }
.barcol { width: 40%; min-width: 220px; }
.matrix td.inc { color: var(--warn); font-style: italic; }
abbr { text-decoration: none; }
</style>
