# Barriere-Check

Webanwendung der **OTH Regensburg** zur strukturierten Einschätzung der **Barrierefreiheit und Inklusion von
Lehrpfaden**. Lehrpfade werden in Wegabschnitte unterteilt; jeder Abschnitt wird mit einem Fragebogen
(28 Kriterien in 7 Kategorien) bewertet, mit Fotos, Messwerten und Kommentaren belegt und automatisch ausgewertet –
differenziert nach den Bedürfnissen unterschiedlicher Nutzergruppen.

**Live:** <https://sientaax.github.io/barriere-check/#/> · **Redaktion (CMS):** <https://sientaax.github.io/barriere-check/#/cms>

---

## Inhalt

- [Für Bewertende](#für-bewertende)
- [Für die Redaktion (CMS)](#für-die-redaktion-cms)
- [Daten und Datenschutz](#daten-und-datenschutz)
- [Bewertungslogik](#bewertungslogik)
- [Architektur](#architektur)
- [Projektstruktur](#projektstruktur)
- [Entwicklung](#entwicklung)
- [Deployment](#deployment)
- [Anpassen](#anpassen)

---

## Für Bewertende

Die Startseite zeigt alle **Streckenabschnitte / Wanderrouten** als Kacheln (Abschnittsname, darüber klein der
Lehrpfad, Länge, Schwierigkeit, aktueller Stand). Ein Abschnitt wird in vier Schritten bearbeitet:

| Schritt | Inhalt |
|---|---|
| **1. Bewertung** | Fragebogen in den Kategorien A–G, Skala 0–4 sowie „nicht zutreffend“ und „nicht beurteilbar“. Unter „Prüfhinweise“ stehen Hinweise zur Beurteilung und die besonders betroffenen Nutzergruppen. Über „Nachweise hinzufügen“ lassen sich Kommentare, Messwerte und Fotos (auch direkt mit der Handykamera) ergänzen. |
| **2. Auswertung** | Gesamtergebnis, Ergebnisse je Kategorie und je Nutzergruppe mit Einstufung. |
| **3. Probleme** | Kritische Barrieren mit Handlungsempfehlung, nicht beurteilbare und offene Kriterien; filterbar nach Nutzergruppe. |
| **4. Bericht** | Druckoptimierter Ergebnisbericht mit Stammdaten, Ergebnissen, priorisierten Handlungsempfehlungen und Einzelbewertungen inkl. Fotos. |

Alles wird **automatisch gespeichert** – im Browser des jeweiligen Geräts.

### Speichern, Weitergeben, Importieren

- **Speichern → Als PDF speichern** (auf der Kachel oder im Bericht): öffnet den Druckdialog des Browsers mit dem
  Ergebnisbericht – auf der Startseite ohne Seitenwechsel; dort
  „Als PDF speichern“ wählen. Der Bericht trägt in der Fußzeile „OTH Regensburg“. Fotos werden vor dem Drucken
  vollständig geladen.
- **Speichern → Als JSON speichern**: sichert die komplette Bewertung eines Abschnitts inkl. Fotos als Datei –
  zur Sicherung oder um auf einem anderen Gerät weiterzuarbeiten.
- **Bewertung importieren (JSON)** auf der Startseite: Vor dem Import zeigt ein Dialog, welcher Abschnitt
  betroffen ist und ob eine vorhandene Bewertung **überschrieben** wird. Erst nach Bestätigung wird etwas geändert.

> **Wichtig:** Bewertungen liegen nur im Browser des Geräts. Browserdaten löschen, privater Modus oder ein anderes
> Gerät bedeuten: Die Bewertung ist dort nicht vorhanden. Regelmäßig als JSON sichern.

---

## Für die Redaktion (CMS)

Lehrpfade und Wegabschnitte werden **ausschließlich über das CMS** gepflegt; Bewertende können sie nicht anlegen
oder löschen.

**Zugang:** Link „Redaktion (CMS)“ im Footer der App bzw. `…/#/cms`. Anmeldung mit dem gemeinsamen
Benutzernamen und Passwort (vergibt die Projektleitung). Die Anmeldung gilt bis zum Schließen des Tabs,
höchstens 8 Stunden.

**Lehrpfad** – Name\*, Lage / Ort, Gesamtlänge (km), Thema / Schwerpunkt, Studiumsfach, Allgemeine Informationen
**Wegabschnitt** – Name\*, Länge (m), Beginn, Ende, Schwierigkeitsstufe (leicht / mittel / schwer), Besonderheiten

- Jeder Lehrpfad hat **mindestens einen Abschnitt** (der letzte Abschnitt kann nicht gelöscht werden).
- Abschnitte lassen sich hinzufügen, verschieben (↑/↓) und löschen; Löschen wird vorher bestätigt.
- **Speichern** prüft die Eingaben (Fehler erscheinen am Feld und als Liste oben). Danach ist die öffentliche
  Seite in **ca. 1–2 Minuten** aktualisiert.
- Haben zwei Personen gleichzeitig bearbeitet, wird nichts überschrieben: Es erscheint „bitte neu laden“.
- **Umbenennen ist unproblematisch** – Bewertungen hängen an einer intern vergebenen ID, nicht am Namen.
  **Löschen** eines Abschnitts macht vorhandene Bewertungen dazu dagegen unerreichbar.
- Jede Speicherung ist ein Commit „CMS: Lehrpfade aktualisiert“ im Repository und kann dort bei Bedarf per
  *Revert* rückgängig gemacht werden.

Betrieb des CMS (Passwort ändern, Token erneuern, Fehlerbehebung): siehe [`cms-worker/README.md`](cms-worker/README.md).

---

## Daten und Datenschutz

| Daten | Speicherort |
|---|---|
| Lehrpfade und Abschnitte | Öffentlich im Repository (`src/content/trails.json`), Teil der veröffentlichten Seite |
| Bewertungen, Kommentare, Messwerte, Fotos | Nur lokal im Browser (IndexedDB) – werden **nicht** an einen Server übertragen |
| CMS-Zugangsdaten, GitHub-Token | Nur als Geheimnisse im Cloudflare Worker |

Die App selbst hat kein Backend und setzt keine Tracking-Cookies. Fotos werden vor dem Speichern verkleinert
(max. 1600 px, JPEG).

---

## Bewertungslogik

`P = Σ(G · B / 4) / ΣG · 100` – P = Ergebnis in %, G = Gewicht der Frage, B = Bewertung 0–4

| Kategorie | Gewicht |
|---|---|
| A. Erreichbarkeit und Zugang | 15 % |
| B. Wegequalität und Bewegungsflächen | 25 % |
| C. Orientierung und Sicherheit | 15 % |
| D. Information und Kommunikation | 20 % |
| E. Sensorische Zugänglichkeit | 10 % |
| F. Rastmöglichkeiten und Infrastruktur | 10 % |
| G. Partizipation und Nutzerorientierung | 5 % |

- Fragengewicht = Kategoriegewicht ÷ Anzahl Fragen der Kategorie (je Frage über `weightOverride` änderbar)
- **Nicht zutreffend** → Frage wird aus der Berechnung herausgenommen
- **Nicht beurteilbar / offen** → bleibt in der Berechnung; Ergebnis als Spannweite (B = 0 … B = 4), als unvollständig gekennzeichnet
- **Kritische Barriere**: Bewertung 0, bei sicherheitsrelevanten Kriterien (A3, B1, B2, B3, B5, C3) auch 1
- **Einstufung:** 0–20 % sehr gering · 21–40 % gering · 41–60 % mittel · 61–80 % hoch · 81–100 % sehr hoch
- In der Oberfläche werden Gewichte nur auf der Seite „Methodik“ (je Kategorie) angezeigt.

> Die Einstufung ist ein eigener Projektvorschlag und keine anerkannte Zertifizierung oder normierte Bewertung.
> Die Grenzwerte sollten methodisch begründet und durch praktische Erprobung überprüft werden.

---

## Architektur

```
                    ┌──────────────────────────── GitHub ─────────────────────────────┐
  Redaktion         │                                                                  │
  #/cms  ──login──▶ Cloudflare Worker ──Commit──▶ src/content/trails.json (main)       │
         ◀─Inhalte─  (Login, Token,               │                                    │
                     Validierung)                 ▼                                    │
                    │                  GitHub Actions: Tests → Typecheck → Build       │
                    │                                 │                                │
                    └─────────────────────────────────┼────────────────────────────────┘
                                                      ▼
  Bewertende  ◀──────────────────────────── GitHub Pages (statische App)
  (Bewertungen nur lokal im Browser / IndexedDB)
```

- **App:** statische Single-Page-App (Vue 3, Vite, TypeScript, Pinia, Vue Router im Hash-Modus, idb-keyval).
  Die Lehrpfade werden beim Build aus `src/content/trails.json` eingebunden.
- **CMS-Worker** (`cms-worker/`): prüft Benutzername/Passwort, hält den GitHub-Token geheim, validiert die Inhalte
  und darf **nur** `src/content/trails.json` ändern.
- **Qualitätssicherung:** Jede Änderung – auch aus dem CMS – durchläuft vor der Veröffentlichung Tests,
  Typecheck und Build. Ungültige Inhalte gehen nicht live.

---

## Projektstruktur

```
src/
  content/trails.json      Lehrpfade + Abschnitte (vom CMS geschrieben)
  config/
    trails.ts              lädt die Inhalte, Hilfsfunktionen, Schwierigkeitsstufen
    criteria.ts            Kategorien, Fragen, Gewichte, Nutzergruppen, Prüfhinweise, Empfehlungen
    rating.ts              Skala, Einstufungsgrenzen, Hinweistext
    cms.ts                 Adresse des CMS-Workers (VITE_CMS_API)
  lib/
    scoring.ts             Berechnung (Formel, Spannweite, Probleme, Empfehlungen)
    trailSchema.ts         Inhaltsregeln – gemeinsam für Tests, CMS und Worker
    storage.ts             IndexedDB, Fotos, JSON-Export/-Import
    cmsApi.ts              CMS-Client (Login, Laden, Speichern)
    print.ts               PDF-Druck erst nach dem Laden aller Fotos
  stores/trails.ts         Bewertungen je Abschnitt, automatisches Speichern
  views/                   Startseite, Bewertung, Auswertung, Probleme, Bericht, Methodik
  views/cms/               CMS: Anmeldung und Editor
  components/              Bewertungsskala, Nachweise, Ergebnisbalken, Speichern-Menü, Import-Dialog …
cms-worker/                Cloudflare Worker für das CMS (eigene README)
tests/                     Vitest: Bewertungslogik, Inhaltsregeln, Inhaltsdatei, CMS-Login
.github/workflows/deploy.yml   Tests + Build + Veröffentlichung auf GitHub Pages
```

---

## Entwicklung

Voraussetzung: Node.js 20+.

```bash
npm install
npm run dev        # Entwicklungsserver (http://localhost:5173)
npm test           # Tests
npm run typecheck  # Typprüfung
npm run build      # statischer Build nach dist/
npm run preview    # Build lokal ansehen
```

Vor jedem Commit: `npm test && npm run typecheck && npm run build`.

**CMS lokal:** `npm run dev` nutzt automatisch einen lokalen Worker unter `http://localhost:8787`
(`.env.development`). Dazu in `cms-worker/` den Worker starten – siehe [`cms-worker/README.md`](cms-worker/README.md#lokal-testen).
Ohne laufenden Worker funktioniert die App normal, nur das CMS meldet „nicht erreichbar“.

**Barrierefreiheit der App selbst:** semantisches HTML, Labels für alle Felder, vollständige Tastaturbedienung,
sichtbarer Fokus, Kontrast ≥ 4,5 : 1, Informationen nie nur über Farbe, Statusmeldungen über `aria-live`,
keine Browser-Dialoge (`alert`/`confirm`).

---

## Deployment

- Jeder Push auf `main` (auch jede Speicherung im CMS) startet `.github/workflows/deploy.yml`:
  `npm ci` → Tests → Typecheck → Build → Veröffentlichung auf GitHub Pages.
- Einstellungen im GitHub-Repository:
  - **Settings → Pages → Source:** „GitHub Actions“
  - **Settings → Secrets and variables → Actions → Variables:** `CMS_API_URL` = Adresse des Workers
    (wird beim Build als `VITE_CMS_API` eingesetzt)
- Den Worker veröffentlicht man separat mit `npx wrangler deploy` im Ordner `cms-worker/`.

---

## Anpassen

| Was | Wo |
|---|---|
| Lehrpfade und Abschnitte | im CMS (`#/cms`) |
| Neue Felder für Lehrpfade/Abschnitte | gemeinsam in `src/types.ts`, `src/lib/trailSchema.ts` (Prüfen + Bereinigen), `src/views/cms/CmsTrailEditor.vue`, Anzeige in den Views, Tests |
| Kriterien, Gewichte, Nutzergruppen, Prüfhinweise, Empfehlungen | `src/config/criteria.ts` |
| Skala, Einstufungsgrenzen, Hinweistext | `src/config/rating.ts` |
| Berechnung | `src/lib/scoring.ts` (immer mit Tests in `tests/scoring.spec.ts`) |
| Farben | CSS-Variablen in `src/style.css` (Hintergrund `#f7f5f0`, Akzent `#4e5152`, Rot `#b42b52`) |

**Wichtig:** Abschnitts-IDs in `src/content/trails.json` nie von Hand ändern – lokale Bewertungen und
JSON-Exporte sind darüber zugeordnet.
