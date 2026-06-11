import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import FamilyTree from './FamilyTree'
import { PersonPanel }  from './components/PersonPanel'
import { PersonForm }   from './components/PersonForm'
import { SearchBar }    from './components/SearchBar'
import { KinshipDrawer } from './components/KinshipDrawer'
import { IssuePanel }    from './components/IssuePanel'
import { computeKinship } from './kinship'
import type { Region } from './kinship'
import { validateDocument } from './utils/validateTree'
import { ClanForm }       from './components/ClanForm'
import { ExportDialog }   from './components/ExportDialog'
import { useStorage }     from './storage'
import { deletePerson, addMarriage } from './mutations'
import type { FtreeDocument } from './types'
import { encodeTree, decodeTree } from './utils/shareUrl'

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
  onAbout?:              () => void
}

export function App({
  headerPadding       = '8px 20px',
  headerDrag          = false,
  onHeaderDoubleClick,
  welcomeFooter,
  onAbout,
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
  const [showClanForm,       setShowClanForm]       = useState(false)
  const [showIssues,         setShowIssues]         = useState(false)
  const [showExport,         setShowExport]         = useState(false)
  const [exportScopePersonId, setExportScopePersonId] = useState<string | null>(null)
  const [expandedMarriages,  setExpandedMarriages]  = useState<Set<string>>(new Set())
  const [editMode,           setEditMode]           = useState(false)
  const [readOnly,           setReadOnly]           = useState(false)
  const [shareToast,         setShareToast]         = useState(false)

  // ── Theme toggle ──────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ft-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ft-theme', theme)
  }, [theme])
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])

  useEffect(() => {
    const hash = window.location.hash
    const shareParam = new URLSearchParams(
      hash.includes('?') ? hash.slice(hash.indexOf('?')) : ''
    ).get('share')
    if (shareParam) {
      decodeTree(shareParam)
        .then(d => { setDoc(d); setReadOnly(true) })
        .catch(() => alert('Link chia sẻ không hợp lệ hoặc bị lỗi'))
      history.replaceState(null, '', window.location.pathname + '#/')
      return
    }
    storage.getRecentFiles().then(setRecent).catch(console.error)
    if (storage.hasSession()) {
      storage.load().then(setDoc).catch(console.error)
    }
  }, [storage])

  async function handleShare() {
    if (!doc) return
    const { encoded, oversized } = await encodeTree(doc)
    if (oversized) {
      const go = confirm(`URL khá dài (${encoded.length} ký tự) — một số ứng dụng có thể không mở được.\nVẫn copy?`)
      if (!go) return
    }
    const url = `${window.location.origin}${window.location.pathname}#/?share=${encoded}`
    await navigator.clipboard.writeText(url)
    setShareToast(true)
    setTimeout(() => setShareToast(false), 2500)
  }

  useEffect(() => {
    if (!compareMode.active) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setCompareMode({ active: false }) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [compareMode.active])

  useEffect(() => {
    if (!kinshipPair) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setKinshipPair(null) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [kinshipPair])

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

  // Ref pattern: giữ compareMode + kinshipPair mới nhất mà không tạo reference mới cho callback
  const compareModeRef  = useRef(compareMode)
  useEffect(() => { compareModeRef.current = compareMode }, [compareMode])

  const kinshipPairRef = useRef(kinshipPair)
  useEffect(() => { kinshipPairRef.current = kinshipPair }, [kinshipPair])

  const handlePersonClick = useCallback((personId: string) => {
    const cm = compareModeRef.current
    if (cm.active) {
      setKinshipPair({ a: cm.firstPersonId, b: personId })
      setCompareMode({ active: false })
      return
    }
    // If kinship panel is open, clicking a tree node updates the target
    if (kinshipPairRef.current) {
      setKinshipPair(prev => prev ? { ...prev, b: personId } : null)
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

  const handleAddMarriage = useCallback((personId: string) => {
    if (!doc) return
    const { doc: newDoc, familyId } = addMarriage(doc, personId)
    setDoc(newDoc)
    setSaved(false)
    setFormMode({ type: 'add-spouse', familyId })
    setSelected(null)
  }, [doc])

  const handleToggleMarriage = useCallback((familyId: string) => {
    setExpandedMarriages(prev => {
      const next = new Set(prev)
      next.has(familyId) ? next.delete(familyId) : next.add(familyId)
      return next
    })
  }, [])

  const issues          = useMemo(() => doc ? validateDocument(doc) : [], [doc])
  const issuePersonIds  = useMemo(() => new Set(issues.flatMap(i => i.personIds)), [issues])
  const errorCount      = issues.filter(i => i.severity === 'error').length
  const warningCount    = issues.filter(i => i.severity === 'warning').length

  const kinshipHighlightPath = useMemo(() => {
    if (!kinshipPair || !doc) return undefined
    const region: Region = doc.clan.region ?? 'north'
    return computeKinship(doc, kinshipPair.a, kinshipPair.b, region)?.path
  }, [kinshipPair, doc])

  const dragStyle = headerDrag
    ? { WebkitAppRegion: 'drag', userSelect: 'none' } as React.CSSProperties
    : undefined
  const noDragStyle = headerDrag
    ? { WebkitAppRegion: 'no-drag' } as React.CSSProperties
    : undefined

  if (!doc) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, background: 'var(--t-bg)', ...dragStyle }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--t-text)' }}>Cây Gia Phả</h1>
        <div style={{ display: 'flex', gap: 12, ...noDragStyle }}>
          <button onClick={handleOpen} style={btn(false)}>Mở file .ftree</button>
          <button onClick={handleNew}  style={btn(true)}>Tạo mới</button>
        </div>
        {recentFiles.length > 0 && (
          <div style={{ marginTop: 16, textAlign: 'center', ...noDragStyle }}>
            <p style={{ fontSize: 12, color: 'var(--t-text-4)', marginBottom: 8 }}>File gần đây</p>
            {recentFiles.map(f => (
              <div key={f.path} style={{ fontSize: 13, color: 'var(--t-text-2)' }}>
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
    background: 'var(--t-header)', borderBottom: '1px solid var(--t-header-b)',
    padding: headerPadding,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12,
    ...dragStyle,
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100%', overflow: 'hidden' }}>
      <header style={headerStyle} onDoubleClick={onHeaderDoubleClick}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: 'var(--t-text)', margin: 0 }}>Cây Gia Phả</h1>
          <span style={{ fontSize: 11, color: 'var(--t-text-5)' }}>{doc.clan.name}</span>
        </div>

        <div style={noDragStyle}>
          <SearchBar doc={doc} onSelect={id => setHighlight(id)} />
        </div>

        <div style={{ display: 'flex', gap: 6, ...noDragStyle }}>
          {!readOnly && (
            <>
              <button onClick={() => setEditMode(m => !m)} style={editMode ? btnActive : btn(false)}>
                {editMode ? '✓ Xong' : '✏ Sửa'}
              </button>
              <button onClick={handleNew}  style={btn(false)}>Tạo mới</button>
              <button onClick={handleOpen} style={btn(false)}>Mở file</button>
              <button onClick={handleSave} style={btn(true)}>{saved ? '✓ Đã lưu' : 'Lưu'}</button>
            </>
          )}
          <button onClick={() => { setExportScopePersonId(null); setShowExport(true) }} style={btn(false)}>↓ Xuất</button>
          {storage.platform === 'web' && (
            <button onClick={handleShare} style={shareToast ? btnActive : btn(false)}>
              {shareToast ? '✓ Đã copy' : '↗ Chia sẻ'}
            </button>
          )}
          {!readOnly && (
            <>
              <button onClick={() => setShowClanForm(true)} style={btn(false)}>⚙</button>
              {issues.length > 0 && (
                <button onClick={() => setShowIssues(true)} style={issueBtn(errorCount > 0)}>
                  {errorCount > 0 ? `■ ${errorCount} lỗi` : `▲ ${warningCount}`}
                </button>
              )}
            </>
          )}
          <button onClick={toggleTheme} style={btn(false)} title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}>{theme === 'dark' ? '☀' : '🌙'}</button>
          {onAbout && (
            <button onClick={onAbout} style={btn(false)} title="Về ứng dụng">ⓘ</button>
          )}
        </div>
      </header>

      {compareMode.active && (
        <div style={compareBanner}>
          <span>Chọn người thứ 2 để xem quan hệ — nhấn ESC để huỷ</span>
          <button onClick={() => setCompareMode({ active: false })} style={cancelBtn}>✕ Huỷ</button>
        </div>
      )}

      {readOnly && (
        <div style={shareBanner}>
          <span>Bạn đang xem bản chia sẻ</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setReadOnly(false)} style={cancelBtn}>✏ Sửa bản sao</button>
            <button onClick={() => storage.exportFile(doc)} style={cancelBtn}>↓ Tải về .ftree</button>
          </div>
        </div>
      )}

      <div style={{ paddingTop: compareMode.active || readOnly ? 84 : 48, position: 'relative' }}>
        <FamilyTree
          ref={treeRef}
          document={doc}
          highlightPersonId={highlight}
          highlightPath={kinshipHighlightPath}
          issuePersonIds={issuePersonIds}
          onPersonClick={handlePersonClick}
          onAddChild={editMode ? handleAddChild : undefined}
          onAddSpouse={editMode ? handleAddSpouse : undefined}
          onAddMarriage={editMode ? handleAddMarriage : undefined}
          darkMode={theme === 'dark'}
        />
        {doc.families.length === 0 && (
          <div style={emptyState}>
            <p style={{ margin: '0 0 12px', color: 'var(--t-text-3)', fontSize: 14 }}>Chưa có ai trong gia phả</p>
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
          editMode={editMode}
          onClose={() => setSelected(null)}
          onEdit={id => { setFormMode({ type: 'edit', personId: id }); setSelected(null) }}
          onDelete={handleDelete}
          onAddParent={childPersonId  => { setFormMode({ type: 'add-parent', childPersonId }); setSelected(null) }}
          onAddChild={parentFamilyId => { setFormMode({ type: 'add-child', parentFamilyId }); setSelected(null) }}
          onAddSpouse={familyId      => { setFormMode({ type: 'add-spouse', familyId }); setSelected(null) }}
          onAddMarriage={handleAddMarriage}
          expandedMarriages={expandedMarriages}
          onToggleMarriage={handleToggleMarriage}
          onCompare={() => {
            setCompareMode({ active: true, firstPersonId: selectedPerson })
            setSelected(null)
          }}
          onExportBranch={id => {
            setExportScopePersonId(id)
            setShowExport(true)
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

      {showIssues && (
        <IssuePanel
          issues={issues}
          onClose={() => setShowIssues(false)}
          onSelect={personId => { setHighlight(personId); setShowIssues(false) }}
        />
      )}

      {showExport && doc && (
        <ExportDialog
          svgEl={treeRef.current}
          doc={doc}
          initialScopePersonId={exportScopePersonId ?? undefined}
          onClose={() => { setShowExport(false); setExportScopePersonId(null) }}
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

const shareBanner: React.CSSProperties = {
  position: 'fixed', top: 48, left: 0, right: 0, zIndex: 9,
  background: '#7c3aed', color: '#fff',
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
    background: primary ? 'var(--t-brand)'   : 'var(--t-btn2-bg)',
    color:      primary ? 'var(--t-brand-fg)' : 'var(--t-btn2-fg)',
    whiteSpace: 'nowrap',
  }
}

const btnActive: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, border: 'none',
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
  background: '#059669', color: '#fff', whiteSpace: 'nowrap',
}

function issueBtn(hasError: boolean): React.CSSProperties {
  return {
    padding: '6px 10px', borderRadius: 8, border: 'none',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    background: hasError ? '#fef2f2' : '#fffbeb',
    color:      hasError ? '#dc2626' : '#d97706',
    whiteSpace: 'nowrap',
  }
}
