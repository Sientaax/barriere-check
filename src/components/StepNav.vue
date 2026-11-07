<script setup lang="ts">
import { useRoute } from 'vue-router'
import { STEPS } from '../router'

defineProps<{ trailId: string }>()
const route = useRoute()
</script>

<template>
  <nav aria-label="Arbeitsschritte" class="no-print">
    <ol class="stepper">
      <li v-for="(s, i) in STEPS" :key="s.name">
        <RouterLink
          :to="`/pfad/${trailId}/${s.name}`"
          :aria-current="route.name === s.name ? 'page' : undefined"
        >
          <span class="num" aria-hidden="true">{{ i + 1 }}</span>
          <span><span class="sr-only">Schritt {{ i + 1 }}: </span>{{ s.label }}</span>
        </RouterLink>
      </li>
    </ol>
  </nav>
</template>
