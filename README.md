# Barriere-Check Lehrpfade

Webanwendung zur strukturierten Einschätzung der **Barrierefreiheit und Inklusion von Lehrpfaden**:
Fragebogen mit 28 Kriterien in 7 gewichteten Kategorien, Nachweise (Fotos, Messwerte, Kommentare),
automatische Auswertung, Problemübersicht, Nutzergruppen-Profile und druckbarer Ergebnisbericht.

Lehrpfade und ihre Wegabschnitte werden von der Redaktion über das **CMS** (`…/#/cms`, Login mit gemeinsamem
Benutzernamen/Passwort) gepflegt und liegen in `src/content/trails.json`. Nutzende können sie nicht anlegen oder
löschen. Bewertet wird **pro Abschnitt**.

**CMS-Einrichtung (einmalig):** siehe [`cms-worker/README.md`](cms-worker/README.md). Ein kleiner kostenloser
Cloudflare Worker prüft den Login, hält den GitHub-Schlüssel geheim und speichert Änderungen als Commit –
GitHub Pages veröffentlicht sie danach automatisch (ca. 1–2 Minuten).

Alle Bewertungen bleiben **lokal im Browser** (IndexedDB). Sicherung und Weitergabe erfolgen über „Speichern“
(JSON oder PDF) bzw. den JSON-Import auf der Startseite. Vor dem Import zeigt ein Dialog, welcher Abschnitt
betroffen ist und ob dessen vorhandene Bewertung überschrieben wird.

## Ablauf

Startseite: Kacheln aller Streckenabschnitte / Wanderrouten → Abschnitt wählen, dann

1. Fragebogen bearbeiten – Kategorien A–G, Skala 0–4, N/A, nicht beurteilbar
2. Nachweise ergänzen – Fotos, Messwerte, Kommentare
3. Auswertung – Kategorie-, Nutzergruppen- und Gesamtergebnis
4. Probleme anzeigen – kritische Barrieren und nicht beurteilbare Kriterien
5. Ergebnisbericht – Prozentwerte, Einzelbewertungen, priorisierte Handlungsempfehlungen (Speichern als JSON / PDF)

## Bewertungslogik

`P = Σ(G · B / 4) / ΣG · 100`

| Kategorie | Gewicht |
|---|---|
| A. Erreichbarkeit und Zugang | 15 % |
| B. Wegequalität und Bewegungsflächen | 25 % |
| C. Orientierung und Sicherheit | 15 % |
| D. Information und Kommunikation | 20 % |
| E. Sensorische Zugänglichkeit | 10 % |
| F. Rastmöglichkeiten und Infrastruktur | 10 % |
| G. Partizipation und Nutzerorientierung | 5 % |

- Fragengewicht G = Kategoriegewicht ÷ Anzahl Fragen der Kategorie (über `weightOverride` je Frage änderbar)
- **Nicht zutreffend** → Gewicht wird herausgenommen
- **Nicht beurteilbar** → bleibt in der Berechnung, Ergebnis als Spannweite (B = 0 … B = 4), gekennzeichnet als unvollständig
- Mehrere Abschnitte → längengewichteter Mittelwert (gleichgewichtet, wenn Längen fehlen)
- Einstufung: 0–20 sehr gering · 21–40 gering · 41–60 mittel · 61–80 hoch · 81–100 sehr hoch

> Die Einstufung ist ein eigener Projektvorschlag und keine anerkannte Zertifizierung oder normierte Bewertung.
> Die Grenzwerte sollten methodisch begründet und durch praktische Erprobung überprüft werden.

## Anpassen

- Lehrpfade und Abschnitte: über das CMS (Daten: `src/content/trails.json`; Regeln in `src/lib/trailSchema.ts`:
  jeder Lehrpfad ≥ 1 Abschnitt, IDs eindeutig – IDs werden automatisch vergeben und dürfen sich nicht ändern,
  weil Bewertungen darüber zugeordnet werden)
- Kriterien, Gewichte, Nutzergruppen, Prüfhinweise und Empfehlungstexte: `src/config/criteria.ts`
- Skala, Einstufungsgrenzen, Hinweistext: `src/config/rating.ts`
- Berechnung: `src/lib/scoring.ts` (Tests in `tests/scoring.spec.ts`)

## Entwicklung

```bash
npm install
npm run dev        # lokaler Entwicklungsserver
npm test           # Tests der Bewertungslogik
npm run typecheck
npm run build      # statischer Build nach dist/
```

Technik: Vue 3, Vite, TypeScript, Pinia, Vue Router (Hash-Modus), idb-keyval, Vitest.

## Hosting (GitHub Pages, kostenlos)

1. Repository auf GitHub anlegen und Code auf den Branch `main` pushen.
2. Unter **Settings → Pages → Build and deployment → Source** „GitHub Actions“ wählen.
3. Jeder Push auf `main` testet, baut und veröffentlicht die Seite automatisch
   (`.github/workflows/deploy.yml`) unter `https://sientaax.github.io/barriere-check/#/`.
