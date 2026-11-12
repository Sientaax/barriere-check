<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { loadPhoto } from '../lib/storage'

const props = defineProps<{ id: string; alt: string }>()
const url = ref<string | null>(null)
const loading = ref(true)

watch(
  () => props.id,
  async (id) => {
    if (url.value) URL.revokeObjectURL(url.value)
    loading.value = true
    try {
      const blob = await loadPhoto(id)
      url.value = blob ? URL.createObjectURL(blob) : null
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => url.value && URL.revokeObjectURL(url.value))
</script>

<template>
  <a v-if="url" :href="url" target="_blank" rel="noopener" class="thumb">
    <!-- kein loading="lazy": sonst fehlen Fotos außerhalb des sichtbaren Bereichs im PDF -->
    <img :src="url" :alt="alt" />
    <span class="sr-only">(Foto in neuem Tab öffnen)</span>
  </a>
  <span v-else-if="loading" class="thumb missing" data-photo-loading>Foto wird geladen …</span>
  <span v-else class="thumb missing">Foto fehlt</span>
</template>

<style scoped>
.thumb { display: block; width: 110px; height: 82px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); background: var(--surface-2); }
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.missing { display: grid; place-items: center; font-size: 0.8rem; color: var(--muted); }
@media print { .thumb { width: 150px; height: 112px; } }
</style>
