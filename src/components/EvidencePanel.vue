<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Answer } from '../types'
import { uid } from '../lib/id'
import { compressImage } from '../lib/image'
import { deletePhoto, savePhoto } from '../lib/storage'
import PhotoThumb from './PhotoThumb.vue'

const props = defineProps<{ answer: Answer; idBase: string; questionLabel: string }>()
const busy = ref(false)
const status = ref('')

const count = computed(
  () => props.answer.photoIds.length + props.answer.measurements.length + (props.answer.comment.trim() ? 1 : 0),
)

async function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (!files.length) return
  busy.value = true
  status.value = 'Fotos werden verarbeitet …'
  try {
    for (const f of files) {
      const id = uid()
      await savePhoto(id, await compressImage(f))
      props.answer.photoIds.push(id)
    }
    status.value = `${files.length} Foto(s) hinzugefügt.`
  } catch {
    status.value = 'Foto konnte nicht gespeichert werden.'
  } finally {
    busy.value = false
    input.value = ''
  }
}

async function removePhoto(id: string) {
  props.answer.photoIds = props.answer.photoIds.filter((p) => p !== id)
  await deletePhoto(id)
  status.value = 'Foto entfernt.'
}

function addMeasurement() {
  props.answer.measurements.push({ id: uid(), label: '', value: '', unit: '' })
}
function removeMeasurement(id: string) {
  props.answer.measurements = props.answer.measurements.filter((m) => m.id !== id)
}
</script>

<template>
  <details class="evidence">
    <summary class="btn btn-sm">
      <template v-if="count">Nachweise <span class="badge badge-ok">{{ count }} vorhanden</span></template>
      <template v-else>+ Nachweise hinzufügen</template>
      <span class="sr-only"> zu {{ questionLabel }}</span>
    </summary>
    <div class="body">
      <div class="field">
        <label :for="`${idBase}-comment`">Kommentar / Beobachtung</label>
        <textarea
          :id="`${idBase}-comment`"
          v-model="answer.comment"
          placeholder="z. B. Wurzelaufbrüche zwischen Station 3 und 4, ca. 5 cm hoch"
        ></textarea>
      </div>

      <fieldset class="measure">
        <legend class="label">Messwerte</legend>
        <div v-for="(m, i) in answer.measurements" :key="m.id" class="mrow">
          <div class="field">
            <label :for="`${idBase}-m${i}-l`">Bezeichnung</label>
            <input :id="`${idBase}-m${i}-l`" v-model="m.label" type="text" placeholder="z. B. Wegbreite" />
          </div>
          <div class="field">
            <label :for="`${idBase}-m${i}-v`">Wert</label>
            <input :id="`${idBase}-m${i}-v`" v-model="m.value" type="text" inputmode="decimal" placeholder="1,20" />
          </div>
          <div class="field">
            <label :for="`${idBase}-m${i}-u`">Einheit</label>
            <input :id="`${idBase}-m${i}-u`" v-model="m.unit" type="text" placeholder="m" />
          </div>
          <button type="button" class="btn btn-danger btn-sm" @click="removeMeasurement(m.id)">
            Entfernen<span class="sr-only"> Messwert {{ i + 1 }}</span>
          </button>
        </div>
        <button type="button" class="btn btn-sm" @click="addMeasurement">+ Messwert hinzufügen</button>
      </fieldset>

      <div class="photos">
        <span class="label">Fotos</span>
        <ul v-if="answer.photoIds.length" class="plist">
          <li v-for="(p, i) in answer.photoIds" :key="p">
            <PhotoThumb :id="p" :alt="`Foto ${i + 1} zu ${questionLabel}`" />
            <button type="button" class="btn btn-danger btn-sm" @click="removePhoto(p)">
              Löschen<span class="sr-only"> Foto {{ i + 1 }}</span>
            </button>
          </li>
        </ul>
        <label class="btn btn-sm upload" :class="{ disabled: busy }">
          + Foto aufnehmen / hochladen
          <input type="file" accept="image/*" capture="environment" multiple :disabled="busy" @change="onFiles" />
        </label>
        <p class="small muted" role="status" aria-live="polite">{{ status }}</p>
      </div>
    </div>
  </details>
</template>

<style scoped>
.evidence { margin-top: 0.75rem; border-top: 1px dashed var(--border); padding-top: 0.5rem; }
summary { list-style: none; width: fit-content; }
summary::-webkit-details-marker { display: none; }
.evidence[open] summary { background: var(--primary-soft); }
.body { display: grid; gap: 1rem; padding: 0.5rem 0 0.25rem; }
.measure { border: 0; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
.measure legend { margin-bottom: 0.3rem; }
.mrow { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; align-items: end; }
.mrow label { font-weight: 500; font-size: 0.85rem; }
.measure > .btn, .upload { justify-self: start; }
.photos { display: grid; gap: 0.5rem; }
.plist { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.75rem; }
.plist li { display: grid; gap: 0.3rem; justify-items: start; }
.upload { position: relative; width: fit-content; }
.upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.upload:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
@media (max-width: 600px) { .mrow { grid-template-columns: 1fr 1fr; } .mrow .field:first-child { grid-column: 1 / -1; } }
</style>
