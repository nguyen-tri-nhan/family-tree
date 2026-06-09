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
interface TreeNode {
  familyId: string
  person:   Person
  spouse?:  Person
  children: TreeNode[]
  hiddenCount: number
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
  ],
  families: [
    { id: 'f1', personId: 'p1',  spouseId: 'p2', marriageStatus: 'widowed', childIds: ['p3','p5','p6'], generation: 1 },
    { id: 'f2', personId: 'p3',  spouseId: 'p4', marriageStatus: 'married', childIds: ['p8','p9'],      generation: 2 },
    { id: 'f3', personId: 'p5',  marriageStatus: 'single',  childIds: [],              generation: 2 },
    { id: 'f4', personId: 'p6',  spouseId: 'p7', marriageStatus: 'married', childIds: ['p10','p11','p12'], generation: 2 },
    { id: 'f5', personId: 'p8',  marriageStatus: 'single',  childIds: [],              generation: 3 },
    { id: 'f6', personId: 'p9',  marriageStatus: 'single',  childIds: [],              generation: 3 },
    { id: 'f7', personId: 'p10', marriageStatus: 'single',  childIds: [],              generation: 3 },
    { id: 'f8', personId: 'p11', marriageStatus: 'single',  childIds: [],              generation: 3 },
    { id: 'f9', personId: 'p12', marriageStatus: 'single',  childIds: [],              generation: 3 },
  ],
}

// ── Convert FtreeDocument → internal tree ───────────────────────

