<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTrail } from './trailContext'
import { emptyAnswer, useTrails } from '../stores/trails'
import { CATEGORIES, USER_GROUPS, questionsOf, type CategoryId } from '../config/criteria'
import { computeScore, isCritical, progressOf, sectionLookup } from '../lib/scoring'
import type { AnswerValue } from '../config/rating'
import RatingInput from '../components/RatingInput.vue'
import EvidencePanel from '../components/EvidencePanel.vue'
import ScoreBar from '../components/ScoreBar.vue'

const trail = useTrail()
const store = useTrails()
const route = useRoute()
const router = useRouter()

const section = computed(
  () => trail.value.sections.find((s) => s.id === route.params.sectionId) ?? trail.value.sections[0],
)
const sectionIndex = computed(() => trail.value.sections.indexOf(section.value))
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
const otherSections = computed(() => trail.value.sections.filter((s) => s.id !== section.value.id))

function groupLabel(id: string) {
  return USER_GROUPS.find((g) => g.id === id)?.short ?? id
}

function selectSection(id: string) {
  router.replace(`/pfad/${trail.value.id}/fragebogen/${id}`)
}

function setValue(qid: string, v: AnswerValue) {
  section.value.answers[qid].value = v
  store.touch(trail.value)
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
  } else if (d === 1 && sectionIndex.value < trail.value.sections.length - 1) {
    activeCat.value = 'A'
    selectSection(trail.value.sections[sectionIndex.value + 1].id)
  } else if (d === 1) {
    router.push(`/pfad/${trail.value.id}/auswertung`)
    return
  }
  await nextTick()
  document.getElementById('panel-heading')?.focus()
}

function copyCategory() {
  const src = trail.value.sections.find((s) => s.id === copyFrom.value)
  if (!src) return
  for (const q of questions.value) {
    const a = src.answers[q.id]
    if (a) section.value.answers[q.id] = { ...JSON.parse(JSON.stringify(a)) }
  }
  status.value = `Bewertungen der Kategorie ${activeCat.value} aus „${src.name}“ übernommen.`
  copyFrom.value = ''
}

const isLastStep = computed(
  () => activeCat.value === 'G' && sectionIndex.value === trail.value.sections.length - 1,
)
</script>

<template>
  <section v-if="section" aria-labelledby="h1">
    <div class="card">
      <div class="page-head">
        <div>
          <h1 id="h1">3. Fragebogen &amp; 4. Nachweise</h1>
          <p class="muted">
            Bewerten Sie jede Frage auf der Skala von 0 bis 4. Ergänzen Sie Fotos, Messwerte und Kommentare als
            Nachweise. Alles wird automatisch gespeichert.
          </p>
        </div>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="sec-select">Wegabschnitt</label>
          <select id="sec-select" :value="section.id" @change="selectSection(($event.target as HTMLSelectElement).value)">
            <option v-for="(s, i) in trail.sections" :key="s.id" :value="s.id">
              {{ i + 1 }}. {{ s.name }} ({{ progressOf([s]).done }}/{{ progressOf([s]).total }})
            </option>
          </select>
        </div>
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
          <span class="badge">Gewicht {{ CATEGORIES.find((c) => c.id === activeCat)!.weight }} %</span>
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
          <p class="groups small">
            <span class="sr-only">Besonders relevant für:</span>
            <span v-for="g in q.userGroups" :key="g" class="badge">{{ groupLabel(g) }}</span>
            <span class="muted">· Gewicht {{ q.weight.toLocaleString('de-DE', { maximumFractionDigits: 2 }) }}</span>
          </p>
          <details class="hint">
            <summary>Prüfhinweise</summary>
            <p>{{ q.hint }}</p>
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
          <template v-else-if="activeCat === 'G'">Nächster Abschnitt →</template>
          <template v-else>Nächste Kategorie →</template>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
progress { width: 100%; height: 14px; accent-color: var(--primary); }
.cat-head h2 { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.cat-head h2:focus { outline: none; }
.copy { margin-top: 1rem; display: grid; gap: 0.3rem; }
.copy label { font-weight: 600; font-size: 0.95rem; }
.copy select { max-width: 320px; }
.questions { list-style: none; padding: 0; margin: 0 0 1rem; }
.question.critical { border-left: 5px solid var(--danger); }
.qtext { font-size: 1.05rem; display: flex; gap: 0.6rem; align-items: baseline; }
.qid { flex: none; background: var(--primary); color: #fff; border-radius: 6px; padding: 0.05rem 0.45rem; font-size: 0.9rem; }
.groups { display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; }
.hint { margin-bottom: 0.75rem; font-size: 0.95rem; }
.hint summary { cursor: pointer; color: var(--primary-strong); font-weight: 600; min-height: 32px; }
.hint p { margin: 0.4rem 0 0; color: var(--muted); }
.flag { margin: 0.75rem 0 0; }
</style>
