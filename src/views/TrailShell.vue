<script setup lang="ts">
import { computed, provide, watch } from 'vue'
import { sectionTrail, useTrails } from '../stores/trails'
import { findSection } from '../config/trails'
import StepNav from '../components/StepNav.vue'
import { SECTION_KEY, type SectionContext } from './trailContext'

const props = defineProps<{ sectionId: string }>()
const store = useTrails()

// Bewertung beim Öffnen anlegen, damit Eingaben direkt im Store landen
watch(
  () => props.sectionId,
  (id) => {
    if (findSection(id)) store.assessmentFor(id)
  },
  { immediate: true },
)

const ctx = computed<SectionContext | undefined>(() => {
  const ref = findSection(props.sectionId)
  if (!ref) return
  const trail = sectionTrail(props.sectionId, store.peek(props.sectionId))
  if (!trail) return
  return { trail, trailDef: ref.trail, sectionDef: ref.section }
})
provide(SECTION_KEY, ctx)
</script>

<template>
  <div v-if="!ctx" class="card">
    <h1>Abschnitt nicht gefunden</h1>
    <p>Diesen Streckenabschnitt gibt es nicht (mehr).</p>
    <RouterLink to="/" class="btn">Zur Übersicht</RouterLink>
  </div>
  <template v-else>
    <p class="crumb no-print">
      <RouterLink to="/">Streckenabschnitte / Wanderrouten</RouterLink> › {{ ctx.trailDef.name }} ›
      <strong>{{ ctx.sectionDef.name }}</strong>
    </p>
    <StepNav :section-id="ctx.sectionDef.id" />
    <RouterView :key="ctx.sectionDef.id" />
  </template>
</template>

<style scoped>
.crumb { margin-bottom: 0.75rem; font-size: 0.95rem; }
</style>
