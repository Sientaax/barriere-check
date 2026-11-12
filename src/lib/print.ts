const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Öffnet den Druckdialog erst, wenn alle Fotos geladen und dekodiert sind
 * (sonst druckt der Browser nur Platzhalter-Symbole).
 */
export async function printWhenImagesReady(timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  // Fotos, die noch aus IndexedDB gelesen werden (PhotoThumb setzt data-photo-loading)
  while (document.querySelector('[data-photo-loading]') && Date.now() < deadline) await sleep(50)
  const images = Array.from(document.images).filter((img) => img.getAttribute('src'))
  await Promise.race([
    Promise.all(images.map((img) => img.decode().catch(() => undefined))),
    sleep(Math.max(0, deadline - Date.now())),
  ])
  window.print()
}
