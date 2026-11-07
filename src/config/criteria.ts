/**
 * Kriterienkatalog des Bewertungssystems.
 *
 * Anpassung für andere Lehrpfade / weitere Projekte:
 * - Kategoriegewichte (`weight` in CATEGORIES) müssen in Summe 100 ergeben.
 * - Das Gewicht einer Frage wird standardmäßig gleichmäßig aus dem Kategoriegewicht
 *   abgeleitet. Über `weightOverride` kann einer Frage ein eigenes Gewicht gegeben werden.
 * - `criticalBelow`: Bewertungen unterhalb dieses Wertes gelten als kritische Barriere
 *   (Standard 1 → nur „0 = Nicht erfüllt“; sicherheitsrelevante Fragen 2 → auch „1“).
 */

export type CategoryId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export type UserGroupId =
  | 'rollstuhl'
  | 'gehbeeintraechtigt'
  | 'sehbehindert'
  | 'hoerbehindert'
  | 'kognitiv'
  | 'aeltere'

export interface UserGroup {
  id: UserGroupId
  label: string
  short: string
}

export const USER_GROUPS: UserGroup[] = [
  { id: 'rollstuhl', label: 'Rollstuhl- und Rollatornutzende', short: 'Rollstuhl/Rollator' },
  { id: 'gehbeeintraechtigt', label: 'Menschen mit Gehbeeinträchtigung', short: 'Gehbeeinträchtigung' },
  { id: 'sehbehindert', label: 'Blinde und sehbehinderte Menschen', short: 'Sehbehinderung' },
  { id: 'hoerbehindert', label: 'Gehörlose und schwerhörige Menschen', short: 'Hörbehinderung' },
  { id: 'kognitiv', label: 'Menschen mit kognitiven Beeinträchtigungen / Lernschwierigkeiten', short: 'Kognitiv' },
  { id: 'aeltere', label: 'Ältere Menschen, Familien mit Kinderwagen', short: 'Ältere/Kinderwagen' },
]

export interface Category {
  id: CategoryId
  title: string
  weight: number
}

export const CATEGORIES: Category[] = [
  { id: 'A', title: 'Erreichbarkeit und Zugang', weight: 15 },
  { id: 'B', title: 'Wegequalität und Bewegungsflächen', weight: 25 },
  { id: 'C', title: 'Orientierung und Sicherheit', weight: 15 },
  { id: 'D', title: 'Information und Kommunikation', weight: 20 },
  { id: 'E', title: 'Sensorische Zugänglichkeit', weight: 10 },
  { id: 'F', title: 'Rastmöglichkeiten und Infrastruktur', weight: 10 },
  { id: 'G', title: 'Partizipation und Nutzerorientierung', weight: 5 },
]

interface QuestionDef {
  id: string
  category: CategoryId
  text: string
  hint: string
  userGroups: UserGroupId[]
  recommendation: string
  criticalBelow?: number
  weightOverride?: number
}

export interface Question extends QuestionDef {
  weight: number
  criticalBelow: number
}

const ALL: UserGroupId[] = USER_GROUPS.map((g) => g.id)

