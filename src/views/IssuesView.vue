<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSectionView } from './trailContext'
import { USER_GROUPS } from '../config/criteria'
import { findIssues, progressOf } from '../lib/scoring'
import IssueList from '../components/IssueList.vue'

const view = useSectionView()
const trail = computed(() => view.value.trail)
const groupFilter = ref('')

const filtered = computed(() =>
  findIssues(trail.value).filter(
    (i) =>
      (!groupFilter.value || i.question.userGroups.includes(groupFilter.value as never)),
  ),
)
const critical = computed(() => filtered.value.filter((i) => i.kind === 'critical'))
const unknown = computed(() => filtered.value.filter((i) => i.kind === 'unknown'))
const openBySection = computed(() =>
  trail.value.sections
    .map((s) => ({ s, p: progressOf([s]) }))
    .filter(({ p }) => p.done < p.total),
)
</script>

<template>
  <section aria-labelledby="h1">
    <div class="card">
      <h1 id="h1">Probleme anzeigen</h1>
      <p class="muted">
        Kritische Barrieren (Bewertung 0 – bei sicherheitsrelevanten Kriterien auch 1) und nicht beurteilbare Kriterien
        werden hier gesondert hervorgehoben.
      </p>
      <div class="form-grid">
        <div class="field">
          <label for="f-grp">Nutzergruppe</label>
          <select id="f-grp" v-model="groupFilter">
            <option value="">Alle Nutzergruppen</option>
            <option v-for="g in USER_GROUPS" :key="g.id" :value="g.id">{{ g.label }}</option>
          </select>
        </div>
      </div>
      <p class="summary" role="status" aria-live="polite">
        <span class="badge badge-danger">{{ critical.length }} kritische Barriere(n)</span>
        <span class="badge badge-info">{{ unknown.length }} nicht beurteilbar</span>
        <span class="badge badge-warn">{{ openBySection.reduce((a, x) => a + x.p.total - x.p.done, 0) }} offen</span>
      </p>
    </div>

    <div class="card">
      <h2>Kritische Barrieren</h2>
      <IssueList :issues="critical" show-recommendation empty-text="Keine kritischen Barrieren erfasst." />
    </div>

    <div class="card">
      <h2>Nicht beurteilbare Kriterien</h2>
      <p class="small muted">
        Diese Kriterien sind nicht aus der Berechnung ausgeschlossen – die Bewertung ist unvollständig, bis sie
        nacherhoben wurden.
      </p>
      <IssueList :issues="unknown" empty-text="Alle Kriterien konnten beurteilt werden." />
    </div>

    <div v-if="openBySection.length" class="card">
      <h2>Noch offene Fragen</h2>
      <ul>
        <li v-for="{ s, p } in openBySection" :key="s.id">
          <RouterLink :to="`/abschnitt/${s.id}/bewertung`">{{ s.name }}</RouterLink>:
          {{ p.total - p.done }} von {{ p.total }} Fragen unbeantwortet
        </li>
      </ul>
    </div>

    <div class="btn-row no-print">
      <RouterLink :to="`/abschnitt/${view.sectionDef.id}/bericht`" class="btn btn-primary">Weiter: Ergebnisbericht →</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.summary { display: flex; gap: 0.4rem; flex-wrap: wrap; margin: 1rem 0 0; }
</style>
