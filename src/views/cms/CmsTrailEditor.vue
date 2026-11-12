<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { SectionDef, TrailDef } from '../../types'
import { DIFFICULTIES } from '../../config/trails'
import { uid } from '../../lib/id'

const props = defineProps<{
  trail: TrailDef
  index: number
  /** Fehlermeldungen je Feldpfad (z. B. `0.sections.1.name`) */
  errors: Record<string, string>
}>()
const emit = defineEmits<{ remove: []; status: [msg: string] }>()

const confirmTrail = ref(false)
const confirmSection = ref<string | null>(null)

const p = (field: string) => `${props.index}.${field}`
const sp = (j: number, field: string) => `${props.index}.sections.${j}.${field}`
const fid = (path: string) => `cms-${path.replace(/\./g, '-')}`

function num(v: string): number | null {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

async function addSection() {
  const s: SectionDef = {
    id: uid(),
    name: `Abschnitt ${props.trail.sections.length + 1}`,
    lengthM: null,
    startDesc: '',
    endDesc: '',
    difficulty: 'leicht',
    notes: '',
  }
  props.trail.sections.push(s)
  emit('status', `${s.name} hinzugefügt.`)
  await nextTick()
  const el = document.getElementById(fid(sp(props.trail.sections.length - 1, 'name'))) as HTMLInputElement | null
  el?.focus()
  el?.select()
}

function move(j: number, d: -1 | 1) {
  const arr = props.trail.sections
  const k = j + d
  if (k < 0 || k >= arr.length) return
  ;[arr[j], arr[k]] = [arr[k], arr[j]]
  emit('status', `${arr[k].name || 'Abschnitt'} nach Position ${k + 1} verschoben.`)
}

function removeSection(id: string) {
  if (props.trail.sections.length <= 1) return
  const s = props.trail.sections.find((x) => x.id === id)
  props.trail.sections = props.trail.sections.filter((x) => x.id !== id) as TrailDef['sections']
  confirmSection.value = null
  emit('status', `${s?.name || 'Abschnitt'} gelöscht.`)
}
</script>

<template>
  <div class="editor">
    <h3 class="h-sub">Angaben zum Lehrpfad</h3>
    <div class="form-grid">
      <div class="field full">
        <label :for="fid(p('name'))">Name des Lehrpfads <span aria-hidden="true">*</span></label>
        <input
          :id="fid(p('name'))"
          v-model="trail.name"
          type="text"
          required
          aria-required="true"
          :aria-invalid="!!errors[p('name')]"
          :aria-describedby="errors[p('name')] ? `${fid(p('name'))}-err` : undefined"
        />
        <p v-if="errors[p('name')]" :id="`${fid(p('name'))}-err`" class="field-error">{{ errors[p('name')] }}</p>
      </div>
      <div class="field">
        <label :for="fid(p('location'))">Lage / Ort</label>
        <input :id="fid(p('location'))" v-model="trail.location" type="text" />
      </div>
      <div class="field">
        <label :for="fid(p('lengthKm'))">Gesamtlänge (km)</label>
        <input
          :id="fid(p('lengthKm'))"
          type="text"
          inputmode="decimal"
          :value="trail.lengthKm ?? ''"
          :aria-invalid="!!errors[p('lengthKm')]"
          @input="trail.lengthKm = num(($event.target as HTMLInputElement).value)"
        />
        <p v-if="errors[p('lengthKm')]" class="field-error">{{ errors[p('lengthKm')] }}</p>
      </div>
      <div class="field">
        <label :for="fid(p('topic'))">Thema / Schwerpunkt</label>
        <input :id="fid(p('topic'))" v-model="trail.topic" type="text" />
      </div>
      <div class="field">
        <label :for="fid(p('subject'))">Studiumsfach</label>
        <input :id="fid(p('subject'))" v-model="trail.subject" type="text" />
      </div>
      <div class="field full">
        <label :for="fid(p('description'))">Allgemeine Informationen</label>
        <textarea :id="fid(p('description'))" v-model="trail.description" rows="4"></textarea>
      </div>
    </div>

    <h3 class="h-sub">Wegabschnitte ({{ trail.sections.length }})</h3>
    <p v-if="errors[p('sections')]" class="field-error">{{ errors[p('sections')] }}</p>
    <ol class="sections">
      <li v-for="(s, j) in trail.sections" :key="s.id" class="section">
        <h4 class="h-sec">Abschnitt {{ j + 1 }}<template v-if="s.name">: {{ s.name }}</template></h4>
        <div class="form-grid">
          <div class="field">
            <label :for="fid(sp(j, 'name'))">Name <span aria-hidden="true">*</span></label>
            <input
              :id="fid(sp(j, 'name'))"
              v-model="s.name"
              type="text"
              required
              aria-required="true"
              :aria-invalid="!!errors[sp(j, 'name')]"
              :aria-describedby="errors[sp(j, 'name')] ? `${fid(sp(j, 'name'))}-err` : undefined"
            />
            <p v-if="errors[sp(j, 'name')]" :id="`${fid(sp(j, 'name'))}-err`" class="field-error">{{ errors[sp(j, 'name')] }}</p>
          </div>
          <div class="field">
            <label :for="fid(sp(j, 'lengthM'))">Länge (m)</label>
            <input
              :id="fid(sp(j, 'lengthM'))"
              type="text"
              inputmode="decimal"
              :value="s.lengthM ?? ''"
              :aria-invalid="!!errors[sp(j, 'lengthM')]"
              @input="s.lengthM = num(($event.target as HTMLInputElement).value)"
            />
            <p v-if="errors[sp(j, 'lengthM')]" class="field-error">{{ errors[sp(j, 'lengthM')] }}</p>
          </div>
          <div class="field">
            <label :for="fid(sp(j, 'startDesc'))">Beginn</label>
            <input :id="fid(sp(j, 'startDesc'))" v-model="s.startDesc" type="text" placeholder="z. B. Parkplatz" />
          </div>
          <div class="field">
            <label :for="fid(sp(j, 'endDesc'))">Ende</label>
            <input :id="fid(sp(j, 'endDesc'))" v-model="s.endDesc" type="text" placeholder="z. B. Aussichtspunkt" />
          </div>
          <div class="field">
            <label :for="fid(sp(j, 'difficulty'))">Schwierigkeitsstufe</label>
            <select :id="fid(sp(j, 'difficulty'))" v-model="s.difficulty">
              <option v-for="d in DIFFICULTIES" :key="d.id" :value="d.id">{{ d.label }}</option>
            </select>
          </div>
          <div class="field full">
            <label :for="fid(sp(j, 'notes'))">Besonderheiten</label>
            <textarea :id="fid(sp(j, 'notes'))" v-model="s.notes" rows="3"></textarea>
          </div>
        </div>
        <div class="btn-row actions">
          <button type="button" class="btn btn-sm" :disabled="j === 0" @click="move(j, -1)">
            ↑ Nach oben<span class="sr-only">: Abschnitt {{ j + 1 }}</span>
          </button>
          <button type="button" class="btn btn-sm" :disabled="j === trail.sections.length - 1" @click="move(j, 1)">
            ↓ Nach unten<span class="sr-only">: Abschnitt {{ j + 1 }}</span>
          </button>
          <template v-if="confirmSection === s.id">
            <strong class="small">Abschnitt löschen? Vorhandene Bewertungen dazu sind danach nicht mehr erreichbar.</strong>
            <button type="button" class="btn btn-sm btn-danger" @click="removeSection(s.id)">Ja, löschen</button>
            <button type="button" class="btn btn-sm btn-ghost" @click="confirmSection = null">Abbrechen</button>
          </template>
          <button
            v-else
            type="button"
            class="btn btn-sm btn-danger"
            :disabled="trail.sections.length <= 1"
            :aria-describedby="trail.sections.length <= 1 ? `${fid(p('sections'))}-min` : undefined"
            @click="confirmSection = s.id"
          >
            Abschnitt löschen<span class="sr-only"> {{ j + 1 }}</span>
          </button>
          <span v-if="trail.sections.length <= 1" :id="`${fid(p('sections'))}-min`" class="small muted">
            Ein Lehrpfad braucht mindestens einen Abschnitt.
          </span>
        </div>
      </li>
    </ol>
    <button type="button" class="btn" @click="addSection">+ Abschnitt hinzufügen</button>

    <div class="btn-row danger-zone">
      <template v-if="confirmTrail">
        <strong class="small">
          Lehrpfad „{{ trail.name || 'ohne Namen' }}“ mit allen Abschnitten löschen? Vorhandene Bewertungen sind danach
          nicht mehr erreichbar.
        </strong>
        <button type="button" class="btn btn-sm btn-danger" @click="emit('remove')">Ja, Lehrpfad löschen</button>
        <button type="button" class="btn btn-sm btn-ghost" @click="confirmTrail = false">Abbrechen</button>
      </template>
      <button v-else type="button" class="btn btn-sm btn-danger" @click="confirmTrail = true">
        Lehrpfad löschen<span class="sr-only">: {{ trail.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.h-sub { font-size: 1.05rem; margin: 1.25rem 0 0.75rem; }
.h-sub:first-child { margin-top: 0.5rem; }
.sections { list-style: none; padding: 0; margin: 0 0 0.75rem; display: grid; gap: 0.75rem; }
.section { border: 1px solid var(--border); border-radius: 8px; padding: 1rem; background: var(--bg); }
.h-sec { font-size: 1rem; margin: 0 0 0.75rem; }
.actions { margin-top: 0.75rem; }
.danger-zone { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px dashed var(--border); }
.field-error { color: var(--danger); font-size: 0.9rem; font-weight: 600; margin: 0.15rem 0 0; }
[aria-invalid='true'] { border-color: var(--danger) !important; }
</style>
