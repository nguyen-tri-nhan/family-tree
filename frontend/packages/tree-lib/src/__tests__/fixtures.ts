import type { FtreeDocument, FamilyUnit, Person } from '../types'
import { FTREE_VERSION } from '../types'

const NOW = '2024-01-01T00:00:00.000Z'

function p(id: string, name: string, gender: 'male' | 'female'): Person {
  return { id, displayName: name, gender, isAlive: true, createdAt: NOW, updatedAt: NOW }
}

function f(
  id: string, personId: string, gen: number,
  spouseId?: string, childIds: string[] = [],
): FamilyUnit {
  return {
    id, personId, generation: gen,
    spouseId, childIds,
    marriageStatus: spouseId ? 'married' : 'single',
  }
}

/**
 * 4-generation family with maternal branch:
 *
 *  p00 (m, Cụ)
 *    ├── p11 (m, Ông Cả nội)  [1st child of p00 — older than p1]
 *    └── p1  (m, Ông nội)  [2nd child of p00] ─ p2 (f, Bà nội)
 *              ├── p3 (m, Bố) [1st child]  ─ p8 (f, Mẹ) ←─ child of p10/p12 below
 *              │     └── p5 (m, Me) ─ p9 (f, Vợ/Dâu)
 *              └── p4 (m, Chú Út) [2nd=last child]
 *                    ├── p6 (m, Anh Em Họ)  [1st child of p4]
 *                    └── p7 (f, Em Họ Gái)  [2nd=last child of p4]
 *
 *  p10 (m, Ông ngoại) ─ p12 (f, Bà ngoại)
 *    ├── p8  (f, Mẹ = p3's wife)  [1st child]
 *    └── p13 (m, Cậu Út)          [2nd=last child]
 */
export function makeTestDoc(): FtreeDocument {
  return {
    version: FTREE_VERSION,
    createdAt: NOW,
    updatedAt: NOW,
    clan: { id: 'clan1', name: 'Test Clan', surname: 'Nguyễn' },
    branches: [],
    persons: [
      p('p00', 'Cụ',          'male'),
      p('p11', 'Ông Cả nội',  'male'),
      p('p1',  'Ông nội',     'male'),
      p('p2',  'Bà nội',      'female'),
      p('p3',  'Bố',          'male'),
      p('p4',  'Chú Út',      'male'),
      p('p5',  'Me',          'male'),
      p('p6',  'Anh Em Họ',   'male'),
      p('p7',  'Em Họ Gái',   'female'),
      p('p8',  'Mẹ',          'female'),
      p('p9',  'Vợ',          'female'),
      p('p10', 'Ông ngoại',   'male'),
      p('p12', 'Bà ngoại',    'female'),
      p('p13', 'Cậu Út',      'male'),
    ],
    families: [
      f('f0', 'p00', 0, undefined, ['p11', 'p1']),
      f('f1', 'p1',  1, 'p2',     ['p3', 'p4']),
      f('f2', 'p3',  2, 'p8',     ['p5']),
      f('f3', 'p4',  2, undefined, ['p6', 'p7']),
      f('f4', 'p5',  3, 'p9',     []),
      f('f5', 'p10', 1, 'p12',    ['p8', 'p13']),  // p8 first, p13 last → Cậu Út
    ],
  }
}
