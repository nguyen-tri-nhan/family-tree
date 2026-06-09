import { useState, useEffect, useRef, useCallback } from 'react'
import type { FtreeDocument } from '../types'
import { buildExportCanvas } from '../utils/exportTree'
import type { ExportOptions } from '../utils/exportTree'

interface Props {
  svgEl:   SVGSVGElement | null
  doc:     FtreeDocument
  onClose: () => void
}

export function ExportDialog({ svgEl, doc, onClose }: Props) {
  const defaultTitle = doc.clan.surname
    ? `Gia phả họ ${doc.clan.surname}`
    : `Gia phả ${doc.clan.name}`

  const [opts, setOpts] = useState<ExportOptions>({
    title:          defaultTitle,
    subtitle:       '',
    showGenMarkers: true,
    font:           'system',
  })
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading,    setLoading]    = useState(false)
  const [exporting,  setExporting]  = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedulePreview = useCallback(() => {
    if (!svgEl) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const canvas = await buildExportCanvas(svgEl, doc, opts, 0.5)
        setPreviewUrl(canvas.toDataURL('image/png'))
      } catch (e) {
        console.error('Export preview error:', e)
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [svgEl, doc, opts])

  useEffect(() => { schedulePreview() }, [schedulePreview])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  async function doExportPng() {
    if (!svgEl) return
    setExporting(true)
    try {
      const canvas = await buildExportCanvas(svgEl, doc, opts, 2)
      const a = document.createElement('a')
      a.href     = canvas.toDataURL('image/png')
      a.download = `${doc.clan.name || 'gia-pha'}.png`
      a.click()
    } finally {
      setExporting(false)
    }
  }

  async function doExportPdf() {
    if (!svgEl) return
    setExporting(true)
    try {
      const canvas = await buildExportCanvas(svgEl, doc, opts, 1.5)
      const w = canvas.width, h = canvas.height
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF({
        orientation: w > h ? 'l' : 'p',
        unit:        'px',
        format:      [w, h],
        putOnlyUsedFonts: true,
      })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h)
      pdf.save(`${doc.clan.name || 'gia-pha'}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  function set<K extends keyof ExportOptions>(k: K, v: ExportOptions[K]) {
    setOpts(o => ({ ...o, [k]: v }))
  }

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={dialog}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={dialogHeader}>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--t-text)' }}>Xuất gia phả</span>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Settings panel */}
          <div style={settingsPanel}>
            <Field label="Tiêu đề">
              <input
                value={opts.title}
                onChange={e => set('title', e.target.value)}
                style={inputStyle}
                placeholder="Gia phả họ ..."
              />
            </Field>

            <Field label="Tiêu đề phụ (tuỳ chọn)">
              <input
                value={opts.subtitle}
                onChange={e => set('subtitle', e.target.value)}
                style={inputStyle}
                placeholder="Ngành trưởng • Đời thứ 1–8"
              />
            </Field>

            <Field label="Font chữ">
              <select
                value={opts.font}
                onChange={e => set('font', e.target.value as ExportOptions['font'])}
                style={inputStyle}
              >
                <option value="system">Hệ thống (sans-serif)</option>
                <option value="serif">Truyền thống (serif)</option>
              </select>
            </Field>

            <label style={checkRow}>
              <input
                type="checkbox"
                checked={opts.showGenMarkers}
                onChange={e => set('showGenMarkers', e.target.checked)}
                style={{ marginRight: 8, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: 'var(--t-text)' }}>Hiển thị số đời</span>
            </label>
          </div>

          {/* Preview panel */}
          <div style={previewPanel}>
            {loading ? (
              <span style={{ fontSize: 13, color: 'var(--t-text-4)' }}>Đang tạo xem trước…</span>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="preview"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}
              />
            ) : null}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div style={dialogFooter}>
          <button onClick={onClose} style={cancelBtnStyle} disabled={exporting}>Hủy</button>
          <button onClick={doExportPdf} style={actionBtn(false)} disabled={exporting || !svgEl}>
            {exporting ? '…' : '↓ PDF'}
          </button>
          <button onClick={doExportPng} style={actionBtn(true)} disabled={exporting || !svgEl}>
            {exporting ? '…' : '↓ PNG'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {children}
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const dialog: React.CSSProperties = {
  background:    'var(--t-bg)',
  border:        '1px solid var(--t-border)',
  borderRadius:  12,
  width:         880,
  maxWidth:      '96vw',
  height:        560,
  maxHeight:     '90vh',
  display:       'flex',
  flexDirection: 'column',
  overflow:      'hidden',
  boxShadow:     '0 24px 64px rgba(0,0,0,0.35)',
}

const dialogHeader: React.CSSProperties = {
  padding:       '13px 18px',
  borderBottom:  '1px solid var(--t-border)',
  display:       'flex',
  alignItems:    'center',
  justifyContent: 'space-between',
  flexShrink:    0,
}

const dialogFooter: React.CSSProperties = {
  padding:       '10px 18px',
  borderTop:     '1px solid var(--t-border)',
  display:       'flex',
  gap:           8,
  justifyContent: 'flex-end',
  flexShrink:    0,
}

const settingsPanel: React.CSSProperties = {
  width:        240,
  flexShrink:   0,
  padding:      '16px 18px',
  borderRight:  '1px solid var(--t-border)',
  overflowY:    'auto',
  display:      'flex',
  flexDirection: 'column',
  gap:          16,
}

const previewPanel: React.CSSProperties = {
  flex:           1,
  overflow:       'auto',
  padding:        20,
  display:        'flex',
  alignItems:     'flex-start',
  justifyContent: 'center',
  background:     'var(--t-tree-bg)',
}

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '6px 9px',
  borderRadius: 6,
  border:       '1px solid var(--t-border)',
  fontSize:     13,
  color:        'var(--t-text)',
  background:   'var(--t-bg)',
  boxSizing:    'border-box',
  outline:      'none',
}

const checkRow: React.CSSProperties = {
  display:    'flex',
  alignItems: 'center',
  cursor:     'pointer',
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 16, color: 'var(--t-text-4)', lineHeight: 1, padding: '2px 4px',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '7px 16px', borderRadius: 8,
  border: '1px solid var(--t-border)',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  background: 'transparent', color: 'var(--t-text-2)',
  marginRight: 'auto',
}

function actionBtn(primary: boolean): React.CSSProperties {
  return {
    padding:      '7px 18px',
    borderRadius: 8,
    border:       'none',
    fontSize:     13,
    fontWeight:   700,
    cursor:       'pointer',
    background:   primary ? 'var(--t-brand)'   : 'var(--t-btn2-bg)',
    color:        primary ? 'var(--t-brand-fg)' : 'var(--t-btn2-fg)',
  }
}
