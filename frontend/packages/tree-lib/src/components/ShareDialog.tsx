import { useState } from 'react'
import { encode } from 'uqr'

interface ShareDialogProps {
  url:       string
  oversized: boolean   // URL > 4000 chars (messenger may not make clickable)
  onClose:   () => void
}

const QR_WARN = 2000   // URL chars — QR getting dense
const QR_MAX  = 2953   // URL chars — QR impossible (binary mode v40 limit)

export function ShareDialog({ url, oversized, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const isLocalFile = url.startsWith('file://')
  const canQr   = !isLocalFile && url.length <= QR_MAX
  const qrDense = url.length >  QR_WARN
  const qr      = canQr ? encode(url) : null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const handleDownloadPng = () => {
    if (!qr) return
    const cell    = 8
    const pad     = 24
    const total   = qr.size * cell + pad * 2
    const canvas  = document.createElement('canvas')
    canvas.width  = canvas.height = total
    const ctx     = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, total, total)
    ctx.fillStyle = '#000000'
    for (let r = 0; r < qr.size; r++)
      for (let c = 0; c < qr.size; c++)
        if (qr.data[r][c])
          ctx.fillRect(pad + c * cell, pad + r * cell, cell, cell)
    const a      = document.createElement('a')
    a.download   = 'gia-pha-qr.png'
    a.href       = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={dialog}>
        {/* Header */}
        <div style={dialogHeader}>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--t-text)' }}>↗ Chia sẻ gia phả</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={dialogBody}>
          {/* Link */}
          <div style={sectionLabel}>🔗 Link chia sẻ</div>
          <div style={urlRow}>
            <div style={urlBox}>{url}</div>
            <button onClick={handleCopy} style={actionBtn(copied ? '#16a34a' : '#4f46e5')}>
              {copied ? '✓ Đã copy' : 'Copy'}
            </button>
          </div>
          {isLocalFile && (
            <div style={warn}>
              ⚠ Ứng dụng đang chạy offline — link này chỉ dùng được trên máy này. Để chia sẻ với người khác, cần cấu hình <strong>SHARE_BASE_URL</strong> trong bản phát hành.
            </div>
          )}
          {!isLocalFile && oversized && (
            <div style={warn}>
              ⚠ URL khá dài ({url.length} ký tự) — một số ứng dụng nhắn tin có thể không hiển thị dưới dạng link clickable.
            </div>
          )}

          {/* QR */}
          <div style={{ ...sectionLabel, marginTop: 20 }}>📷 QR Code</div>
          {!canQr ? (
            <div style={warn}>
              ⚠ Cây quá lớn để tạo QR ({url.length} / {QR_MAX} ký tự). Dùng link phía trên để chia sẻ.
            </div>
          ) : (
            <>
              {qrDense && (
                <div style={warn}>
                  ⚠ QR khá dày — nên scan trong điều kiện ánh sáng tốt.
                </div>
              )}
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 8 }}>
                {qr && <QrSvg data={qr.data} size={qr.size} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                  <button onClick={handleDownloadPng} style={actionBtn('#059669')}>↓ Tải PNG</button>
                  <span style={{ fontSize: 11, color: 'var(--t-text-4)', lineHeight: 1.5 }}>
                    Cho người khác<br />scan trực tiếp<br />từ màn hình
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── QR SVG renderer ───────────────────────────────────────────────

const QR_DISPLAY_SIZE = 160

function QrSvg({ data, size }: { data: boolean[][]; size: number }) {
  const cell  = 4
  const total = size * cell
  let path    = ''
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (data[r][c])
        path += `M${c * cell} ${r * cell}h${cell}v${cell}h-${cell}z`

  return (
    <svg
      width={QR_DISPLAY_SIZE} height={QR_DISPLAY_SIZE}
      viewBox={`-8 -8 ${total + 16} ${total + 16}`}
      style={{ background: '#fff', borderRadius: 8, border: '1px solid var(--t-border)', flexShrink: 0 }}
    >
      <path d={path} fill="#000" />
    </svg>
  )
}

// ── Styles ────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const dialog: React.CSSProperties = {
  background: 'var(--t-card)',
  borderRadius: 12,
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  width: 380,
  maxWidth: 'calc(100vw - 32px)',
  fontFamily: 'system-ui, sans-serif',
  overflow: 'hidden',
}

const dialogHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 16px 12px',
  borderBottom: '1px solid var(--t-border)',
}

const dialogBody: React.CSSProperties = {
  padding: '16px',
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, color: 'var(--t-text-4)', padding: '2px 6px', borderRadius: 4,
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--t-text-4)',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8,
}

const urlRow: React.CSSProperties = {
  display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: 8,
}

const urlBox: React.CSSProperties = {
  flex: 1, fontSize: 11, color: 'var(--t-text-3)',
  background: 'var(--t-surface)', border: '1px solid var(--t-border)',
  borderRadius: 6, padding: '7px 10px',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  fontFamily: 'monospace',
}

const warn: React.CSSProperties = {
  fontSize: 12, color: '#92400e',
  background: '#fef3c7', border: '1px solid #fde68a',
  borderRadius: 6, padding: '8px 10px', marginBottom: 8,
  lineHeight: 1.5,
}

function actionBtn(color: string): React.CSSProperties {
  return {
    background: color, color: '#fff',
    border: 'none', borderRadius: 8,
    padding: '8px 14px', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
    flexShrink: 0,
  }
}
