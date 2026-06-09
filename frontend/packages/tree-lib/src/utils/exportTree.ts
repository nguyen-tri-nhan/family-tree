import type { FtreeDocument } from '../types'
import { TREE_NODE_HEIGHT } from '../FamilyTree'

export interface ExportOptions {
  title:           string
  subtitle:        string
  showGenMarkers:  boolean
  font:            'system' | 'serif'
}

const GEN_SIDEBAR_W = 72   // logical px, scaled later
const TITLE_H       = 88   // logical px, scaled later

// Shift tree content down by half a row so that each depth-d node center
// lands exactly at the midpoint of its gen band (band d spans [d*H, (d+1)*H]).
const EXPORT_TOP_OFFSET = TREE_NODE_HEIGHT / 2  // 100 px at scale=1

function fontStack(font: ExportOptions['font']): string {
  return font === 'serif' ? "Georgia, 'Times New Roman', serif" : 'system-ui, sans-serif'
}

/**
 * Render the full tree at 1:1 zoom (ignoring the user's current pan/zoom).
 * The inner zoom <g> is reset to translate(0, EXPORT_TOP_OFFSET) scale(1).
 */
async function renderTreeCanvas(svgEl: SVGSVGElement, scale: number): Promise<HTMLCanvasElement> {
  const w     = Number(svgEl.getAttribute('width'))  || svgEl.clientWidth
  const origH = Number(svgEl.getAttribute('height')) || svgEl.clientHeight
  const newH  = origH + EXPORT_TOP_OFFSET

  const clone = svgEl.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('height', String(newH))
  clone.querySelectorAll('[data-no-export]').forEach(el => el.remove())

  // Reset zoom transform: full tree at 1:1, shifted down by EXPORT_TOP_OFFSET
  // so the root node circle is fully visible and centered in its gen band.
  const zoomG = clone.querySelector<SVGGElement>(':scope > g')
  if (zoomG) zoomG.setAttribute('transform', `translate(0,${EXPORT_TOP_OFFSET})`)

  const svgData = new XMLSerializer().serializeToString(clone)
  const blob    = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url     = URL.createObjectURL(blob)

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el  = new Image()
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = url
  })
  URL.revokeObjectURL(url)

  const canvas = document.createElement('canvas')
  canvas.width  = w * scale
  canvas.height = newH * scale
  const ctx = canvas.getContext('2d')!
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--t-tree-bg').trim()
  ctx.fillStyle = bgColor || '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0, w, newH)
  return canvas
}

/**
 * Build a decorated export canvas:
 *  - optional title header at top
 *  - optional generation sidebar on the left (aligned with tree rows)
 *  - full tree at 1:1 zoom
 *
 * Gen band d spans y ∈ [topH + d·H·s, topH + (d+1)·H·s].
 * Node center at depth d is at topH + (EXPORT_TOP_OFFSET + d·H)·s
 *                            = topH + (d + 0.5)·H·s   (= band midpoint ✓)
 */
