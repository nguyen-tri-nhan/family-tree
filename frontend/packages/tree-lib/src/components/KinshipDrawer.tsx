import type { FtreeDocument, Person } from '../types'
import { buildIndex } from '../types'
import { computeKinship } from '../kinship'
import type { Region } from '../kinship'

interface KinshipDrawerProps {
  doc:       FtreeDocument
  personAId: string
  personBId: string
  onClose:   () => void
}

export function KinshipDrawer({ doc, personAId, personBId, onClose }: KinshipDrawerProps) {
  const region: Region = doc.clan.region ?? 'north'
  const idx  = buildIndex(doc)
  const pA   = idx.personMap.get(personAId)
  const pB   = idx.personMap.get(personBId)

  if (!pA || !pB) return null

  const ab = computeKinship(doc, personAId, personBId, region)
  const ba = computeKinship(doc, personBId, personAId, region)

  const pathNames = (ab?.path ?? []).map(id => idx.personMap.get(id)?.displayName ?? '…')

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={closeBtn}>✕</button>

        <div style={{ fontWeight: 800, fontSize: 15, color: '#1e1b4b', marginBottom: 16, textAlign: 'center' }}>
          Quan hệ họ hàng
        </div>

        {/* Person pair */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          <PersonChip person={pA} />
          <span style={{ color: '#9ca3af', fontSize: 18, fontWeight: 300 }}>↔</span>
          <PersonChip person={pB} />
        </div>

        {!ab && !ba ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            Không tìm thấy quan hệ họ hàng
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ab && <RelRow fromName={pA.displayName} toName={pB.displayName} label={ab.label} selfLabel={ab.selfLabel} />}
            {ba && <RelRow fromName={pB.displayName} toName={pA.displayName} label={ba.label} selfLabel={ba.selfLabel} />}
          </div>
        )}

        {/* Path */}
        {ab && ab.path.length > 1 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
            <div style={sectionLabel}>Đường nối ({ab.path.length - 1} bậc)</div>
            <div style={{ fontSize: 12, color: '#374151', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              {pathNames.map((name, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontWeight: i === 0 || i === pathNames.length - 1 ? 700 : 500 }}>{name}</span>
                  {i < pathNames.length - 1 && <span style={{ color: '#d1d5db', margin: '0 2px' }}>›</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────

function PersonChip({ person }: { person: Person }) {
  const color = person.gender === 'female' ? '#be185d' : '#1d4ed8'
  const bg    = person.gender === 'female' ? '#fdf2f8' : '#eff6ff'
  return (
    <div style={{ textAlign: 'center', minWidth: 90, maxWidth: 120 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%', background: bg,
        border: `2px solid ${color}`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 20, margin: '0 auto 4px',
      }}>
        {person.gender === 'female' ? '♀' : '♂'}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e1b4b', lineHeight: 1.2 }}>
        {person.displayName}
      </div>
    </div>
  )
}

function RelRow({
  fromName, toName, label, selfLabel,
}: { fromName: string; toName: string; label: string; selfLabel: string }) {
  return (
    <div style={{
      background: '#f9fafb', borderRadius: 8, padding: '10px 12px',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 3 }}>
        <span style={{ fontWeight: 600, color: '#374151' }}>{fromName}</span> gọi{' '}
        <span style={{ fontWeight: 600, color: '#374151' }}>{toName}</span> là:
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1e1b4b', marginBottom: 3 }}>
        "{label}"
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af' }}>
        {fromName} tự xưng:{' '}
        <span style={{ fontWeight: 600, color: '#6b7280' }}>"{selfLabel}"</span>
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const modal: React.CSSProperties = {
  background: '#fff', borderRadius: 14,
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  padding: 24, width: 380, maxWidth: 'calc(100vw - 32px)',
  maxHeight: 'calc(100vh - 60px)', overflowY: 'auto',
  position: 'relative',
}

const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 12, right: 12,
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 14, color: '#9ca3af', padding: 4,
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
}
