import { useRef, useState, useEffect, useCallback } from 'react'
import FamilyTree from './FamilyTree'
import { PersonPanel }  from './components/PersonPanel'
import { PersonForm }   from './components/PersonForm'
import { SearchBar }    from './components/SearchBar'
import { KinshipDrawer } from './components/KinshipDrawer'
import { ClanForm }     from './components/ClanForm'
import { useStorage }   from './storage'
import { deletePerson } from './mutations'
import { downloadPng, downloadPdf } from './utils/exportTree'
import type { FtreeDocument } from './types'

type FormMode =
  | { type: 'add-root' }
  | { type: 'add-child';  parentFamilyId: string }
  | { type: 'add-spouse'; familyId: string }
  | { type: 'add-parent'; childPersonId: string }
  | { type: 'edit';       personId: string }

type CompareMode =
  | { active: false }
  | { active: true; firstPersonId: string }

export interface AppProps {
  headerPadding?:        string
  headerDrag?:           boolean
  onHeaderDoubleClick?:  (e: React.MouseEvent<HTMLElement>) => void
  welcomeFooter?:        React.ReactNode
}

export function App({
  headerPadding       = '8px 20px',
  headerDrag          = false,
  onHeaderDoubleClick,
  welcomeFooter,
}: AppProps) {
  const storage = useStorage()
  const treeRef = useRef<SVGSVGElement>(null)

  const [doc,            setDoc]        = useState<FtreeDocument | null>(null)
  const [recentFiles,    setRecent]     = useState<{ path: string; name: string; openedAt: string }[]>([])
  const [saved,          setSaved]      = useState(false)
  const [selectedPerson, setSelected]   = useState<string | null>(null)
  const [formMode,       setFormMode]   = useState<FormMode | null>(null)
  const [highlight,      setHighlight]  = useState<string | undefined>()
  const [compareMode,    setCompareMode] = useState<CompareMode>({ active: false })
  const [kinshipPair,    setKinshipPair] = useState<{ a: string; b: string } | null>(null)
  const [showClanForm,   setShowClanForm] = useState(false)

  useEffect(() => {
    storage.getRecentFiles().then(setRecent).catch(console.error)
    if (storage.hasSession()) {
      storage.load().then(setDoc).catch(console.error)
    }
  }, [storage])

  useEffect(() => {
    if (!compareMode.active) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setCompareMode({ active: false }) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [compareMode.active])

  async function handleNew() {
    try {
      await storage.newFile()
      setDoc(await storage.load())
      setSelected(null)
    } catch (e) {
      if (e instanceof Error && e.message !== 'Hủy tạo file mới') alert(e.message)
    }
  }

  async function handleOpen() {
    try {
      const d = await storage.openFile()
      setDoc(d)
      setSelected(null)
      setHighlight(undefined)
      setCompareMode({ active: false })
      setKinshipPair(null)
    } catch (e) {
      if (e instanceof Error && e.message !== 'Không có file được chọn') alert(e.message)
    }
  }

  async function handleSave() {
    if (!doc) return
    await storage.save(doc)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleFormSubmit(updatedDoc: FtreeDocument, newPersonId?: string) {
    setDoc(updatedDoc)
    setFormMode(null)
    if (newPersonId) {
      setSelected(newPersonId)
      setHighlight(newPersonId)
    }
  }

  function handleDelete(personId: string) {
    if (!doc) return
    try {
      setDoc(deletePerson(doc, personId))
      setSelected(null)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Lỗi khi xoá')
    }
  }

  // Ref pattern: giữ compareMode mới nhất mà không tạo reference mới cho callback
  const compareModeRef = useRef(compareMode)
  useEffect(() => { compareModeRef.current = compareMode }, [compareMode])

  const handlePersonClick = useCallback((personId: string) => {
    const cm = compareModeRef.current
    if (cm.active) {
      setKinshipPair({ a: cm.firstPersonId, b: personId })
      setCompareMode({ active: false })
      return
    }
    setSelected(personId)
    setHighlight(undefined)
  }, [])

  const handleAddChild = useCallback((parentFamilyId: string) => {
    setFormMode({ type: 'add-child', parentFamilyId })
  }, [])

  const handleAddSpouse = useCallback((familyId: string) => {
    setFormMode({ type: 'add-spouse', familyId })
  }, [])

  async function handleExportPng() {
    if (!treeRef.current || !doc) return
    await downloadPng(treeRef.current, doc.clan.name)
  }

  async function handleExportPdf() {
    if (!treeRef.current || !doc) return
    await downloadPdf(treeRef.current, doc.clan.name)
  }

  const dragStyle = headerDrag
    ? { WebkitAppRegion: 'drag', userSelect: 'none' } as React.CSSProperties
    : undefined
  const noDragStyle = headerDrag
    ? { WebkitAppRegion: 'no-drag' } as React.CSSProperties
    : undefined

  if (!doc) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, ...dragStyle }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1e1b4b' }}>Cây Gia Phả</h1>
        <div style={{ display: 'flex', gap: 12, ...noDragStyle }}>
          <button onClick={handleOpen} style={btn(false)}>Mở file .ftree</button>
          <button onClick={handleNew}  style={btn(true)}>Tạo mới</button>
        </div>
        {recentFiles.length > 0 && (
          <div style={{ marginTop: 16, textAlign: 'center', ...noDragStyle }}>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>File gần đây</p>
            {recentFiles.map(f => (
              <div key={f.path} style={{ fontSize: 13, color: '#4b5563' }}>
                {f.name} — {f.path.split('/').pop()}
              </div>
            ))}
          </div>
        )}
        {welcomeFooter && (
          <div style={{ marginTop: 8, ...noDragStyle }}>
            {welcomeFooter}
          </div>
        )}
      </div>
    )
  }

  const headerStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
    background: '#fef08a', borderBottom: '1px solid #fde047',
    padding: headerPadding,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12,
    ...dragStyle,
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100%', overflow: 'hidden' }}>
      <header style={headerStyle} onDoubleClick={onHeaderDoubleClick}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#1e1b4b', margin: 0 }}>Cây Gia Phả</h1>
          <span style={{ fontSize: 11, color: '#78716c' }}>{doc.clan.name}</span>
        </div>

        <div style={noDragStyle}>
          <SearchBar doc={doc} onSelect={id => setHighlight(id)} />
        </div>

        <div style={{ display: 'flex', gap: 6, ...noDragStyle }}>
          <button onClick={handleOpen}                  style={btn(false)}>Mở file</button>
          <button onClick={handleSave}                  style={btn(true)}>{saved ? '✓ Đã lưu' : 'Lưu'}</button>
          <button onClick={handleExportPng}             style={btn(false)}>↓ PNG</button>
          <button onClick={handleExportPdf}             style={btn(false)}>↓ PDF</button>
          <button onClick={() => setShowClanForm(true)} style={btn(false)}>⚙</button>
        </div>
      </header>

      {compareMode.active && (
        <div style={compareBanner}>
          <span>Chọn người thứ 2 để xem quan hệ — nhấn ESC để huỷ</span>
          <button onClick={() => setCompareMode({ active: false })} style={cancelBtn}>✕ Huỷ</button>
        </div>
      )}

      <div style={{ paddingTop: compareMode.active ? 84 : 48, position: 'relative' }}>
        <FamilyTree
          ref={treeRef}
          document={doc}
          highlightPersonId={highlight}
          onPersonClick={handlePersonClick}
          onAddChild={handleAddChild}
          onAddSpouse={handleAddSpouse}
        />
        {doc.families.length === 0 && (
          <div style={emptyState}>
            <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 14 }}>Chưa có ai trong gia phả</p>
            <button onClick={() => setFormMode({ type: 'add-root' })} style={btn(true)}>
              + Thêm người đầu tiên
            </button>
          </div>
        )}
      </div>

      {selectedPerson && (
        <PersonPanel
          personId={selectedPerson}
          doc={doc}
          onClose={() => setSelected(null)}
          onEdit={id => { setFormMode({ type: 'edit', personId: id }); setSelected(null) }}
          onDelete={handleDelete}
          onAddParent={childPersonId  => { setFormMode({ type: 'add-parent', childPersonId }); setSelected(null) }}
          onAddChild={parentFamilyId => { setFormMode({ type: 'add-child', parentFamilyId }); setSelected(null) }}
          onAddSpouse={familyId      => { setFormMode({ type: 'add-spouse', familyId }); setSelected(null) }}
          onCompare={() => {
            setCompareMode({ active: true, firstPersonId: selectedPerson })
            setSelected(null)
          }}
        />
      )}

      {formMode && (
        <PersonForm
          mode={formMode}
          doc={doc}
          onSubmit={handleFormSubmit}
          onClose={() => setFormMode(null)}
        />
      )}

      {kinshipPair && (
        <KinshipDrawer
          doc={doc}
          personAId={kinshipPair.a}
          personBId={kinshipPair.b}
          onClose={() => setKinshipPair(null)}
        />
      )}

      {showClanForm && (
        <ClanForm
          doc={doc}
          onSubmit={d => { setDoc(d); setShowClanForm(false) }}
          onClose={() => setShowClanForm(false)}
        />
      )}
    </div>
  )
}

const emptyState: React.CSSProperties = {
  position: 'absolute', top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
}

const compareBanner: React.CSSProperties = {
  position: 'fixed', top: 48, left: 0, right: 0, zIndex: 9,
  background: '#0891b2', color: '#fff',
  padding: '8px 20px', fontSize: 13, fontWeight: 600,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
}

const cancelBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.2)', border: 'none',
  borderRadius: 6, color: '#fff', fontSize: 12,
  fontWeight: 700, cursor: 'pointer', padding: '3px 10px',
}

function btn(primary: boolean): React.CSSProperties {
  return {
    padding: '6px 14px', borderRadius: 8, border: 'none',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    background: primary ? '#1e1b4b' : '#e5e7eb',
    color:      primary ? '#fff'    : '#374151',
    whiteSpace: 'nowrap',
  }
}
