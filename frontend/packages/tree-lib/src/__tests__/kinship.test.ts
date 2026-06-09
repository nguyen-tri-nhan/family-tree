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

  test('p5 → p1: Ông nội (paternal grandfather)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p1', 'north')
    expect(r?.label).toBe('Ông nội')
    expect(r?.selfLabel).toBe('Cháu')
    expect(r?.genDelta).toBe(2)
  })

  test('p5 → p2: Bà nội (paternal grandmother, via in-law resolution)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p2', 'north')
    expect(r?.label).toBe('Bà nội')
  })
})

// ── computeKinship — uncle/aunt (paternal) ───────────────────────

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

// ── computeKinship — path + lcaIndex ─────────────────────────────

describe('computeKinship — path + lcaIndex', () => {
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

  test('direct ancestor: lcaIndex = path.length - 1', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p1', 'north')
    expect(r?.lcaIndex).toBe(r!.path.length - 1)
  })

  test('cousin: lcaIndex points to LCA in middle of path', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p6', 'north')
    // path = [p5, p3, p1, p4, p6] → LCA p1 at index 2
    expect(r?.lcaIndex).toBe(2)
    expect(r?.path[r.lcaIndex]).toBe('p1')
  })
})

// ── Fix 2c: ordinal cho anh/em của ông ─────────────────────────

describe('Fix 2c — ordinal for ông sibling (genDelta=2)', () => {
  test('p5 → p11: Ông nội Cả (p11 is 1st child of p00, branchRank≠0)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p11', 'north')
    expect(r?.label).toBe('Ông nội Cả')
    expect(r?.genDelta).toBe(2)
  })

  test('p5 → p1: Ông nội (direct grandparent, branchRank=0 → no ordinal)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p1', 'north')
    expect(r?.label).toBe('Ông nội')
  })

  test('p11 → p5: Cháu (p11 looking down at p5)', () => {
    const r = computeKinship(makeTestDoc(), 'p11', 'p5', 'north')
    expect(r?.label).toBe('Cháu')
    expect(r?.genDelta).toBe(-2)
  })
})

// ── Fix 2f: applyInLaw ascending — Bố/Ba → Mẹ/Má ───────────────

describe('Fix 2f — child calls parent spouse (mẹ/bố)', () => {
  test('p5 → p8: Mẹ (north) — vợ của bố phải là Mẹ', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p8', 'north')
    expect(r?.label).toBe('Mẹ')
    expect(r?.selfLabel).toBe('Con')
  })

  test('p5 → p8: Má (south)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p8', 'south')
    expect(r?.label).toBe('Má')
  })

  test('p5 → p2: Bà nội (p2 là vợ ông nội)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p2', 'north')
    expect(r?.label).toBe('Bà nội')
  })
})

// ── Fix 2g: con dâu/rể dùng kinship của chồng ───────────────────

describe('Fix 2g — con dâu/rể inherits spouse kinship', () => {
  test('p9 → p3: Bố (dâu gọi cha chồng như chồng gọi)', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p3', 'north')
    expect(r?.label).toBe('Bố')
    expect(r?.selfLabel).toBe('Con')
  })

  test('p9 → p8: Mẹ (dâu gọi mẹ chồng)', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p8', 'north')
    expect(r?.label).toBe('Mẹ')
  })

  test('p9 → p4: Chú Út (dâu gọi chú chồng)', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p4', 'north')
    expect(r?.label).toBe('Chú Út')
  })

  test('p9 → p1: Ông nội (dâu gọi ông chồng)', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p1', 'north')
    expect(r?.label).toBe('Ông nội')
  })

  test('p9 → p2: Bà nội (dâu gọi bà chồng — p2 là in-law của p1)', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p2', 'north')
    expect(r?.label).toBe('Bà nội')
  })

  test('p9 → p6: Em họ (dâu gọi em họ chồng)', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p6', 'north')
    expect(r?.label).toBe('Em họ')
  })

  test('p9 path starts with p9, then follows p5 lineage', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p3', 'north')
    expect(r?.path[0]).toBe('p9')
    expect(r?.path[1]).toBe('p5')
  })

  test('previously returned null — now returns result', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p1', 'north')
    expect(r).not.toBeNull()
  })
})

