# CMS-Worker

Kleiner Cloudflare Worker als „Türsteher“ zwischen der CMS-Oberfläche (`…/#/cms`) und GitHub:

- prüft **Benutzername + Passwort** (ein gemeinsamer Zugang für alle Redakteur:innen),
- hält den **GitHub-Token geheim** (er gelangt nie in den Browser),
- prüft die Inhalte mit denselben Regeln wie die App (`src/lib/trailSchema.ts`),
- darf **ausschließlich** `src/content/trails.json` auf `main` ändern.

Jede Speicherung ist ein Commit „CMS: Lehrpfade aktualisiert“ → GitHub Actions testet, baut und veröffentlicht
die App (ca. 1–2 Minuten). Kosten: keine (Cloudflare Free-Plan, 100 000 Anfragen/Tag).

## Schnittstelle

| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/login` | `{ username, password }` → `{ token }` (HMAC-signiert, 8 h gültig). Fehlversuche werden um 1 s verzögert. |
| `GET` | `/content` | Bearer-Token → `{ trails, sha }` (aktueller Stand direkt aus GitHub) |
| `PUT` | `/content` | Bearer-Token, `{ trails, sha }` → validiert, bereinigt, committet → `{ sha }`. `409`, wenn inzwischen jemand anderes gespeichert hat; `422` mit Fehlerliste bei ungültigen Inhalten. |

Anfragen werden nur von den Adressen in `ALLOWED_ORIGINS` angenommen (CORS).

## Konfiguration

**Variablen** (`wrangler.toml`, nicht geheim):

| Name | Wert |
|---|---|
| `REPO` | `Sientaax/barriere-check` |
| `BRANCH` | `main` |
| `CONTENT_PATH` | `src/content/trails.json` |
| `ALLOWED_ORIGINS` | `https://sientaax.github.io` + lokale Entwicklungsadressen |

**Geheimnisse** (nur per `npx wrangler secret put <NAME>` oder im Cloudflare-Dashboard, nie ins Repo):

| Name | Inhalt |
|---|---|
| `CMS_USER` | Benutzername für das CMS |
| `CMS_PASSWORD` | Passwort für das CMS (lang, z. B. 4–5 zufällige Wörter) |
| `SESSION_SECRET` | langer Zufallstext zum Signieren der Sitzungen |
| `GITHUB_TOKEN` | Fine-grained Token: nur Repo `barriere-check`, Recht „Contents: Read and write“ |

In GitHub ist außerdem die Repo-Variable **`CMS_API_URL`** (Settings → Secrets and variables → Actions →
Variables) auf die Worker-Adresse gesetzt; sie wird beim Build der App als `VITE_CMS_API` eingesetzt.

## Betrieb

Alle Befehle im Ordner `cms-worker/` (einmalig `npm install`, bei Bedarf `npx wrangler login`).

| Aufgabe | So geht's |
|---|---|
| **Passwort ändern** | `npx wrangler secret put CMS_PASSWORD` (oder Dashboard → Workers & Pages → barriere-check-cms → Settings → Variables and Secrets). Bestehende Sitzungen bleiben bis zu 8 h gültig. |
| **Alle sofort abmelden** | zusätzlich `npx wrangler secret put SESSION_SECRET` mit neuem Zufallstext |
| **Benutzername ändern** | `npx wrangler secret put CMS_USER` |
| **GitHub-Token erneuern** (läuft nach der gewählten Frist ab) | GitHub → Settings → Developer settings → Fine-grained tokens → neuen Token mit denselben Rechten erstellen → `npx wrangler secret put GITHUB_TOKEN` |
| **Worker-Code aktualisieren** | nach Änderungen in `src/` (oder an `src/lib/trailSchema.ts` der App): `npx wrangler deploy` |
| **Andere Adresse der App** | `ALLOWED_ORIGINS` in `wrangler.toml` anpassen → `npx wrangler deploy` |
| **Änderung rückgängig machen** | im GitHub-Repo den Commit „CMS: Lehrpfade aktualisiert“ öffnen → *Revert* |
| **Logs ansehen** | `npx wrangler tail` (live) oder Dashboard → Worker → Logs |

> **Wichtig:** Wird `src/lib/trailSchema.ts` (Inhaltsregeln) oder `src/types.ts` geändert, den Worker neu
> veröffentlichen (`npx wrangler deploy`), damit App und Worker dieselben Regeln verwenden.

## Fehlerbehebung

| Meldung im CMS | Ursache / Lösung |
|---|---|
| „CMS ist nicht eingerichtet“ | Repo-Variable `CMS_API_URL` fehlt oder die App wurde seitdem nicht neu gebaut → Variable prüfen, Workflow „Deploy to GitHub Pages“ manuell starten. |
| „Der CMS-Server ist nicht erreichbar“ | Worker-Adresse falsch, Worker nicht veröffentlicht oder Adresse der App fehlt in `ALLOWED_ORIGINS` (dann blockiert der Browser die Anfrage – in den Entwicklertools als CORS-Fehler sichtbar). |
| „Benutzername oder Passwort ist falsch“ | Zugangsdaten prüfen; ggf. neu setzen (siehe Betrieb). |
| „Bitte erneut anmelden“ | Sitzung nach 8 h abgelaufen oder `SESSION_SECRET` geändert. Ungespeicherte Änderungen bleiben nach der Anmeldung erhalten. |
| „Inhalte wurden zwischenzeitlich geändert …“ | Jemand anderes hat gespeichert → „Neu laden“, Änderungen erneut vornehmen. |
| „GitHub-Lesefehler 401/403“ bzw. „Speichern bei GitHub fehlgeschlagen (401/403)“ | GitHub-Token abgelaufen oder ohne Schreibrecht → Token erneuern. |
| Gespeichert, aber die Seite zeigt den alten Stand | Build läuft noch (1–2 Min.) oder ist fehlgeschlagen → GitHub → Actions prüfen. |

## Lokal testen

```bash
cp .dev.vars.example .dev.vars   # Werte eintragen; zum gefahrlosen Testen BRANCH=cms-test setzen
npm run dev                      # Worker auf http://localhost:8787
```

In einem zweiten Terminal im Hauptordner `npm run dev` – die App nutzt lokal automatisch
`http://localhost:8787` (siehe `.env.development`). `.dev.vars` ist in `.gitignore` eingetragen.

Für Tests ganz ohne GitHub kann über die Variable `GITHUB_API` eine eigene Attrappe der GitHub-API angegeben
werden (Standard: `https://api.github.com`).

## Sicherheit

- Wer das Passwort kennt, kann Lehrpfade ändern oder löschen – nur an vertrauenswürdige Personen weitergeben und
  bei personellen Wechseln ändern. Kein Passwort per unverschlüsselter Mail an große Verteiler senden.
- Der GitHub-Token hat nur Inhaltsrechte auf dieses eine Repository; der Worker schreibt zusätzlich nur `CONTENT_PATH`.
- Login-Vergleich in konstanter Zeit, Verzögerung bei Fehlversuchen, Sitzungstoken mit Ablaufzeit,
  im Browser nur in `sessionStorage` (endet mit dem Tab).
- Inhalte werden serverseitig validiert und von unbekannten Feldern bereinigt; vor der Veröffentlichung laufen die Tests.
