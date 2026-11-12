# CMS-Worker – Einrichtung

Der Worker ist der „Türsteher“ des CMS (`…/#/cms`):

- prüft **Benutzername + Passwort** (ein gemeinsamer Zugang für alle Redakteur:innen),
- hält den **GitHub-Schlüssel geheim** (er landet nie im Browser),
- prüft die Inhalte und darf **nur** `src/content/trails.json` ändern.

Jedes Speichern im CMS ist ein Commit auf `main` → GitHub Pages baut die App neu (ca. 1–2 Minuten).
Der Worker läuft kostenlos bei Cloudflare (Free-Plan, 100 000 Anfragen/Tag).

## Einmalige Einrichtung (ca. 15 Minuten)

### 1. GitHub-Schlüssel erstellen
1. GitHub → Profilbild → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. Name: `barriere-check-cms`, Ablaufdatum: z. B. 1 Jahr (danach Schritt 3 mit neuem Token wiederholen)
3. **Repository access:** *Only select repositories* → `barriere-check`
4. **Permissions → Repository permissions → Contents:** *Read and write* (sonst nichts)
5. Token kopieren (beginnt mit `github_pat_…`)

### 2. Cloudflare-Konto
Kostenloses Konto unter <https://dash.cloudflare.com/sign-up> anlegen.

### 3. Worker veröffentlichen
Im Terminal, im Ordner `cms-worker`:

```bash
npm install
npx wrangler login                     # öffnet den Browser zur Cloudflare-Anmeldung
npx wrangler secret put CMS_USER       # Benutzername für das CMS eingeben, z. B. redaktion
npx wrangler secret put CMS_PASSWORD   # langes Passwort, z. B. 4–5 zufällige Wörter
npx wrangler secret put SESSION_SECRET # beliebiger langer Zufallstext (z. B. aus einem Passwortgenerator)
npx wrangler secret put GITHUB_TOKEN   # Token aus Schritt 1
npx wrangler deploy
```

`wrangler deploy` gibt am Ende die Adresse aus, z. B. `https://barriere-check-cms.<name>.workers.dev`.

### 4. Adresse in GitHub eintragen
GitHub-Repo → **Settings → Secrets and variables → Actions → Tab „Variables“ → New repository variable**

- Name: `CMS_API_URL`
- Wert: die Adresse aus Schritt 3 (ohne `/` am Ende)

Danach einmal neu bauen lassen (Tab **Actions → Deploy to GitHub Pages → Run workflow**) oder einfach etwas pushen.
Das CMS ist dann unter `https://sientaax.github.io/barriere-check/#/cms` erreichbar (Link „Redaktion (CMS)“ im Footer).

## Im Betrieb

| Aufgabe | So geht's |
|---|---|
| Passwort ändern | `npx wrangler secret put CMS_PASSWORD` (oder Cloudflare-Dashboard → Workers → barriere-check-cms → Settings → Variables). Alte Sitzungen bleiben max. 8 h gültig; sofort abmelden: auch `SESSION_SECRET` neu setzen. |
| GitHub-Token erneuern | Neuen Token wie in Schritt 1 erstellen, `npx wrangler secret put GITHUB_TOKEN` |
| Änderung rückgängig machen | Jede Speicherung ist ein Commit „CMS: Lehrpfade aktualisiert“ – in GitHub per *Revert* zurücknehmen. |
| Andere Web-Adresse für die App | `ALLOWED_ORIGINS` in `wrangler.toml` anpassen, `npx wrangler deploy` |

## Lokal testen

```bash
cp .dev.vars.example .dev.vars   # Werte eintragen; zum gefahrlosen Testen BRANCH=cms-test setzen
npm run dev                      # Worker auf http://localhost:8787
```

In einem zweiten Terminal im Hauptordner `npm run dev` – die App nutzt lokal automatisch
`http://localhost:8787` (siehe `.env.development`).

## Sicherheit

- Login-Fehlversuche werden um 1 s verzögert; Sitzungen laufen nach 8 h ab (signiertes Token, im Browser nur bis zum Schließen des Tabs gespeichert).
- Der Worker akzeptiert nur Anfragen von den Adressen in `ALLOWED_ORIGINS` und schreibt ausschließlich `CONTENT_PATH`.
- Inhalte werden vor dem Speichern geprüft (`src/lib/trailSchema.ts`); zusätzlich laufen vor jeder Veröffentlichung die Tests.
- Wer das Passwort kennt, kann Lehrpfade ändern oder löschen – also nur an vertrauenswürdige Personen weitergeben und bei Bedarf ändern.
