import { describe, test, expect } from 'vitest'
import { computeKinship, getSiblingOrdinal } from '../kinship'
import { makeTestDoc } from './fixtures'

// ── getSiblingOrdinal ────────────────────────────────────────────

describe('getSiblingOrdinal', () => {
  test('youngest always returns Út', () => {
    expect(getSiblingOrdinal(0, true, 'north')).toBe('Út')
    expect(getSiblingOrdinal(5, true, 'south')).toBe('Út')
  })

  test('north: 1st child is Cả', () => {
    expect(getSiblingOrdinal(0, false, 'north')).toBe('Cả')
  })

  test('north: 2nd child is Hai', () => {
    expect(getSiblingOrdinal(1, false, 'north')).toBe('Hai')
  })

  test('south: 1st child is Hai', () => {
    expect(getSiblingOrdinal(0, false, 'south')).toBe('Hai')
  })

  test('south: 2nd child is Ba', () => {
    expect(getSiblingOrdinal(1, false, 'south')).toBe('Ba')
  })

  test('north: 3rd child is Ba', () => {
    expect(getSiblingOrdinal(2, false, 'north')).toBe('Ba')
  })
})

// ── computeKinship — null cases ──────────────────────────────────

describe('computeKinship — edge cases', () => {
  test('returns null when viewer === target', () => {
    const doc = makeTestDoc()
    expect(computeKinship(doc, 'p5', 'p5', 'north')).toBeNull()
  })

  test('returns null when target not in document', () => {
    const doc = makeTestDoc()
    expect(computeKinship(doc, 'p5', 'pXXX', 'north')).toBeNull()
  })

  test('returns null when no common ancestor', () => {
    const doc = makeTestDoc()
    const unrelated = { id: 'pU', displayName: 'Unrelated', gender: 'male' as const, isAlive: true, createdAt: '', updatedAt: '' }
    const d = { ...doc, persons: [...doc.persons, unrelated] }
    expect(computeKinship(d, 'p5', 'pU', 'north')).toBeNull()
  })
})

// ── computeKinship — direct line ─────────────────────────────────

describe('computeKinship — direct parent/grandparent', () => {
  test('p5 → p3: father (north = Bố)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p3', 'north')
    expect(r?.label).toBe('Bố')
    expect(r?.selfLabel).toBe('Con')
    expect(r?.genDelta).toBe(1)
  })

  test('p5 → p3: father (south = Ba)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p3', 'south')
    expect(r?.label).toBe('Ba')
  })

  test('p3 → p5: child', () => {
    const r = computeKinship(makeTestDoc(), 'p3', 'p5', 'north')
    expect(r?.label).toBe('Con')
    expect(r?.selfLabel).toBe('Bố')
  })

  test('p5 → p1: grandfather', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p1', 'north')
    expect(r?.label).toBe('Ông')
    expect(r?.selfLabel).toBe('Cháu')
    expect(r?.genDelta).toBe(2)
  })

  test('p5 → p2: grandmother (via in-law resolution)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p2', 'north')
    expect(r?.label).toBe('Bà')
  })
})

// ── computeKinship — uncle/aunt ──────────────────────────────────

describe('computeKinship — uncle (younger sibling of father)', () => {
  test('p5 → p4: Chú Út (p4 is youngest child of p1)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p4', 'north')
    expect(r?.label).toBe('Chú Út')
    expect(r?.selfLabel).toBe('Cháu')
    expect(r?.genDelta).toBe(1)
  })
})

// ── computeKinship — siblings ────────────────────────────────────

describe('computeKinship — siblings', () => {
  test('p3 → p4: elder calls younger "Em Út"', () => {
    const r = computeKinship(makeTestDoc(), 'p3', 'p4', 'north')
    expect(r?.label).toBe('Em Út')
    expect(r?.selfLabel).toBe('Anh')
  })

  test('p4 → p3: younger calls elder "Anh Cả"', () => {
    const r = computeKinship(makeTestDoc(), 'p4', 'p3', 'north')
    expect(r?.label).toBe('Anh Cả')
    expect(r?.selfLabel).toBe('Em')
  })
})

// ── computeKinship — cousins ─────────────────────────────────────

describe('computeKinship — cousins', () => {
  // p5 is from senior branch (p3=1st child of p1)
  // p6, p7 are from junior branch (p4=2nd child of p1)

  test('p5 → p6: senior branch calls junior "Em họ"', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p6', 'north')
    expect(r?.label).toBe('Em họ')
    expect(r?.selfLabel).toBe('Anh họ')
    expect(r?.genDelta).toBe(0)
  })

  test('p5 → p7: female cousin from junior branch is also "Em họ"', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p7', 'north')
    expect(r?.label).toBe('Em họ')
  })

  test('p6 → p5: junior branch calls senior "Anh họ"', () => {
    const r = computeKinship(makeTestDoc(), 'p6', 'p5', 'north')
    expect(r?.label).toBe('Anh họ')
    expect(r?.selfLabel).toBe('Em')
  })
})

// ── computeKinship — spouse ──────────────────────────────────────

describe('computeKinship — spouse', () => {
  test('p1 → p2: Vợ', () => {
    const r = computeKinship(makeTestDoc(), 'p1', 'p2', 'north')
    expect(r?.label).toBe('Vợ')
    expect(r?.genDelta).toBe(0)
  })

  test('p2 → p1: Chồng', () => {
    const r = computeKinship(makeTestDoc(), 'p2', 'p1', 'north')
    expect(r?.label).toBe('Chồng')
  })
})

// ── computeKinship — path ────────────────────────────────────────

describe('computeKinship — path', () => {
  test('parent path is [child, parent]', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p3', 'north')
    expect(r?.path).toEqual(['p5', 'p3'])
  })

  test('grandparent path is [grandchild, parent, grandparent]', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p1', 'north')
    expect(r?.path).toEqual(['p5', 'p3', 'p1'])
  })

  test('cousin path goes through LCA', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p6', 'north')
    // p5 → p3 → p1 (LCA) → p4 → p6
    expect(r?.path).toEqual(['p5', 'p3', 'p1', 'p4', 'p6'])
  })
})
