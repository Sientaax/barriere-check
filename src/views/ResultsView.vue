<script setup lang="ts">
import { useSectionView } from './trailContext'
import ResultOverview from '../components/ResultOverview.vue'
import { DISCLAIMER } from '../config/rating'

const view = useSectionView()
</script>

<template>
  <section aria-labelledby="h1">
    <div class="card">
      <h1 id="h1">Auswertung</h1>
      <p class="muted">
        Automatische Berechnung für den Abschnitt „{{ view.sectionDef.name }}“. Nicht zutreffende Kriterien werden aus
        der Berechnung herausgenommen; nicht beurteilbare Kriterien führen zu einer Spannweite.
        <RouterLink to="/methodik">Mehr zur Methodik</RouterLink>
      </p>
    </div>
    <ResultOverview :trail="view.trail" />
    <p class="alert alert-info small">{{ DISCLAIMER }}</p>
    <div class="btn-row no-print">
      <RouterLink :to="`/abschnitt/${view.sectionDef.id}/probleme`" class="btn btn-primary">Weiter: Probleme anzeigen →</RouterLink>
    </div>
  </section>
</template>
