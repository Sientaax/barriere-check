<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CmsError, login } from '../../lib/cmsApi'

defineProps<{ notice?: string }>()
const emit = defineEmits<{ success: [] }>()

const username = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const userInput = ref<HTMLInputElement | null>(null)

onMounted(() => userInput.value?.focus())

async function submit() {
  error.value = ''
  if (!username.value.trim() || !password.value) {
    error.value = 'Bitte Benutzername und Passwort eingeben.'
    return
  }
  busy.value = true
  try {
    await login(username.value.trim(), password.value)
    password.value = ''
    emit('success')
  } catch (e) {
    error.value = e instanceof CmsError ? e.message : 'Anmeldung fehlgeschlagen.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="card login" aria-labelledby="login-h">
    <h1 id="login-h">Redaktion – Anmeldung</h1>
    <p class="muted">Im CMS werden Lehrpfade und Wegabschnitte angelegt und bearbeitet.</p>
    <p v-if="notice" class="alert alert-info">{{ notice }}</p>
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <form class="form" novalidate @submit.prevent="submit">
      <div class="field">
        <label for="cms-user">Benutzername</label>
        <input id="cms-user" ref="userInput" v-model="username" type="text" autocomplete="username" required />
      </div>
      <div class="field">
        <label for="cms-pass">Passwort</label>
        <input id="cms-pass" v-model="password" type="password" autocomplete="current-password" required />
      </div>
      <button type="submit" class="btn btn-primary" :disabled="busy">
        {{ busy ? 'Anmeldung läuft …' : 'Anmelden' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.login { max-width: 460px; margin: 1rem auto; }
.form { display: grid; gap: 1rem; }
.form .btn { justify-self: start; }
</style>
