import type { FtreeDocument, Person, FamilyUnit } from './types'
import { touchUpdatedAt } from './document'

type PersonInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>

function newPerson(input: PersonInput): Person {
  const now = new Date().toISOString()
  return { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
}

// Thêm person vào persons[] và (nếu có) vào childIds của parent family
export function addPerson(
  doc: FtreeDocument,
  input: PersonInput,
  parentFamilyId?: string,
): { doc: FtreeDocument; person: Person } {
  const person = newPerson(input)
  let families = doc.families

  if (parentFamilyId) {
    families = families.map(f =>
      f.id === parentFamilyId
        ? { ...f, childIds: [...f.childIds, person.id] }
        : f,
    )
  }

  return {
    doc: touchUpdatedAt({ ...doc, persons: [...doc.persons, person], families }),
    person,
  }
}

// Tạo FamilyUnit cho một person (chưa có family entry)
export function addFamilyUnit(
  doc: FtreeDocument,
  personId: string,
  generation: number,
  branchId?: string,
): FtreeDocument {
  const family: FamilyUnit = {
    id: crypto.randomUUID(),
    personId,
    marriageStatus: 'single',
    childIds: [],
    generation,
    branchId,
  }
  return touchUpdatedAt({ ...doc, families: [...doc.families, family] })
}

// Thêm hôn nhân mới cho một person đã có FamilyUnit (đa thê / tái hôn)
export function addMarriage(
  doc: FtreeDocument,
  personId: string,
): { doc: FtreeDocument; familyId: string } {
  const existing = doc.families.filter(f => f.personId === personId)
  if (existing.length === 0) throw new Error('Person chưa có FamilyUnit — dùng addFamilyUnit trước')
  const maxOrder  = existing.reduce((m, f) => Math.max(m, f.marriageOrder ?? 1), 0)
  const baseFamily = existing[0]
  const familyId   = crypto.randomUUID()
  const family: FamilyUnit = {
    id:             familyId,
    personId,
    marriageStatus: 'single',
    marriageOrder:  maxOrder + 1,
    childIds:       [],
    generation:     baseFamily.generation,
    branchId:       baseFamily.branchId,
  }
  return { doc: touchUpdatedAt({ ...doc, families: [...doc.families, family] }), familyId }
}

// Gán vợ/chồng cho FamilyUnit đã có — tạo Person mới từ input
export function setSpouse(
  doc: FtreeDocument,
  familyId: string,
  input: PersonInput,
): { doc: FtreeDocument; person: Person } {
  const person = newPerson(input)
  const families = doc.families.map(f =>
    f.id === familyId ? { ...f, spouseId: person.id, marriageStatus: 'married' as const } : f,
  )
  return {
    doc: touchUpdatedAt({ ...doc, persons: [...doc.persons, person], families }),
    person,
  }
}

// Cập nhật thông tin một person
export function updatePerson(
  doc: FtreeDocument,
  personId: string,
  updates: Partial<Omit<Person, 'id' | 'createdAt'>>,
): FtreeDocument {
  const persons = doc.persons.map(p =>
    p.id === personId
      ? { ...p, ...updates, updatedAt: new Date().toISOString() }
      : p,
  )
  return touchUpdatedAt({ ...doc, persons })
}

// Thêm cha/mẹ cho một người: dịch tất cả generation lên 1, tạo FamilyUnit mới ở gen 1
export function addParent(
  doc: FtreeDocument,
  childPersonId: string,
  input: PersonInput,
): { doc: FtreeDocument; person: Person } {
  const shiftedDoc = {
    ...doc,
    families: doc.families.map(f => ({ ...f, generation: f.generation + 1 })),
  }
  const parent = newPerson(input)
  const parentFamily: FamilyUnit = {
    id: crypto.randomUUID(),
    personId: parent.id,
    marriageStatus: 'single',
    childIds: [childPersonId],
    generation: 1,
  }
  return {
    person: parent,
    doc: touchUpdatedAt({
      ...shiftedDoc,
      persons: [...shiftedDoc.persons, parent],
      families: [...shiftedDoc.families, parentFamily],
    }),
  }
}

// Xoá một person:
//   - Ném lỗi nếu họ có FamilyUnit với childIds (phải xoá con trước)
//   - Xoá FamilyUnit của họ (personId = họ)
//   - Xoá personId khỏi childIds của parent
//   - Nếu là spouseId → xoá spouseId trên family đó
export function deletePerson(
  doc: FtreeDocument,
  personId: string,
): FtreeDocument {
  const ownFamily = doc.families.find(f => f.personId === personId)
  if (ownFamily && ownFamily.childIds.length > 0) {
    throw new Error('Xoá con cái trước khi xoá người này')
  }

  const families = doc.families
    .filter(f => f.personId !== personId)
    .map(f => ({
      ...f,
      spouseId:  f.spouseId  === personId ? undefined : f.spouseId,
      childIds:  f.childIds.filter(id => id !== personId),
    }))

  const persons = doc.persons.filter(p => p.id !== personId)
  return touchUpdatedAt({ ...doc, persons, families })
}
