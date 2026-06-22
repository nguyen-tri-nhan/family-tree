import { useNavigate } from 'react-router-dom'

const AUTHOR = {
  name:     'Nguyễn Trí Nhân',
  email:    'nguyentrinhan.dev@gmail.com',
  website:  'https://nguyen-tri-nhan.github.io',
  linkedin: 'https://www.linkedin.com/in/nguyen-tri-nhan',
}

export function AboutPage() {
  const navigate = useNavigate()

  return (
    <div style={page}>
      <button onClick={() => navigate(-1)} style={backBtn}>← Quay lại</button>

      <div style={card}>
        {/* App identity */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>🌳</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: 'var(--t-text)' }}>
            Cây Gia Phả
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--t-text-4)' }}>
            Ứng dụng quản lý và trực quan hoá gia phả theo dạng cây.
          </p>
        </div>

        <hr style={divider} />

        {/* Author */}
        <section style={{ marginBottom: 4 }}>
          <p style={sectionLabel}>Tác giả</p>
          <p style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: 'var(--t-text)' }}>
            {AUTHOR.name}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ContactRow icon="✉" label={AUTHOR.email}     href={`mailto:${AUTHOR.email}`} />
            <ContactRow icon="🌐" label="nguyen-tri-nhan.github.io" href={AUTHOR.website} />
            <ContactRow icon="in" label="LinkedIn"        href={AUTHOR.linkedin} isLinkedIn />
          </div>
        </section>

        <hr style={divider} />

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/terms')}
            style={termsLink}
          >
            Điều khoản sử dụng
          </button>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--t-text-5)' }}>
            Dùng cho mục đích cá nhân và gia đình
          </p>
        </div>
      </div>
    </div>
  )
}

function ContactRow({
  icon, label, href, isLinkedIn,
}: { icon: string; label: string; href: string; isLinkedIn?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={contactLink}>
      <span style={iconBox(isLinkedIn)}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--t-text-2)' }}>{label}</span>
    </a>
  )
}

// ── Styles ─────────────────────────────────────────────────────

const page: React.CSSProperties = {
  minHeight:      '100vh',
  background:     'var(--t-bg)',
  display:        'flex',
  flexDirection:  'column',
  alignItems:     'center',
  justifyContent: 'center',
  padding:        '24px 16px',
  fontFamily:     'system-ui, sans-serif',
  position:       'relative',
}

const card: React.CSSProperties = {
  width:        '100%',
  maxWidth:     440,
  background:   'var(--t-header)',
  border:       '1px solid var(--t-border)',
  borderRadius: 16,
  padding:      '28px 32px',
  boxShadow:    '0 4px 24px rgba(0,0,0,0.08)',
}

const backBtn: React.CSSProperties = {
  position:     'absolute',
  top:          20,
  left:         20,
  background:   'none',
  border:       'none',
  cursor:       'pointer',
  fontSize:     13,
  fontWeight:   600,
  color:        'var(--t-text-3)',
  padding:      '6px 10px',
  borderRadius: 6,
}

const divider: React.CSSProperties = {
  border:    'none',
  borderTop: '1px solid var(--t-border)',
  margin:    '20px 0',
}

const sectionLabel: React.CSSProperties = {
  margin:        '0 0 10px',
  fontSize:      11,
  fontWeight:    600,
  color:         'var(--t-text-4)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const contactLink: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  gap:            10,
  textDecoration: 'none',
  borderRadius:   8,
  padding:        '6px 8px',
  margin:         '0 -8px',
  transition:     'background 0.15s',
}

const termsLink: React.CSSProperties = {
  background:     'none',
  border:         'none',
  cursor:         'pointer',
  fontSize:       12,
  color:          'var(--t-text-4)',
  textDecoration: 'underline',
  padding:        0,
}

function iconBox(isLinkedIn?: boolean): React.CSSProperties {
  return {
    width:          28,
    height:         28,
    borderRadius:   6,
    background:     isLinkedIn ? '#0A66C2' : 'var(--t-btn2-bg)',
    color:          isLinkedIn ? '#fff'    : 'var(--t-btn2-fg)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       isLinkedIn ? 10 : 14,
    fontWeight:     700,
    flexShrink:     0,
  }
}
