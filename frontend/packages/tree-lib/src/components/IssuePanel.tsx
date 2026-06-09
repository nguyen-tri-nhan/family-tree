import type { ValidationIssue } from '../utils/validateTree'

interface IssuePanelProps {
  issues:   ValidationIssue[]
  onClose:  () => void
  onSelect: (personId: string) => void
}

export function IssuePanel({ issues, onClose, onSelect }: IssuePanelProps) {
  const errors   = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')

  return (
    <div style={panel}>
      <div style={panelHeader}>
        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--t-text)' }}>
          Kiểm tra dữ liệu
        </span>
        <button onClick={onClose} style={closeBtn}>✕</button>
      </div>

      <div style={panelBody}>
        {issues.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--t-text-4)', fontSize: 13, paddingTop: 24 }}>
            Không phát hiện vấn đề nào
          </div>
        ) : (
          <>
            {errors.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={groupLabel}>Lỗi · {errors.length}</div>
                {errors.map(i => <IssueRow key={i.id} issue={i} onSelect={onSelect} />)}
              </div>
            )}
            {warnings.length > 0 && (
              <div>
                <div style={groupLabel}>Cảnh báo · {warnings.length}</div>
                {warnings.map(i => <IssueRow key={i.id} issue={i} onSelect={onSelect} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function IssueRow({ issue, onSelect }: { issue: ValidationIssue; onSelect: (id: string) => void }) {
  const isError = issue.severity === 'error'
  return (
    <div
      style={rowStyle}
      onClick={() => onSelect(issue.personIds[0])}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-surface)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{
        flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
        background: isError ? '#dc2626' : '#d97706',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, color: '#fff',
      }}>
        {isError ? '!' : '?'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
          color: isError ? '#dc2626' : '#d97706',
          marginRight: 6,
        }}>
          {issue.rule}
        </span>
        <span style={{ fontSize: 12, color: 'var(--t-text)', lineHeight: 1.4 }}>
          {issue.message}
        </span>
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  position: 'fixed', top: 0, right: 0, bottom: 0,
  width: 320, zIndex: 110,
  background: 'var(--t-card)',
  borderLeft: '1px solid var(--t-border)',
  boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
  display: 'flex', flexDirection: 'column',
  fontFamily: 'system-ui, sans-serif',
}

const panelHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 16px 12px',
  borderBottom: '1px solid var(--t-border)',
  flexShrink: 0,
}

const panelBody: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: 16,
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, color: 'var(--t-text-4)', padding: '2px 6px', borderRadius: 4,
}

const groupLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'var(--t-text-4)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
}

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  padding: '8px 6px', borderRadius: 6, cursor: 'pointer',
  transition: 'background 0.1s', marginBottom: 4,
  background: 'transparent',
}
