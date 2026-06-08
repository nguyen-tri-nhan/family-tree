export async function treeToDataUrl(svgEl: SVGSVGElement, scale = 2): Promise<string> {
  const w = Number(svgEl.getAttribute('width'))  || svgEl.clientWidth
  const h = Number(svgEl.getAttribute('height')) || svgEl.clientHeight

  // Inline the background fill so the exported image matches what's on screen
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

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
  ctx.fillStyle = '#fef9c3'
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

  // Dynamic import so the app still loads even before `make install` adds jspdf
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
