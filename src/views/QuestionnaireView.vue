<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSectionView } from './trailContext'
import { emptyAnswer, useTrails } from '../stores/trails'
import { CATEGORIES, USER_GROUPS, questionsOf, type CategoryId } from '../config/criteria'
import { difficultyLabel } from '../config/trails'
import { computeScore, isCritical, progressOf, sectionLookup } from '../lib/scoring'
import type { AnswerValue } from '../config/rating'
import RatingInput from '../components/RatingInput.vue'
import EvidencePanel from '../components/EvidencePanel.vue'
import ScoreBar from '../components/ScoreBar.vue'

const view = useSectionView()
const store = useTrails()
const router = useRouter()

const section = computed(() => view.value.trail.sections[0])
const def = computed(() => view.value.sectionDef)
const trailDef = computed(() => view.value.trailDef)
const activeCat = ref<CategoryId>('A')
const copyFrom = ref('')
const status = ref('')

// Sicherstellen, dass für jede Frage ein Antwortobjekt existiert
watch(
  section,
  (s) => {
    if (!s) return
    for (const c of CATEGORIES) for (const q of questionsOf(c.id)) if (!s.answers[q.id]) s.answers[q.id] = emptyAnswer()
  },
  { immediate: true },
)

const questions = computed(() => questionsOf(activeCat.value))
const catScore = computed(() => computeScore(questions.value, sectionLookup(section.value)))
// Geschwisterabschnitte desselben Lehrpfads mit vorhandenen Antworten in dieser Kategorie
const otherSections = computed(() =>
  trailDef.value.sections.filter(
    (s) => s.id !== section.value.id && questions.value.some((q) => (store.peek(s.id).answers[q.id]?.value ?? null) !== null),
  ),
)

function groupLabel(id: string) {
  return USER_GROUPS.find((g) => g.id === id)?.short ?? id
}

function setValue(qid: string, v: AnswerValue) {
  section.value.answers[qid].value = v
  store.touch(section.value.id)
}

function catProgress(id: CategoryId) {
  return progressOf([section.value], questionsOf(id))
}

const tabRefs = ref<HTMLButtonElement[]>([])
function onTabKey(e: KeyboardEvent, i: number) {
  const n = CATEGORIES.length
  let j = -1
  if (e.key === 'ArrowRight') j = (i + 1) % n
  else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n
  else if (e.key === 'Home') j = 0
  else if (e.key === 'End') j = n - 1
  if (j < 0) return
  e.preventDefault()
  activeCat.value = CATEGORIES[j].id
  tabRefs.value[j]?.focus()
}

async function gotoCat(d: -1 | 1) {
  const i = CATEGORIES.findIndex((c) => c.id === activeCat.value) + d
  if (i >= 0 && i < CATEGORIES.length) {
    activeCat.value = CATEGORIES[i].id
  } else if (d === 1) {
    router.push(`/abschnitt/${section.value.id}/auswertung`)
    return
  }
  await nextTick()
  document.getElementById('panel-heading')?.focus()
}

function copyCategory() {
  const src = trailDef.value.sections.find((s) => s.id === copyFrom.value)
  if (!src) return
  const answers = store.peek(src.id).answers
  for (const q of questions.value) {
    const a = answers[q.id]
    if (a) section.value.answers[q.id] = { ...JSON.parse(JSON.stringify(a)) }
  }
  store.touch(section.value.id)
  status.value = `Bewertungen der Kategorie ${activeCat.value} aus „${src.name}“ übernommen.`
  copyFrom.value = ''
}

const isLastStep = computed(() => activeCat.value === 'G')
</script>

