import { describe, it, expect } from 'vitest'
import { extractSubtree } from '../utils/subtree'
import { makeTestDoc } from './fixtures'

describe('extractSubtree', () => {
  it('from root includes entire tree', () => {
    const doc = makeTestDoc()
    // p00 is the root — single-person root family (no spouse, children p11 and p1)
    const sub = extractSubtree(doc, 'p00')
    const personIds = sub.persons.map(p => p.id).sort()
    // p00 has no spouse; children p11 and p1 pulled in
    // p1 has spouse p2 and children p3, p4
    // p3 has spouse p8 and child p5; p5 has spouse p9
    // p4 has children p6, p7; p7 has spouse p14 and child p15
    // maternal branch (p10, p12, p13) NOT included — p8 is included as spouse but not p10's family
    expect(personIds).toEqual(
      ['p00','p1','p11','p14','p15','p2','p3','p4','p5','p6','p7','p8','p9'].sort()
    )
  })

  it('from p1 excludes p00 and p11', () => {
    const doc = makeTestDoc()
    const sub = extractSubtree(doc, 'p1')
    const personIds = sub.persons.map(p => p.id).sort()
    expect(personIds).toEqual(
      ['p1','p14','p15','p2','p3','p4','p5','p6','p7','p8','p9'].sort()
    )
    // families: only those whose personId is in the set
    const familyPersonIds = sub.families.map(f => f.personId).sort()
    expect(familyPersonIds).toEqual(['p1','p3','p4','p5','p7'].sort())
  })

  it('from p3 (Bố) includes only his branch', () => {
    const doc = makeTestDoc()
    const sub = extractSubtree(doc, 'p3')
    const personIds = sub.persons.map(p => p.id).sort()
    expect(personIds).toEqual(['p3','p5','p8','p9'].sort())
    // p4's family excluded
    expect(sub.families.map(f => f.personId).sort()).toEqual(['p3','p5'].sort())
  })

  it('from leaf p5 includes only p5 and spouse p9', () => {
    const doc = makeTestDoc()
    const sub = extractSubtree(doc, 'p5')
    expect(sub.persons.map(p => p.id).sort()).toEqual(['p5','p9'].sort())
    expect(sub.families.map(f => f.personId)).toEqual(['p5'])
  })

  it('from leaf p4 child p6 (no family) returns only p6', () => {
    const doc = makeTestDoc()
    // p6 has no family entry — appears only as a child
    const sub = extractSubtree(doc, 'p6')
    expect(sub.persons.map(p => p.id)).toEqual(['p6'])
    expect(sub.families).toEqual([])
  })

  it('preserves clan metadata', () => {
    const doc = makeTestDoc()
    const sub = extractSubtree(doc, 'p3')
    expect(sub.clan).toBe(doc.clan)
    expect(sub.version).toBe(doc.version)
  })
})
