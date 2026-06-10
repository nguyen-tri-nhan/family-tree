import type { FtreeDocument, FtreeIndex, Person } from './types'
import { buildIndex } from './types'

export type Region = 'north' | 'south'

export interface KinshipResult {
  label:     string    // viewer gọi target là gì
  selfLabel: string    // viewer tự xưng gì khi nói với target
  ordinal?:  string    // "Hai", "Ba", "Cả", "Út", v.v.
  genDelta:  number    // + = target ở thế hệ cao hơn viewer
  path:      string[]  // chuỗi personId từ viewer → target qua LCA
  lcaIndex:  number    // index trong path[] của LCA (path[lcaIndex] = LCA)
}

// ── Ordinal ───────────────────────────────────────────────────────

const NAM = ['Hai','Ba','Tư','Năm','Sáu','Bảy','Tám','Chín','Mười']
const BAC = ['Cả','Hai','Ba','Tư','Năm','Sáu','Bảy','Tám','Chín','Mười']

export function getSiblingOrdinal(index: number, isYoungest: boolean, region: Region): string {
  if (isYoungest) return 'Út'
  const arr = region === 'south' ? NAM : BAC
  return arr[index] ?? (region === 'south' ? String(index + 2) : String(index + 1))
}

// ── Ancestor BFS ──────────────────────────────────────────────────

interface AncestorEntry {
  depth:      number   // steps from start to this ancestor
  parentId:   string   // ID of the node (closer to start) that discovered this one
  viaMother:  boolean  // first step from start was via spouseId (viewer's mother)
}

// BFS upward through both father (personId) and mother (spouseId) at each step.
// viaMother = true only when the FIRST step from startId went through spouseId.
// Subsequent steps inherit the viaMother value of their discoverer.
function buildAncestorSet(startId: string, idx: FtreeIndex): Map<string, AncestorEntry> {
  const map = new Map<string, AncestorEntry>()
  map.set(startId, { depth: 0, parentId: '', viaMother: false })
  const queue: Array<{ id: string; depth: number; viaMother: boolean }> = [
    { id: startId, depth: 0, viaMother: false },
  ]
  while (queue.length > 0) {
    const { id, depth, viaMother } = queue.shift()!
    const pf = idx.childToParentFamily.get(id)
    if (!pf) continue
    if (pf.personId && !map.has(pf.personId)) {
      // At the viewer's own parent step (depth=0) use the parent's actual gender,
      // because personId may be female (e.g. Cô Út as head of her own family).
      const next = depth === 0
        ? idx.personMap.get(pf.personId)?.gender === 'female'
        : viaMother
      map.set(pf.personId, { depth: depth + 1, parentId: id, viaMother: next })
      queue.push({ id: pf.personId, depth: depth + 1, viaMother: next })
    }
    if (pf.spouseId && !map.has(pf.spouseId)) {
      const next = depth === 0
        ? idx.personMap.get(pf.spouseId)?.gender === 'female'
        : viaMother
      map.set(pf.spouseId, { depth: depth + 1, parentId: id, viaMother: next })
      queue.push({ id: pf.spouseId, depth: depth + 1, viaMother: next })
    }
  }
  return map
}

// Reconstruct path [start, …, lca] by following parentId pointers from lca back to start.
function tracePath(lcaId: string, ancestorSet: Map<string, AncestorEntry>): string[] {
  const path: string[] = []
  let cur = lcaId
  for (;;) {
    path.push(cur)
    const e = ancestorSet.get(cur)
    if (!e || e.depth === 0) break
    cur = e.parentId
  }
  return path.reverse()  // [start, …, lca]
}

// ── Label builder ──────────────────────────────────────────────────

function g(gender: Person['gender'], m: string, f: string): string {
  return gender === 'female' ? f : m
}

