import { useState } from 'react'
import type { FtreeDocument, PartialDate } from '../types'
import { addPerson, addFamilyUnit, addParent, setSpouse, updatePerson } from '../mutations'
import { touchUpdatedAt } from '../document'
import { DateInput } from './DateInput'
import { validateDocument } from '../utils/validateTree'
import type { ValidationIssue } from '../utils/validateTree'

type FormMode =
  | { type: 'add-root' }
  | { type: 'add-child';  parentFamilyId: string }
  | { type: 'add-spouse'; familyId: string }
  | { type: 'add-parent'; childPersonId: string }
  | { type: 'edit';       personId: string }

interface PersonFormProps {
  mode:     FormMode
  doc:      FtreeDocument
  onSubmit: (doc: FtreeDocument, newPersonId?: string) => void
  onClose:  () => void
}

type Tab = 'basic' | 'names' | 'dates'

interface FormState {
  displayName:  string
  gender:       'male' | 'female' | 'unknown'
  isAlive:      boolean
  nameBirth:    string
  nameNickname: string
  nameCourtesy: string
  nameTaboo:    string
  nameSino:     string
  birthDate?:   PartialDate
  birthPlace:   string
  deathDate?:   PartialDate
  deathPlace:   string
  bio:          string
  notes:        string
}

const EMPTY: FormState = {
  displayName: '', gender: 'male', isAlive: true,
  nameBirth: '', nameNickname: '', nameCourtesy: '', nameTaboo: '', nameSino: '',
  birthPlace: '', deathPlace: '', bio: '', notes: '',
}

function tabLabel(t: Tab): string {
  return t === 'basic' ? 'Cơ bản' : t === 'names' ? 'Tên' : 'Ngày tháng'
}

