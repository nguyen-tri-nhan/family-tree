import { describe, it, expect } from 'vitest'
import { validateDocument } from '../utils/validateTree'
import type { FtreeDocument, Person, FamilyUnit } from '../types'
import { FTREE_VERSION } from '../types'

const NOW = '2024-01-01T00:00:00.000Z'

function makePerson(id: string, overrides: Partial<Person> = {}): Person {
  return {
    id,
    displayName: id,
    gender: 'male',
    isAlive: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

function makeFamily(id: string, personId: string, spouseId?: string, childIds: string[] = []): FamilyUnit {
  return {
    id,
    personId,
    spouseId,
    childIds,
    generation: 0,
    marriageStatus: spouseId ? 'married' : 'single',
  }
}

function makeDoc(persons: Person[], families: FamilyUnit[] = []): FtreeDocument {
  return {
    version: FTREE_VERSION,
    createdAt: NOW,
    updatedAt: NOW,
    clan: { id: 'c1', name: 'Test', surname: 'Test' },
    branches: [],
    persons,
    families,
  }
}

// ── Group A: individual person ────────────────────────────────────

describe('A1: death year before birth year', () => {
  it('returns error when death < birth', () => {
    const p = makePerson('p1', { isAlive: false, birthDate: { year: 1950, displayCalendar: 'solar' }, deathDate: { year: 1940, displayCalendar: 'solar' } })
    const issues = validateDocument(makeDoc([p]))
    expect(issues.some(i => i.rule === 'A1' && i.severity === 'error' && i.personIds.includes('p1'))).toBe(true)
  })

  it('no error when death > birth', () => {
    const p = makePerson('p1', { isAlive: false, birthDate: { year: 1950, displayCalendar: 'solar' }, deathDate: { year: 2000, displayCalendar: 'solar' } })
    expect(validateDocument(makeDoc([p])).filter(i => i.rule === 'A1')).toHaveLength(0)
  })
})

describe('A2: lifespan > 120 years', () => {
  it('warns when death - birth > 120', () => {
    const p = makePerson('p1', { isAlive: false, birthDate: { year: 1800, displayCalendar: 'solar' }, deathDate: { year: 1930, displayCalendar: 'solar' } })
    const issues = validateDocument(makeDoc([p]))
    expect(issues.some(i => i.rule === 'A2' && i.severity === 'warning')).toBe(true)
  })

  it('no warning when exactly 120', () => {
    const p = makePerson('p1', { isAlive: false, birthDate: { year: 1800, displayCalendar: 'solar' }, deathDate: { year: 1920, displayCalendar: 'solar' } })
    expect(validateDocument(makeDoc([p])).filter(i => i.rule === 'A2')).toHaveLength(0)
  })
})

describe('A3: birth year in the future', () => {
  it('warns when birth year > current year', () => {
    const futureYear = new Date().getFullYear() + 1
    const p = makePerson('p1', { birthDate: { year: futureYear, displayCalendar: 'solar' } })
    expect(validateDocument(makeDoc([p])).some(i => i.rule === 'A3')).toBe(true)
  })

  it('no warning for current year', () => {
    const p = makePerson('p1', { birthDate: { year: new Date().getFullYear(), displayCalendar: 'solar' } })
    expect(validateDocument(makeDoc([p])).filter(i => i.rule === 'A3')).toHaveLength(0)
  })
})

describe('A4: isAlive but has deathDate', () => {
  it('warns when isAlive=true but deathDate set', () => {
    const p = makePerson('p1', { isAlive: true, deathDate: { year: 2020, displayCalendar: 'solar' } })
    expect(validateDocument(makeDoc([p])).some(i => i.rule === 'A4')).toBe(true)
  })

  it('no warning when isAlive=false', () => {
    const p = makePerson('p1', { isAlive: false, deathDate: { year: 2020, displayCalendar: 'solar' } })
    expect(validateDocument(makeDoc([p])).filter(i => i.rule === 'A4')).toHaveLength(0)
  })
})

// ── Group B: parent-child ─────────────────────────────────────────

describe('B1: child born before or same year as parent', () => {
  it('error when child born same year as father', () => {
    const father = makePerson('dad', { birthDate: { year: 1950, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1950, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', undefined, ['kid'])
    expect(validateDocument(makeDoc([father, child], [fam])).some(i => i.rule === 'B1')).toBe(true)
  })

  it('error when child born before father', () => {
    const father = makePerson('dad', { birthDate: { year: 1960, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1940, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', undefined, ['kid'])
    expect(validateDocument(makeDoc([father, child], [fam])).some(i => i.rule === 'B1')).toBe(true)
  })

  it('error when child born same year as mother', () => {
    const father = makePerson('dad', { birthDate: { year: 1950, displayCalendar: 'solar' } })
    const mother = makePerson('mom', { gender: 'female', birthDate: { year: 1952, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1952, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', 'mom', ['kid'])
    expect(validateDocument(makeDoc([father, mother, child], [fam])).some(i => i.rule === 'B1')).toBe(true)
  })

  it('no error when child born well after parents', () => {
    const father = makePerson('dad', { birthDate: { year: 1950, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1975, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', undefined, ['kid'])
    expect(validateDocument(makeDoc([father, child], [fam])).filter(i => i.rule === 'B1')).toHaveLength(0)
  })
})

describe('B2: parent too young (< 14) when child born', () => {
  it('warns when father was 13 at child birth', () => {
    const father = makePerson('dad', { birthDate: { year: 1950, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1963, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', undefined, ['kid'])
    expect(validateDocument(makeDoc([father, child], [fam])).some(i => i.rule === 'B2')).toBe(true)
  })

  it('warns when mother was 13 at child birth', () => {
    const father = makePerson('dad', { birthDate: { year: 1950, displayCalendar: 'solar' } })
    const mother = makePerson('mom', { gender: 'female', birthDate: { year: 1952, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1965, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', 'mom', ['kid'])
    expect(validateDocument(makeDoc([father, mother, child], [fam])).some(i => i.rule === 'B2')).toBe(true)
  })

  it('no warning when father was 14', () => {
    const father = makePerson('dad', { birthDate: { year: 1950, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1964, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', undefined, ['kid'])
    expect(validateDocument(makeDoc([father, child], [fam])).filter(i => i.rule === 'B2')).toHaveLength(0)
  })
})

describe('B3: parent very old when child born', () => {
  it('warns when father was 71 at child birth', () => {
    const father = makePerson('dad', { birthDate: { year: 1900, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1971, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', undefined, ['kid'])
    expect(validateDocument(makeDoc([father, child], [fam])).some(i => i.rule === 'B3')).toBe(true)
  })

  it('warns when mother was 61 at child birth', () => {
    const father = makePerson('dad', { birthDate: { year: 1900, displayCalendar: 'solar' } })
    const mother = makePerson('mom', { gender: 'female', birthDate: { year: 1905, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1966, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', 'mom', ['kid'])
    expect(validateDocument(makeDoc([father, mother, child], [fam])).some(i => i.rule === 'B3')).toBe(true)
  })

  it('no warning for father at 70', () => {
    const father = makePerson('dad', { birthDate: { year: 1900, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1970, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', undefined, ['kid'])
    expect(validateDocument(makeDoc([father, child], [fam])).filter(i => i.rule === 'B3')).toHaveLength(0)
  })
})

describe('B4: child born more than 1 year after father died', () => {
  it('warns when child born 2 years after father death', () => {
    const father = makePerson('dad', { isAlive: false, deathDate: { year: 1950, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1952, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', undefined, ['kid'])
    expect(validateDocument(makeDoc([father, child], [fam])).some(i => i.rule === 'B4')).toBe(true)
  })

  it('no warning when child born same year as father death', () => {
    const father = makePerson('dad', { isAlive: false, deathDate: { year: 1950, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1950, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', undefined, ['kid'])
    expect(validateDocument(makeDoc([father, child], [fam])).filter(i => i.rule === 'B4')).toHaveLength(0)
  })

  it('no warning when child born 1 year after father death (posthumous)', () => {
    const father = makePerson('dad', { isAlive: false, deathDate: { year: 1950, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1951, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', undefined, ['kid'])
    expect(validateDocument(makeDoc([father, child], [fam])).filter(i => i.rule === 'B4')).toHaveLength(0)
  })
})

describe('B5: child born after mother died', () => {
  it('error when child born after mother death', () => {
    const father = makePerson('dad')
    const mother = makePerson('mom', { gender: 'female', isAlive: false, deathDate: { year: 1950, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1951, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', 'mom', ['kid'])
    expect(validateDocument(makeDoc([father, mother, child], [fam])).some(i => i.rule === 'B5' && i.severity === 'error')).toBe(true)
  })

  it('no error when child born same year as mother death', () => {
    const father = makePerson('dad')
    const mother = makePerson('mom', { gender: 'female', isAlive: false, deathDate: { year: 1950, displayCalendar: 'solar' } })
    const child  = makePerson('kid', { birthDate: { year: 1950, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'dad', 'mom', ['kid'])
    expect(validateDocument(makeDoc([father, mother, child], [fam])).filter(i => i.rule === 'B5')).toHaveLength(0)
  })
})

// ── Group C: spouses ──────────────────────────────────────────────

describe('C3: spouse age gap > 40 years', () => {
  it('warns when spouses are 41 years apart', () => {
    const husband = makePerson('h', { birthDate: { year: 1900, displayCalendar: 'solar' } })
    const wife    = makePerson('w', { gender: 'female', birthDate: { year: 1941, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'h', 'w')
    expect(validateDocument(makeDoc([husband, wife], [fam])).some(i => i.rule === 'C3')).toBe(true)
  })

  it('no warning when spouses are exactly 40 years apart', () => {
    const husband = makePerson('h', { birthDate: { year: 1900, displayCalendar: 'solar' } })
    const wife    = makePerson('w', { gender: 'female', birthDate: { year: 1940, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'h', 'w')
    expect(validateDocument(makeDoc([husband, wife], [fam])).filter(i => i.rule === 'C3')).toHaveLength(0)
  })

  it('warns regardless of which spouse is older', () => {
    const young = makePerson('y', { birthDate: { year: 1941, displayCalendar: 'solar' } })
    const old   = makePerson('o', { gender: 'female', birthDate: { year: 1900, displayCalendar: 'solar' } })
    const fam = makeFamily('f1', 'y', 'o')
    expect(validateDocument(makeDoc([young, old], [fam])).some(i => i.rule === 'C3')).toBe(true)
  })
})

// ── Clean doc has no issues ───────────────────────────────────────

describe('clean document', () => {
  it('returns empty array for valid document with no dates', () => {
    const persons = [makePerson('p1'), makePerson('p2', { gender: 'female' })]
    const families = [makeFamily('f1', 'p1', 'p2', [])]
    expect(validateDocument(makeDoc(persons, families))).toHaveLength(0)
  })

  it('returns empty array for typical 3-gen family', () => {
    const grandfather = makePerson('gf', { birthDate: { year: 1920, displayCalendar: 'solar' }, isAlive: false, deathDate: { year: 2000, displayCalendar: 'solar' } })
    const father      = makePerson('f',  { birthDate: { year: 1948, displayCalendar: 'solar' } })
    const mother      = makePerson('m',  { gender: 'female', birthDate: { year: 1950, displayCalendar: 'solar' } })
    const child       = makePerson('c',  { birthDate: { year: 1975, displayCalendar: 'solar' } })
    const f1 = makeFamily('f1', 'gf', undefined, ['f'])
    const f2 = makeFamily('f2', 'f', 'm', ['c'])
    expect(validateDocument(makeDoc([grandfather, father, mother, child], [f1, f2]))).toHaveLength(0)
  })
})
