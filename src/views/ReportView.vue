<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTrail } from './trailContext'
import { CATEGORIES, USER_GROUPS, questionsOf } from '../config/criteria'
import { DISCLAIMER, scaleLabel } from '../config/rating'
import { buildRecommendations, findIssues } from '../lib/scoring'
import ResultOverview from '../components/ResultOverview.vue'
import IssueList from '../components/IssueList.vue'
import PhotoThumb from '../components/PhotoThumb.vue'

const trail = useTrail()
const showDetails = ref(true)
const showPhotos = ref(true)

const issues = computed(() => findIssues(trail.value))
const critical = computed(() => issues.value.filter((i) => i.kind === 'critical'))
const unknown = computed(() => issues.value.filter((i) => i.kind === 'unknown'))
const recs = computed(() => buildRecommendations(trail.value))
const today = new Date().toLocaleDateString('de-DE')

function groupLabel(id: string) {
  return USER_GROUPS.find((g) => g.id === id)?.short ?? id
}
function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString('de-DE') : '–'
}
function valueText(v: unknown) {
  return typeof v === 'number' ? `${v} – ${scaleLabel(v as 0)}` : scaleLabel((v ?? null) as null)
}
</script>

<template>
  <section aria-labelledby="h1" class="report">
    <div class="card no-print">
      <p class="muted">
        Druckoptimierte Übersicht. Über „Drucken / als PDF speichern“ erzeugen Sie einen Bericht zum Weitergeben.
      </p>
      <div class="btn-row">
        <button type="button" class="btn btn-primary" onclick="window.print()">Drucken / als PDF speichern</button>
        <label class="check"><input v-model="showDetails" type="checkbox" /> Einzelbewertungen anzeigen</label>
        <label class="check"><input v-model="showPhotos" type="checkbox" /> Fotos anzeigen</label>
      </div>
    </div>

    <header class="card rhead">
      <p class="kicker">Ergebnisbericht Barrierefreiheit &amp; Inklusion</p>
      <h1 id="h1">{{ trail.name || 'Unbenannter Lehrpfad' }}</h1>
      <dl class="meta">
        <div><dt>Lage</dt><dd>{{ trail.location || '–' }}</dd></div>
        <div><dt>Länge</dt><dd>{{ trail.lengthKm ? `${trail.lengthKm.toLocaleString('de-DE')} km` : '–' }}</dd></div>
        <div v-if="trail.topic"><dt>Thema</dt><dd>{{ trail.topic }}</dd></div>
        <div><dt>Betreiber</dt><dd>{{ trail.operator || '–' }}</dd></div>
        <div><dt>Bewertet von</dt><dd>{{ trail.assessor || '–' }}</dd></div>
        <div><dt>Begehung</dt><dd>{{ fmtDate(trail.date) }}</dd></div>
        <div><dt>Bericht erstellt</dt><dd>{{ today }}</dd></div>
      </dl>
      <p v-if="trail.description" class="desc">{{ trail.description }}</p>
      <h2 class="h3">Wegabschnitte</h2>
      <ol class="small">
        <li v-for="s in trail.sections" :key="s.id">
          <strong>{{ s.name }}</strong>
          <template v-if="s.lengthM"> ({{ s.lengthM }} m)</template>
          <template v-if="s.startDesc || s.endDesc">: {{ s.startDesc || '…' }} → {{ s.endDesc || '…' }}</template>
        </li>
      </ol>
    </header>

    <ResultOverview :trail="trail" />

    <div class="card">
      <h2>Handlungsempfehlungen</h2>
      <p class="small muted">
        Für alle Kriterien mit einer Bewertung von 2 oder schlechter, priorisiert nach kritischen Barrieren, Gewicht
        der Frage und Ausmaß des Defizits (längengewichtet über die betroffenen Abschnitte).
      </p>
      <p v-if="!recs.length" class="muted">Keine Kriterien mit Handlungsbedarf (alle Bewertungen ≥ 3).</p>
      <ol v-else class="recs">
        <li v-for="r in recs" :key="r.question.id">
          <div class="rtop">
            <span class="badge" :class="r.priorityLabel === 'Hoch' ? 'badge-danger' : r.priorityLabel === 'Mittel' ? 'badge-warn' : ''">
              Priorität {{ r.priorityLabel }}
            </span>
            <strong>{{ r.question.id }} {{ r.question.text }}</strong>
          </div>
          <p>{{ r.question.recommendation }}</p>
          <p class="small muted">
            Betroffen:
            <span v-for="(a, idx) in r.affected" :key="a.section.id">{{ idx ? ', ' : '' }}{{ a.section.name }} ({{ a.value }})</span>
            · Nutzergruppen: {{ r.question.userGroups.map(groupLabel).join(', ') }}
          </p>
        </li>
      </ol>
    </div>

    <div class="card">
      <h2>Kritische Barrieren</h2>
      <IssueList :issues="critical" empty-text="Keine kritischen Barrieren erfasst." />
    </div>

    <div class="card">
      <h2>Nicht beurteilbare Kriterien</h2>
      <IssueList :issues="unknown" empty-text="Alle Kriterien konnten beurteilt werden." />
    </div>

    <template v-if="showDetails">
      <div v-for="s in trail.sections" :key="s.id" class="card details">
        <h2>Einzelbewertungen: {{ s.name }}</h2>
        <div v-for="c in CATEGORIES" :key="c.id" class="cat">
          <h3>{{ c.id }}. {{ c.title }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Frage</th>
                  <th scope="col">Bewertung</th>
                  <th scope="col">Nachweise</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="q in questionsOf(c.id)" :key="q.id">
                  <th scope="row" class="qcol"><span class="qid">{{ q.id }}</span> {{ q.text }}</th>
                  <td class="vcol" :class="`v-${s.answers[q.id]?.value ?? 'null'}`">{{ valueText(s.answers[q.id]?.value) }}</td>
                  <td>
                    <p v-if="s.answers[q.id]?.comment" class="small">{{ s.answers[q.id].comment }}</p>
                    <p v-if="s.answers[q.id]?.measurements.length" class="small">
                      <span v-for="(m, i) in s.answers[q.id].measurements" :key="m.id">{{ i ? '; ' : '' }}{{ m.label }}: {{ m.value }} {{ m.unit }}</span>
                    </p>
                    <div v-if="showPhotos && s.answers[q.id]?.photoIds.length" class="photos">
                      <PhotoThumb v-for="(p, i) in s.answers[q.id].photoIds" :id="p" :key="p" :alt="`Foto ${i + 1} zu ${q.id}, ${s.name}`" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div class="card method">
      <h2>Methodik</h2>
      <p class="small">
        Bewertung von 28 Kriterien in sieben Kategorien auf einer Skala von 0 (nicht erfüllt) bis 4 (vollständig
        erfüllt). Gesamtergebnis P = Σ(G · B / 4) / ΣG · 100 mit G = Gewicht der Frage (Kategoriegewicht gleichmäßig
        auf die Fragen verteilt) und B = Bewertung. Nicht zutreffende Kriterien werden aus der Berechnung
        herausgenommen; nicht beurteilbare Kriterien bleiben enthalten und werden als Spannweite (0 bis 4)
        ausgewiesen. Einstufung: 0–20 % sehr gering, 21–40 % gering, 41–60 % mittel, 61–80 % hoch, 81–100 % sehr hoch.
      </p>
      <p class="small"><strong>Hinweis:</strong> {{ DISCLAIMER }}</p>
    </div>
  </section>
</template>

<style scoped>
.check { display: inline-flex; gap: 0.4rem; align-items: center; min-height: 44px; }
.check input { width: 1.2rem; height: 1.2rem; accent-color: var(--primary); }
.kicker { text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.8rem; font-weight: 700; color: var(--primary-strong); margin: 0; }
.meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.5rem 1rem; margin: 0.5rem 0 1rem; }
.meta dt { font-size: 0.8rem; color: var(--muted); }
.meta dd { margin: 0; font-weight: 600; }
.desc { white-space: pre-line; }
.h3 { font-size: 1.05rem; }
.recs { padding-left: 1.4rem; display: grid; gap: 0.9rem; }
.recs p { margin: 0.25rem 0 0; }
.rtop { display: flex; gap: 0.5rem; align-items: baseline; flex-wrap: wrap; }
.cat { margin-top: 1rem; }
.qcol { font-weight: 500; background: none; width: 45%; }
.qid { font-weight: 700; }
.vcol { white-space: nowrap; font-weight: 600; }
.v-0 { color: var(--lvl-sehr-gering); }
.v-1 { color: #a5500f; }
.v-unknown { color: var(--info); }
.v-null { color: var(--muted); font-style: italic; }
.photos { display: flex; flex-wrap: wrap; gap: 0.5rem; }
td p { margin: 0 0 0.3rem; }
@media print {
  .details { break-before: page; }
  .method { break-inside: avoid; }
}
</style>
