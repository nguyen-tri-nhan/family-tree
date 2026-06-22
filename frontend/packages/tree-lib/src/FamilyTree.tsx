import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { FtreeDocument, Person, FamilyUnit } from './types'
import { buildIndex } from './types'

// ── Layout constants ────────────────────────────────────────────
const R          = 36
const SPOUSE_GAP = 130
const NODE_W     = 260
const NODE_H     = 200
/** Exported so export utilities can align generation markers with tree rows. */
export const TREE_NODE_HEIGHT = NODE_H

// ── Internal tree node ──────────────────────────────────────────

interface ExtraFamilyNode {
  familyId:   string
  spouse?:    Person
  childCount: number
  role?:      FamilyUnit['marriageRole']
}

interface TreeNode {
  familyId:           string
  parentFamilyOffset: number     // 0 = child of primary family; 1 = first extra; etc.
  person:             Person
  spouse?:            Person     // primary spouse (right side)
  extraFamilies:      ExtraFamilyNode[]   // secondary marriages (rendered left)
  children:           TreeNode[]
  hiddenCount:        number
}

// ── Demo document ───────────────────────────────────────────────

function makePerson(
  id: string, displayName: string, gender: Person['gender'],
  birth: number, death?: number,
): Person {
  return {
    id, displayName, gender,
    birthDate:  { year: birth, displayCalendar: 'solar' },
    deathDate:  death ? { year: death, displayCalendar: 'solar' } : undefined,
    isAlive:    !death,
    createdAt:  '2026-01-01T00:00:00Z',
    updatedAt:  '2026-01-01T00:00:00Z',
  }
}

const DEMO_DOCUMENT: FtreeDocument = {
  version: '1.0',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  clan: { id: 'demo', name: 'Họ Nguyễn (demo)', surname: 'Nguyễn' },
  branches: [],
  persons: [
    makePerson('p1',  'Nguyễn Văn An',    'male',   1930, 2005),
    makePerson('p2',  'Trần Thị Bình',    'female', 1933, 2018),
    makePerson('p3',  'Nguyễn Văn Cường', 'male',   1955),
    makePerson('p4',  'Lê Thị Dung',      'female', 1959),
    makePerson('p5',  'Nguyễn Thị Lan',   'female', 1962),
    makePerson('p6',  'Nguyễn Văn Dũng',  'male',   1958),
    makePerson('p7',  'Phạm Thị Hoa',     'female', 1961),
    makePerson('p8',  'Nguyễn Minh Khoa', 'male',   1980),
    makePerson('p9',  'Nguyễn Thị Mai',   'female', 1983),
    makePerson('p10', 'Nguyễn Anh Tuấn',  'male',   1985),
    makePerson('p11', 'Nguyễn Thu Hương', 'female', 1988),
    makePerson('p12', 'Nguyễn Thu Hoa',   'female', 1990),
    // Hôn nhân thứ 2 của p1
    makePerson('p13', 'Lê Thị Xuân',      'female', 1937),
    makePerson('p14', 'Nguyễn Văn Phong', 'male',   1960),
  ],
  families: [
    { id: 'f1',  personId: 'p1',  spouseId: 'p2',  marriageStatus: 'widowed', marriageOrder: 1,
      childIds: ['p3','p5','p6'], generation: 1 },
    // Hôn nhân thứ 2: p1 + Lê Thị Xuân → con p14
    { id: 'f1b', personId: 'p1',  spouseId: 'p13', marriageStatus: 'married', marriageOrder: 2,
      marriageRole: 'thu', childIds: ['p14'], generation: 1 },
    { id: 'f2',  personId: 'p3',  spouseId: 'p4',  marriageStatus: 'married', childIds: ['p8','p9'],           generation: 2 },
    { id: 'f3',  personId: 'p5',  marriageStatus: 'single',  childIds: [],                                      generation: 2 },
    { id: 'f4',  personId: 'p6',  spouseId: 'p7',  marriageStatus: 'married', childIds: ['p10','p11','p12'],    generation: 2 },
    { id: 'f5',  personId: 'p8',  marriageStatus: 'single',  childIds: [],                                      generation: 3 },
    { id: 'f6',  personId: 'p9',  marriageStatus: 'single',  childIds: [],                                      generation: 3 },
    { id: 'f7',  personId: 'p10', marriageStatus: 'single',  childIds: [],                                      generation: 3 },
    { id: 'f8',  personId: 'p11', marriageStatus: 'single',  childIds: [],                                      generation: 3 },
    { id: 'f9',  personId: 'p12', marriageStatus: 'single',  childIds: [],                                      generation: 3 },
    { id: 'f10', personId: 'p14', marriageStatus: 'single',  childIds: [],                                      generation: 2 },
  ],
}

