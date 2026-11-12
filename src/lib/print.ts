const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Alle Fotos geladen? (PhotoThumb setzt data-photo-loading, solange es aus IndexedDB liest) */
function imagesReady(): boolean {
  if (document.querySelector('[data-photo-loading]')) return false
  return Array.from(document.images)
    .filter((img) => img.getAttribute('src'))
    .every((img) => img.complete)
}

/**
 * Öffnet den Druckdialog erst, wenn alle Fotos geladen und dekodiert sind
 * (sonst druckt der Browser nur Platzhalter-Symbole).
 *
 * Safari öffnet den Druckdialog nur direkt nach einer Nutzeraktion (Klick). Sind die Fotos schon da,
 * wird deshalb sofort – noch synchron im Klick – gedruckt; gewartet wird nur, wenn es nötig ist.
 */
export async function printWhenImagesReady(timeoutMs = 8000): Promise<void> {
  if (imagesReady()) {
    window.print()
    return
  }
  const deadline = Date.now() + timeoutMs
  while (document.querySelector('[data-photo-loading]') && Date.now() < deadline) await sleep(50)
  const images = Array.from(document.images).filter((img) => img.getAttribute('src'))
  await Promise.race([
    Promise.all(images.map((img) => img.decode().catch(() => undefined))),
    sleep(Math.max(0, deadline - Date.now())),
  ])
  window.print()
}

/**
 * Wie printWhenImagesReady, meldet aber, ob der Druckdialog tatsächlich erschienen ist.
 * Safari blockiert window.print() ohne vorherigen Klick stillschweigend – dann liefert die Funktion false,
 * und die Oberfläche bietet stattdessen einen Button zum Drucken an.
 */
export async function tryPrint(): Promise<boolean> {
  let opened = false
  const onBefore = () => (opened = true)
  window.addEventListener('beforeprint', onBefore)
  try {
    await printWhenImagesReady()
    // Chrome/Firefox: print() blockiert bis zum Schließen; Safari kehrt sofort zurück → kurz warten
    if (!opened) await sleep(1000)
  } finally {
    window.removeEventListener('beforeprint', onBefore)
  }
  return opened
}
