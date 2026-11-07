<script setup lang="ts">
import { computed } from 'vue'
import { levelFor } from '../lib/scoring'

const props = defineProps<{ pMin: number | null; pMax: number | null }>()
const lo = computed(() => levelFor(props.pMin))
const hi = computed(() => levelFor(props.pMax))
</script>

<template>
  <span v-if="!lo" class="muted">keine Einstufung</span>
  <span v-else-if="!hi || lo.key === hi.key" class="level" :class="`lvl-${lo.key}`">{{ lo.label }}</span>
  <span v-else class="level-range">
    <span class="level" :class="`lvl-${lo.key}`">{{ lo.label }}</span>
    <span aria-hidden="true"> bis </span><span class="sr-only"> bis </span>
    <span class="level" :class="`lvl-${hi.key}`">{{ hi.label }}</span>
  </span>
</template>
