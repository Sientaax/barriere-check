<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRouter, type RouteLocationRaw } from 'vue-router'
import type { TrailDef } from '../../types'
import { CMS_API } from '../../config/cms'
import { CmsError, getToken, loadContent, logout, saveContent } from '../../lib/cmsApi'
import { validateTrails, type ValidationError } from '../../lib/trailSchema'
import { uid } from '../../lib/id'
import CmsLogin from './CmsLogin.vue'
import CmsTrailEditor from './CmsTrailEditor.vue'

const router = useRouter()

const loggedIn = ref(!!getToken())
const loginNotice = ref('')
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const trails = ref<TrailDef[] | null>(null)
const original = ref('')
const sha = ref('')
const errors = ref<ValidationError[]>([])
const saveMessage = ref('')
const saveError = ref('')
const status = ref('')
const openIds = ref<Set<string>>(new Set())
const pendingLeave = ref<RouteLocationRaw | null>(null)

const dirty = computed(() => trails.value !== null && JSON.stringify(trails.value) !== original.value)
const errorMap = computed(() => Object.fromEntries(errors.value.map((e) => [e.path, e.short])))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await loadContent()
    trails.value = data.trails
    original.value = JSON.stringify(data.trails)
    sha.value = data.sha
    errors.value = []
  } catch (e) {
    handleAuthError(e)
    loadError.value = e instanceof CmsError ? e.message : 'Inhalte konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

function handleAuthError(e: unknown) {
  if (e instanceof CmsError && e.status === 401) {
    loggedIn.value = false
    loginNotice.value = 'Ihre Sitzung ist abgelaufen. Bitte erneut anmelden – Ihre Änderungen bleiben erhalten.'
  }
}

function onLoggedIn() {
  loggedIn.value = true
  loginNotice.value = ''
  if (!trails.value) load()
}

async function addTrail() {
  if (!trails.value) return
  const t: TrailDef = {
    id: uid(),
    name: '',
    location: '',
    lengthKm: null,
    topic: '',
    subject: '',
    description: '',
    sections: [{ id: uid(), name: 'Abschnitt 1', lengthM: null, startDesc: '', endDesc: '', difficulty: 'leicht', notes: '' }],
  }
  trails.value.push(t)
  openIds.value.add(t.id)
  status.value = 'Neuer Lehrpfad angelegt.'
  await nextTick()
  document.getElementById(`cms-${trails.value.length - 1}-name`)?.focus()
}

function removeTrail(id: string) {
  if (!trails.value) return
  const t = trails.value.find((x) => x.id === id)
  trails.value = trails.value.filter((x) => x.id !== id)
  status.value = `Lehrpfad „${t?.name || 'ohne Namen'}“ gelöscht (wird erst mit „Speichern“ übernommen).`
}

function toggle(id: string, e: Event) {
  const open = (e.target as HTMLDetailsElement).open
  if (open) openIds.value.add(id)
  else openIds.value.delete(id)
}

async function save() {
  if (!trails.value) return
  saveMessage.value = ''
  saveError.value = ''
  const result = validateTrails(trails.value)
  errors.value = result.errors
  if (!result.ok) {
    // Lehrpfade mit Fehlern aufklappen und zur Fehlerliste springen
    for (const err of result.errors) {
      const i = Number(err.path.split('.')[0])
      if (Number.isInteger(i) && trails.value[i]) openIds.value.add(trails.value[i].id)
    }
    await nextTick()
    document.getElementById('cms-errors')?.focus()
    return
  }
  saving.value = true
  try {
    const res = await saveContent(trails.value, sha.value)
    sha.value = res.sha
    original.value = JSON.stringify(trails.value)
    saveMessage.value = 'Gespeichert. Die öffentliche Seite ist in ca. 1–2 Minuten aktualisiert.'
  } catch (e) {
    handleAuthError(e)
    if (e instanceof CmsError && e.errors.length) errors.value = e.errors
    saveError.value = e instanceof CmsError ? e.message : 'Speichern fehlgeschlagen.'
  } finally {
    saving.value = false
  }
}

function discard() {
  if (!original.value) return
  trails.value = JSON.parse(original.value)
  errors.value = []
  saveMessage.value = ''
  status.value = 'Änderungen verworfen.'
}

function doLogout() {
  logout()
  loggedIn.value = false
  trails.value = null
  original.value = ''
  loginNotice.value = 'Sie wurden abgemeldet.'
}

// Ungespeicherte Änderungen: Verlassen innerhalb der App inline bestätigen lassen
onBeforeRouteLeave((to) => {
  if (!dirty.value || pendingLeave.value === to.fullPath) return true
  pendingLeave.value = to.fullPath
  nextTick(() => document.getElementById('cms-leave')?.focus())
  return false
})
function leaveAnyway() {
  const target = pendingLeave.value
  if (target) router.push(target)
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (dirty.value) e.preventDefault()
}
onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  if (CMS_API && loggedIn.value) load()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <div v-if="!CMS_API" class="card">
    <h1>CMS ist nicht eingerichtet</h1>
    <p>
      Für diese Installation ist keine CMS-Adresse hinterlegt (<code>VITE_CMS_API</code>). Die Einrichtung ist in
      <code>cms-worker/README.md</code> beschrieben.
    </p>
  </div>

  <CmsLogin v-else-if="!loggedIn" :notice="loginNotice" @success="onLoggedIn" />

  <section v-else aria-labelledby="cms-h">
    <div class="card page-head">
      <div>
        <h1 id="cms-h">Redaktion: Lehrpfade &amp; Wegabschnitte</h1>
        <p class="muted">
          Hier gepflegte Lehrpfade erscheinen nach dem Speichern für alle Nutzenden auf der Startseite.
        </p>
      </div>
      <button type="button" class="btn btn-ghost" @click="doLogout">Abmelden</button>
    </div>

    <p class="sr-only" role="status" aria-live="polite">{{ status }}</p>

    <p v-if="loading" aria-live="polite">Inhalte werden geladen …</p>
    <div v-else-if="loadError" class="alert alert-danger" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="btn btn-sm" @click="load">Erneut versuchen</button>
    </div>

    <template v-else-if="trails">
      <div v-if="pendingLeave" class="alert alert-warn">
        <p id="cms-leave" tabindex="-1"><strong>Es gibt ungespeicherte Änderungen.</strong> Seite trotzdem verlassen?</p>
        <div class="btn-row">
          <button type="button" class="btn btn-sm btn-danger" @click="leaveAnyway">Verlassen, Änderungen verwerfen</button>
          <button type="button" class="btn btn-sm" @click="pendingLeave = null">Hier bleiben</button>
        </div>
      </div>

      <div v-if="errors.length" id="cms-errors" class="alert alert-danger" tabindex="-1" role="alert">
        <p><strong>Bitte korrigieren ({{ errors.length }}):</strong></p>
        <ul>
          <li v-for="e in errors" :key="e.path + e.message">{{ e.message }}</li>
        </ul>
      </div>

      <p v-if="!trails.length" class="card muted">Noch keine Lehrpfade angelegt.</p>
      <ul class="trails">
        <li v-for="(t, i) in trails" :key="t.id" class="card">
          <details :open="openIds.has(t.id)" @toggle="toggle(t.id, $event)">
            <summary>
              <span class="tname">{{ t.name || 'Neuer Lehrpfad (ohne Namen)' }}</span>
              <span class="small muted">{{ t.sections.length }} Abschnitt(e){{ t.location ? ` · ${t.location}` : '' }}</span>
            </summary>
            <CmsTrailEditor :trail="t" :index="i" :errors="errorMap" @remove="removeTrail(t.id)" @status="status = $event" />
          </details>
        </li>
      </ul>
      <button type="button" class="btn" @click="addTrail">+ Lehrpfad anlegen</button>

      <div class="savebar" :class="{ dirty }">
        <p class="small" aria-live="polite">
          <strong v-if="dirty">Ungespeicherte Änderungen</strong>
          <span v-else-if="saveMessage">{{ saveMessage }}</span>
          <span v-else class="muted">Alle Änderungen gespeichert.</span>
        </p>
        <p v-if="saveError" class="alert alert-danger small" role="alert">
          {{ saveError }}
          <button v-if="saveError.includes('neu laden')" type="button" class="btn btn-sm" @click="load">Neu laden</button>
        </p>
        <div class="btn-row">
          <button type="button" class="btn btn-ghost" :disabled="!dirty || saving" @click="discard">Änderungen verwerfen</button>
          <button type="button" class="btn btn-primary" :disabled="!dirty || saving" @click="save">
            {{ saving ? 'Wird gespeichert …' : 'Speichern' }}
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.trails { list-style: none; padding: 0; margin: 0 0 1rem; }
summary { cursor: pointer; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 0.75rem; min-height: 44px; padding: 0.2rem 0; }
.tname { font-weight: 700; font-size: 1.15rem; }
#cms-errors:focus, #cms-leave:focus { outline: none; }
#cms-errors ul { margin: 0.25rem 0 0; padding-left: 1.2rem; }
.savebar {
  position: sticky; bottom: 0; z-index: 10; margin-top: 1.5rem;
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.6rem 1rem;
  padding: 0.75rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: 0 -4px 16px rgb(0 0 0 / 0.08);
}
.savebar.dirty { border-color: var(--primary); border-width: 2px; }
.savebar p { margin: 0; }
code { background: var(--surface-2); padding: 0 0.3rem; border-radius: 4px; }
</style>
