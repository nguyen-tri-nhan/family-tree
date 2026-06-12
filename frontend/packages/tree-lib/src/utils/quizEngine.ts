import type { FtreeDocument, Person } from '../types'
import { computeKinship } from '../kinship'
import type { KinshipResult, Region } from '../kinship'

export interface QuizQuestion {
  targetId:     string
  correct:      string
  choices:      string[]
  correctIndex: number
}

export interface QuizSession {
  playerId:  string
  questions: QuizQuestion[]
  answers:   (number | null)[]
  current:   number
}

const KINSHIP_POOLS: Record<string, string[]> = {
  'Bố':     ['Mẹ', 'Bác', 'Chú', 'Cậu'],
  'Ba':     ['Má', 'Bác', 'Chú', 'Cậu'],
  'Mẹ':     ['Bố', 'Bác', 'Cô', 'Dì'],
  'Má':     ['Ba', 'Bác', 'Cô', 'Dì'],
  'Chú':    ['Bác', 'Cô', 'Cậu', 'Bố'],
  'Cô':     ['Chú', 'Bác', 'Dì', 'Mẹ'],
  'Cậu':    ['Chú', 'Bác', 'Cô', 'Dì'],
  'Dì':     ['Cô', 'Mẹ', 'Bác', 'Cậu'],
  'Bác':    ['Chú', 'Cô', 'Cậu', 'Dì'],
  'Ông':    ['Bà', 'Ông Cụ', 'Bà Cụ', 'Bác'],
  'Bà':     ['Ông', 'Ông Cụ', 'Bà Cụ', 'Cô'],
  'Cụ':     ['Ông', 'Bà', 'Ông Cụ', 'Bà Cụ'],
  'Ông Cụ': ['Bà Cụ', 'Ông', 'Bà', 'Cụ'],
  'Bà Cụ':  ['Ông Cụ', 'Ông', 'Bà', 'Cụ'],
  'Con':    ['Cháu', 'Em', 'Anh', 'Chị'],
  'Cháu':   ['Con', 'Em', 'Chắt'],
  'Chắt':   ['Cháu', 'Con', 'Chút'],
  'Anh':    ['Em', 'Chị', 'Anh họ', 'Chú'],
  'Chị':    ['Em', 'Anh', 'Chị họ', 'Cô'],
  'Em':     ['Anh', 'Chị', 'Con', 'Cháu'],
  'Chồng':  ['Vợ', 'Anh', 'Em'],
  'Vợ':     ['Chồng', 'Chị', 'Em'],
}

function stripOrdinal(label: string): string {
  return label
    .replace(/\s+(Hai|Ba|Tư|Năm|Sáu|Bảy|Tám|Chín|Mười\w*)$/, '')
    .trim()
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateDistractors(correct: string, allLabels: string[], count: number): string[] {
  const correctBase = stripOrdinal(correct)
  const seen = new Set<string>([correct, correctBase])
  const result: string[] = []

  for (const term of shuffle(KINSHIP_POOLS[correctBase] ?? KINSHIP_POOLS[correct] ?? [])) {
    if (!seen.has(term) && result.length < count) {
      seen.add(term)
      result.push(term)
    }
  }

  if (result.length < count) {
    for (const label of shuffle(allLabels)) {
      if (result.length >= count) break
      const base = stripOrdinal(label)
      if (!seen.has(label) && base !== correctBase) {
        seen.add(label)
        seen.add(base)
        result.push(label)
      }
    }
  }

  if (result.length < count) {
    for (const term of shuffle([...new Set(Object.values(KINSHIP_POOLS).flat())])) {
      if (result.length >= count) break
      if (!seen.has(term)) {
        seen.add(term)
        result.push(term)
      }
    }
  }

  return result.slice(0, count)
}

export function generateQuiz(doc: FtreeDocument, playerId: string, count = 8): QuizSession {
  const region: Region = doc.clan.region ?? 'north'
  const candidates = doc.persons.filter(p => p.id !== playerId)

  const withKinship: { p: Person; k: KinshipResult }[] = candidates.flatMap(p => {
    const k = computeKinship(doc, playerId, p.id, region)
    return k ? [{ p, k }] : []
  })

  if (withKinship.length === 0) return { playerId, questions: [], answers: [], current: 0 }

  const allLabels = withKinship.map(x => x.k.label)
  const selected  = shuffle(withKinship).slice(0, Math.min(count, withKinship.length))

  const questions: QuizQuestion[] = selected.map(({ p, k }) => {
    const correct   = k.label
    const distractors = generateDistractors(correct, allLabels, 3)
    const choices   = shuffle([correct, ...distractors])
    return { targetId: p.id, correct, choices, correctIndex: choices.indexOf(correct) }
  })

  return { playerId, questions, answers: questions.map(() => null), current: 0 }
}
