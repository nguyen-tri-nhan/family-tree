import type { FtreeDocument, Person, PartialDate } from '../types'
import { buildIndex } from '../types'

interface PersonPanelProps {
  personId:          string
  doc:               FtreeDocument
  editMode?:         boolean
  onClose:           () => void
  onEdit:            (personId: string) => void
  onDelete:          (personId: string) => void
  onAddChild:        (parentFamilyId: string) => void
  onAddSpouse:       (familyId: string) => void
  onAddParent?:      (childPersonId: string) => void
  onAddMarriage?:    (personId: string) => void
  onCompare?:        () => void
  expandedMarriages?: Set<string>
  onToggleMarriage?:  (familyId: string) => void
}

export function PersonPanel({
  personId, doc, editMode = false, onClose, onEdit, onDelete, onAddChild, onAddSpouse,
  onAddParent, onAddMarriage, onCompare, expandedMarriages, onToggleMarriage,
}: PersonPanelProps) {
  const { personMap, familiesByPerson, childToParentFamily, familyBySpouse } = buildIndex(doc)
  const person = personMap.get(personId)
  if (!person) return null

  const allFamilies = familiesByPerson.get(personId) ?? []
  const family      = allFamilies[0]                       // primary family
  const hasParent   = childToParentFamily.has(personId)
  const isSpouse    = !familiesByPerson.has(personId) && familyBySpouse.has(personId)

  return (
    <div style={panel}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PersonIcon gender={person.gender} size={36} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--t-text)' }}>{person.displayName}</div>
            {person.titles?.map((t, i) => (
              <span key={i} style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>{t.label} </span>
            ))}
          </div>
        </div>
        <button onClick={onClose} style={iconBtn}>✕</button>
      </div>

      {/* Dates */}
      <Section>
        {person.birthDate && (
          <Row label="Sinh">{formatDate(person.birthDate)}</Row>
        )}
        {person.birthPlace && (
          <Row label="Nơi sinh">{person.birthPlace}</Row>
        )}
        {!person.isAlive && person.deathDate && (
          <Row label="Mất">{formatDate(person.deathDate)}</Row>
        )}
        {!person.isAlive && person.deathPlace && (
          <Row label="Nơi mất">{person.deathPlace}</Row>
        )}
        {!person.birthDate && !person.deathDate && (
          <span style={{ fontSize: 12, color: 'var(--t-text-4)' }}>Chưa có thông tin ngày tháng</span>
        )}
      </Section>

      {/* Names (nếu có) */}
      {person.names && Object.values(person.names).some(Boolean) && (
        <Section title="Tên">
          {person.names.birth     && <Row label="Khai sinh">{person.names.birth}</Row>}
          {person.names.nickname  && <Row label="Thường gọi">{person.names.nickname}</Row>}
          {person.names.courtesy  && <Row label="Tên tự">{person.names.courtesy}</Row>}
          {person.names.taboo     && <Row label="Tên húy">{person.names.taboo}</Row>}
          {person.names.sinograph && <Row label="Chữ Hán">{person.names.sinograph}</Row>}
        </Section>
      )}

      {/* Education */}
      {person.education && person.education.length > 0 && (
        <Section title="Học vấn">
          {person.education.map((e, i) => (
            <div key={i} style={listItem}>
              {e.level}{e.major ? ` — ${e.major}` : ''}
              {e.institution && <div style={subText}>{e.institution}{e.graduationYear ? `, ${e.graduationYear}` : ''}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* Titles */}
      {person.titles && person.titles.length > 0 && (
        <Section title="Học hàm / Danh hiệu">
          {person.titles.map((t, i) => (
            <div key={i} style={listItem}>
              {t.label}{t.awardedYear ? ` (${t.awardedYear})` : ''}
              {t.awardedBy && <div style={subText}>{t.awardedBy}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* Occupations */}
      {person.occupations && person.occupations.length > 0 && (
        <Section title="Công việc">
          {person.occupations.map((o, i) => (
            <div key={i} style={listItem}>
              {o.title}{o.organization ? ` — ${o.organization}` : ''}
              {(o.startYear || o.endYear) && (
                <div style={subText}>{o.startYear ?? '?'} – {o.endYear ?? 'nay'}</div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Achievements */}
      {person.achievements && person.achievements.length > 0 && (
        <Section title="Thành tích">
          {person.achievements.map((a, i) => (
            <div key={i} style={listItem}>
              {a.title}{a.year ? ` (${a.year})` : ''}
              {a.description && <div style={subText}>{a.description}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* Bio */}
      {person.bio && (
        <Section title="Tiểu sử">
          <p style={{ margin: 0, fontSize: 12, color: 'var(--t-text-2)', lineHeight: 1.6 }}>{person.bio}</p>
        </Section>
      )}

      {/* Hôn nhân */}
      {allFamilies.length > 0 && (
        <Section title="Hôn nhân">
          {allFamilies.map((f, idx) => {
            const spouse     = f.spouseId ? personMap.get(f.spouseId) : undefined
            const isExpanded = !expandedMarriages || expandedMarriages.has(f.id)
            const isPrimary  = idx === 0
            const roleLabel  = f.marriageRole === 'chinh' ? 'Vợ cả' : f.marriageRole === 'thu' ? 'Vợ lẽ' : f.marriageRole === 'thiep' ? 'Tì thiếp' : null
            const statusLabel = f.marriageStatus === 'divorced' ? 'ly hôn' : f.marriageStatus === 'widowed' ? 'đã mất' : null
            const meta = [roleLabel, statusLabel].filter(Boolean).join(' · ')
            return (
              <div key={f.id} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--t-text-4)', minWidth: 16 }}>
                    {isPrimary ? '①' : `${String.fromCharCode(0x2460 + idx)}`}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text-2)', flex: 1 }}>
                    {spouse ? spouse.displayName : <span style={{ color: 'var(--t-text-4)', fontStyle: 'italic' }}>Chưa có vợ/chồng</span>}
                  </span>
                  {meta && <span style={{ fontSize: 10, color: 'var(--t-text-4)' }}>{meta}</span>}
                  {!isPrimary && onToggleMarriage && (
                    <button onClick={() => onToggleMarriage(f.id)} style={{ ...toggleBtn, background: isExpanded ? '#dbeafe' : undefined }}>
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t-text-4)', paddingLeft: 22 }}>
                  {f.childIds.length > 0
                    ? `${f.childIds.length} con`
                    : 'Chưa có con'}
                  {editMode && !spouse && (
                    <button onClick={() => onAddSpouse(f.id)} style={inlineLink}>⊕ Thêm vợ/chồng</button>
                  )}
                  {editMode && (
                    <button onClick={() => onAddChild(f.id)} style={inlineLink}>+ Thêm con</button>
                  )}
                </div>
              </div>
            )
          })}
          {editMode && onAddMarriage && allFamilies[0]?.spouseId && (
            <button onClick={() => onAddMarriage(personId)} style={addMarriageBtn}>
              + Thêm hôn nhân
            </button>
          )}
        </Section>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--t-border)' }}>
        {editMode && onAddParent && !hasParent && (
          isSpouse
            ? <button disabled style={disabledBtn} title="Gia phả liên tộc chưa được hỗ trợ">
                ↑ Thêm cha / mẹ
              </button>
            : <ActionBtn onClick={() => onAddParent(personId)} color="#059669">
                ↑ Thêm cha / mẹ
              </ActionBtn>
        )}
        {onCompare && (
          <ActionBtn onClick={onCompare} color="#0891b2">
            ↔ Xem quan hệ với...
          </ActionBtn>
        )}
        {editMode && (
          <div style={{ display: 'flex', gap: 6 }}>
            <ActionBtn onClick={() => onEdit(personId)} color="#4f46e5">
              ✏ Sửa
            </ActionBtn>
            <ActionBtn onClick={() => {
              if (confirm(`Xoá ${person.displayName}?`)) onDelete(personId)
            }} color="#dc2626">
              🗑 Xoá
            </ActionBtn>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(d: PartialDate): string {
  if (d.displayCalendar === 'lunar' && d.lunar) {
    const { year, month, day, leapMonth } = d.lunar
    const leap = leapMonth ? '*' : ''
    const parts = [day, month ? `${month}${leap}` : undefined, year].filter(Boolean)
    const lunarStr = parts.join('/')
    if (d.month && d.day) {
      return `${lunarStr} âm (${d.day}/${d.month}/${d.year})`
    }
    return `${lunarStr} âm`
  }
  const { year, month, day } = d
  if (day && month) return `${day}/${month}/${year}`
  if (month) return `${month}/${year}`
  return `${year}`
}

// ── Sub-components ───────────────────────────────────────────────

function PersonIcon({ gender, size }: { gender: Person['gender']; size: number }) {
  const color = gender === 'female' ? '#be185d' : '#1d4ed8'
  const bg    = `var(${gender === 'female' ? '--t-female-bg' : '--t-male-bg'})`
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, flexShrink: 0,
    }}>
      {gender === 'female' ? '♀' : '♂'}
    </div>
  )
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{title}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 13 }}>
      <span style={{ color: 'var(--t-text-4)', minWidth: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--t-text-2)', fontWeight: 500 }}>{children}</span>
    </div>
  )
}

function ActionBtn({ onClick, color, children }: { onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '6px 0', borderRadius: 7,
      border: `1px solid ${color}`, background: 'transparent',
      color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    }}>
      {children}
    </button>
  )
}

// ── Styles ───────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  position: 'fixed', top: 0, right: 0, bottom: 0,
  width: 280, background: 'var(--t-card)',
  boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
  padding: 18, overflowY: 'auto', zIndex: 50,
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 14, color: 'var(--t-text-4)', padding: 2, flexShrink: 0,
}

const listItem: React.CSSProperties = {
  fontSize: 13, color: 'var(--t-text-2)', fontWeight: 500,
}

const subText: React.CSSProperties = {
  fontSize: 11, color: 'var(--t-text-3)', fontWeight: 400,
}

const toggleBtn: React.CSSProperties = {
  padding: '1px 5px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
  border: '1px solid #93c5fd', color: '#3b82f6', background: 'transparent',
}

const inlineLink: React.CSSProperties = {
  marginLeft: 8, padding: '1px 6px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
  border: '1px solid var(--t-border)', background: 'transparent', color: 'var(--t-text-4)',
}

const addMarriageBtn: React.CSSProperties = {
  marginTop: 6, width: '100%', padding: '5px 0', fontSize: 11, borderRadius: 6,
  border: '1px dashed #94a3b8', background: 'transparent', color: '#64748b', cursor: 'pointer',
}

const disabledBtn: React.CSSProperties = {
  width: '100%', padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: 700,
  border: '1px solid #cbd5e1', background: 'transparent', color: '#94a3b8',
  cursor: 'not-allowed', opacity: 0.6,
}
