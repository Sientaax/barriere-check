<script setup lang="ts">
import { CATEGORIES, USER_GROUPS, questionsOf } from '../config/criteria'
import { DISCLAIMER, LEVELS, SCALE } from '../config/rating'
</script>

<template>
  <article>
    <div class="card">
      <h1>Methodik des Bewertungssystems</h1>
      <p>
        Das Bewertungssystem erfasst den aktuellen Zustand eines Lehrpfads, macht Barrieren und
        Verbesserungspotenziale sichtbar, berücksichtigt die Bedürfnisse verschiedener Nutzergruppen und leitet
        konkrete Handlungsempfehlungen ab. Der Kriterienkatalog ist allgemein formuliert und auf andere Lehrpfade
        übertragbar.
      </p>
    </div>

    <div class="card">
      <h2>Bewertungsskala</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th scope="col">Wert</th><th scope="col">Bedeutung</th><th scope="col">Beschreibung</th></tr></thead>
          <tbody>
            <tr v-for="s in SCALE" :key="String(s.value)">
              <td><strong>{{ s.short }}</strong></td>
              <td>{{ s.label }}</td>
              <td>{{ s.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Berechnung</h2>
      <p class="formula" aria-label="P gleich Summe aus G mal B durch 4, geteilt durch Summe G, mal 100">
        P = <span class="frac"><span>Σ (G · B / 4)</span><span>Σ G</span></span> · 100
      </p>
      <ul>
        <li><strong>P</strong> = Gesamtergebnis in Prozent</li>
        <li><strong>G</strong> = Gewichtung der jeweiligen Frage (Kategoriegewicht ÷ Anzahl der Fragen der Kategorie)</li>
        <li><strong>B</strong> = erreichte Bewertung zwischen 0 und 4</li>
        <li><strong>Nicht zutreffend:</strong> Das Gewicht der Frage wird aus der Berechnung herausgenommen.</li>
        <li>
          <strong>Nicht beurteilbar:</strong> Die Frage bleibt in der Berechnung. Das Ergebnis wird als Spannweite
          angegeben – unterer Wert mit B = 0, oberer Wert mit B = 4 – und als unvollständig gekennzeichnet.
        </li>
        <li>
          <strong>Mehrere Abschnitte:</strong> Jeder Abschnitt wird einzeln berechnet. Das Gesamtergebnis ist der
          nach Abschnittslänge gewichtete Mittelwert (gleichgewichtet, wenn nicht alle Längen bekannt sind).
        </li>
        <li>
          <strong>Kritische Barriere:</strong> Bewertung 0; bei sicherheitsrelevanten Kriterien (A3, B1, B2, B3, B5,
          C3) auch Bewertung 1.
        </li>
      </ul>
    </div>

    <div class="card">
      <h2>Einstufung</h2>
      <ul class="levels">
        <li v-for="l in LEVELS" :key="l.key"><span class="level" :class="`lvl-${l.key}`">{{ l.label }}</span> {{ l.min }}–{{ l.max }} %</li>
      </ul>
      <p class="alert alert-warn"><strong>Wichtig:</strong> {{ DISCLAIMER }}</p>
    </div>

    <div class="card">
      <h2>Kategorien und Kriterien</h2>
      <div v-for="c in CATEGORIES" :key="c.id" class="cat">
        <h3>{{ c.id }}. {{ c.title }} – {{ c.weight }} %</h3>
        <ol class="qs">
          <li v-for="q in questionsOf(c.id)" :key="q.id">
            <strong>{{ q.id }}:</strong> {{ q.text }}
          </li>
        </ol>
      </div>
    </div>

    <div class="card">
      <h2>Berücksichtigte Nutzergruppen</h2>
      <ul>
        <li v-for="g in USER_GROUPS" :key="g.id">{{ g.label }}</li>
      </ul>
      <p class="small muted">
        Jedes Kriterium ist den Nutzergruppen zugeordnet, für die es besonders relevant ist. Daraus ergeben sich
        gruppenspezifische Ergebnisse und Filter in der Problemansicht.
      </p>
    </div>
  </article>
</template>

<style scoped>
.formula { font-size: 1.3rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.frac { display: inline-flex; flex-direction: column; text-align: center; }
.frac span:first-child { border-bottom: 2px solid currentColor; padding: 0 0.3rem; }
.levels { list-style: none; padding: 0; display: grid; gap: 0.3rem; }
.qs { list-style: none; padding: 0; }
.qs li { margin-bottom: 0.3rem; }
.cat + .cat { margin-top: 1rem; }
</style>
