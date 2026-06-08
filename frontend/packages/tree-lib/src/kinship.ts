import type { FtreeDocument, FtreeIndex, Person } from './types'
import { buildIndex } from './types'

export type Region = 'north' | 'south'

export interface KinshipResult {
  label:     string    // viewer gọi target là gì
  selfLabel: string    // viewer tự xưng gì khi nói với target
  ordinal?:  string    // "Hai", "Ba", "Cả", "Út", v.v.
  genDelta:  number    // + = target ở thế hệ cao hơn viewer
  path:      string[]  // chuỗi personId từ viewer → target qua LCA
}

// ── Ordinal ───────────────────────────────────────────────────────

const NAM = ['Hai','Ba','Tư','Năm','Sáu','Bảy','Tám','Chín','Mười']
const BAC = ['Cả','Hai','Ba','Tư','Năm','Sáu','Bảy','Tám','Chín','Mười']

export function getSiblingOrdinal(index: number, isYoungest: boolean, region: Region): string {
  if (isYoungest) return 'Út'
  const arr = region === 'south' ? NAM : BAC
  return arr[index] ?? (region === 'south' ? String(index + 2) : String(index + 1))
}

// ── Internal helpers ─────────────────────────────────────────────

function g(gender: Person['gender'], m: string, f: string): string {
  return gender === 'female' ? f : m
}

function getAncestorChain(startId: string, idx: FtreeIndex): string[] {
  const chain = [startId]
  let cur = startId
  const visited = new Set<string>([startId])
  for (;;) {
    const pf = idx.childToParentFamily.get(cur)
    if (!pf || visited.has(pf.personId)) break
    cur = pf.personId
    visited.add(cur)
    chain.push(cur)
  }
  return chain
}

// branchRank > 0: viewer's branch is junior → target is senior (Bác/Anh/Chị)
// branchRank < 0: viewer's branch is senior → target is junior (Chú/Cô/Em)
// branchRank = 0: direct line (Cha/Mẹ, Con, direct ancestor/descendant)
function buildLabel(
  genDelta:   number,
  branchRank: number,
  isSibling:  boolean,
  tg: Person['gender'],
  vg: Person['gender'],
  ordinal:    string | undefined,
  region:     Region,
): { label: string; selfLabel: string; ordinal?: string } {
  const showOrd = genDelta === 1 || isSibling
  const N = showOrd && ordinal ? ` ${ordinal}` : ''

  // ── Ascending ────────────────────────────────────────────────
  if (genDelta >= 5) return { label: g(tg, `Ông Sơ${N}`, `Bà Sơ${N}`),   selfLabel: 'Cháu', ordinal }
  if (genDelta === 4) return { label: g(tg, `Ông Kỵ${N}`, `Bà Kỵ${N}`),   selfLabel: 'Cháu', ordinal }
  if (genDelta === 3) return { label: (region === 'south' ? 'Cố' : 'Cụ') + N, selfLabel: 'Cháu chắt', ordinal }
  if (genDelta === 2) return { label: g(tg, `Ông${N}`, `Bà${N}`),          selfLabel: 'Cháu', ordinal }

  if (genDelta === 1) {
    if (branchRank === 0) {
      return {
        label:     g(tg, region === 'south' ? 'Ba' : 'Bố', region === 'south' ? 'Má' : 'Mẹ'),
        selfLabel: 'Con',
      }
    }
    if (branchRank > 0) return { label: g(tg, `Bác${N}`, `Bác${N}`), selfLabel: 'Cháu', ordinal }
    return { label: g(tg, `Chú${N}`, `Cô${N}`),                              selfLabel: 'Cháu', ordinal }
  }

  // ── Same generation ──────────────────────────────────────────
  if (genDelta === 0) {
    if (branchRank > 0) {
      return {
        label:     g(tg, isSibling ? `Anh${N}` : 'Anh họ', isSibling ? `Chị${N}` : 'Chị họ'),
        selfLabel: 'Em',
      }
    }
    if (branchRank < 0) {
      return {
        label:     isSibling ? `Em${N}` : 'Em họ',
        selfLabel: g(vg, isSibling ? 'Anh' : 'Anh họ', isSibling ? 'Chị' : 'Chị họ'),
      }
    }
    return { label: 'Họ hàng', selfLabel: 'Họ hàng' }
  }

  // ── Descending ───────────────────────────────────────────────
  if (genDelta === -1) {
    if (branchRank === 0) {
      return {
        label:     'Con',
        selfLabel: g(vg, region === 'south' ? 'Ba' : 'Bố', region === 'south' ? 'Má' : 'Mẹ'),
      }
    }
    // Cháu (con của anh/em)
    const sl = branchRank > 0 ? g(vg, 'Chú', 'Cô') : g(vg, 'Bác', 'Bác')
    return { label: 'Cháu', selfLabel: sl }
  }
  if (genDelta === -2) return { label: 'Cháu', selfLabel: g(vg, 'Ông', 'Bà') }
  if (genDelta === -3) return { label: 'Chắt', selfLabel: region === 'south' ? 'Cố' : 'Cụ' }
  if (genDelta === -4) return { label: region === 'north' ? 'Chút' : 'Chít', selfLabel: 'Ông Kỵ' }
  if (genDelta <= -5) return { label: region === 'north' ? 'Chít' : 'Chút', selfLabel: 'Ông Sơ' }

  return { label: 'Họ hàng xa', selfLabel: 'Người thân' }
}

