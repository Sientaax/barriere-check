<script setup lang="ts">
import { SCALE, type AnswerValue } from '../config/rating'

defineProps<{ name: string; modelValue: AnswerValue; legendId: string }>()
const emit = defineEmits<{ 'update:modelValue': [AnswerValue] }>()

function select(v: AnswerValue) {
  emit('update:modelValue', v)
}
</script>

<template>
  <div class="rating" role="radiogroup" :aria-labelledby="legendId">
    <label
      v-for="opt in SCALE"
      :key="String(opt.value)"
      class="opt"
      :class="[`v-${opt.value}`, { checked: modelValue === opt.value }]"
      :title="opt.description"
    >
      <input
        type="radio"
        :name="name"
        :value="opt.value"
        :checked="modelValue === opt.value"
        @change="select(opt.value)"
      />
      <span class="short" aria-hidden="true">{{ opt.short }}</span>
      <span class="txt">{{ opt.label }}</span>
    </label>
    <button
      v-if="modelValue !== null"
      type="button"
      class="btn btn-ghost btn-sm reset"
      @click="select(null)"
    >
      Zurücksetzen
    </button>
  </div>
</template>

<style scoped>
.rating { display: grid; grid-template-columns: repeat(5, 1fr) 1.15fr 1.15fr; gap: 0.35rem; align-items: stretch; }
.opt {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  gap: 0.1rem; padding: 0.4rem 0.25rem; min-height: 64px; border: 2px solid var(--border); border-radius: 8px;
  background: var(--surface); cursor: pointer; font-size: 0.8rem; line-height: 1.2; color: var(--text);
}
.opt:hover { border-color: var(--primary); }
.opt input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.opt:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.short { font-size: 1.15rem; font-weight: 800; }
.opt.checked { color: #fff; border-color: transparent; }
.opt.checked.v-0 { background: var(--lvl-sehr-gering); }
.opt.checked.v-1 { background: var(--lvl-gering); }
.opt.checked.v-2 { background: #8a6a00; }
.opt.checked.v-3 { background: #3f7a22; }
.opt.checked.v-4 { background: var(--lvl-sehr-hoch); }
.opt.checked.v-na { background: var(--muted); }
.opt.checked.v-unknown { background: var(--info); }
.opt.v-na, .opt.v-unknown { background: var(--surface-2); }
.reset { grid-column: 1 / -1; justify-self: start; }
@media (max-width: 700px) {
  .rating { grid-template-columns: repeat(5, 1fr); }
  .opt.v-na, .opt.v-unknown { grid-column: span 2; }
  .opt.v-unknown { grid-column: 3 / span 3; }
  .txt { font-size: 0.72rem; }
}
</style>
