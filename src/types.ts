import type { AnswerValue } from './config/rating'

export interface Measurement {
  id: string
  label: string
  value: string
  unit: string
}

export interface Answer {
  value: AnswerValue
  comment: string
  measurements: Measurement[]
  photoIds: string[]
}

export interface Section {
  id: string
  name: string
  lengthM: number | null
  startDesc: string
  endDesc: string
  answers: Record<string, Answer>
}

export interface Trail {
  id: string
  name: string
  location: string
  lengthKm: number | null
  description: string
  topic: string
  operator: string
  assessor: string
  date: string
  createdAt: string
  updatedAt: string
  sections: Section[]
}