// ── Convert FtreeDocument → internal tree ───────────────────────

function buildTree(
  doc:       FtreeDocument,
  collapsed: Set<string>,
): TreeNode | null {
  if (doc.families.length === 0) return null

  const { personMap, familiesByPerson } = buildIndex(doc)
  const childPersonIds = new Set(doc.families.flatMap(f => f.childIds))

  // Root = primary family (marriageOrder=1) of persons who are not children
  const rootFamilies: FamilyUnit[] = []
  const seenRoots = new Set<string>()
  for (const [personId, fams] of familiesByPerson) {
    if (!childPersonIds.has(personId) && !seenRoots.has(personId)) {
      rootFamilies.push(fams[0])
      seenRoots.add(personId)
    }
  }
  if (rootFamilies.length === 0) return null

  function countDescendants(familyId: string): number {
    const fams = familiesByPerson.get(familyId) ?? []
    if (fams.length === 0) return 0
    const primary = fams[0]
    const extraIds = fams.slice(1).flatMap(f => f.childIds)
    return [...primary.childIds, ...extraIds].reduce((sum, childId) => {
      const cf = familiesByPerson.get(childId)?.[0]
      return cf ? sum + 1 + countDescendants(cf.personId) : sum + 1
    }, 0)
  }

  function buildNode(family: FamilyUnit, parentFamilyOffset = 0): TreeNode {
    const person      = personMap.get(family.personId)!
    const spouse      = family.spouseId ? personMap.get(family.spouseId) : undefined
    const allFamilies = familiesByPerson.get(family.personId) ?? [family]

    // Secondary marriages (rendered to the right, in order: wife1 — husband — wife2 — wife3)
    const extraFamilies: ExtraFamilyNode[] = allFamilies.slice(1).map(ef => ({
      familyId:   ef.id,
      spouse:     ef.spouseId ? personMap.get(ef.spouseId) : undefined,
      childCount: ef.childIds.length,
      role:       ef.marriageRole,
    }))

    // Children: primary family + expanded secondary families
    type ChildEntry = { f: FamilyUnit; offset: number }
    const childEntries: ChildEntry[] = family.childIds
      .map(id => familiesByPerson.get(id)?.[0])
      .filter((f): f is FamilyUnit => f !== undefined)
      .map(f => ({ f, offset: 0 }))

    for (let i = 0; i < allFamilies.slice(1).length; i++) {
      const ef = allFamilies[i + 1]
      for (const childId of ef.childIds) {
        const cf = familiesByPerson.get(childId)?.[0]
        if (cf) childEntries.push({ f: cf, offset: i + 1 })
      }
    }

    // Primary sort: by marriage offset (primary family left, secondary families right).
    // Secondary sort within same family: by birth year ascending (oldest child leftmost).
    // Children without a birth year sort last within their group.
    childEntries.sort((a, b) => {
      if (a.offset !== b.offset) return a.offset - b.offset
      const personA = personMap.get(a.f.personId)
      const personB = personMap.get(b.f.personId)
      const ya = personA?.birthDate?.year ?? Infinity
      const yb = personB?.birthDate?.year ?? Infinity
      return ya - yb
    })

    if (collapsed.has(family.id)) {
      return {
        familyId: family.id, parentFamilyOffset,
        person, spouse, extraFamilies, children: [],
        hiddenCount: childEntries.reduce((s, { f }) => s + 1 + countDescendants(f.personId), 0),
      }
    }
    return {
      familyId: family.id, parentFamilyOffset,
      person, spouse, extraFamilies,
      children: childEntries.map(({ f, offset }) => buildNode(f, offset)),
      hiddenCount: 0,
    }
  }

  return buildNode(rootFamilies[0])
}

