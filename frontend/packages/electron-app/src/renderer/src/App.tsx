import { useRef, useState, useEffect } from 'react'
import {
  FamilyTree, PersonPanel, PersonForm, SearchBar, KinshipDrawer, ClanForm,
  useStorage, deletePerson, downloadPng, downloadPdf,
} from '@family-tree/tree-lib'
import type { FtreeDocument, RecentFile } from '@family-tree/tree-lib'

type FormMode =
  | { type: 'add-root' }
  | { type: 'add-child';  parentFamilyId: string }
  | { type: 'add-spouse'; familyId: string }
  | { type: 'edit';       personId: string }

type CompareMode =
  | { active: false }
  | { active: true; firstPersonId: string }

export default function App() {
  const storage = useStorage()
  const treeRef = useRef<SVGSVGElement>(null)

  const [doc,            setDoc]         = useState<FtreeDocument | null>(null)
  const [recentFiles,    setRecent]      = useState<RecentFile[]>([])
  const [saved,          setSaved]       = useState(false)
  const [selectedPerson, setSelected]    = useState<string | null>(null)
  const [formMode,       setFormMode]    = useState<FormMode | null>(null)
  const [highlight,      setHighlight]   = useState<string | undefined>()
  const [compareMode,    setCompareMode]  = useState<CompareMode>({ active: false })
  const [kinshipPair,    setKinshipPair]  = useState<{ a: string; b: string } | null>(null)
  const [showClanForm,   setShowClanForm] = useState(false)

  useEffect(() => {
    storage.getRecentFiles().then(setRecent).catch(console.error)
    if (storage.hasSession()) {
      storage.load().then(setDoc).catch(console.error)
    }
  }, [storage])

  // ESC cancels compare mode
  useEffect(() => {
    if (!compareMode.active) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setCompareMode({ active: false }) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [compareMode.active])

  async function handleNew() {
    await storage.newFile()
    setDoc(await storage.load())
    setSelected(null)
  }

  async function handleOpen() {
    const d = await storage.openFile()
    setDoc(d)
    setSelected(null)
    setHighlight(undefined)
    setCompareMode({ active: false })
    setKinshipPair(null)
  }

  async function handleSave() {
    if (!doc) return
    await storage.save(doc)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleFormSubmit(updatedDoc: FtreeDocument) {
    setDoc(updatedDoc)
    setFormMode(null)
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

  function handlePersonClick(personId: string) {
    if (compareMode.active) {
      setKinshipPair({ a: compareMode.firstPersonId, b: personId })
      setCompareMode({ active: false })
      return
    }
    setSelected(personId)
    setHighlight(undefined)
  }

  async function handleExportPng() {
    if (!treeRef.current || !doc) return
    await downloadPng(treeRef.current, doc.clan.name)
  }

  async function handleExportPdf() {
    if (!treeRef.current || !doc) return
    await downloadPdf(treeRef.current, doc.clan.name)
  }

  if (!doc) {
    return <WelcomeScreen recentFiles={recentFiles} onNew={handleNew} onOpen={handleOpen} />
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#1e1b4b', margin: 0 }}>Cây Gia Phả</h1>
          <span style={{ fontSize: 11, color: '#78716c' }}>{doc.clan.name}</span>
        </div>

        <SearchBar doc={doc} onSelect={id => setHighlight(id)} />

        <div style={{ display: 'flex', gap: 6, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button onClick={handleOpen}                  style={btn(false)}>Mở file</button>
          <button onClick={handleSave}                  style={btn(true)}>{saved ? '✓ Đã lưu' : 'Lưu'}</button>
          <button onClick={handleExportPng}             style={btn(false)}>↓ PNG</button>
          <button onClick={handleExportPdf}             style={btn(false)}>↓ PDF</button>
          <button onClick={() => setShowClanForm(true)} style={btn(false)}>⚙</button>
        </div>
      </header>

      {/* Compare mode banner */}
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
          onAddChild={parentFamilyId => setFormMode({ type: 'add-child', parentFamilyId })}
          onAddSpouse={familyId      => setFormMode({ type: 'add-spouse', familyId })}
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
          onEdit={id   => { setFormMode({ type: 'edit', personId: id }); setSelected(null) }}
          onDelete={handleDelete}
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

function WelcomeScreen({
  recentFiles, onNew, onOpen,
}: { recentFiles: RecentFile[]; onNew: () => void; onOpen: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1e1b4b' }}>Cây Gia Phả</h1>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onOpen} style={btn(false)}>Mở file .ftree</button>
        <button onClick={onNew}  style={btn(true)}>Tạo mới</button>
      </div>
      {recentFiles.length > 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>File gần đây</p>
          {recentFiles.map(f => (
            <div key={f.path} style={{ fontSize: 13, color: '#4b5563' }}>
              {f.name} — {f.path.split('/').pop()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const emptyState: React.CSSProperties = {
  position: 'absolute', top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
}

const headerStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
  background: '#fef08a', borderBottom: '1px solid #fde047',
  padding: '8px 20px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 12,
  WebkitAppRegion: 'drag',
} as React.CSSProperties

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
