<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTrails } from '../stores/trails'
import { findSection } from '../config/trails'
import { buildExport, downloadFile, slug, type ExportFile } from '../lib/storage'
import { printWhenImagesReady, tryPrint } from '../lib/print'
import ReportDocument from './ReportDocument.vue'

const props = defineProps<{
  sectionId: string
  /** true: PDF aus der aktuellen Seite drucken (Bericht); sonst den Bericht unsichtbar einblenden und ihn drucken */
  printHere?: boolean
  small?: boolean
}>()

const store = useTrails()
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
  // Bericht für den Druck außerhalb der Berichtsseite: schon beim Öffnen des Menüs rendern,
  // damit der Druck noch synchron im Klick starten kann (Safari)
  if (!props.printHere) {
    if (o) showReport.value = true
    else if (!pdfPending) showReport.value = false
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('afterprint', hideReport)
})

const showReport = ref(false)
let pdfPending = false
function hideReport() {
  window.removeEventListener('afterprint', hideReport)
  showReport.value = false
}

// Safari fokussiert Buttons beim Anklicken nicht, sondern schiebt den Fokus auf <main tabindex="-1">.
// Ein Klick ins Menü darf es deshalb nicht über focusout schließen (sonst kommt der Klick nie an).
let pointerInside = false
const resetPointer = () => (pointerInside = false)
const onPointerInside = () => (pointerInside = true)
onMounted(() => window.addEventListener('pointerup', resetPointer, true))
onBeforeUnmount(() => window.removeEventListener('pointerup', resetPointer, true))

// Fokus verlässt das Menü per Tab → schließen
function onFocusOut(e: FocusEvent) {
  if (pointerInside) return
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

// Export schon beim Öffnen des Menüs vorbereiten: Safari erlaubt den Download nur direkt im Klick,
// nicht erst nach dem (asynchronen) Lesen der Fotos aus IndexedDB.
let prepared: { data: ExportFile | null; promise: Promise<ExportFile> } | null = null
function prepareExport() {
  const entry: { data: ExportFile | null; promise: Promise<ExportFile> } = {
    data: null,
    promise: buildExport([store.peek(props.sectionId)]),
  }
  entry.promise.then((d) => (entry.data = d)).catch(() => undefined)
  prepared = entry
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    prepareExport()
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
  // Normalfall: Daten liegen bereits vor → Download synchron im Klick (Safari)
  const data = prepared?.data ?? (await (prepared?.promise ?? buildExport([store.peek(props.sectionId)])))
  prepared = null
  downloadFile(`barriere-check-${slug(name)}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2))
  status.value = 'JSON-Datei wurde heruntergeladen.'
  close()
}

async function savePdf() {
  if (props.printHere) {
    open.value = false
    printWhenImagesReady()
    return
  }
  // Ohne Seitenwechsel: den (unsichtbar eingeblendeten) Bericht drucken, danach wieder entfernen
  pdfPending = true
  open.value = false
  window.addEventListener('afterprint', hideReport)
  const opened = await tryPrint()
  pdfPending = false
  if (!opened) {
    hideReport()
    status.value = 'Der Druckdialog konnte nicht geöffnet werden. Bitte „Als PDF speichern“ erneut wählen.'
  }
  toggleBtn.value?.focus()
}
</script>

<template>
  <div ref="root" class="save" @keydown.esc="open && close()" @focusout="onFocusOut" @pointerdown="onPointerInside">
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
    <Teleport v-if="showReport" to="body">
      <div class="print-standalone">
        <ReportDocument :section-id="sectionId" :heading-id="`report-${sectionId}`" />
      </div>
    </Teleport>
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