// ── Fix 2a: nội / ngoại ─────────────────────────────────────────

describe('Fix 2a — nội/ngoại distinction (paternal vs maternal grandparents)', () => {
  // Paternal side: p1 (ông nội), p2 (bà nội), p11 (ông nội Cả)
  // Maternal side: p10 (ông ngoại), p12 (bà ngoại)

  test('p5 → p1: Ông nội (paternal)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p1', 'north')
    expect(r?.label).toBe('Ông nội')
  })

  test('p5 → p2: Bà nội (paternal grandmother)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p2', 'north')
    expect(r?.label).toBe('Bà nội')
  })

  test('p5 → p10: Ông ngoại (maternal grandfather)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p10', 'north')
    expect(r?.label).toBe('Ông ngoại')
    expect(r?.genDelta).toBe(2)
  })

  test('p5 → p12: Bà ngoại (maternal grandmother, via in-law resolution)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p12', 'north')
    expect(r?.label).toBe('Bà ngoại')
  })

  test('p5 → p11: Ông nội Cả (sibling of ông nội — still paternal)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p11', 'north')
    expect(r?.label).toBe('Ông nội Cả')
  })

  test('p10 → p5: Cháu (ông ngoại looking down)', () => {
    const r = computeKinship(makeTestDoc(), 'p10', 'p5', 'north')
    expect(r?.label).toBe('Cháu')
    expect(r?.genDelta).toBe(-2)
  })

  test('maternal grandparent path goes through p8', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p10', 'north')
    // p5 → p8 → p10
    expect(r?.path).toEqual(['p5', 'p8', 'p10'])
    expect(r?.lcaIndex).toBe(2)
  })
})

// ── Fix 2b: Cậu / Dì (maternal uncle/aunt) ──────────────────────

describe('Fix 2b — Cậu/Dì (siblings of mother)', () => {
  // p13 is p8's sibling (child of p10/p12) — maternal uncle of p5
  // f5.childIds = ['p8', 'p13'] → p8=Cả, p13=Út

  test('p5 → p13: Cậu Út (p13 là em trai của mẹ p8)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p13', 'north')
    expect(r?.label).toBe('Cậu Út')
    expect(r?.selfLabel).toBe('Cháu')
    expect(r?.genDelta).toBe(1)
  })

  test('p13 → p5: Cháu (Cậu nhìn xuống cháu)', () => {
    const r = computeKinship(makeTestDoc(), 'p13', 'p5', 'north')
    expect(r?.label).toBe('Cháu')
  })

  test('p5 → p13 path goes through p8 (mother)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p13', 'north')
    // p5 → p8 → p10 (LCA) → p13
    expect(r?.path).toEqual(['p5', 'p8', 'p10', 'p13'])
    expect(r?.lcaIndex).toBe(2)
  })

  test('p9 → p13: Cậu Út (dâu gọi cậu chồng)', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p13', 'north')
    expect(r?.label).toBe('Cậu Út')
  })
})

// ── Fix 2d: vợ/chồng của anh/em họ ─────────────────────────────

describe('Fix 2d — in-law of cousin', () => {
  // Need a female cousin to test "chị dâu họ" case
  // p7 (f, Em họ gái) — chị/em của p5's cousin from p4's branch
  // For "anh rể họ" we'd need a male married to p7, but fixture doesn't have that.
  // We can test applyInLaw logic via the existing Anh/Chị mapping.

  test('p9 → p6: Em họ (blood cousin, unchanged)', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p6', 'north')
    expect(r?.label).toBe('Em họ')
  })
})