const QUESTION_DEFS: QuestionDef[] = [
  // A. Erreichbarkeit und Zugang
  {
    id: 'A1', category: 'A',
    text: 'Ist der Weg mit öffentlichen Verkehrsmitteln erreichbar?',
    hint: 'Haltestelle in der Nähe, barrierefreie Haltestelle (Hochbord), Taktung, Fußweg von der Haltestelle zum Einstieg.',
    userGroups: ALL,
    recommendation: 'ÖPNV-Anbindung prüfen und kommunizieren: nächstgelegene barrierefreie Haltestelle, Fahrpläne und den Weg von der Haltestelle zum Einstieg beschreiben; ggf. mit Verkehrsbetrieben Haltestellenausbau oder Rufbus-Angebote abstimmen.',
  },
  {
    id: 'A2', category: 'A',
    text: 'Gibt es geeignete Park- und Ausstiegsmöglichkeiten in der Nähe des Einstiegs?',
    hint: 'Behindertenparkplätze (ca. 3,50 m × 5,00 m), ebene und befestigte Fläche, kurze Distanz zum Einstieg, Ausstiegsmöglichkeit für Fahrdienste.',
    userGroups: ['rollstuhl', 'gehbeeintraechtigt', 'aeltere'],
    recommendation: 'Gekennzeichnete, ausreichend breite Behindertenparkplätze mit festem, ebenem Belag nahe dem Einstieg einrichten und eine Halte-/Ausstiegszone für Fahrdienste vorsehen.',
  },
  {
    id: 'A3', category: 'A',
    text: 'Ist der Einstieg möglichst barrierearm und ohne größere Hindernisse möglich?',
    hint: 'Keine Stufen, Schranken oder Drängelgitter ohne Umfahrung, Durchgangsbreite ≥ 0,90 m, fester Untergrund.',
    userGroups: ['rollstuhl', 'gehbeeintraechtigt', 'sehbehindert', 'aeltere'],
    recommendation: 'Hindernisse am Einstieg (Stufen, Schranken, Drängelgitter) entfernen oder mit einer stufenlosen Umfahrung (≥ 0,90 m breit) ergänzen; Einstieg taktil und kontrastreich markieren.',
    criticalBelow: 2,
  },
  {
    id: 'A4', category: 'A',
    text: 'Gibt es erreichbare Ein- und Ausstiegsmöglichkeiten sowie alternative Zugänge entlang der Strecke?',
    hint: 'Möglichkeit zur Verkürzung des Weges, Notausstiege, Abholpunkte für Fahrdienste.',
    userGroups: ['rollstuhl', 'gehbeeintraechtigt', 'aeltere', 'kognitiv'],
    recommendation: 'Zwischenzugänge und Abkürzungen ausweisen (Rundweg-Varianten, Abholpunkte), sodass der Pfad auch in Teilstrecken genutzt werden kann.',
  },

  // B. Wegequalität und Bewegungsflächen
  {
    id: 'B1', category: 'B',
    text: 'Ist die Wegbreite für eine selbstständige und sichere Nutzung ausreichend?',
    hint: 'Richtwert: ≥ 1,50 m (Begegnung Rollstuhl/Fußgänger), mindestens 1,20 m bei kurzen Engstellen (vgl. DIN 18040-3). Messwert als Nachweis eintragen.',
    userGroups: ['rollstuhl', 'gehbeeintraechtigt', 'sehbehindert', 'aeltere'],
    recommendation: 'Engstellen auf mindestens 1,20 m, regulär 1,50 m verbreitern; Bewuchs zurückschneiden und Wegränder freihalten.',
    criticalBelow: 2,
  },
  {
    id: 'B2', category: 'B',
    text: 'Ist der Wegebelag eben, fest und möglichst erschütterungsarm?',
    hint: 'Wassergebundene Decke gut verdichtet, Asphalt oder Pflaster mit engen Fugen; kein loser Kies, Schotter, Sand oder Matsch.',
    userGroups: ['rollstuhl', 'gehbeeintraechtigt', 'aeltere'],
    recommendation: 'Lose oder unebene Beläge durch eine feste, gut verdichtete wassergebundene Wegedecke oder einen anderen erschütterungsarmen Belag ersetzen; Entwässerung verbessern.',
    criticalBelow: 2,
  },
  {
    id: 'B3', category: 'B',
    text: 'Sind die Längsneigungen für möglichst viele Nutzergruppen bewältigbar?',
    hint: 'Richtwert: ≤ 3 % gut nutzbar, bis 6 % mit Zwischenpodesten alle 10 m; darüber für viele nicht selbstständig nutzbar. Messwert eintragen.',
    userGroups: ['rollstuhl', 'gehbeeintraechtigt', 'aeltere'],
    recommendation: 'Steile Abschnitte entschärfen (Serpentinen, Podeste), alternative flachere Wegführung prüfen und Steigungen vor Ort sowie in der Vorabinformation angeben.',
    criticalBelow: 2,
  },
  {
    id: 'B4', category: 'B',
    text: 'Sind Querneigungen möglichst gering und gut nutzbar?',
    hint: 'Richtwert: ≤ 2,5 %; größere Querneigungen erschweren Rollstuhl- und Rollatornutzung erheblich.',
    userGroups: ['rollstuhl', 'gehbeeintraechtigt', 'aeltere'],
    recommendation: 'Querneigung bei der Wegesanierung auf ≤ 2,5 % reduzieren; Entwässerung über Längsgefälle oder Rinnen lösen.',
  },
  {
    id: 'B5', category: 'B',
    text: 'Sind Hindernisse wie Wurzeln, Stufen, Schwellen oder lose Gegenstände vermieden oder gesichert?',
    hint: 'Schwellen > 2 cm, Wurzelaufbrüche, Querrinnen, herabhängende Äste (lichte Höhe ≥ 2,25 m).',
    userGroups: ['rollstuhl', 'gehbeeintraechtigt', 'sehbehindert', 'aeltere'],
    recommendation: 'Wurzeln und Schwellen überdecken oder rückbauen, Stufen durch Rampen ergänzen, Querrinnen überfahrbar abdecken und lichte Höhe freischneiden; verbleibende Hindernisse kontrastreich markieren.',
    criticalBelow: 2,
  },
  {
    id: 'B6', category: 'B',
    text: 'Gibt es ausreichend Bewegungs-, Begegnungs- und Wendemöglichkeiten?',
    hint: 'Wendeflächen ≥ 1,50 m × 1,50 m, Begegnungsflächen 1,80 m × 1,80 m in Sichtweite (ca. alle 50 m bei schmalen Wegen).',
    userGroups: ['rollstuhl', 'gehbeeintraechtigt', 'aeltere'],
    recommendation: 'Ausweich- und Wendeflächen (≥ 1,50 × 1,50 m) in regelmäßigen Abständen anlegen, insbesondere vor Stationen und an Wegenden.',
  },

  // C. Orientierung und Sicherheit
  {
    id: 'C1', category: 'C',
    text: 'Ist der Weg eindeutig und durchgehend erkennbar?',
    hint: 'Deutliche Wegkanten, kontrastierende Randbegrenzung, taktil erfassbare Leitlinien, keine verwirrenden Abzweigungen.',
    userGroups: ['sehbehindert', 'kognitiv', 'aeltere'],
    recommendation: 'Wegränder taktil und visuell kontrastierend ausbilden (Randsteine, Leitlinien) und Abzweigungen eindeutig kennzeichnen.',
  },
  {
    id: 'C2', category: 'C',
    text: 'Sind Beschilderungen und Orientierungselemente gut sichtbar und verständlich?',
    hint: 'Einheitliches Leitsystem, Piktogramme, ausreichende Größe und Kontrast, Höhe für Stehende und Sitzende lesbar.',
    userGroups: ['sehbehindert', 'kognitiv', 'hoerbehindert', 'aeltere'],
    recommendation: 'Einheitliches, kontrastreiches Leitsystem mit Piktogrammen und Richtungsangaben einführen; Schilder in 1,20–1,60 m Höhe anbringen.',
  },
  {
    id: 'C3', category: 'C',
    text: 'Sind Gefahrenstellen, Absturzkanten und Risiken erkennbar und ausreichend gesichert?',
    hint: 'Geländer/Handläufe, Radabweiser (≥ 10 cm), Tastkanten, Kontrastmarkierung an Gefahrenstellen.',
    userGroups: ALL,
    recommendation: 'Absturzkanten mit Geländer und Radabweiser sichern, Gefahrenstellen taktil und visuell kontrastreich markieren und regelmäßig kontrollieren.',
    criticalBelow: 2,
  },
  {
    id: 'C4', category: 'C',
    text: 'Gibt es verständliche Informationen zu Länge, Schwierigkeitsgrad, Wegbeschaffenheit und Einschränkungen?',
    hint: 'Übersichtstafel am Start und online: Länge, Dauer, Steigungen, Belag, Engstellen, Toiletten, Rastplätze.',
    userGroups: ALL,
    recommendation: 'Am Einstieg und online eine Übersicht mit Länge, Steigungen, Belag, Engstellen und Infrastruktur bereitstellen, damit Nutzende vorab selbst entscheiden können.',
  },

  // D. Information und Kommunikation
  {
    id: 'D1', category: 'D',
    text: 'Sind Informationen in verständlicher und zugänglicher Sprache formuliert?',
    hint: 'Kurze Sätze, bekannte Wörter, Fachbegriffe erklärt; ggf. Leichte Sprache als Ergänzung.',
    userGroups: ['kognitiv', 'hoerbehindert', 'aeltere'],
    recommendation: 'Texte in einfacher Sprache überarbeiten und Kerninhalte zusätzlich in Leichter Sprache anbieten (idealerweise von Prüfgruppen geprüft).',
  },
  {
    id: 'D2', category: 'D',
    text: 'Sind Schriftgröße, Kontrast und Gestaltung der Informationstafeln gut lesbar?',
    hint: 'Serifenlose Schrift, hoher Leuchtdichtekontrast, blendfreie Oberfläche, gut erreichbare Höhe und Unterfahrbarkeit.',
    userGroups: ['sehbehindert', 'rollstuhl', 'aeltere'],
    recommendation: 'Tafeln mit großer, serifenloser Schrift, starkem Kontrast und matter Oberfläche gestalten; schräg in unterfahrbarer Höhe anbringen.',
  },
  {
    id: 'D3', category: 'D',
    text: 'Werden Informationen über unterschiedliche Medien und Formate angeboten?',
    hint: 'Text, Bild, Audio, Video mit Untertiteln/Gebärdensprache, taktile Elemente, Brailleschrift.',
    userGroups: ['sehbehindert', 'hoerbehindert', 'kognitiv'],
    recommendation: 'Inhalte im Mehr-Sinne-Prinzip anbieten: Audioguide, Videos mit Untertiteln und DGS, taktile Modelle sowie Braille-/Profilschrift.',
  },
  {
    id: 'D4', category: 'D',
    text: 'Sind Inhalte übersichtlich strukturiert und in angemessenem Umfang dargestellt?',
    hint: 'Klare Gliederung, wenige Kernaussagen pro Tafel, Bilder unterstützen den Text.',
    userGroups: ['kognitiv', 'sehbehindert', 'aeltere'],
    recommendation: 'Inhalte je Station auf wenige Kernaussagen reduzieren, mit Zwischenüberschriften und Bildern strukturieren und Vertiefungen auslagern (z. B. digital).',
  },
  {
    id: 'D5', category: 'D',
    text: 'Sind ergänzende digitale Informationsangebote barrierearm zugänglich?',
    hint: 'Website/App nach WCAG 2.1 AA, QR-Codes tastbar markiert, Screenreader-tauglich, offline nutzbar.',
    userGroups: ['sehbehindert', 'hoerbehindert', 'kognitiv'],
    recommendation: 'Digitale Angebote nach WCAG 2.1 AA / BITV 2.0 prüfen und anpassen; QR-Codes taktil auffindbar machen und Inhalte auch ohne App zugänglich halten.',
  },
  {
    id: 'D6', category: 'D',
    text: 'Können Inhalte auch unabhängig von einer einzelnen Sinnesmodalität aufgenommen werden?',
    hint: 'Zwei-Sinne-Prinzip: Jede Kerninformation über mindestens zwei Sinne (z. B. Sehen + Hören oder Tasten).',
    userGroups: ['sehbehindert', 'hoerbehindert'],
    recommendation: 'Konsequent das Zwei-Sinne-Prinzip umsetzen: Zu jeder visuellen Information eine hörbare oder tastbare Alternative bereitstellen.',
  },

  // E. Sensorische Zugänglichkeit
  {
    id: 'E1', category: 'E',
    text: 'Werden neben dem Sehsinn auch Hören, Tasten und Riechen angesprochen?',
    hint: 'Tastobjekte, Hörstationen, Duftgärten, Materialproben.',
    userGroups: ['sehbehindert', 'kognitiv'],
    recommendation: 'Stationen um Tast-, Hör- und Riechelemente ergänzen (z. B. Materialproben, Hörstationen, Duftpflanzen).',
  },
  {
    id: 'E2', category: 'E',
    text: 'Gibt es alternative Möglichkeiten, Inhalte und Landschaftselemente wahrzunehmen?',
    hint: 'Tastmodelle/Reliefs der Landschaft, Audiodeskription von Ausblicken, Fernrohre in Sitzhöhe.',
    userGroups: ['sehbehindert', 'rollstuhl', 'hoerbehindert'],
    recommendation: 'Landschaftselemente über Tastreliefs, Audiodeskriptionen und unterfahrbare Aussichtspunkte erschließen.',
  },
  {
    id: 'E3', category: 'E',
    text: 'Sind die sensorischen Angebote sinnvoll in die Vermittlung der Kulturlandschaft integriert?',
    hint: 'Sensorische Elemente sind inhaltlich mit dem Thema verbunden, nicht nur Zusatz.',
    userGroups: ['sehbehindert', 'kognitiv'],
    recommendation: 'Sensorische Elemente inhaltlich an die Vermittlungsziele koppeln und gemeinsam mit Vermittlungsfachleuten und Betroffenen entwickeln.',
  },

  // F. Rastmöglichkeiten und Infrastruktur
  {
    id: 'F1', category: 'F',
    text: 'Gibt es in angemessenen Abständen Rastmöglichkeiten?',
    hint: 'Richtwert: Sitzgelegenheiten etwa alle 100–300 m, an Steigungen häufiger.',
    userGroups: ['gehbeeintraechtigt', 'aeltere', 'rollstuhl'],
    recommendation: 'Rastplätze in Abständen von ca. 100–300 m ergänzen, besonders am Anfang und Ende von Steigungen.',
  },
  {
    id: 'F2', category: 'F',
    text: 'Sind Sitzgelegenheiten vorhanden und für unterschiedliche Menschen nutzbar?',
    hint: 'Sitzhöhe 46–48 cm, Rücken- und Armlehnen, daneben Stellfläche für Rollstuhl/Kinderwagen (≥ 1,50 × 1,50 m).',
    userGroups: ['gehbeeintraechtigt', 'aeltere', 'rollstuhl'],
    recommendation: 'Bänke mit Rücken- und Armlehnen in ergonomischer Sitzhöhe aufstellen und daneben befestigte Stellflächen für Rollstühle und Kinderwagen schaffen.',
  },
  {
    id: 'F3', category: 'F',
    text: 'Sind notwendige Einrichtungen wie Toiletten, Wetterschutz oder Trinkwasser zugänglich oder ausreichend ausgeschildert?',
    hint: 'Barrierefreies WC (ggf. Euroschlüssel) am Start oder in der Nähe, Unterstand, Trinkwasser; Hinweis auf nächstgelegene Einrichtungen.',
    userGroups: ALL,
    recommendation: 'Barrierefreie Toilette (z. B. mit Euroschlüssel) und Wetterschutz bereitstellen oder auf nahegelegene Einrichtungen deutlich hinweisen (vor Ort und online).',
  },

  // G. Partizipation und Nutzerorientierung
  {
    id: 'G1', category: 'G',
    text: 'Wurden Menschen mit unterschiedlichen Bedürfnissen in Planung, Erprobung oder Bewertung einbezogen?',
    hint: 'Beteiligung von Selbstvertretungsorganisationen, Behindertenbeiräten, Prüfgruppen, Testbegehungen.',
    userGroups: ALL,
    recommendation: 'Selbstvertretungen, Behindertenbeirat und Prüfgruppen in Planung, Testbegehungen und Evaluation einbinden und Rückmeldemöglichkeiten schaffen.',
  },
  {
    id: 'G2', category: 'G',
    text: 'Ermöglicht das Angebot eine selbstbestimmte Nutzung, gegebenenfalls auch mit Begleitpersonen?',
    hint: 'Nutzung ohne fremde Hilfe möglich, Angebote für Begleitpersonen, Führungen auf Anfrage.',
    userGroups: ALL,
    recommendation: 'Selbstständige Nutzung als Planungsziel verankern; ergänzend inklusive Führungen und Hinweise für Begleitpersonen anbieten.',
  },
]

function categoryWeight(id: CategoryId): number {
  return CATEGORIES.find((c) => c.id === id)!.weight
}

export const QUESTIONS: Question[] = QUESTION_DEFS.map((q) => {
  const count = QUESTION_DEFS.filter((x) => x.category === q.category).length
  return {
    ...q,
    weight: q.weightOverride ?? categoryWeight(q.category) / count,
    criticalBelow: q.criticalBelow ?? 1,
  }
})

export function questionsOf(category: CategoryId): Question[] {
  return QUESTIONS.filter((q) => q.category === category)
}

export function getQuestion(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id)
}

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id)!
}