// ── D3 helpers ──────────────────────────────────────────────────

type D3G = d3.Selection<SVGGElement, unknown, null, undefined>

function formatYears(p: Person): string {
  const birth = p.birthDate?.year
  const death = p.deathDate?.year
  if (!birth) return ''
  if (!p.isAlive && death) return `${birth} – ${death}`
  return `sinh ${birth}`
}

function drawPersonIcon(g: D3G, color: string) {
  g.append('circle').attr('cy', -9).attr('r', 11)
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.5)
  g.append('path').attr('d', 'M -15 17 C -15 5 15 5 15 17')
    .attr('fill', 'none').attr('stroke', color)
    .attr('stroke-width', 1.5).attr('stroke-linecap', 'round')
}

interface DrawColors {
  text: string; text5: string; maleBg: string; femaleBg: string
  brand: string; brandFg: string; surface: string; text3: string; border: string
}

function drawPerson(
  parent: D3G, cx: number, cy: number, person: Person, colors: DrawColors,
  onClick?: (id: string) => void,
  hasIssue?: boolean,
) {
  const isFemale = person.gender === 'female'
  const iconColor = isFemale ? '#be185d' : '#1d4ed8'
  const bg        = isFemale ? colors.femaleBg : colors.maleBg

  const g = parent.append('g')
    .attr('transform', `translate(${cx},${cy})`)
    .style('cursor', 'pointer')
    .on('click', (e: MouseEvent) => { e.stopPropagation(); onClick?.(person.id) })

  g.append('circle').attr('r', R + 4).attr('fill', 'transparent')
  g.append('circle').attr('r', R)
    .attr('fill', bg).attr('stroke', colors.text).attr('stroke-width', 2.5)
    .attr('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))')

  drawPersonIcon(g, iconColor)

  const words = person.displayName.split(' ')
  const line1 = words.length > 3 ? words.slice(0, -2).join(' ') : person.displayName
  const line2 = words.length > 3 ? words.slice(-2).join(' ')    : null

  g.append('text').attr('y', R + 16).attr('text-anchor', 'middle')
    .attr('font-size', '11px').attr('font-weight', '700').attr('fill', colors.text)
    .attr('font-family', 'system-ui, sans-serif').text(line1)

  if (line2) {
    g.append('text').attr('y', R + 29).attr('text-anchor', 'middle')
      .attr('font-size', '11px').attr('font-weight', '700').attr('fill', colors.text)
      .attr('font-family', 'system-ui, sans-serif').text(line2)
  }

  g.append('text').attr('y', R + (line2 ? 43 : 30)).attr('text-anchor', 'middle')
    .attr('font-size', '10px').attr('fill', colors.text5)
    .attr('font-family', 'system-ui, sans-serif').text(formatYears(person))

  if (hasIssue) {
    g.append('circle')
      .attr('cx', 28).attr('cy', -28).attr('r', 8)
      .attr('fill', '#f59e0b').attr('stroke', bg).attr('stroke-width', 2)
    g.append('text')
      .attr('x', 28).attr('y', -28)
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('font-size', '9px').attr('font-weight', '800')
      .attr('fill', '#fff').attr('font-family', 'system-ui, sans-serif')
      .text('!')
  }
}

// ── Component ───────────────────────────────────────────────────

export interface FamilyTreeProps {
  document?:           FtreeDocument
  onPersonClick?:      (personId: string) => void
  onAddChild?:         (parentFamilyId: string) => void
  onAddSpouse?:        (familyId: string) => void
  onAddMarriage?:      (personId: string) => void
  highlightPersonId?:  string
  highlightPath?:      string[]
  issuePersonIds?:     Set<string>
  darkMode?:           boolean
}

type NodePos = { x: number; y: number }

