import type { FtreeDocument } from '../types'
import { buildIndex } from '../types'

export type Severity = 'error' | 'warning'

export interface ValidationIssue {
  id:        string
  severity:  Severity
  rule:      string
  personIds: string[]
  message:   string
}

const CURRENT_YEAR = new Date().getFullYear()

export function validateDocument(doc: FtreeDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const idx = buildIndex(doc)

  function add(issue: ValidationIssue) { issues.push(issue) }

  // ── Group A: cá nhân ────────────────────────────────────────────
  for (const p of doc.persons) {
    const by = p.birthDate?.year
    const dy = p.deathDate?.year

    if (by && dy && dy < by)
      add({ id: `A1-${p.id}`, severity: 'error', rule: 'A1', personIds: [p.id],
        message: `${p.displayName}: năm mất (${dy}) trước năm sinh (${by})` })

    if (by && dy && dy - by > 120)
      add({ id: `A2-${p.id}`, severity: 'warning', rule: 'A2', personIds: [p.id],
        message: `${p.displayName}: tuổi thọ ${dy - by} năm — kiểm tra lại năm mất` })

    if (by && by > CURRENT_YEAR)
      add({ id: `A3-${p.id}`, severity: 'warning', rule: 'A3', personIds: [p.id],
        message: `${p.displayName}: năm sinh ${by} nằm trong tương lai` })

    if (p.isAlive && dy)
      add({ id: `A4-${p.id}`, severity: 'warning', rule: 'A4', personIds: [p.id],
        message: `${p.displayName}: được đánh dấu "còn sống" nhưng có năm mất (${dy})` })
  }

  // ── Group B: cha/mẹ → con ───────────────────────────────────────
  for (const family of doc.families) {
    const father = idx.personMap.get(family.personId)
    const mother = family.spouseId ? idx.personMap.get(family.spouseId) : undefined

    for (const childId of family.childIds) {
      const child = idx.personMap.get(childId)
      if (!child) continue
      const cy = child.birthDate?.year
      if (!cy) continue

      // Father checks
      if (father) {
        const fy = father.birthDate?.year
        if (fy) {
          if (cy <= fy)
            add({ id: `B1-${family.personId}-${childId}`, severity: 'error', rule: 'B1',
              personIds: [childId, family.personId],
              message: `${child.displayName} (${cy}) sinh trước hoặc cùng năm cha ${father.displayName} (${fy})` })
          else if (cy - fy < 14)
            add({ id: `B2f-${family.personId}-${childId}`, severity: 'warning', rule: 'B2',
              personIds: [childId, family.personId],
              message: `${father.displayName} chỉ ${cy - fy} tuổi khi ${child.displayName} sinh` })
          else if (cy - fy > 70)
            add({ id: `B3f-${family.personId}-${childId}`, severity: 'warning', rule: 'B3',
              personIds: [childId, family.personId],
              message: `${father.displayName} ${cy - fy} tuổi khi ${child.displayName} sinh — kiểm tra lại` })
        }
        const fdy = father.deathDate?.year
        if (fdy && cy > fdy + 1)
          add({ id: `B4-${family.personId}-${childId}`, severity: 'warning', rule: 'B4',
            personIds: [childId, family.personId],
            message: `${child.displayName} sinh ${cy - fdy} năm sau khi cha ${father.displayName} mất` })
      }

      // Mother checks
      if (mother && family.spouseId) {
        const my = mother.birthDate?.year
        if (my) {
          if (cy <= my)
            add({ id: `B1m-${family.spouseId}-${childId}`, severity: 'error', rule: 'B1',
              personIds: [childId, family.spouseId],
              message: `${child.displayName} (${cy}) sinh trước hoặc cùng năm mẹ ${mother.displayName} (${my})` })
          else if (cy - my < 14)
            add({ id: `B2m-${family.spouseId}-${childId}`, severity: 'warning', rule: 'B2',
              personIds: [childId, family.spouseId],
              message: `${mother.displayName} chỉ ${cy - my} tuổi khi ${child.displayName} sinh` })
          else if (cy - my > 60)
            add({ id: `B3m-${family.spouseId}-${childId}`, severity: 'warning', rule: 'B3',
              personIds: [childId, family.spouseId],
              message: `${mother.displayName} ${cy - my} tuổi khi ${child.displayName} sinh — kiểm tra lại` })
        }
        const mdy = mother.deathDate?.year
        if (mdy && cy > mdy)
          add({ id: `B5-${family.spouseId}-${childId}`, severity: 'error', rule: 'B5',
            personIds: [childId, family.spouseId],
            message: `${child.displayName} sinh sau khi mẹ ${mother.displayName} mất (${mdy})` })
      }
    }
  }

  // ── Group C: vợ chồng ───────────────────────────────────────────
  for (const family of doc.families) {
    if (!family.spouseId) continue
    const pA = idx.personMap.get(family.personId)
    const pB = idx.personMap.get(family.spouseId)
    if (!pA || !pB) continue
    const ayb = pA.birthDate?.year
    const byb = pB.birthDate?.year
    if (ayb && byb && Math.abs(ayb - byb) > 40)
      add({ id: `C3-${family.personId}-${family.spouseId}`, severity: 'warning', rule: 'C3',
        personIds: [family.personId, family.spouseId],
        message: `${pA.displayName} và ${pB.displayName} chênh lệch ${Math.abs(ayb - byb)} tuổi` })
  }

  return issues
}
