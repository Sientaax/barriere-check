<script setup lang="ts">
import { computed, provide } from 'vue'
import { useTrails } from '../stores/trails'
import StepNav from '../components/StepNav.vue'
import { TRAIL_KEY } from './trailContext'

const props = defineProps<{ id: string }>()
const store = useTrails()
const trail = computed(() => store.get(props.id))
provide(TRAIL_KEY, trail)
</script>

<template>
  <div v-if="!trail" class="card">
    <h1>Lehrpfad nicht gefunden</h1>
    <p>Dieser Lehrpfad existiert in diesem Browser nicht (mehr).</p>
    <RouterLink to="/" class="btn">Zur Übersicht</RouterLink>
  </div>
  <template v-else>
    <p class="crumb no-print">
      <RouterLink to="/">Meine Lehrpfade</RouterLink> › <strong>{{ trail.name || 'Unbenannter Lehrpfad' }}</strong>
    </p>
    <StepNav :trail-id="trail.id" />
    <RouterView :key="trail.id" />
  </template>
</template>

<style scoped>
.crumb { margin-bottom: 0.75rem; font-size: 0.95rem; }
</style>
