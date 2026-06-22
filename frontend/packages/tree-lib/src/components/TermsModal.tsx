const TERMS_KEY = 'ft-terms-v1'

interface TermsModalProps {
  onAccept:  () => void
  onViewFull: () => void
}

export function TermsModal({ onAccept, onViewFull }: TermsModalProps) {
  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={header}>
          <span style={headerTitle}>Điều khoản sử dụng</span>
        </div>

        <div style={body}>
          <p style={intro}>
            Trước khi sử dụng Cây Gia Phả, vui lòng đọc và đồng ý với các
            điều khoản sau:
          </p>

          <ul style={list}>
            <li style={item}>
              Ứng dụng là tài sản trí tuệ của tác giả — không được sao chép
              hoặc phân phối lại.
            </li>
            <li style={item}>
              Tác giả không chịu trách nhiệm về mất dữ liệu. Hãy tự sao lưu
              file <code style={code}>.ftree</code> của bạn.
            </li>
            <li style={item}>
              Bản miễn phí giới hạn <strong>200 thành viên</strong> mỗi file.
            </li>
            <li style={item}>
              Dữ liệu lưu cục bộ trên máy bạn — không lên server, không cần
              tài khoản.
            </li>
          </ul>
        </div>

        <div style={footer}>
          <button onClick={onViewFull} style={secondaryBtn}>
            Xem đầy đủ ↗
          </button>
          <button onClick={onAccept} style={primaryBtn}>
            Đồng ý &amp; Tiếp tục
          </button>
        </div>
      </div>
    </div>
  )
}

export function isTermsAccepted(): boolean {
  return !!localStorage.getItem(TERMS_KEY)
}

export function acceptTerms(): void {
  localStorage.setItem(TERMS_KEY, '1')
}

// ── Styles ────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position:        'fixed',
  inset:           0,
  zIndex:          9999,
  background:      'rgba(0,0,0,0.55)',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  fontFamily:      'system-ui, sans-serif',
}

const dialog: React.CSSProperties = {
  background:   'var(--t-card)',
  borderRadius: 14,
  boxShadow:    '0 24px 64px rgba(0,0,0,0.3)',
  width:        380,
  maxWidth:     'calc(100vw - 32px)',
  overflow:     'hidden',
}

const header: React.CSSProperties = {
  padding:      '16px 20px 14px',
  borderBottom: '1px solid var(--t-border)',
}

const headerTitle: React.CSSProperties = {
  fontSize:   15,
  fontWeight: 800,
  color:      'var(--t-text)',
}

const body: React.CSSProperties = {
  padding: '16px 20px',
}

const intro: React.CSSProperties = {
  margin:     '0 0 14px',
  fontSize:   13,
  lineHeight: 1.6,
  color:      'var(--t-text-2)',
}

const list: React.CSSProperties = {
  margin:      0,
  paddingLeft: 20,
  display:     'flex',
  flexDirection: 'column',
  gap:         10,
}

const item: React.CSSProperties = {
  fontSize:   13,
  lineHeight: 1.6,
  color:      'var(--t-text-2)',
}

const code: React.CSSProperties = {
  fontFamily:   'monospace',
  fontSize:     12,
  background:   'var(--t-surface)',
  padding:      '1px 4px',
  borderRadius: 3,
}

const footer: React.CSSProperties = {
  display:       'flex',
  gap:           10,
  justifyContent: 'flex-end',
  padding:       '12px 20px 16px',
  borderTop:     '1px solid var(--t-border)',
}

const primaryBtn: React.CSSProperties = {
  background:   '#4f46e5',
  color:        '#fff',
  border:       'none',
  borderRadius: 8,
  padding:      '9px 18px',
  cursor:       'pointer',
  fontSize:     13,
  fontWeight:   700,
}

const secondaryBtn: React.CSSProperties = {
  background:   'none',
  color:        'var(--t-text-3)',
  border:       '1px solid var(--t-border)',
  borderRadius: 8,
  padding:      '9px 14px',
  cursor:       'pointer',
  fontSize:     13,
  fontWeight:   600,
}
