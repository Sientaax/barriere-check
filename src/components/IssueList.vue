<script setup lang="ts">
import type { Issue } from '../lib/scoring'
import { scaleLabel } from '../config/rating'

defineProps<{ issues: Issue[]; showRecommendation?: boolean; emptyText: string }>()
</script>

<template>
  <p v-if="!issues.length" class="muted">{{ emptyText }}</p>
  <ul v-else class="issues">
    <li v-for="i in issues" :key="i.section.id + i.question.id" :class="`k-${i.kind}`">
      <div class="top">
        <span class="qid">{{ i.question.id }}</span>
        <span class="text">{{ i.question.text }}</span>
      </div>
      <p class="meta small">
        <span class="badge">{{ i.section.name }}</span>
        <span class="badge" :class="i.kind === 'critical' ? 'badge-danger' : 'badge-info'">
          {{ i.kind === 'critical' ? `Bewertung ${i.answer?.value} – ${scaleLabel(i.answer?.value ?? null)}` : scaleLabel(i.answer?.value ?? null) }}
        </span>
        <span v-if="i.answer?.photoIds.length" class="badge">{{ i.answer.photoIds.length }} Foto(s)</span>
      </p>
      <p v-if="i.answer?.comment" class="small comment">„{{ i.answer.comment }}“</p>
      <p v-if="i.answer?.measurements.length" class="small">
        Messwerte:
        <span v-for="(m, idx) in i.answer.measurements" :key="m.id">{{ idx ? '; ' : '' }}{{ m.label }} {{ m.value }} {{ m.unit }}</span>
      </p>
      <p v-if="showRecommendation" class="small rec"><strong>Empfehlung:</strong> {{ i.question.recommendation }}</p>
    </li>
  </ul>
</template>

<style scoped>
.issues { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
.issues li { border: 1px solid var(--border); border-left: 5px solid var(--border); border-radius: 8px; padding: 0.75rem 0.9rem; background: var(--surface); break-inside: avoid; }
.issues li.k-critical { border-left-color: var(--danger); }
.issues li.k-unknown { border-left-color: var(--info); }
.top { display: flex; gap: 0.6rem; align-items: baseline; font-weight: 600; }
.qid { flex: none; background: var(--surface-2); border-radius: 6px; padding: 0 0.4rem; font-size: 0.9rem; }
.meta { display: flex; flex-wrap: wrap; gap: 0.3rem; margin: 0.4rem 0; }
.comment { font-style: italic; }
.rec { margin: 0; }
.issues p:last-child { margin-bottom: 0; }
</style>