export async function buildExportCanvas(
  svgEl:  SVGSVGElement,
  doc:    FtreeDocument,
  opts:   ExportOptions,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const treeCanvas = await renderTreeCanvas(svgEl, scale)
  const treeW      = treeCanvas.width
  const treeH      = treeCanvas.height

  const hasTitle  = !!(opts.title || opts.subtitle)
  const leftW     = opts.showGenMarkers ? GEN_SIDEBAR_W * scale : 0
  const topH      = hasTitle            ? TITLE_H        * scale : 0

  const totalW = treeW + leftW
  const totalH = treeH + topH

  const canvas = document.createElement('canvas')
  canvas.width  = totalW
  canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  const bgColor  = getComputedStyle(document.documentElement).getPropertyValue('--t-tree-bg').trim() || '#ffffff'
  const textMain = '#1a1a2e'
  const textSub  = '#4b5563'
  const divider  = '#d1d5db'
  const ff       = fontStack(opts.font)

  // ── Background ────────────────────────────────────────────────
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, totalW, totalH)

  // ── Title header ─────────────────────────────────────────────
  if (hasTitle) {
    ctx.textAlign = 'center'

    if (opts.title) {
      ctx.font      = `bold ${22 * scale}px ${ff}`
      ctx.fillStyle = textMain
      ctx.fillText(opts.title, totalW / 2, 32 * scale)
    }

    if (opts.subtitle) {
      ctx.font      = `${14 * scale}px ${ff}`
      ctx.fillStyle = textSub
      ctx.fillText(opts.subtitle, totalW / 2, (opts.title ? 54 : 36) * scale)
    }

    // Divider below header
    ctx.strokeStyle = divider
    ctx.lineWidth   = 1 * scale
    ctx.beginPath()
    ctx.moveTo(leftW, topH - 6 * scale)
    ctx.lineTo(totalW, topH - 6 * scale)
    ctx.stroke()
  }

  // ── Tree image ────────────────────────────────────────────────
  ctx.drawImage(treeCanvas, leftW, topH)

  // ── Generation sidebar ────────────────────────────────────────
  if (opts.showGenMarkers && doc.families.length > 0) {
    const gens   = doc.families.map(f => f.generation ?? 1)
    const minGen = Math.min(...gens)
    const maxGen = Math.max(...gens)
    const bandH  = TREE_NODE_HEIGHT * scale

    for (let gen = minGen; gen <= maxGen; gen++) {
      const depth = gen - minGen
      const bandY = topH + depth * bandH
      const midY  = bandY + bandH / 2   // = node center for this depth ✓

      // Alternating fill
      ctx.fillStyle = depth % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)'
      ctx.fillRect(0, bandY, leftW, bandH)

      // "Đời" label (small)
      ctx.textAlign = 'center'
      ctx.font      = `${8 * scale}px ${ff}`
      ctx.fillStyle = textSub
      ctx.fillText('Đời', leftW / 2, midY - 7 * scale)

      // Generation number (bold, larger)
      ctx.font      = `bold ${14 * scale}px ${ff}`
      ctx.fillStyle = textMain
      ctx.fillText(String(gen).padStart(2, '0'), leftW / 2, midY + 9 * scale)
    }

    // Sidebar right border
    ctx.strokeStyle = divider
    ctx.lineWidth   = 1 * scale
    ctx.beginPath()
    ctx.moveTo(leftW - 0.5 * scale, topH)
    ctx.lineTo(leftW - 0.5 * scale, totalH)
    ctx.stroke()

    // Corner fill + border for the header area above the sidebar
    if (hasTitle) {
      ctx.fillStyle = 'rgba(0,0,0,0.02)'
      ctx.fillRect(0, 0, leftW, topH)
      ctx.strokeStyle = divider
      ctx.lineWidth   = 1 * scale
      ctx.beginPath()
      ctx.moveTo(leftW - 0.5 * scale, 0)
      ctx.lineTo(leftW - 0.5 * scale, topH - 6 * scale)
      ctx.stroke()
    }
  }

  return canvas
}

// ── Original simple export helpers (still used as internal fallback) ───

export async function treeToDataUrl(svgEl: SVGSVGElement, scale = 2): Promise<string> {
  const w = Number(svgEl.getAttribute('width'))  || svgEl.clientWidth
  const h = Number(svgEl.getAttribute('height')) || svgEl.clientHeight

  const clone = svgEl.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.querySelectorAll('[data-no-export]').forEach(el => el.remove())

  const svgData = new XMLSerializer().serializeToString(clone)
  const blob    = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url     = URL.createObjectURL(blob)

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el  = new Image()
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = url
  })

  const canvas = document.createElement('canvas')
  canvas.width  = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')!
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--t-tree-bg').trim()
  ctx.fillStyle = bgColor || '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0, w, h)

  URL.revokeObjectURL(url)
  return canvas.toDataURL('image/png')
}

export async function downloadPng(svgEl: SVGSVGElement, name: string): Promise<void> {
  const dataUrl = await treeToDataUrl(svgEl, 2)
  const a = document.createElement('a')
  a.href     = dataUrl
  a.download = name.endsWith('.png') ? name : `${name}.png`
  a.click()
}

export async function downloadPdf(svgEl: SVGSVGElement, name: string): Promise<void> {
  const w      = Number(svgEl.getAttribute('width'))  || svgEl.clientWidth
  const h      = Number(svgEl.getAttribute('height')) || svgEl.clientHeight
  const dataUrl = await treeToDataUrl(svgEl, 1.5)

  const { default: jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    orientation: w > h ? 'l' : 'p',
    unit: 'px',
    format: [w, h],
    putOnlyUsedFonts: true,
  })
  pdf.addImage(dataUrl, 'PNG', 0, 0, w, h)
  pdf.save(name.endsWith('.pdf') ? name : `${name}.pdf`)
}
