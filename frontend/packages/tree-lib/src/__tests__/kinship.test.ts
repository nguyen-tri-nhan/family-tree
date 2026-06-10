import { describe, test, expect } from 'vitest'
import { computeKinship, getSiblingOrdinal } from '../kinship'
import { makeTestDoc } from './fixtures'
import type { FtreeDocument } from '../types'
import { FTREE_VERSION } from '../types'

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
    expect(r?.label).toBe('Em (họ)')
    expect(r?.selfLabel).toBe('Anh (họ)')
    expect(r?.genDelta).toBe(0)
  })

  test('p5 → p7: female cousin from junior branch is also "Em họ"', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p7', 'north')
    expect(r?.label).toBe('Em (họ)')
  })

  test('p6 → p5: junior branch calls senior "Anh Út họ" (p5 is only child → Út), selfLabel "Em họ"', () => {
    const r = computeKinship(makeTestDoc(), 'p6', 'p5', 'north')
    expect(r?.label).toBe('Anh Út (họ)')
    expect(r?.selfLabel).toBe('Em (họ)')
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

  test('in-law target: blood person stays in path before in-law', () => {
    // p5 → p2: p2 is in-law (spouseId) of p1. Path must include p1 before p2.
    const r = computeKinship(makeTestDoc(), 'p5', 'p2', 'north')
    expect(r?.path).toEqual(['p5', 'p3', 'p1', 'p2'])
    expect(r?.lcaIndex).toBe(2) // LCA is p1 at index 2
  })

  test('in-law viewer: marriage edge from viewer to blood is path start', () => {
    // p9 (viewer=dâu) → p13: path starts [p9, p5, ...]
    const r = computeKinship(makeTestDoc(), 'p9', 'p13', 'north')
    expect(r?.path[0]).toBe('p9')
    expect(r?.path[1]).toBe('p5')
    expect(r?.path[r!.path.length - 1]).toBe('p13')
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
    expect(r?.label).toBe('Em (họ)')
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

// ── Fix 2d: vợ/chồng của anh/em họ + họ hàng xa đời ─────────────

const NOW = '2024-01-01T00:00:00.000Z'
function mkP(id: string, gender: 'male' | 'female'): FtreeDocument['persons'][0] {
  return { id, displayName: id, gender, isAlive: true, createdAt: NOW, updatedAt: NOW }
}
function mkF(id: string, personId: string, gen: number, spouseId?: string, childIds: string[] = []): FtreeDocument['families'][0] {
  return { id, personId, generation: gen, spouseId, childIds, marriageStatus: spouseId ? 'married' : 'single' }
}

describe('Fix 2d Case1 — vợ/chồng của anh/em họ', () => {
  test('p9 → p6: Em họ (blood cousin, unchanged)', () => {
    const r = computeKinship(makeTestDoc(), 'p9', 'p6', 'north')
    expect(r?.label).toBe('Em (họ)')
  })

  // p6 views p5 as "Anh Út họ" (p5 is only child → Út). p5's wife is p9 → "Chị (dâu) Út họ"
  test('p6 → p9: Chị (dâu) Út họ (wife of Anh Út họ p5)', () => {
    const r = computeKinship(makeTestDoc(), 'p6', 'p9', 'north')
    expect(r?.label).toBe('Chị (dâu) Út (họ)')
    // Path must include p5 (blood) before p9 (in-law): edge p5→p9 is the marriage line
    expect(r?.path).toEqual(['p6', 'p4', 'p1', 'p3', 'p5', 'p9'])
  })

  // p14 is husband of p7 (Em Họ Gái). "Em họ" bloodLabel hits fallback in applyInLaw.
  // "Em rể họ" needs blood gender in applyInLaw — deferred to K3 follow-up.
  test('p5 → p14: Em họ (husband of Em Họ Gái p7 — current fallback)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p14', 'north')
    expect(r?.label).toBe('Em (họ)')
  })
})

// Case 2: second+ cousins (depth ≥ 3 from LCA)
// root (m) → branchA (m) → ac (m) → viewer (m)   ← depth 3 from root
//          → branchB (m) → bc (m) → target (m)   ← depth 3 from root
function makeSecondCousinDoc(): FtreeDocument {
  return {
    version: FTREE_VERSION,
    createdAt: NOW, updatedAt: NOW,
    clan: { id: 'c1', name: 'Test', surname: 'T' },
    branches: [],
    persons: [
      mkP('root', 'male'),
      mkP('a',    'male'), mkP('ac', 'male'), mkP('v', 'male'),
      mkP('b',    'male'), mkP('bc', 'male'), mkP('t', 'male'),
    ],
    families: [
      mkF('f0', 'root', 0, undefined, ['a', 'b']),
      mkF('f1', 'a',    1, undefined, ['ac']),
      mkF('f2', 'ac',   2, undefined, ['v']),
      mkF('f3', 'b',    1, undefined, ['bc']),
      mkF('f4', 'bc',   2, undefined, ['t']),
    ],
  }
}

describe('Fix 2d Case2 — họ hàng xa chi tiết', () => {
  test('first cousins: senior target gets ordinal ("Anh Út họ"), junior stays "Em họ" (depth 2)', () => {
    expect(computeKinship(makeTestDoc(), 'p6', 'p5', 'north')?.label).toBe('Anh Út (họ)')
    expect(computeKinship(makeTestDoc(), 'p5', 'p6', 'north')?.label).toBe('Em (họ)')
  })

  test('second cousins: v → t "Em họ 2 đời" (depth 3 from root)', () => {
    const r = computeKinship(makeSecondCousinDoc(), 'v', 't', 'north')
    expect(r?.label).toBe('Em (họ 2 đời)')
    expect(r?.genDelta).toBe(0)
  })

  test('second cousins: t → v "Anh Út họ 2 đời" (v is only child → Út)', () => {
    const r = computeKinship(makeSecondCousinDoc(), 't', 'v', 'north')
    expect(r?.label).toBe('Anh Út (họ 2 đời)')
  })

  test('selfLabel is "Anh họ 2 đời"/"Em họ 2 đời"', () => {
    const rv = computeKinship(makeSecondCousinDoc(), 'v', 't', 'north')
    expect(rv?.selfLabel).toBe('Anh (họ 2 đời)')
    const rt = computeKinship(makeSecondCousinDoc(), 't', 'v', 'north')
    expect(rt?.selfLabel).toBe('Em (họ 2 đời)')
  })
})

// ── Bug fix: female as personId in family ───────────────────────
// f6: personId=p7 (FEMALE), spouseId=p14 (male), childIds=[p15]
// Without fix: p7 treated as "father" → p4 appears as nội → "Ông nội"
// With fix: gender check at depth=0 → p7 is female → p4 is ngoại → "Ông ngoại"

describe('Female personId bug fix — correct viaMother when mother is family head', () => {
  test('p15 → p7: Mẹ (female personId is still the mother)', () => {
    const r = computeKinship(makeTestDoc(), 'p15', 'p7', 'north')
    expect(r?.label).toBe('Mẹ')
    expect(r?.selfLabel).toBe('Con')
    expect(r?.genDelta).toBe(1)
  })

  test('p15 → p14: Bố (male spouseId is the father)', () => {
    const r = computeKinship(makeTestDoc(), 'p15', 'p14', 'north')
    expect(r?.label).toBe('Bố')
    expect(r?.genDelta).toBe(1)
  })

  test('p15 → p4: Ông ngoại (NOT Ông nội — p4 is mother p7s father)', () => {
    const r = computeKinship(makeTestDoc(), 'p15', 'p4', 'north')
    expect(r?.label).toBe('Ông ngoại')
    expect(r?.genDelta).toBe(2)
  })

  test('p5 → p00: Ông Cụ nội (direct paternal line, north)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p00', 'north')
    expect(r?.label).toBe('Ông Cụ nội')
    expect(r?.genDelta).toBe(3)
  })

  test('p5 → p00: Ông Cố nội (direct paternal line, south)', () => {
    const r = computeKinship(makeTestDoc(), 'p5', 'p00', 'south')
    expect(r?.label).toBe('Ông Cố nội')
    expect(r?.genDelta).toBe(3)
  })

  test('p00 → p5: Chắt / selfLabel Ông Cụ (p00 is male, north)', () => {
    const r = computeKinship(makeTestDoc(), 'p00', 'p5', 'north')
    expect(r?.label).toBe('Chắt')
    expect(r?.selfLabel).toBe('Ông Cụ')
    expect(r?.genDelta).toBe(-3)
  })

  test('p15 → p1: Ông Cụ ngoại (3 levels up via maternal chain, p1 is male)', () => {
    const r = computeKinship(makeTestDoc(), 'p15', 'p1', 'north')
    expect(r?.label).toBe('Ông Cụ ngoại')
    expect(r?.genDelta).toBe(3)
  })

  test('p15 → p5: Cậu Út (p5 is 1 gen above p15; reached via p7/mother isMaternal=true)', () => {
    // p15 depth-to-p1=3 (p15→p7→p4→p1), p5 depth-to-p1=2 (p5→p3→p1) → genDelta=1, isMaternal
    const r = computeKinship(makeTestDoc(), 'p15', 'p5', 'north')
    expect(r?.genDelta).toBe(1)
    expect(r?.label).toBe('Cậu Út')
  })
})