// branchRank > 0: viewer's branch is junior → target is senior (Bác/Anh/Chị)
// branchRank < 0: viewer's branch is senior → target is junior (Chú/Cô/Em)
// branchRank = 0: direct line (Cha/Mẹ, Con, direct ancestor/descendant)
function buildLabel(
  genDelta:        number,
  branchRank:      number,
  isSibling:       boolean,
  tg:              Person['gender'],
  vg:              Person['gender'],
  ordinal:         string | undefined,
  region:          Region,
  isMaternal:      boolean,
  minLcaDepth:     number = 1,
  halfSiblingType: 'father' | 'mother' | null = null,
): { label: string; selfLabel: string; ordinal?: string } {
  const showOrd = genDelta === 1 || isSibling || (genDelta === 2 && branchRank !== 0)
  const N = showOrd && ordinal ? ` ${ordinal}` : ''

  // ── Ascending ────────────────────────────────────────────────
  if (genDelta >= 5) return { label: g(tg, `Ông Sơ${N}`, `Bà Sơ${N}`),   selfLabel: 'Cháu', ordinal }
  if (genDelta === 4) return { label: g(tg, `Ông Kỵ${N}`, `Bà Kỵ${N}`),   selfLabel: 'Cháu', ordinal }
  if (genDelta === 3) {
    const side = isMaternal ? 'ngoại' : 'nội'
    const root = region === 'south' ? 'Cố' : 'Cụ'
    return { label: g(tg, `Ông ${root} ${side}${N}`, `Bà ${root} ${side}${N}`), selfLabel: 'Cháu chắt', ordinal }
  }

  if (genDelta === 2) {
    const side = isMaternal ? 'ngoại' : 'nội'
    return { label: g(tg, `Ông ${side}${N}`, `Bà ${side}${N}`), selfLabel: 'Cháu', ordinal }
  }

  if (genDelta === 1) {
    if (branchRank === 0) {
      return {
        label:     g(tg, region === 'south' ? 'Ba' : 'Bố', region === 'south' ? 'Má' : 'Mẹ'),
        selfLabel: 'Con',
      }
    }
    if (isMaternal) {
      // Anh/em của mẹ → Cậu (male) / Dì (female)
      return { label: g(tg, `Cậu${N}`, `Dì${N}`), selfLabel: 'Cháu', ordinal }
    }
    if (branchRank > 0) return { label: g(tg, `Bác${N}`, `Bác${N}`), selfLabel: 'Cháu', ordinal }
    return { label: g(tg, `Chú${N}`, `Cô${N}`),                              selfLabel: 'Cháu', ordinal }
  }

  // ── Same generation ──────────────────────────────────────────
  if (genDelta === 0) {
    const doi = !isSibling && !halfSiblingType && minLcaDepth >= 3 ? ` ${minLcaDepth - 1} đời` : ''

    if (halfSiblingType) {
      const sfx = halfSiblingType === 'father' ? ' cùng cha' : ' cùng mẹ'
      if (branchRank > 0) return { label: g(tg, `Anh${sfx}`, `Chị${sfx}`), selfLabel: `Em${sfx}` }
      if (branchRank < 0) return { label: `Em${sfx}`, selfLabel: g(vg, `Anh${sfx}`, `Chị${sfx}`) }
      return { label: g(tg, `Anh/Em${sfx}`, `Chị/Em${sfx}`), selfLabel: `Anh/Em${sfx}` }
    }

    if (branchRank > 0) {
      // Cousin: include ordinal from target's family rank; "họ" in parens
      const cousinOrd = !isSibling && ordinal ? ` ${ordinal}` : ''
      const hoSuffix  = `(họ${doi})`
      return {
        label:     g(tg, isSibling ? `Anh${N}` : `Anh${cousinOrd} ${hoSuffix}`, isSibling ? `Chị${N}` : `Chị${cousinOrd} ${hoSuffix}`),
        selfLabel: isSibling ? 'Em' : `Em ${hoSuffix}`,
      }
    }
    if (branchRank < 0) {
      const hoSuffix = `(họ${doi})`
      return {
        label:     isSibling ? `Em${N}` : `Em ${hoSuffix}`,
        selfLabel: g(vg, isSibling ? 'Anh' : `Anh ${hoSuffix}`, isSibling ? 'Chị' : `Chị ${hoSuffix}`),
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
  if (genDelta === -3) return { label: 'Chắt', selfLabel: region === 'south' ? g(vg, 'Ông Cố', 'Bà Cố') : g(vg, 'Ông Cụ', 'Bà Cụ') }
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
  const rest = sp > 0 ? bloodLabel.slice(sp)    : ''  // already has ordinal/side suffix

  let nb: string
  if (targetGender === 'female') {
    nb = ({
      // Direct (vợ của cha/mẹ)
      Bố: 'Mẹ', Ba: 'Má',
      // Ascending (vợ của...)
      Chú: 'Thím', Bác: 'Bác', Ông: 'Bà', Cụ: 'Cụ', Cậu: 'Mợ',
      // Same-gen in-law: vợ của anh = chị (dâu)
      Anh: 'Chị (dâu)',
      // Descending (dâu)
      Con: 'Con (dâu)', Cháu: 'Cháu (dâu)', Chắt: 'Chắt (dâu)',
      Chút: 'Chút (dâu)', Chít: 'Chít (dâu)',
    } as Record<string,string>)[base] ?? base
  } else {
    const chu = region === 'south' ? 'Chú' : 'Dượng'
    nb = ({
      // Direct (chồng của mẹ)
      Mẹ: region === 'south' ? 'Ba' : 'Bố', Má: 'Ba',
      // Ascending (chồng của...)
      Cô: chu, Bác: 'Bác', Dì: 'Dượng', Bà: 'Ông', Cụ: 'Cụ',
      // Same-gen in-law: chồng của chị = anh (rể)
      Chị: 'Anh (rể)',
      // Descending (rể)
      Con: 'Con (rể)', Cháu: 'Cháu (rể)', Chắt: 'Chắt (rể)',
      Chút: 'Chút (rể)', Chít: 'Chít (rể)',
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

  // Spouse (fast path) — check ALL marriages of each person
  const isSpouse =
    idx.familiesByPerson.get(viewerId)?.some(f => f.spouseId === targetId) ||
    idx.familiesByPerson.get(targetId)?.some(f => f.spouseId === viewerId)
  if (isSpouse) {
    return {
      label:     g(target.gender, 'Chồng', 'Vợ'),
      selfLabel: g(viewer.gender, 'Chồng', 'Vợ'),
      genDelta:  0,
      path:      [viewerId, targetId],
      lcaIndex:  0,
    }
  }

  // If viewer is an in-law (spouseId in some family), use blood spouse as effective viewer.
  const viewerInLawFamily = idx.familyBySpouse.get(viewerId)
  const effectiveViewerId = viewerInLawFamily?.personId ?? viewerId

  // In-law: target appears as spouseId → resolve through blood spouse
  const inLawFamily   = idx.familyBySpouse.get(targetId)
  const bloodTargetId = inLawFamily ? inLawFamily.personId : targetId
  const bloodTarget   = idx.personMap.get(bloodTargetId) ?? target
  const isInLaw       = !!inLawFamily

  // BFS ancestor sets for both sides (follow father + mother at each step)
  const vSet = buildAncestorSet(effectiveViewerId, idx)
  const tSet = buildAncestorSet(bloodTargetId, idx)

  // Find LCA: lowest combined depth
  let lcaId: string | null = null
  let vDepth = 0, tDepth = 0
  let minCost = Infinity
  for (const [id, tEntry] of tSet) {
    const vEntry = vSet.get(id)
    if (!vEntry) continue
    const cost = vEntry.depth + tEntry.depth
    if (cost < minCost) {
      minCost = cost; lcaId = id
      vDepth = vEntry.depth; tDepth = tEntry.depth
    }
  }
  if (!lcaId) return null

  const genDelta  = vDepth - tDepth  // + = target is an older generation
  const isMaternal = vSet.get(lcaId)!.viaMother

  // Reconstruct paths: [effectiveViewer, …, lca] and [bloodTarget, …, lca]
  const vPath = tracePath(lcaId, vSet)  // length = vDepth + 1
  const tPath = tracePath(lcaId, tSet)  // length = tDepth + 1

  // branchRank: compare sibling positions at LCA — search all LCA's families
  let branchRank = 0
  if (vDepth > 0 && tDepth > 0) {
    const vChild = vPath[vDepth - 1]  // viewer's ancestor just below LCA
    const tChild = tPath[tDepth - 1]  // target's ancestor just below LCA
    // Try all families of LCA (covers multi-marriage) then fall back to spouse-side
    const lcaFamilies = [
      ...(idx.familiesByPerson.get(lcaId) ?? []),
      ...(idx.familyBySpouse.get(lcaId) ? [idx.familyBySpouse.get(lcaId)!] : []),
    ]
    for (const lcaUnit of lcaFamilies) {
      const vi = lcaUnit.childIds.indexOf(vChild)
      const ti = lcaUnit.childIds.indexOf(tChild)
      if (vi !== -1 && ti !== -1) { branchRank = vi - ti; break }
    }
    // Cross-family case: vChild and tChild are children of *different* FamilyUnits
    // of the same LCA person (e.g. uncle/nephew via different wives of same father).
    // No single family contains both, so the loop above leaves branchRank=0 → "Ba".
    // Use marriageOrder of their respective parent families to determine seniority.
    if (branchRank === 0) {
      const vcf = idx.childToParentFamily.get(vChild)
      const tcf = idx.childToParentFamily.get(tChild)
      if (vcf && tcf && vcf.personId === tcf.personId && vcf.id !== tcf.id) {
        branchRank = (vcf.marriageOrder ?? 1) - (tcf.marriageOrder ?? 1)
      }
    }
  }

  // Detect actual siblings (same parent FamilyUnit) and half-siblings (same father or mother)
  const vPF              = idx.childToParentFamily.get(effectiveViewerId)
  const tPF              = idx.childToParentFamily.get(bloodTargetId)
  const isSibling        = !!vPF && !!tPF && vPF.id === tPF.id
  const halfSiblingType: 'father' | 'mother' | null =
    isSibling ? null
    : vPF && tPF && vPF.personId === tPF.personId  ? 'father'
    : vPF && tPF && vPF.spouseId && tPF.spouseId && vPF.spouseId === tPF.spouseId ? 'mother'
    : null

  // For half-siblings, branchRank from childIds won't work (different FamilyUnits).
  // Use marriageOrder of parent families to determine relative seniority.
  if (halfSiblingType && branchRank === 0 && vPF && tPF) {
    branchRank = (vPF.marriageOrder ?? 1) - (tPF.marriageOrder ?? 1)
  }

  // Ordinal: target's position among their siblings
  let ordinal: string | undefined
  if (tPF) {
    const ti = tPF.childIds.indexOf(bloodTargetId)
    if (ti !== -1) ordinal = getSiblingOrdinal(ti, ti === tPF.childIds.length - 1, region)
  }

  // viewer.gender (not effectiveViewer) is used for selfLabel — dâu/rể xưng theo giới tính thật
  const { label: raw, selfLabel, ordinal: ord } = buildLabel(
    genDelta, branchRank, isSibling, bloodTarget.gender, viewer.gender, ordinal, region, isMaternal,
    Math.min(vDepth, tDepth), halfSiblingType,
  )

  const finalLabel = isInLaw ? applyInLaw(raw, target.gender, region, ordinal) : raw

  // Path: viewer → LCA → target.
  // rawPath = [effectiveViewer, …, LCA, …, bloodTarget]
  const rawPath = [...vPath, ...tPath.slice(0, -1).reverse()]
  // Append in-law AFTER blood relative (not replace) so blood→in-law marriage edge is included.
  if (isInLaw) rawPath.push(targetId)

  const isViewerInLaw = viewerId !== effectiveViewerId
  const path     = isViewerInLaw ? [viewerId, ...rawPath] : rawPath
  const lcaIndex = isViewerInLaw ? vDepth + 1            : vDepth

  return { label: finalLabel, selfLabel, ordinal: ord, genDelta, path, lcaIndex }
}
