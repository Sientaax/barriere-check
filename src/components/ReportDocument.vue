<script setup lang="ts">
import { computed } from 'vue'
import { sectionTrail, useTrails } from '../stores/trails'
import { difficultyLabel, findSection } from '../config/trails'
import { CATEGORIES, USER_GROUPS, questionsOf } from '../config/criteria'
import { DISCLAIMER, scaleLabel } from '../config/rating'
import { buildRecommendations, findIssues } from '../lib/scoring'
import ResultOverview from './ResultOverview.vue'
import IssueList from './IssueList.vue'
import PhotoThumb from './PhotoThumb.vue'

/** Inhalt des Ergebnisberichts (Bildschirm und PDF) – genutzt vom Bericht und vom PDF-Druck auf der Startseite */
const props = withDefaults(
  defineProps<{ sectionId: string; showDetails?: boolean; showPhotos?: boolean; headingId?: string }>(),
  { showDetails: true, showPhotos: true, headingId: 'h1' },
)

const store = useTrails()
const sectionRef = computed(() => findSection(props.sectionId)!)
const def = computed(() => sectionRef.value.section)
const trailDef = computed(() => sectionRef.value.trail)
const trail = computed(() => sectionTrail(props.sectionId, store.peek(props.sectionId))!)

const issues = computed(() => findIssues(trail.value))
const critical = computed(() => issues.value.filter((i) => i.kind === 'critical'))
const unknown = computed(() => issues.value.filter((i) => i.kind === 'unknown'))
const recs = computed(() => buildRecommendations(trail.value))
const today = new Date().toLocaleDateString('de-DE')

function groupLabel(id: string) {
  return USER_GROUPS.find((g) => g.id === id)?.short ?? id
}
function valueText(v: unknown) {
  return typeof v === 'number' ? `${v} – ${scaleLabel(v as 0)}` : scaleLabel((v ?? null) as null)
}
</script>

<template>
  <!-- Druckrahmen: thead/tfoot wiederholen sich auf jeder PDF-Seite und halten Platz für Rand und Fußzeile frei -->
  <table class="print-frame" role="presentation">
    <thead aria-hidden="true"><tr><td><div class="pf-top"></div></td></tr></thead>
    <tfoot aria-hidden="true"><tr><td><div class="pf-bottom"></div></td></tr></tfoot>
    <tbody><tr><td>

      <header class="card rhead">
        <p class="kicker">Ergebnisbericht Barrierefreiheit &amp; Inklusion</p>
        <p class="trail-name">{{ trailDef.name }}</p>
        <h1 :id="headingId">{{ def.name }}</h1>
        <h2 class="h3">Streckenabschnitt</h2>
        <dl class="meta">
          <div><dt>Länge</dt><dd>{{ def.lengthM ? `${def.lengthM.toLocaleString('de-DE')} m` : '–' }}</dd></div>
          <div><dt>Beginn</dt><dd>{{ def.startDesc || '–' }}</dd></div>
          <div><dt>Ende</dt><dd>{{ def.endDesc || '–' }}</dd></div>
          <div><dt>Schwierigkeit</dt><dd>{{ difficultyLabel(def.difficulty) }}</dd></div>
          <div><dt>Bericht erstellt</dt><dd>{{ today }}</dd></div>
        </dl>
        <p v-if="def.notes" class="desc"><strong>Besonderheiten:</strong> {{ def.notes }}</p>
        <h2 class="h3">Lehrpfad</h2>
        <dl class="meta">
          <div><dt>Lage / Ort</dt><dd>{{ trailDef.location || '–' }}</dd></div>
          <div><dt>Gesamtlänge</dt><dd>{{ trailDef.lengthKm ? `${trailDef.lengthKm.toLocaleString('de-DE')} km` : '–' }}</dd></div>
          <div v-if="trailDef.topic"><dt>Thema / Schwerpunkt</dt><dd>{{ trailDef.topic }}</dd></div>
          <div v-if="trailDef.subject"><dt>Studiumsfach</dt><dd>{{ trailDef.subject }}</dd></div>
        </dl>
        <p v-if="trailDef.description" class="desc">{{ trailDef.description }}</p>
      </header>

      <ResultOverview :trail="trail" />

      <div class="card">
        <h2>Handlungsempfehlungen</h2>
        <p class="small muted">
          Für alle Kriterien mit einer Bewertung von 2 oder schlechter, priorisiert nach kritischen Barrieren,
          Bedeutung des Kriteriums und Ausmaß des Defizits.
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
          <h2>Einzelbewertungen</h2>
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

      <p class="alert alert-info small"><strong>Hinweis:</strong> {{ DISCLAIMER }}</p>
    </td></tr></tbody>
  </table>
</template>

<style scoped>
.trail-name { margin: 0.4rem 0 0; color: var(--muted); font-weight: 600; }
.h3 + .meta { margin-top: 0.25rem; }
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
}
</style>
