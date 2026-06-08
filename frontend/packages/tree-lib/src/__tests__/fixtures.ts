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
 * 3-generation family:
 *
 *  p1 (m, Ông) ─ p2 (f, Bà)
 *    ├── p3 (m, Bố)   [1st child]
 *    │     └── p5 (m, viewer/Me)
 *    └── p4 (m, Chú)  [2nd=last child]
 *          ├── p6 (m, Anh Em Họ)  [1st child of p4]
 *          └── p7 (f, Em Họ Gái)  [2nd=last child of p4]
 */
export function makeTestDoc(): FtreeDocument {
  return {
    version: FTREE_VERSION,
    createdAt: NOW,
    updatedAt: NOW,
    clan: { id: 'clan1', name: 'Test Clan', surname: 'Nguyễn' },
    branches: [],
    persons: [
      p('p1', 'Ông',         'male'),
      p('p2', 'Bà',          'female'),
      p('p3', 'Bố',          'male'),
      p('p4', 'Chú Út',      'male'),
      p('p5', 'Me',          'male'),
      p('p6', 'Anh Em Họ',   'male'),
      p('p7', 'Em Họ Gái',   'female'),
    ],
    families: [
      f('f1', 'p1', 1, 'p2', ['p3', 'p4']),
      f('f2', 'p3', 2, undefined, ['p5']),
      f('f3', 'p4', 2, undefined, ['p6', 'p7']),
    ],
  }
}