export function PersonForm({ mode, doc, onSubmit, onClose }: PersonFormProps) {
  const [tab,    setTab]    = useState<Tab>('basic')
  const [form,   setForm]   = useState<FormState>(() => {
    if (mode.type === 'edit') {
      const p = doc.persons.find(x => x.id === mode.personId)
      if (!p) return EMPTY
      return {
        displayName:  p.displayName,
        gender:       p.gender,
        isAlive:      p.isAlive,
        nameBirth:    p.names?.birth     ?? '',
        nameNickname: p.names?.nickname  ?? '',
        nameCourtesy: p.names?.courtesy  ?? '',
        nameTaboo:    p.names?.taboo     ?? '',
        nameSino:     p.names?.sinograph ?? '',
        birthDate:    p.birthDate,
        birthPlace:   p.birthPlace  ?? '',
        deathDate:    p.deathDate,
        deathPlace:   p.deathPlace  ?? '',
        bio:          p.bio   ?? '',
        notes:        p.notes ?? '',
      }
    }
    return EMPTY
  })
  const [error,       setError]       = useState('')
  const [formWarnings, setFormWarnings] = useState<ValidationIssue[]>([])
  const [pendingDoc,   setPendingDoc]   = useState<{ doc: FtreeDocument; id?: string } | null>(null)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function validate(): string {
    if (!form.displayName.trim()) return 'Tên hiển thị không được để trống'
    const by = form.birthDate?.year
    const dy = form.deathDate?.year
    if (by && (by < 1 || by > new Date().getFullYear() + 1)) return 'Năm sinh không hợp lệ'
    if (dy && by && dy < by) return 'Năm mất phải sau năm sinh'
    return ''
  }

  function handleSubmit() {
    // User already saw warnings and confirmed
    if (pendingDoc) {
      onSubmit(pendingDoc.doc, pendingDoc.id)
      return
    }

    const err = validate()
    if (err) { setError(err); return }

    const names = [form.nameBirth, form.nameNickname, form.nameCourtesy, form.nameTaboo, form.nameSino]
      .some(Boolean) ? {
        birth:     form.nameBirth     || undefined,
        nickname:  form.nameNickname  || undefined,
        courtesy:  form.nameCourtesy  || undefined,
        taboo:     form.nameTaboo     || undefined,
        sinograph: form.nameSino      || undefined,
      } : undefined

    const personInput = {
      displayName:  form.displayName.trim(),
      gender:       form.gender,
      isAlive:      form.isAlive,
      names,
      birthDate:    form.birthDate,
      birthPlace:   form.birthPlace   || undefined,
      deathDate:    form.isAlive ? undefined : form.deathDate,
      deathPlace:   form.isAlive ? undefined : (form.deathPlace || undefined),
      bio:          form.bio    || undefined,
      notes:        form.notes  || undefined,
    }

    let updatedDoc = doc
    let newPersonId: string | undefined

    if (mode.type === 'add-root') {
      const { doc: d1, person } = addPerson(updatedDoc, personInput)
      updatedDoc  = addFamilyUnit(d1, person.id, 1)
      newPersonId = person.id
    } else if (mode.type === 'edit') {
      updatedDoc = updatePerson(updatedDoc, mode.personId, personInput)
    } else if (mode.type === 'add-child') {
      const parentFamily = doc.families.find(f => f.id === mode.parentFamilyId)
      const gen          = (parentFamily?.generation ?? 1) + 1
      const { doc: d1, person } = addPerson(updatedDoc, personInput, mode.parentFamilyId)
      updatedDoc  = addFamilyUnit(d1, person.id, gen)
      newPersonId = person.id
    } else if (mode.type === 'add-spouse') {
      const { doc: d1, person } = setSpouse(updatedDoc, mode.familyId, personInput)
      updatedDoc  = d1
      newPersonId = person.id
    } else if (mode.type === 'add-parent') {
      const { doc: d1, person } = addParent(updatedDoc, mode.childPersonId, personInput)
      updatedDoc  = d1
      newPersonId = person.id
    }

    const finalDoc = touchUpdatedAt(updatedDoc)

    // Cross-relation validation
    const targetId = mode.type === 'edit' ? mode.personId : newPersonId
    const issues   = targetId
      ? validateDocument(finalDoc).filter(i => i.personIds.includes(targetId))
      : []

    if (issues.length > 0) {
      setFormWarnings(issues)
      setPendingDoc({ doc: finalDoc, id: newPersonId })
      return
    }

    onSubmit(finalDoc, newPersonId)
  }

  const title = mode.type === 'add-root'    ? 'Thêm người đầu tiên'
    : mode.type === 'edit'        ? 'Sửa thông tin'
    : mode.type === 'add-child'   ? 'Thêm con'
    : mode.type === 'add-parent'  ? 'Thêm cha / mẹ'
    : 'Thêm vợ / chồng'

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--t-text)' }}>{title}</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--t-border)', marginBottom: 18, gap: 0 }}>
          {(['basic', 'names', 'dates'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={tabBtn(t === tab)}>
              {tabLabel(t)}
            </button>
          ))}
        </div>

        {/* Tab: Cơ bản */}
        {tab === 'basic' && (
          <div style={section}>
            <Field label="Tên hiển thị *">
              <input
                value={form.displayName} autoFocus
                onChange={e => set('displayName', e.target.value)}
                style={textInput}
                placeholder="Nguyễn Văn An"
              />
            </Field>
            <Field label="Giới tính">
              <div style={{ display: 'flex', gap: 16 }}>
                {(['male', 'female', 'unknown'] as const).map(g => (
                  <label key={g} style={radioLabel}>
                    <input type="radio" checked={form.gender === g}
                      onChange={() => set('gender', g)} />
                    {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Trạng thái">
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={radioLabel}>
                  <input type="radio" checked={form.isAlive} onChange={() => set('isAlive', true)} />
                  Còn sống
                </label>
                <label style={radioLabel}>
                  <input type="radio" checked={!form.isAlive} onChange={() => set('isAlive', false)} />
                  Đã mất
                </label>
              </div>
            </Field>
          </div>
        )}

        {/* Tab: Tên */}
        {tab === 'names' && (
          <div style={section}>
            {([
              ['nameBirth',    'Tên khai sinh',  'Nguyễn Văn An'],
              ['nameNickname', 'Tên thường gọi', 'Anh An'],
              ['nameCourtesy', 'Tên tự (字)',     'Mộng Hà'],
              ['nameTaboo',    'Tên húy (諱)',    'Húy An'],
              ['nameSino',     'Chữ Hán',         '阮文安'],
            ] as [keyof FormState, string, string][]).map(([key, label, ph]) => (
              <Field key={key} label={label}>
                <input
                  value={form[key] as string}
                  onChange={e => set(key, e.target.value)}
                  placeholder={ph}
                  style={textInput}
                />
              </Field>
            ))}
          </div>
        )}

        {/* Tab: Ngày tháng */}
        {tab === 'dates' && (
          <div style={section}>
            <Field label="Ngày sinh">
              <DateInput value={form.birthDate} onChange={v => set('birthDate', v)} />
            </Field>
            <Field label="Nơi sinh">
              <input value={form.birthPlace} onChange={e => set('birthPlace', e.target.value)}
                placeholder="Hà Nội" style={textInput} />
            </Field>
            {!form.isAlive && <>
              <Field label="Ngày mất">
                <DateInput value={form.deathDate} onChange={v => set('deathDate', v)} />
              </Field>
              <Field label="Nơi mất">
                <input value={form.deathPlace} onChange={e => set('deathPlace', e.target.value)}
                  placeholder="Hà Nội" style={textInput} />
              </Field>
            </>}
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#dc2626' }}>{error}</p>
        )}

        {/* Validation warnings */}
        {formWarnings.length > 0 && (
          <div style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 8,
            background: '#fffbeb', border: '1px solid #fcd34d',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
              Cảnh báo dữ liệu:
            </div>
            {formWarnings.map(w => (
              <div key={w.id} style={{ fontSize: 12, color: '#78350f', marginBottom: 3, lineHeight: 1.4 }}>
                {w.severity === 'error' ? '■ ' : '▲ '}{w.message}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--t-border)' }}>
          {formWarnings.length > 0 ? (
            <>
              <button
                onClick={() => { setFormWarnings([]); setPendingDoc(null) }}
                style={btn(false)}
              >
                Quay lại sửa
              </button>
              <button onClick={handleSubmit} style={{ ...btn(true), background: '#d97706', color: '#fff' }}>
                Lưu dù vậy
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose}      style={btn(false)}>Huỷ</button>
              <button onClick={handleSubmit} style={btn(true)}>Lưu</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-2)' }}>{label}</label>
      {children}
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100,
}

const modal: React.CSSProperties = {
  background: 'var(--t-card)', borderRadius: 12, padding: 24,
  width: 420, maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
}

const section: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 14,
}

const textInput: React.CSSProperties = {
  padding: '7px 10px', fontSize: 13, borderRadius: 7,
  border: '1px solid var(--t-border-2)', outline: 'none', width: '100%',
  background: 'var(--t-bg)', color: 'var(--t-text)',
  boxSizing: 'border-box',
}

const radioLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 13, cursor: 'pointer', color: 'var(--t-text-2)',
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 16,
  cursor: 'pointer', color: 'var(--t-text-4)', padding: 4,
}

function tabBtn(active: boolean): React.CSSProperties {
  return {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '6px 14px', fontSize: 13, fontWeight: active ? 700 : 400,
    color: active ? 'var(--t-text)' : 'var(--t-text-3)',
    borderBottom: active ? '2px solid var(--t-brand)' : '2px solid transparent',
    marginBottom: -1,
  }
}

function btn(primary: boolean): React.CSSProperties {
  return {
    padding: '7px 20px', borderRadius: 8, border: 'none',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    background: primary ? 'var(--t-brand)'   : 'var(--t-btn2-bg)',
    color:      primary ? 'var(--t-brand-fg)' : 'var(--t-btn2-fg)',
  }
}
