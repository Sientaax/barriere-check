# Barriere-Check Lehrpfade

Webanwendung zur strukturierten Einschätzung der **Barrierefreiheit und Inklusion von Lehrpfaden**:
Fragebogen mit 28 Kriterien in 7 gewichteten Kategorien, Nachweise (Fotos, Messwerte, Kommentare),
automatische Auswertung, Problemübersicht, Nutzergruppen-Profile und druckbarer Ergebnisbericht.

Alle Daten bleiben **lokal im Browser** (IndexedDB). Sicherung und Weitergabe erfolgen über den JSON-Export/-Import.

## Ablauf

1. Lehrpfad anlegen – Name, Lage, Länge, allgemeine Informationen
2. Wegabschnitte festlegen
3. Fragebogen bearbeiten – Kategorien A–G, Skala 0–4, N/A, nicht beurteilbar
4. Nachweise ergänzen – Fotos, Messwerte, Kommentare
5. Auswertung – Kategorie-, Abschnitts-, Nutzergruppen- und Gesamtergebnisse
6. Probleme anzeigen – kritische Barrieren und nicht beurteilbare Kriterien
7. Ergebnisbericht – Prozentwerte, Einzelbewertungen, priorisierte Handlungsempfehlungen (Drucken / PDF)

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
   (`.github/workflows/deploy.yml`) unter `https://<benutzer>.github.io/<repo>/`.
