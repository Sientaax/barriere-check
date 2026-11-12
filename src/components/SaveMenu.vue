<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTrails } from '../stores/trails'
import { findSection } from '../config/trails'
import { buildExport, downloadFile, slug } from '../lib/storage'
import { printWhenImagesReady } from '../lib/print'

const props = defineProps<{
  sectionId: string
  /** true: PDF direkt aus der aktuellen Seite drucken (Bericht); sonst zum Bericht wechseln und dort drucken */
  printHere?: boolean
  small?: boolean
}>()

const store = useTrails()
const router = useRouter()
const open = ref(false)
const status = ref('')
const firstOption = ref<HTMLButtonElement | null>(null)
const toggleBtn = ref<HTMLButtonElement | null>(null)
const menuId = `save-${props.sectionId}`
const root = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)

// Klick außerhalb schließt das Menü (ohne Fokus zu verschieben)
function onPointerDown(e: PointerEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
watch(open, (o) => {
  if (o) document.addEventListener('pointerdown', onPointerDown)
  else document.removeEventListener('pointerdown', onPointerDown)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))

// Fokus verlässt das Menü per Tab → schließen
function onFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (next && root.value && !root.value.contains(next)) open.value = false
}

// Pfeiltasten zwischen den Optionen
function onMenuKey(e: KeyboardEvent) {
  const items = Array.from(menu.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
  const i = items.indexOf(document.activeElement as HTMLButtonElement)
  let j = -1
  if (e.key === 'ArrowDown') j = (i + 1) % items.length
  else if (e.key === 'ArrowUp') j = (i - 1 + items.length) % items.length
  else if (e.key === 'Home') j = 0
  else if (e.key === 'End') j = items.length - 1
  if (j < 0) return
  e.preventDefault()
  items[j]?.focus()
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    status.value = ''
    await nextTick()
    firstOption.value?.focus()
  }
}

function close() {
  open.value = false
  toggleBtn.value?.focus()
}

async function saveJson() {
  const ref = findSection(props.sectionId)
  const name = ref ? `${ref.trail.name}-${ref.section.name}` : props.sectionId
  const data = await buildExport([store.peek(props.sectionId)])
  downloadFile(`barriere-check-${slug(name)}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2))
  status.value = 'JSON-Datei wurde heruntergeladen.'
  close()
}

function savePdf() {
  open.value = false
  if (props.printHere) printWhenImagesReady()
  else router.push({ path: `/abschnitt/${props.sectionId}/bericht`, query: { print: '1' } })
}
</script>

<template>
  <div ref="root" class="save" @keydown.esc="open && close()" @focusout="onFocusOut">
    <button
      ref="toggleBtn"
      type="button"
      class="btn btn-primary"
      :class="{ 'btn-sm': small }"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="menuId"
      @click="toggle"
    >
      Speichern <span class="caret" :class="{ up: open }" aria-hidden="true">▾</span>
    </button>
    <div v-show="open" :id="menuId" ref="menu" class="menu" role="menu" aria-label="Speichern als" @keydown="onMenuKey">
      <button ref="firstOption" type="button" role="menuitem" class="item" @click="saveJson">Als JSON speichern</button>
      <button type="button" role="menuitem" class="item" @click="savePdf">Als PDF speichern</button>
    </div>
    <span class="sr-only" role="status" aria-live="polite">{{ status }}</span>
  </div>
</template>

<style scoped>
.save { position: relative; display: inline-block; }
.caret { display: inline-block; transition: transform 0.15s; }
.caret.up { transform: rotate(180deg); }
.menu {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 20; min-width: 100%;
  display: flex; flex-direction: column; padding: 0.3rem;
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.15);
}
.item {
  font: inherit; font-weight: 600; font-size: 0.95rem; color: var(--text); text-align: left; white-space: nowrap;
  background: none; border: 0; border-radius: 6px; padding: 0.55rem 0.75rem; min-height: 40px; cursor: pointer;
}
.item:hover, .item:focus-visible { background: var(--primary-soft); }
@media print { .menu { display: none !important; } }
</style>
