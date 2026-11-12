<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSectionView } from './trailContext'
import ReportDocument from '../components/ReportDocument.vue'
import SaveMenu from '../components/SaveMenu.vue'

const view = useSectionView()
const def = computed(() => view.value.sectionDef)
const showDetails = ref(true)
const showPhotos = ref(true)
</script>

<template>
  <section aria-labelledby="h1" class="report">
    <div class="card no-print">
      <p class="muted">
        Druckoptimierte Übersicht. Über „Speichern“ sichern Sie die Bewertung als JSON-Datei oder erzeugen einen
        PDF-Bericht zum Weitergeben.
      </p>
      <div class="btn-row">
        <SaveMenu :section-id="def.id" print-here />
        <label class="check"><input v-model="showDetails" type="checkbox" /> Einzelbewertungen anzeigen</label>
        <label class="check"><input v-model="showPhotos" type="checkbox" /> Fotos anzeigen</label>
      </div>
    </div>
    <ReportDocument :section-id="def.id" :show-details="showDetails" :show-photos="showPhotos" />
  </section>
</template>

<style scoped>
.check { display: inline-flex; gap: 0.4rem; align-items: center; min-height: 44px; }
.check input { width: 1.2rem; height: 1.2rem; accent-color: var(--primary); }
</style>
