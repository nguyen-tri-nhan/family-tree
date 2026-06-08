import { useState } from 'react'
import type { FtreeDocument, Clan } from '../types'
import { touchUpdatedAt } from '../document'

interface ClanFormProps {
  doc:      FtreeDocument
  onSubmit: (doc: FtreeDocument) => void
  onClose:  () => void
}

export function ClanForm({ doc, onSubmit, onClose }: ClanFormProps) {
  const [name,    setName]    = useState(doc.clan.name)
  const [surname, setSurname] = useState(doc.clan.surname)
  const [region,  setRegion]  = useState<'north' | 'south'>(doc.clan.region ?? 'north')
  const [origin,  setOrigin]  = useState(doc.clan.origin ?? '')
  const [desc,    setDesc]    = useState(doc.clan.description ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const updated: Clan = {
      ...doc.clan,
      name:        name.trim() || doc.clan.name,
      surname:     surname.trim(),
      region,
      origin:      origin.trim() || undefined,
      description: desc.trim()   || undefined,
    }
    onSubmit(touchUpdatedAt({ ...doc, clan: updated }))
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={header}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#1e1b4b' }}>Thông tin dòng họ</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Tên dòng họ *">
            <input
              style={input} value={name} required
              onChange={e => setName(e.target.value)}
              placeholder="Họ Nguyễn Văn — Làng Đông Ngạc"
            />
          </Field>

          <Field label="Họ (surname)">
            <input
              style={input} value={surname}
              onChange={e => setSurname(e.target.value)}
              placeholder="Nguyễn"
            />
          </Field>

          <Field label="Vùng — ảnh hưởng xưng hô">
            <div style={{ display: 'flex', gap: 10 }}>
              <RegionOption value="north" current={region} label="Miền Bắc" sub="Anh Cả, Chị Hai..." onChange={setRegion} />
              <RegionOption value="south" current={region} label="Miền Nam"  sub="Anh Hai, Chị Ba..."  onChange={setRegion} />
            </div>
          </Field>

          <Field label="Gốc tích / Quê quán">
            <input
              style={input} value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="Làng Đông Ngạc, Từ Liêm, Hà Nội"
            />
          </Field>

          <Field label="Mô tả">
            <textarea
              style={{ ...input, height: 70, resize: 'vertical' }}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Lịch sử, nét đặc trưng của dòng họ..."
            />
          </Field>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={btnSecondary}>Huỷ</button>
            <button type="submit" style={btnPrimary}>Lưu</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{label}</label>
      {children}
    </div>
  )
}

function RegionOption({
  value, current, label, sub, onChange,
}: { value: 'north' | 'south'; current: 'north' | 'south'; label: string; sub: string; onChange: (v: 'north' | 'south') => void }) {
  const active = value === current
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      style={{
        flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
        border: `2px solid ${active ? '#1e1b4b' : '#e5e7eb'}`,
        background: active ? '#f0f0ff' : '#fff',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, color: active ? '#1e1b4b' : '#374151' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>
    </button>
  )
}

// ── Styles ───────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 100,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const modal: React.CSSProperties = {
  background: '#fff', borderRadius: 12,
  boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
  padding: 24, width: 420, maxWidth: 'calc(100vw - 32px)',
  maxHeight: 'calc(100vh - 60px)', overflowY: 'auto',
}

const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18,
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9ca3af', padding: 2,
}

const input: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7,
  border: '1px solid #d1d5db', fontSize: 13, color: '#1f2937',
  outline: 'none', boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 8, border: 'none',
  background: '#1e1b4b', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db',
  background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