<template>
  <section v-if="section" aria-labelledby="h1">
    <div class="card">
      <div class="page-head">
        <div>
          <h1 id="h1">Bewertung</h1>
          <p class="muted">
            Bewerten Sie jede Frage auf der Skala von 0 bis 4. Ergänzen Sie Fotos, Messwerte und Kommentare als
            Nachweise. Alles wird automatisch gespeichert.
          </p>
        </div>
      </div>
      <div class="info">
        <p class="small muted trail-name">{{ trailDef.name }}</p>
        <h2 class="sec-name">{{ def.name }}</h2>
        <dl class="meta">
          <div v-if="def.lengthM"><dt>Länge</dt><dd>{{ def.lengthM.toLocaleString('de-DE') }} m</dd></div>
          <div v-if="def.startDesc || def.endDesc"><dt>Beginn → Ende</dt><dd>{{ def.startDesc || '…' }} → {{ def.endDesc || '…' }}</dd></div>
          <div><dt>Schwierigkeit</dt><dd>{{ difficultyLabel(def.difficulty) }}</dd></div>
          <div v-if="trailDef.location"><dt>Lage / Ort</dt><dd>{{ trailDef.location }}</dd></div>
        </dl>
        <p v-if="def.notes" class="small notes"><strong>Besonderheiten:</strong> {{ def.notes }}</p>
      </div>
      <div class="form-grid">
        <div class="field">
          <span class="label">Fortschritt in diesem Abschnitt</span>
          <progress :value="progressOf([section]).done" :max="progressOf([section]).total" aria-label="Fortschritt">
          </progress>
          <span class="small muted">{{ progressOf([section]).done }} von {{ progressOf([section]).total }} Fragen beantwortet</span>
        </div>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Kategorien">
      <button
        v-for="(c, i) in CATEGORIES"
        :id="`tab-${c.id}`"
        :key="c.id"
        ref="tabRefs"
        type="button"
        role="tab"
        class="tab"
        :aria-selected="activeCat === c.id"
        :aria-controls="`panel-${c.id}`"
        :tabindex="activeCat === c.id ? 0 : -1"
        @click="activeCat = c.id"
        @keydown="onTabKey($event, i)"
      >
        {{ c.id }}
        <span class="count">{{ catProgress(c.id).done }}/{{ catProgress(c.id).total }}</span>
        <span class="sr-only">{{ c.title }}</span>
      </button>
    </div>

    <div :id="`panel-${activeCat}`" role="tabpanel" :aria-labelledby="`tab-${activeCat}`">
      <div class="card cat-head">
        <h2 id="panel-heading" tabindex="-1">
          {{ activeCat }}. {{ CATEGORIES.find((c) => c.id === activeCat)!.title }}
        </h2>
        <ScoreBar :p-min="catScore.pMin" :p-max="catScore.pMax" :label="`Ergebnis Kategorie ${activeCat}`" />
        <div v-if="otherSections.length" class="copy">
          <label for="copy-from">Bewertung dieser Kategorie übernehmen aus</label>
          <div class="btn-row">
            <select id="copy-from" v-model="copyFrom">
              <option value="">– Abschnitt wählen –</option>
              <option v-for="s in otherSections" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <button type="button" class="btn btn-sm" :disabled="!copyFrom" @click="copyCategory">Übernehmen</button>
          </div>
        </div>
        <p class="sr-only" role="status" aria-live="polite">{{ status }}</p>
      </div>

      <ol class="questions">
        <li v-for="q in questions" :key="q.id" class="card question" :class="{ critical: isCritical(q, section.answers[q.id]?.value ?? null) }">
          <h3 :id="`q-${section.id}-${q.id}`" class="qtext">
            <span class="qid">{{ q.id }}</span> {{ q.text }}
          </h3>
          <details class="hint">
            <summary>Prüfhinweise</summary>
            <p>{{ q.hint }}</p>
            <p class="groups-label">Besonders relevant für:</p>
            <p class="groups small">
              <span v-for="g in q.userGroups" :key="g" class="badge">{{ groupLabel(g) }}</span>
            </p>
          </details>
          <RatingInput
            v-if="section.answers[q.id]"
            :name="`r-${section.id}-${q.id}`"
            :legend-id="`q-${section.id}-${q.id}`"
            :model-value="section.answers[q.id].value"
            @update:model-value="setValue(q.id, $event)"
          />
          <p v-if="isCritical(q, section.answers[q.id]?.value ?? null)" class="alert alert-danger small flag">
            <strong>Kritische Barriere.</strong> Empfehlung: {{ q.recommendation }}
          </p>
          <p v-else-if="section.answers[q.id]?.value === 'unknown'" class="alert alert-info small flag">
            <strong>Nicht beurteilbar</strong> – die Bewertung wird als unvollständig gekennzeichnet. Bitte fehlende
            Informationen nacherheben.
          </p>
          <EvidencePanel
            v-if="section.answers[q.id]"
            :answer="section.answers[q.id]"
            :id-base="`e-${section.id}-${q.id}`"
            :question-label="q.id"
          />
        </li>
      </ol>

      <div class="btn-row no-print">
        <button type="button" class="btn" :disabled="activeCat === 'A'" @click="gotoCat(-1)">← Vorherige Kategorie</button>
        <button type="button" class="btn btn-primary" @click="gotoCat(1)">
          <template v-if="isLastStep">Zur Auswertung →</template>
          <template v-else>Nächste Kategorie →</template>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
progress { width: 100%; height: 14px; accent-color: var(--primary); }
.info { margin-bottom: 1rem; }
.trail-name { margin: 0; }
.sec-name { margin-bottom: 0.4rem; }
.meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.5rem 1rem; margin: 0 0 0.5rem; }
.meta dt { font-size: 0.8rem; color: var(--muted); }
.meta dd { margin: 0; font-weight: 600; }
.notes { white-space: pre-line; }
.cat-head h2 { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.cat-head h2:focus { outline: none; }
.copy { margin-top: 1rem; display: grid; gap: 0.3rem; }
.copy label { font-weight: 600; font-size: 0.95rem; }
.copy select { max-width: 320px; }
.questions { list-style: none; padding: 0; margin: 0 0 1rem; }
.question.critical { border-left: 5px solid var(--danger); }
.qtext { font-size: 1.05rem; display: flex; gap: 0.6rem; align-items: baseline; }
.qid { flex: none; background: var(--primary); color: #fff; border-radius: 6px; padding: 0.05rem 0.45rem; font-size: 0.9rem; }
.hint .groups-label { font-weight: 600; color: var(--text); margin-top: 0.6rem; }
.hint .groups { display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; margin-top: 0.3rem; }
.hint { margin-bottom: 0.75rem; font-size: 0.95rem; }
.hint summary { cursor: pointer; color: var(--primary-strong); font-weight: 600; min-height: 32px; }
.hint p { margin: 0.4rem 0 0; color: var(--muted); }
.flag { margin: 0.75rem 0 0; }
</style>