function buildTree(doc: FtreeDocument, collapsed: Set<string>): TreeNode | null {
  if (doc.families.length === 0) return null

  const { personMap, familyByPerson } = buildIndex(doc)
  const childPersonIds = new Set(doc.families.flatMap(f => f.childIds))
  const rootFamilies   = doc.families.filter(f => !childPersonIds.has(f.personId))
  if (rootFamilies.length === 0) return null

  function countDescendants(family: FamilyUnit): number {
    return family.childIds.reduce((sum, childId) => {
      const cf = familyByPerson.get(childId)
      return cf ? sum + 1 + countDescendants(cf) : sum + 1
    }, 0)
  }

  function buildNode(family: FamilyUnit): TreeNode {
    const person = personMap.get(family.personId)!
    const spouse = family.spouseId ? personMap.get(family.spouseId) : undefined
    const childFamilies = family.childIds
      .map(id => familyByPerson.get(id))
      .filter((f): f is FamilyUnit => f !== undefined)

    if (collapsed.has(family.id)) {
      return {
        familyId: family.id, person, spouse, children: [],
        hiddenCount: childFamilies.reduce((s, cf) => s + 1 + countDescendants(cf), 0),
      }
    }
    return {
      familyId: family.id, person, spouse,
      children: childFamilies.map(buildNode),
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
  document?:          FtreeDocument
  onPersonClick?:     (personId: string) => void
  onAddChild?:        (parentFamilyId: string) => void
  onAddSpouse?:       (familyId: string) => void
  highlightPersonId?: string
  highlightPath?:     string[]
  issuePersonIds?:    Set<string>
  darkMode?:          boolean
}

type NodePos = { x: number; y: number }

const FamilyTree = forwardRef<SVGSVGElement, FamilyTreeProps>(function FamilyTree({
  document: doc = DEMO_DOCUMENT,
  onPersonClick, onAddChild, onAddSpouse,
  highlightPersonId, highlightPath, issuePersonIds, darkMode = false,
}, forwardedRef) {
  const svgRef   = useRef<SVGSVGElement>(null)
  const zoomRef  = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const posRef   = useRef<Map<string, NodePos>>(new Map())
  const linksRef = useRef<Map<string, string>>(new Map())  // "parentId:childId" → SVG path string
  const hlGRef   = useRef<D3G | null>(null)

  useImperativeHandle(forwardedRef, () => svgRef.current as SVGSVGElement)

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

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
    const root      = d3.tree<TreeNode>().nodeSize([NODE_W, NODE_H])(hierarchy)

    const PAD = 100
    let minX = Infinity
    root.each(n => {
      const left = n.data.spouse ? n.x - SPOUSE_GAP / 2 - R : n.x - R
      if (left < minX) minX = left
    })
    root.each(n => { n.x -= minX - PAD })

    let maxX = 0, maxY = 0
    root.each(n => {
      const right = n.data.spouse ? n.x + SPOUSE_GAP / 2 + R : n.x + R
      maxX = Math.max(maxX, right + PAD)
      maxY = Math.max(maxY, n.y + R + 80)
    })
    svg.attr('width', maxX).attr('height', maxY + PAD)

    // Collect node positions for highlight / pan
    const positions = new Map<string, NodePos>()
    root.each(n => {
      const px = n.data.spouse ? n.x - SPOUSE_GAP / 2 : n.x
      positions.set(n.data.person.id, { x: px, y: n.y })
      if (n.data.spouse) positions.set(n.data.spouse.id, { x: n.x + SPOUSE_GAP / 2, y: n.y })
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

    // ── Links ─────────────────────────────────────────────────
    const edgeMap = new Map<string, string>()
    root.links().forEach(({ source, target }) => {
      const sx   = source.x
      const sy   = source.data.spouse ? source.y : source.y + R
      const tx   = target.data.spouse ? target.x - SPOUSE_GAP / 2 : target.x
      const ty   = target.y - R
      const midY = (source.y + target.y) / 2
      const d    = `M ${sx} ${sy} V ${midY} H ${tx} V ${ty}`
      linkLayer.append('path')
        .attr('d', d)
        .attr('fill', 'none').attr('stroke', '#94a3b8')
        .attr('stroke-width', 2).attr('stroke-linecap', 'round')
      edgeMap.set(`${source.data.person.id}:${target.data.person.id}`, d)
    })
    // Store spouse lines too (for in-law paths)
    root.each(n => {
      if (n.data.spouse) {
        const d = `M ${n.x - SPOUSE_GAP / 2 + R} ${n.y} H ${n.x + SPOUSE_GAP / 2 - R}`
        edgeMap.set(`${n.data.person.id}:${n.data.spouse.id}`, d)
        edgeMap.set(`${n.data.spouse.id}:${n.data.person.id}`, d)
      }
    })
    linksRef.current = edgeMap

    // ── Nodes ────────────────────────────────────────────────
    root.each(node => {
      const { x, y, data: d } = node

      if (d.spouse) {
        nodeLayer.append('line')
          .attr('x1', x - SPOUSE_GAP / 2 + R).attr('y1', y)
          .attr('x2', x + SPOUSE_GAP / 2 - R).attr('y2', y)
          .attr('stroke', '#64748b').attr('stroke-width', 2)
        drawPerson(nodeLayer, x + SPOUSE_GAP / 2, y, d.spouse,  colors, onPersonClick, issuePersonIds?.has(d.spouse.id))
        drawPerson(nodeLayer, x - SPOUSE_GAP / 2, y, d.person, colors, onPersonClick, issuePersonIds?.has(d.person.id))
      } else {
        drawPerson(nodeLayer, x, y, d.person, colors, onPersonClick, issuePersonIds?.has(d.person.id))
      }

      // Collapse / expand badge
      const hasChildren = d.children.length > 0 || d.hiddenCount > 0
      if (hasChildren) {
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
        const btnY = y + R + 58 + (hasChildren ? 26 : 0)
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

      // Add-spouse button
      if (onAddSpouse && !d.spouse) {
        const spouseX = x + R + 16
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
  }, [doc, collapsed, onPersonClick, onAddChild, onAddSpouse, issuePersonIds, darkMode])  // darkMode triggers D3 re-read CSS vars

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
  }, [highlightPath, doc])

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
