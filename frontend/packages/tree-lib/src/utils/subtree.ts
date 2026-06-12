import type { FtreeDocument } from '../types'
import { buildIndex } from '../types'

export function extractSubtree(doc: FtreeDocument, rootPersonId: string): FtreeDocument {
  const { familiesByPerson } = buildIndex(doc)

  const included = new Set<string>()
  const queue = [rootPersonId]

  while (queue.length > 0) {
    const pid = queue.shift()!
    if (included.has(pid)) continue
    included.add(pid)
    for (const f of familiesByPerson.get(pid) ?? []) {
      if (f.spouseId) included.add(f.spouseId)
      for (const childId of f.childIds) {
        if (!included.has(childId)) queue.push(childId)
      }
    }
  }

  return {
    ...doc,
    persons:  doc.persons.filter(p => included.has(p.id)),
    families: doc.families.filter(f => included.has(f.personId)),
    branches: doc.branches.filter(b => b.ancestorPersonId != null && included.has(b.ancestorPersonId)),
  }
}
