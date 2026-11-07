export type Score = 0 | 1 | 2 | 3 | 4
export type AnswerValue = Score | 'na' | 'unknown' | null

export interface ScaleOption {
  value: Exclude<AnswerValue, null>
  short: string
  label: string
  description: string
}

export const SCALE: ScaleOption[] = [
  { value: 0, short: '0', label: 'Nicht erfüllt', description: 'Fehlt vollständig oder stellt eine erhebliche Barriere dar' },
  { value: 1, short: '1', label: 'Kaum erfüllt', description: 'Nur minimale Umsetzung' },
  { value: 2, short: '2', label: 'Teilweise erfüllt', description: 'Umsetzung vorhanden, aber mit Einschränkungen' },
  { value: 3, short: '3', label: 'Weitgehend erfüllt', description: 'Gute Umsetzung mit kleineren Einschränkungen' },
  { value: 4, short: '4', label: 'Vollständig erfüllt', description: 'Ohne wesentliche Einschränkungen umgesetzt' },
  { value: 'na', short: 'N/A', label: 'Nicht zutreffend', description: 'Kriterium ist für diesen Abschnitt nicht relevant – Gewicht wird aus der Berechnung herausgenommen' },
  { value: 'unknown', short: '?', label: 'Nicht beurteilbar', description: 'Nicht genügend Informationen – Bewertung wird als unvollständig gekennzeichnet' },
]

export function scaleLabel(value: AnswerValue): string {
  if (value === null) return 'Offen'
  return SCALE.find((s) => s.value === value)?.label ?? String(value)
}

export interface Level {
  min: number // inklusive Untergrenze (gerundeter Prozentwert)
  max: number
  label: string
  key: 'sehr-gering' | 'gering' | 'mittel' | 'hoch' | 'sehr-hoch'
}

/** Einstufung nach gerundetem Prozentwert. Eigener Projektvorschlag – keine normierte Bewertung. */
export const LEVELS: Level[] = [
  { min: 0, max: 20, label: 'Sehr gering', key: 'sehr-gering' },
  { min: 21, max: 40, label: 'Gering', key: 'gering' },
  { min: 41, max: 60, label: 'Mittel', key: 'mittel' },
  { min: 61, max: 80, label: 'Hoch', key: 'hoch' },
  { min: 81, max: 100, label: 'Sehr hoch', key: 'sehr-hoch' },
]

export const DISCLAIMER =
  'Die Einteilung in Barrierefreiheits-Stufen ist ein eigener Projektvorschlag. Sie stellt keine anerkannte Zertifizierung oder normierte Bewertung dar. Die Grenzwerte sollten methodisch begründet und durch eine praktische Erprobung überprüft werden.'
