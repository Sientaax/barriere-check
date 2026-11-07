<script setup lang="ts">
import { useTrail } from './trailContext'
import ResultOverview from '../components/ResultOverview.vue'
import { DISCLAIMER } from '../config/rating'

const trail = useTrail()
</script>

<template>
  <section aria-labelledby="h1">
    <div class="card">
      <h1 id="h1">5. Auswertung</h1>
      <p class="muted">
        Automatische Berechnung nach P = Σ(G · B / 4) / ΣG · 100. Nicht zutreffende Kriterien werden aus der
        Berechnung herausgenommen; nicht beurteilbare Kriterien führen zu einer Spannweite.
        <RouterLink to="/methodik">Mehr zur Methodik</RouterLink>
      </p>
    </div>
    <ResultOverview :trail="trail" />
    <p class="alert alert-info small">{{ DISCLAIMER }}</p>
    <div class="btn-row no-print">
      <RouterLink :to="`/pfad/${trail.id}/probleme`" class="btn btn-primary">Weiter: Probleme anzeigen →</RouterLink>
    </div>
  </section>
</template>