// Descending terms that need ordinal appended (ordinal follows blood spouse's position)
const DESCENDING_TERMS = new Set(['Con','Cháu','Chắt','Chút','Chít'])

function applyInLaw(
  bloodLabel:   string,
  targetGender: Person['gender'],
  region:       Region,
  ordinal:      string | undefined,
): string {
  const sp   = bloodLabel.indexOf(' ')
  const base = sp > 0 ? bloodLabel.slice(0, sp) : bloodLabel
  const rest = sp > 0 ? bloodLabel.slice(sp)    : ''  // already has ordinal for ascending cases

  let nb: string
  if (targetGender === 'female') {
    nb = ({
      // Ascending (vợ của...)
      Chú: 'Thím', Bác: 'Bác', Ông: 'Bà', Cậu: 'Mợ', Anh: 'Chị',
      // Descending (dâu)
      Con: 'Con dâu', Cháu: 'Cháu dâu', Chắt: 'Chắt dâu',
      Chút: 'Chút dâu', Chít: 'Chít dâu',
    } as Record<string,string>)[base] ?? base
  } else {
    const chu = region === 'south' ? 'Chú' : 'Dượng'
    nb = ({
      // Ascending (chồng của...)
      Cô: chu, Bác: 'Bác', Dì: 'Dượng', Chị: 'Anh', Bà: 'Ông',
      // Descending (rể)
      Con: 'Con rể', Cháu: 'Cháu rể', Chắt: 'Chắt rể',
      Chút: 'Chút rể', Chít: 'Chít rể',
    } as Record<string,string>)[base] ?? base
  }

  // Descending in-law: ordinal from blood spouse's position (chồng/vợ thứ mấy)
  if (DESCENDING_TERMS.has(base) && ordinal) return `${nb} ${ordinal}`
  return `${nb}${rest}`
}

// ── Public API ────────────────────────────────────────────────────

export function computeKinship(
  doc:      FtreeDocument,
  viewerId: string,
  targetId: string,
  region:   Region,
): KinshipResult | null {
  if (viewerId === targetId) return null

  const idx    = buildIndex(doc)
  const viewer = idx.personMap.get(viewerId)
  const target = idx.personMap.get(targetId)
  if (!viewer || !target) return null

  // Spouse (fast path)
  if (idx.familyByPerson.get(viewerId)?.spouseId === targetId ||
      idx.familyByPerson.get(targetId)?.spouseId === viewerId) {
    return {
      label:     g(target.gender, 'Chồng', 'Vợ'),
      selfLabel: g(viewer.gender, 'Chồng', 'Vợ'),
      genDelta:  0,
      path:      [viewerId, targetId],
    }
  }

  // In-law: target appears as spouseId → resolve through blood spouse
  const inLawFamily   = idx.familyBySpouse.get(targetId)
  const bloodTargetId = inLawFamily ? inLawFamily.personId : targetId
  const bloodTarget   = idx.personMap.get(bloodTargetId) ?? target
  const isInLaw       = !!inLawFamily

  // Ancestor chains
  const vChain = getAncestorChain(viewerId,      idx)
  const tChain = getAncestorChain(bloodTargetId, idx)

  // Lowest common ancestor (LCA)
  const vSet = new Map(vChain.map((id, i) => [id, i]))
  let lcaId: string | null = null
  let tDepth = 0
  for (let i = 0; i < tChain.length; i++) {
    if (vSet.has(tChain[i])) { lcaId = tChain[i]; tDepth = i; break }
  }
  if (!lcaId) return null

  const vDepth   = vSet.get(lcaId)!
  const genDelta = vDepth - tDepth  // + = target is an older generation

  // branchRank at LCA: compare position in LCA's childIds
  let branchRank = 0
  if (vDepth > 0 && tDepth > 0) {
    const vChild  = vChain[vDepth - 1]  // viewer's ancestor just below LCA
    const tChild  = tChain[tDepth - 1]  // target's ancestor just below LCA
    const lcaUnit = idx.familyByPerson.get(lcaId)
    if (lcaUnit) {
      const vi = lcaUnit.childIds.indexOf(vChild)
      const ti = lcaUnit.childIds.indexOf(tChild)
      // vi > ti → viewer's branch is junior (later-born) → target is senior → Bác/Anh/Chị
      if (vi !== -1 && ti !== -1) branchRank = vi - ti
    }
  }

  // Detect actual siblings (same parent FamilyUnit)
  const vPF      = idx.childToParentFamily.get(viewerId)
  const tPF      = idx.childToParentFamily.get(bloodTargetId)
  const isSibling = !!vPF && !!tPF && vPF.id === tPF.id

  // Ordinal: target's position among their siblings
  let ordinal: string | undefined
  if (tPF) {
    const ti = tPF.childIds.indexOf(bloodTargetId)
    if (ti !== -1) ordinal = getSiblingOrdinal(ti, ti === tPF.childIds.length - 1, region)
  }

  const { label: raw, selfLabel, ordinal: ord } = buildLabel(
    genDelta, branchRank, isSibling, bloodTarget.gender, viewer.gender, ordinal, region,
  )

  const finalLabel = isInLaw ? applyInLaw(raw, target.gender, region, ordinal) : raw

  // Path: viewer → LCA → target
  const path = [
    ...vChain.slice(0, vDepth + 1),
    ...tChain.slice(0, tDepth).reverse(),
  ]
  if (isInLaw && path.length > 0) path[path.length - 1] = targetId

  return { label: finalLabel, selfLabel, ordinal: ord, genDelta, path }
}