const FamilyTree = forwardRef<SVGSVGElement, FamilyTreeProps>(function FamilyTree({
  document: doc = DEMO_DOCUMENT,
  onPersonClick, onAddChild, onAddSpouse, onAddMarriage,
  highlightPersonId, highlightPath, issuePersonIds, darkMode = false,
}, forwardedRef) {
  const svgRef   = useRef<SVGSVGElement>(null)
  const zoomRef  = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const posRef   = useRef<Map<string, NodePos>>(new Map())
  const linksRef = useRef<Map<string, string>>(new Map())  // "parentId:childId" → SVG path string
  const hlGRef   = useRef<D3G | null>(null)

  useImperativeHandle(forwardedRef, () => svgRef.current as SVGSVGElement)

  const [collapsed,          setCollapsed]          = useState<Set<string>>(new Set())

  // ── Main draw effect ──────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current
    if (!el) return

    const colors: DrawColors = darkMode ? {
      text:     '#f1f5f9', text3: '#94a3b8', text5: '#a8a29e',
      border:   '#334155', maleBg: '#0d1f48', femaleBg: '#3d0f2a',
      brand:    '#4f46e5', brandFg: '#ffffff', surface: '#1e293b',
    } : {
      text:     '#1e1b4b', text3: '#6b7280', text5: '#78716c',
      border:   '#e5e7eb', maleBg: '#eff6ff', femaleBg: '#fdf2f8',
      brand:    '#1e1b4b', brandFg: '#ffffff', surface: '#f9fafb',
    }

    const prevTransform = d3.zoomTransform(el)

    const svg = d3.select(el)
    svg.selectAll('*').remove()

    const tree = buildTree(doc, collapsed)
    if (!tree) {
      svg.attr('width', '100%').attr('height', '100%')
      return
    }

    const hierarchy = d3.hierarchy<TreeNode>(tree, d => d.children.length ? d.children : null)
    const root      = d3.tree<TreeNode>()
      .nodeSize([NODE_W, NODE_H])
      .separation((a, b) => {
        const samePar = a.parent === b.parent
        const base    = samePar ? 1 : 2
        // D3 calls sep(rightSibling, leftSibling) for same-parent pairs (a=RIGHT, b=LEFT)
        // but sep(leftContour, rightContour) for cross-branch pairs (a=LEFT, b=RIGHT).
        // Secondary wives now extend RIGHT → the LEFT node's secondary wives need gap from RIGHT node.
        const [right, left] = samePar ? [a, b] : [b, a]
        const secondary = left.data.extraFamilies.length * 0.5  // each secondary wife adds SPOUSE_GAP/NODE_W
        const rightBuf  = right.data.spouse ? 0.5 : 0           // right couple: husband shifts center left
        const leftBuf   = left.data.spouse  ? 0.3 : 0           // left couple: wife extends right 65px
        return base + secondary + rightBuf + leftBuf
      })(hierarchy)

    // Post-layout: secondary marriage children must sit to the RIGHT of their wife.
    // D3 centers children under the couple center, unaware of wife x positions,
    // so secondary children might end up left of their wife → causes crossing edges.
    root.each(n => {
      if (!n.children || n.data.extraFamilies.length === 0) return
      for (let i = 0; i < n.data.extraFamilies.length; i++) {
        const wifeX  = n.x + SPOUSE_GAP / 2 + (i + 1) * SPOUSE_GAP
        const offset = i + 1
        const secKids = n.children.filter(c => c.data.parentFamilyOffset === offset)
        if (secKids.length === 0) continue
        const leftmostX = Math.min(...secKids.map(c =>
          c.data.spouse ? c.x - SPOUSE_GAP / 2 : c.x
        ))
        const minAllowed = wifeX + SPOUSE_GAP / 2
        if (leftmostX < minAllowed) {
          const delta = minAllowed - leftmostX
          secKids.forEach(c => c.each(d => { d.x += delta }))
        }
      }
    })

    const PAD = 100
    let minX = Infinity
    root.each(n => {
      // Secondary wives now extend RIGHT, so leftmost element is always the husband
      const left = (n.data.spouse ? n.x - SPOUSE_GAP / 2 : n.x) - R
      if (left < minX) minX = left
    })
    root.each(n => { n.x -= minX - PAD })

    let maxX = 0, maxY = 0
    root.each(n => {
      const numExtra = n.data.extraFamilies.length
      // Rightmost element: last secondary wife (or primary wife if no secondary)
      const rightmostX = n.data.spouse
        ? n.x + SPOUSE_GAP / 2 + numExtra * SPOUSE_GAP
        : n.x + numExtra * SPOUSE_GAP
      maxX = Math.max(maxX, rightmostX + R + PAD)
      maxY = Math.max(maxY, n.y + R + 80)
    })
    svg.attr('width', maxX).attr('height', maxY + PAD)

    // Collect node positions for highlight / pan
    const positions = new Map<string, NodePos>()
    root.each(n => {
      const px = n.data.spouse ? n.x - SPOUSE_GAP / 2 : n.x
      positions.set(n.data.person.id, { x: px, y: n.y })
      if (n.data.spouse) positions.set(n.data.spouse.id, { x: n.x + SPOUSE_GAP / 2, y: n.y })
      // Secondary wives extend to the RIGHT of primary wife
      const primaryWifeX = n.data.spouse ? n.x + SPOUSE_GAP / 2 : n.x
      n.data.extraFamilies.forEach((ef, i) => {
        if (ef.spouse) positions.set(ef.spouse.id, { x: primaryWifeX + (i + 1) * SPOUSE_GAP, y: n.y })
      })
    })
    posRef.current = positions

    const g = svg.append('g') as D3G

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 2.5])
      .on('zoom', e => g.attr('transform', e.transform))
    zoomRef.current = zoom
    svg.call(zoom)
    svg.call(zoom.transform, prevTransform)

    // Layer order: highlights → links → nodes
    const hlG      = g.append('g').attr('class', 'hl').attr('data-no-export', 'true') as D3G
    const linkLayer = g.append('g') as D3G
    const nodeLayer = g.append('g') as D3G
    hlGRef.current = hlG
    hlG.append('g').attr('class', 'hl-search')
    hlG.append('g').attr('class', 'hl-path')

    // ── Links (comb/bracket style) ────────────────────────────
    const edgeMap = new Map<string, string>()

    // Group children by [sourceNodeFamilyId + marriageOffset]
    type LinkGroup = {
      source:  d3.HierarchyPointNode<TreeNode>
      offset:  number
      targets: d3.HierarchyPointNode<TreeNode>[]
    }
    const linkGroups = new Map<string, LinkGroup>()
    root.links().forEach(({ source, target }) => {
      const offset = target.data.parentFamilyOffset
      const key    = `${source.data.familyId}:${offset}`
      const grp    = linkGroups.get(key) ?? { source, offset, targets: [] }
      grp.targets.push(target)
      linkGroups.set(key, grp)
    })

    const personNodeX = (n: d3.HierarchyPointNode<TreeNode>) =>
      n.data.spouse ? n.x - SPOUSE_GAP / 2 : n.x

    for (const { source, offset, targets } of linkGroups.values()) {
      const isMultiMarriage = source.data.extraFamilies.length > 0

      let sx: number
      let sy: number

      if (isMultiMarriage) {
        if (offset === 0) {
          // Primary family: stem from couple center, like single-marriage.
          // Prevents bracket from extending right toward secondary wife area.
          sx = source.x
          sy = source.data.spouse ? source.y : source.y + R
        } else {
          // Secondary family: stem from the specific secondary wife's circle.
          // Layout: wife1 — wife2 — wife3 right of husband.
          sx = source.x + SPOUSE_GAP / 2 + offset * SPOUSE_GAP
          sy = source.y + R
        }
      } else {
        // Single marriage: existing behaviour unchanged
        sx = source.x
        sy = source.data.spouse ? source.y : source.y + R
      }

      // Sort targets left → right
      const sorted = [...targets].sort((a, b) => personNodeX(a) - personNodeX(b))

      const childTopY  = sorted[0].y - R
      // Reverse stagger: later wives (higher offset) get HIGHER junctions (shorter stems).
      // This prevents a later wife's vertical stem from crossing an earlier wife's horizontal
      // bracket — the earlier wife's bracket sits BELOW all later wifes' junction levels.
      const staggerK   = isMultiMarriage && offset > 0
        ? (source.data.extraFamilies.length - offset + 1) * 24
        : 0
      const junctionY  = (sy + childTopY) / 2 + staggerK

      // Vertical stem from source down to junction
      const stemD = `M ${sx} ${sy} V ${junctionY}`
      linkLayer.append('path').attr('d', stemD)
        .attr('fill', 'none').attr('stroke', '#94a3b8')
        .attr('stroke-width', 2).attr('stroke-linecap', 'round')

      if (sorted.length === 1) {
        // Single child: one L-shaped jog from stem to child
        const tx = personNodeX(sorted[0])
        const ty = sorted[0].y - R
        const jogD = `M ${sx} ${junctionY} H ${tx} V ${ty}`
        linkLayer.append('path').attr('d', jogD)
          .attr('fill', 'none').attr('stroke', '#94a3b8')
          .attr('stroke-width', 2).attr('stroke-linecap', 'round')
        edgeMap.set(`${source.data.person.id}:${sorted[0].data.person.id}`,
          `${stemD} ${jogD}`)
      } else {
        // Multiple children: horizontal bracket covering all + stem attachment
        const leftX  = Math.min(personNodeX(sorted[0]), sx)
        const rightX = Math.max(personNodeX(sorted[sorted.length - 1]), sx)
        linkLayer.append('path')
          .attr('d', `M ${leftX} ${junctionY} H ${rightX}`)
          .attr('fill', 'none').attr('stroke', '#94a3b8').attr('stroke-width', 2)
        // Drop from bracket to each child
        for (const target of sorted) {
          const tx = personNodeX(target)
          const ty = target.y - R
          linkLayer.append('path')
            .attr('d', `M ${tx} ${junctionY} V ${ty}`)
            .attr('fill', 'none').attr('stroke', '#94a3b8')
            .attr('stroke-width', 2).attr('stroke-linecap', 'round')
          edgeMap.set(`${source.data.person.id}:${target.data.person.id}`,
            `M ${sx} ${sy} V ${junctionY} H ${tx} V ${ty}`)
        }
      }
    }
    // Store spouse lines (primary + extra) for in-law kinship highlight
    root.each(n => {
      if (n.data.spouse) {
        const d = `M ${n.x - SPOUSE_GAP / 2 + R} ${n.y} H ${n.x + SPOUSE_GAP / 2 - R}`
        edgeMap.set(`${n.data.person.id}:${n.data.spouse.id}`, d)
        edgeMap.set(`${n.data.spouse.id}:${n.data.person.id}`, d)
      }
      // Secondary wives are to the RIGHT of primary wife; each connects to the previous wife
      n.data.extraFamilies.forEach((ef, i) => {
        if (!ef.spouse) return
        const prevX   = n.x + SPOUSE_GAP / 2 + i * SPOUSE_GAP  // previous wife x (i=0 → primary wife)
        const spouseX = prevX + SPOUSE_GAP                       // this secondary wife x
        const d = `M ${prevX + R} ${n.y} H ${spouseX - R}`
        edgeMap.set(`${n.data.person.id}:${ef.spouse.id}`, d)
        edgeMap.set(`${ef.spouse.id}:${n.data.person.id}`, d)
      })
    })
    linksRef.current = edgeMap

    // ── Nodes ────────────────────────────────────────────────
    root.each(node => {
      const { x, y, data: d } = node
      const personX = d.spouse ? x - SPOUSE_GAP / 2 : x

      // Primary marriage bar + spouse
      if (d.spouse) {
        nodeLayer.append('line')
          .attr('x1', personX + R).attr('y1', y)
          .attr('x2', x + SPOUSE_GAP / 2 - R).attr('y2', y)
          .attr('stroke', '#64748b').attr('stroke-width', 2)
        drawPerson(nodeLayer, x + SPOUSE_GAP / 2, y, d.spouse, colors, onPersonClick, issuePersonIds?.has(d.spouse.id))
      }

      // Extra marriages — rendered to the RIGHT of the primary wife, in order
      d.extraFamilies.forEach((ef, i) => {
        // Connect to previous wife (i=0 → primary wife; i>0 → previous secondary wife)
        const prevX   = x + SPOUSE_GAP / 2 + i * SPOUSE_GAP
        const spouseX = prevX + SPOUSE_GAP
        if (ef.spouse) {
          nodeLayer.append('line')
            .attr('x1', prevX + R).attr('y1', y)
            .attr('x2', spouseX - R).attr('y2', y)
            .attr('stroke', '#64748b').attr('stroke-width', 2)
          drawPerson(nodeLayer, spouseX, y, ef.spouse, colors, onPersonClick, issuePersonIds?.has(ef.spouse.id))
        }
      })

      // Primary person
      drawPerson(nodeLayer, personX, y, d.person, colors, onPersonClick, issuePersonIds?.has(d.person.id))

      // Collapse / expand badge
      const hasChildren = d.children.length > 0 || d.hiddenCount > 0
      const showCollapseBadge = hasChildren
      if (showCollapseBadge) {
        const isCollapsed = d.hiddenCount > 0
        const badge = nodeLayer.append('g').attr('data-no-export', 'true')
          .attr('transform', `translate(${x},${y + R + 58})`)
          .style('cursor', 'pointer')
          .on('click', (e: MouseEvent) => {
            e.stopPropagation()
            setCollapsed(prev => {
              const next = new Set(prev)
              next.has(d.familyId) ? next.delete(d.familyId) : next.add(d.familyId)
              return next
            })
          })
        badge.append('circle')
          .attr('r', 10)
          .attr('fill', isCollapsed ? colors.brand : colors.surface)
          .attr('stroke', colors.border).attr('stroke-width', 1.5)
        badge.append('text')
          .attr('text-anchor', 'middle').attr('dy', '0.35em')
          .attr('font-size', '9px').attr('font-weight', '700')
          .attr('fill', isCollapsed ? colors.brandFg : colors.text3)
          .text(isCollapsed ? `+${d.hiddenCount}` : '−')
      }

      // Add-child button
      if (onAddChild) {
        const btnY = y + R + 58 + (showCollapseBadge ? 26 : 0)
        const addBtn = nodeLayer.append('g').attr('data-no-export', 'true')
          .attr('transform', `translate(${x},${btnY})`)
          .style('cursor', 'pointer')
          .on('click', (e: MouseEvent) => { e.stopPropagation(); onAddChild(d.familyId) })
        addBtn.append('circle')
          .attr('r', 9)
          .attr('fill', '#f0fdf4').attr('stroke', '#16a34a').attr('stroke-width', 1.5)
        addBtn.append('text')
          .attr('text-anchor', 'middle').attr('dy', '0.35em')
          .attr('font-size', '11px').attr('font-weight', '700').attr('fill', '#16a34a')
          .text('+')
      }

      // Add-spouse button (only for primary family without spouse)
      if (onAddSpouse && !d.spouse) {
        const spouseX = personX + R + 16
        const addSpouseBtn = nodeLayer.append('g').attr('data-no-export', 'true')
          .attr('transform', `translate(${spouseX},${y})`)
          .style('cursor', 'pointer')
          .on('click', (e: MouseEvent) => { e.stopPropagation(); onAddSpouse(d.familyId) })
        addSpouseBtn.append('circle')
          .attr('r', 9)
          .attr('fill', '#fef9c3').attr('stroke', '#ca8a04').attr('stroke-width', 1.5)
        addSpouseBtn.append('text')
          .attr('text-anchor', 'middle').attr('dy', '0.35em')
          .attr('font-size', '10px').attr('font-weight', '700').attr('fill', '#ca8a04')
          .text('⊕')
      }
    })
  }, [doc, collapsed, onPersonClick, onAddChild, onAddSpouse, onAddMarriage, issuePersonIds, darkMode])

  // ── Auto-expand collapsed nodes that are part of highlight path ─
  useEffect(() => {
    if (!highlightPath || highlightPath.length === 0) return
    const missing = highlightPath.filter(id => !posRef.current.has(id))
    if (missing.length === 0) return
    const childToParent = new Map<string, string>()
    doc.families.forEach(f => f.childIds.forEach(cid => childToParent.set(cid, f.id)))
    setCollapsed(prev => {
      const next = new Set(prev)
      missing.forEach(id => {
        const famId = childToParent.get(id)
        if (famId) next.delete(famId)
      })
      return next
    })
  }, [highlightPath, doc])

  // ── Search highlight ring (no full redraw) ───────────────────
  useEffect(() => {
    const hg = hlGRef.current
    if (!hg) return
    const layer = hg.select<SVGGElement>('.hl-search')
    layer.selectAll('*').remove()
    if (!highlightPersonId) return
    const pos = posRef.current.get(highlightPersonId)
    if (!pos) return
    layer.append('circle')
      .attr('cx', pos.x).attr('cy', pos.y)
      .attr('r', R + 10)
      .attr('fill', 'none')
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 3.5)
      .attr('stroke-dasharray', '6 3')
  }, [highlightPersonId])

  // ── Kinship path highlight ────────────────────────────────────
  useEffect(() => {
    const hg = hlGRef.current
    if (!hg) return
    const layer = hg.select<SVGGElement>('.hl-path')
    layer.selectAll('*').remove()
    if (!highlightPath || highlightPath.length < 2) return

    const edges     = linksRef.current
    const positions = posRef.current

    // Highlight each edge segment along the path
    for (let i = 0; i < highlightPath.length - 1; i++) {
      const a = highlightPath[i]
      const b = highlightPath[i + 1]
      const d = edges.get(`${a}:${b}`) ?? edges.get(`${b}:${a}`)
      if (!d) continue
      // Outer glow
      layer.append('path')
        .attr('d', d).attr('fill', 'none')
        .attr('stroke', '#6366f1').attr('stroke-width', 10)
        .attr('stroke-linecap', 'round').attr('opacity', 0.15)
      // Inner highlight
      layer.append('path')
        .attr('d', d).attr('fill', 'none')
        .attr('stroke', '#818cf8').attr('stroke-width', 4)
        .attr('stroke-linecap', 'round').attr('opacity', 0.7)
    }

    // Endpoint rings
    highlightPath.forEach((id, i) => {
      const pos = positions.get(id)
      if (!pos) return
      const isEndpoint = i === 0 || i === highlightPath.length - 1
      layer.append('circle')
        .attr('cx', pos.x).attr('cy', pos.y)
        .attr('r', R + (isEndpoint ? 9 : 6))
        .attr('fill', isEndpoint ? 'rgba(99,102,241,0.08)' : 'none')
        .attr('stroke', isEndpoint ? '#6366f1' : '#a5b4fc')
        .attr('stroke-width', isEndpoint ? 2.5 : 1.5)
    })
  }, [highlightPath, doc, collapsed])

  // ── Pan to highlighted node ───────────────────────────────────
  useEffect(() => {
    if (!highlightPersonId || !svgRef.current || !zoomRef.current) return
    const pos = posRef.current.get(highlightPersonId)
    if (!pos) return
    const el = svgRef.current
    const w  = el.clientWidth  || 800
    const h  = el.clientHeight || 600
    const k  = d3.zoomTransform(el).k
    const t  = d3.zoomIdentity.scale(k).translate(w / (2 * k) - pos.x, h / (2 * k) - pos.y)
    d3.select(el).transition().duration(500).call(zoomRef.current.transform, t)
  }, [highlightPersonId])

  return (
    <svg
      ref={svgRef}
      style={{ display: 'block', background: 'var(--t-tree-bg)', width: '100%', minHeight: '100vh' }}
    />
  )
})

export default FamilyTree
