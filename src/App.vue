<script setup lang="ts">
import { onMounted } from 'vue'
import { useTrails } from './stores/trails'

const store = useTrails()
onMounted(() => store.load())
</script>

<template>
  <a href="#main" class="skip-link" @click.prevent="($refs.main as HTMLElement)?.focus()">Zum Inhalt springen</a>
  <header class="site-header">
    <div class="container">
      <RouterLink to="/" class="brand">
        <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#fff" fill-opacity=".16"/><path d="M6 24c4-8 8-12 10-12s6 4 10 12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="8" r="2.5" fill="#fff"/></svg>
        Barriere-Check
      </RouterLink>
      <nav aria-label="Hauptnavigation">
        <RouterLink to="/">Streckenabschnitte / Wanderrouten</RouterLink>
        <RouterLink to="/methodik">Methodik</RouterLink>
      </nav>
    </div>
  </header>

  <main id="main" ref="main" tabindex="-1">
    <div class="container">
      <div v-if="store.saveError" class="alert alert-danger" role="alert">{{ store.saveError }}</div>
      <p v-if="!store.loaded" aria-live="polite">Daten werden geladen …</p>
      <RouterView v-else />
    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>
        Barriere-Check – Bewertungssystem zur Einschätzung von Barrierefreiheit und Inklusion.
        Alle Daten werden ausschließlich lokal in diesem Browser gespeichert.
      </p>
      <p><RouterLink to="/cms">Redaktion (CMS)</RouterLink></p>
    </div>
  </footer>
  <p class="print-footer" aria-hidden="true">OTH Regensburg</p>
</template>

<style>
main:focus { outline: none; }
</style>
