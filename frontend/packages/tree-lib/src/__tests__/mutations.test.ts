import { describe, test, expect } from 'vitest'
import { addPerson, addFamilyUnit, setSpouse, updatePerson, deletePerson } from '../mutations'
import { emptyDocument } from '../document'

function baseDoc() {
  return emptyDocument()
}

describe('addPerson', () => {
  test('appends person to persons array', () => {
    const { doc, person } = addPerson(baseDoc(), { displayName: 'Alice', gender: 'female', isAlive: true })
    expect(doc.persons).toHaveLength(1)
    expect(doc.persons[0].id).toBe(person.id)
    expect(doc.persons[0].displayName).toBe('Alice')
  })

  test('assigns unique id', () => {
    const { person: a } = addPerson(baseDoc(), { displayName: 'A', gender: 'male', isAlive: true })
    const { person: b } = addPerson(baseDoc(), { displayName: 'B', gender: 'male', isAlive: true })
    expect(a.id).not.toBe(b.id)
  })

  test('sets createdAt and updatedAt', () => {
    const { person } = addPerson(baseDoc(), { displayName: 'A', gender: 'male', isAlive: true })
    expect(typeof person.createdAt).toBe('string')
    expect(typeof person.updatedAt).toBe('string')
  })

  test('appends child id to parent family when parentFamilyId given', () => {
    let doc = baseDoc()
    const { doc: d1, person: parent } = addPerson(doc, { displayName: 'Parent', gender: 'male', isAlive: true })
    const d2 = addFamilyUnit(d1, parent.id, 1)
    const parentFamily = d2.families[0]

    const { doc: d3, person: child } = addPerson(d2, { displayName: 'Child', gender: 'male', isAlive: true }, parentFamily.id)
    const updated = d3.families.find(f => f.id === parentFamily.id)!
    expect(updated.childIds).toContain(child.id)
  })

  test('does not modify other families when parentFamilyId given', () => {
    let doc = baseDoc()
    const { doc: d1, person: p1 } = addPerson(doc, { displayName: 'P1', gender: 'male', isAlive: true })
    const d2 = addFamilyUnit(d1, p1.id, 1)
    const { doc: d3, person: p2 } = addPerson(d2, { displayName: 'P2', gender: 'male', isAlive: true })
    const d4 = addFamilyUnit(d3, p2.id, 1)

    const targetFamily = d4.families.find(f => f.personId === p1.id)!
    const { doc: d5 } = addPerson(d4, { displayName: 'Child', gender: 'male', isAlive: true }, targetFamily.id)

    const otherFamily = d5.families.find(f => f.personId === p2.id)!
    expect(otherFamily.childIds).toHaveLength(0)
  })
})

describe('addFamilyUnit', () => {
  test('creates a new family entry', () => {
    const { doc, person } = addPerson(baseDoc(), { displayName: 'Root', gender: 'male', isAlive: true })
    const d = addFamilyUnit(doc, person.id, 1)
    expect(d.families).toHaveLength(1)
    expect(d.families[0].personId).toBe(person.id)
    expect(d.families[0].generation).toBe(1)
    expect(d.families[0].childIds).toHaveLength(0)
  })

  test('attaches branchId when provided', () => {
    const { doc, person } = addPerson(baseDoc(), { displayName: 'Root', gender: 'male', isAlive: true })
    const d = addFamilyUnit(doc, person.id, 1, 'branch-1')
    expect(d.families[0].branchId).toBe('branch-1')
  })
})

describe('setSpouse', () => {
  test('assigns spouse to family and creates person', () => {
    let doc = baseDoc()
    const { doc: d1, person: p } = addPerson(doc, { displayName: 'Husband', gender: 'male', isAlive: true })
    const d2 = addFamilyUnit(d1, p.id, 1)
    const family = d2.families[0]

    const { doc: d3, person: spouse } = setSpouse(d2, family.id, { displayName: 'Wife', gender: 'female', isAlive: true })
    const updated = d3.families.find(f => f.id === family.id)!
    expect(updated.spouseId).toBe(spouse.id)
    expect(updated.marriageStatus).toBe('married')
    expect(d3.persons.find(p => p.id === spouse.id)?.displayName).toBe('Wife')
  })
})

describe('updatePerson', () => {
  test('updates specified fields', () => {
    const { doc, person } = addPerson(baseDoc(), { displayName: 'Old Name', gender: 'male', isAlive: true })
    const updated = updatePerson(doc, person.id, { displayName: 'New Name' })
    expect(updated.persons.find(p => p.id === person.id)?.displayName).toBe('New Name')
  })

  test('does not change other fields', () => {
    const { doc, person } = addPerson(baseDoc(), { displayName: 'Alice', gender: 'female', isAlive: true })
    const updated = updatePerson(doc, person.id, { displayName: 'Alicia' })
    expect(updated.persons.find(p => p.id === person.id)?.gender).toBe('female')
  })

  test('does not mutate original', () => {
    const { doc, person } = addPerson(baseDoc(), { displayName: 'Alice', gender: 'female', isAlive: true })
    updatePerson(doc, person.id, { displayName: 'Alicia' })
    expect(doc.persons[0].displayName).toBe('Alice')
  })
})

describe('deletePerson', () => {
  test('removes person and their family', () => {
    let doc = baseDoc()
    const { doc: d1, person } = addPerson(doc, { displayName: 'Solo', gender: 'male', isAlive: true })
    const d2 = addFamilyUnit(d1, person.id, 1)
    const d3 = deletePerson(d2, person.id)
    expect(d3.persons).toHaveLength(0)
    expect(d3.families).toHaveLength(0)
  })

  test('throws when person has children', () => {
    let doc = baseDoc()
    const { doc: d1, person: parent } = addPerson(doc, { displayName: 'Parent', gender: 'male', isAlive: true })
    const d2 = addFamilyUnit(d1, parent.id, 1)
    const family = d2.families[0]
    const { doc: d3 } = addPerson(d2, { displayName: 'Child', gender: 'male', isAlive: true }, family.id)

    expect(() => deletePerson(d3, parent.id)).toThrow('Xoá con cái trước khi xoá người này')
  })

  test('removing child clears childIds from parent family', () => {
    let doc = baseDoc()
    const { doc: d1, person: parent } = addPerson(doc, { displayName: 'Parent', gender: 'male', isAlive: true })
    const d2 = addFamilyUnit(d1, parent.id, 1)
    const family = d2.families[0]
    const { doc: d3, person: child } = addPerson(d2, { displayName: 'Child', gender: 'male', isAlive: true }, family.id)
    const d4 = addFamilyUnit(d3, child.id, 2)

    const d5 = deletePerson(d4, child.id)
    const parentFamily = d5.families.find(f => f.id === family.id)!
    expect(parentFamily.childIds).not.toContain(child.id)
  })

  test('removing spouse clears spouseId from family', () => {
    let doc = baseDoc()
    const { doc: d1, person: husband } = addPerson(doc, { displayName: 'H', gender: 'male', isAlive: true })
    const d2 = addFamilyUnit(d1, husband.id, 1)
    const family = d2.families[0]
    const { doc: d3, person: wife } = setSpouse(d2, family.id, { displayName: 'W', gender: 'female', isAlive: true })

    const d4 = deletePerson(d3, wife.id)
    const updated = d4.families.find(f => f.id === family.id)!
    expect(updated.spouseId).toBeUndefined()
  })
})
