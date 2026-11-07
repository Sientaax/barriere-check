<script setup lang="ts">
import { computed } from 'vue'
import { formatRange, levelFor } from '../lib/scoring'

const props = defineProps<{ pMin: number | null; pMax: number | null; label?: string }>()
const lvl = computed(() => levelFor(props.pMin))
const min = computed(() => Math.max(0, Math.min(100, props.pMin ?? 0)))
const max = computed(() => Math.max(0, Math.min(100, props.pMax ?? 0)))
const text = computed(() => {
  if (props.pMin === null) return 'Kein Ergebnis (nicht zutreffend)'
  const r = formatRange(props)
  return props.pMin !== props.pMax ? `${r} (unvollständig, Spannweite)` : r
})
</script>

<template>
  <div class="scorebar">
    <div
      class="track"
      role="img"
      :aria-label="`${label ? label + ': ' : ''}${text}`"
      :class="lvl ? `lvl-${lvl.key}` : ''"
    >
      <div class="fill" :style="{ width: min + '%' }"></div>
      <div v-if="max > min" class="range" :style="{ left: min + '%', width: max - min + '%' }"></div>
      <div class="ticks" aria-hidden="true"><span v-for="t in [20, 40, 60, 80]" :key="t" :style="{ left: t + '%' }"></span></div>
    </div>
    <span class="value" aria-hidden="true">{{ formatRange(props) }}</span>
  </div>
</template>

<style scoped>
.scorebar { display: flex; align-items: center; gap: 0.75rem; min-width: 160px; }
.track { position: relative; flex: 1; height: 14px; background: var(--surface-2); border-radius: 7px; overflow: hidden; border: 1px solid var(--border); }
.fill { position: absolute; inset: 0 auto 0 0; background: var(--lvl, var(--muted)); }
.range {
  position: absolute; top: 0; bottom: 0;
  background: repeating-linear-gradient(135deg, var(--lvl, #888) 0 3px, transparent 3px 7px);
  opacity: 0.55;
}
.ticks span { position: absolute; top: 0; bottom: 0; width: 1px; background: rgb(0 0 0 / 0.18); }
.value { font-weight: 700; font-variant-numeric: tabular-nums; min-width: 5.5em; text-align: right; }
</style>
