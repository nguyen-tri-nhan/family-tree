import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import FamilyTree from './FamilyTree'
import { PersonPanel }      from './components/PersonPanel'
import { PersonForm }       from './components/PersonForm'
import { SearchBar }        from './components/SearchBar'
import { KinshipDrawer }    from './components/KinshipDrawer'
import { IssuePanel }       from './components/IssuePanel'
import { WorkspaceSidebar } from './components/WorkspaceSidebar'
import { computeKinship }   from './kinship'
import type { Region }      from './kinship'
import { validateDocument } from './utils/validateTree'
import { ClanForm }       from './components/ClanForm'
import { ExportDialog }   from './components/ExportDialog'
import { QuizPanel }      from './components/QuizPanel'
import { ShareDialog }    from './components/ShareDialog'
import { useStorage }     from './storage'
import type { WorkspaceEntry } from './storage'
import { deletePerson, addMarriage } from './mutations'
import type { FtreeDocument } from './types'
import { encodeTree, decodeTree } from './utils/shareUrl'
import { decodeDocument } from './document'

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
  shareBaseUrl?:         string   // e.g. "https://caygiapha.app" — enables share on Electron
}

export function App({
  headerPadding       = '8px 20px',
  headerDrag          = false,
  onHeaderDoubleClick,
  welcomeFooter,
  onAbout,
  shareBaseUrl,
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
  const [showShare,          setShowShare]          = useState(false)
  const [shareUrl,           setShareUrl]           = useState('')
  const [shareOversized,     setShareOversized]     = useState(false)
  const [quizPlayerId,       setQuizPlayerId]       = useState<string | null>(null)

  // ── Workspace (folder mode) ───────────────────────────────────
  const [workspaceEntries,   setWorkspaceEntries]   = useState<WorkspaceEntry[]>([])
  const [workspaceName,      setWorkspaceName]      = useState<string | null>(null)
  const [activeFileId,       setActiveFileId]       = useState<string | null>(null)
  const [sidebarOpen,        setSidebarOpen]        = useState(false)
  const [showMigrateBanner,  setShowMigrateBanner]  = useState(false)
  const [isDraggingOver,     setIsDraggingOver]     = useState(false)

  // ── Dialog (replaces native prompt/confirm — not in Electron) ─
  const dialogResolverRef = useRef<((v: string | null | boolean) => void) | null>(null)
  const [dialogState, setDialogState] = useState<
    | null
    | { kind: 'prompt'; message: string }
    | { kind: 'confirm'; message: string }
  >(null)
  const [dialogInput, setDialogInput] = useState('')

  function showPrompt(message: string, defaultValue = ''): Promise<string | null> {
    return new Promise(resolve => {
      dialogResolverRef.current = resolve as (v: string | null | boolean) => void
      setDialogInput(defaultValue)
      setDialogState({ kind: 'prompt', message })
    })
  }
  function showConfirm(message: string): Promise<boolean> {
    return new Promise(resolve => {
      dialogResolverRef.current = resolve as (v: string | null | boolean) => void
      setDialogState({ kind: 'confirm', message })
    })
  }
  function resolveDialog(val: string | null | boolean) {
    dialogResolverRef.current?.(val)
    dialogResolverRef.current = null
    setDialogState(null)
  }

  // ── Drag & drop ───────────────────────────────────────────────
  const dragCounter = useRef(0)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current++
    if (dragCounter.current === 1) setIsDraggingOver(true)
  }
  function handleDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDraggingOver(false)
  }
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDraggingOver(false)
    if (!storage.hasWorkspace()) return
    const ftreeFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.ftree'))
    if (ftreeFiles.length === 0) return
    let lastId = activeFileId
    let lastDoc = doc
    for (const file of ftreeFiles) {
      try {
        const content = await file.text()
        const droppedDoc = decodeDocument(content)
        const name = file.name.replace(/\.ftree$/, '')
        const { id } = await storage.createInWorkspace(name)
        await storage.save(droppedDoc)
        lastId = id
        lastDoc = droppedDoc
      } catch {
        alert(`Không thể import "${file.name}"`)
      }
    }
    const files = await storage.getWorkspaceFiles()
    setWorkspaceEntries(files)
    if (lastId && lastDoc) { setDoc(lastDoc); setActiveFileId(lastId) }
  }
  const dropHandlers = { onDragOver: handleDragOver, onDragEnter: handleDragEnter, onDragLeave: handleDragLeave, onDrop: handleDrop }

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
    // Try restoring workspace first; fall back to single-file session
    storage.getWorkspaceFiles().then(async files => {
      if (storage.hasWorkspace()) {
        setWorkspaceEntries(files)
        setWorkspaceName(storage.getWorkspaceName())
        setSidebarOpen(true)
        if (files.length > 0) {
          const firstDoc = await storage.openFromWorkspace(files[0].id)
          setDoc(firstDoc)
          setActiveFileId(files[0].id)
        }
        return
      }
      storage.getRecentFiles().then(setRecent).catch(console.error)
      if (storage.hasSession()) {
        storage.load().then(d => {
          setDoc(d)
          if (storage.platform === 'web') setShowMigrateBanner(true)
        }).catch(console.error)
      }
    }).catch(() => {
      storage.getRecentFiles().then(setRecent).catch(console.error)
      if (storage.hasSession()) {
        storage.load().then(d => {
          setDoc(d)
          if (storage.platform === 'web') setShowMigrateBanner(true)
        }).catch(console.error)
      }
    })
  }, [storage])



  async function handleSaveSharedToWorkspace() {
    if (!doc) return
    try {
      const files = await storage.openWorkspace()
      setWorkspaceEntries(files)
      setWorkspaceName(storage.getWorkspaceName())
      setSidebarOpen(true)
      setReadOnly(false)
      const safeName = doc.clan.name.trim() || 'gia-pha'
      const { id } = await storage.createInWorkspace(safeName)
      await storage.save(doc)
      setActiveFileId(id)
      setWorkspaceEntries(await storage.getWorkspaceFiles())
    } catch (e) {
      if (e instanceof Error && !e.message.includes('cancel') && !e.message.includes('Hủy')) {
        alert(e.message)
      }
    }
  }

  async function handleMigrateToWorkspace() {
    if (!doc) return
    try {
      const files = await storage.openWorkspace()
      setWorkspaceEntries(files)
      setWorkspaceName(storage.getWorkspaceName())
      setSidebarOpen(true)
      setShowMigrateBanner(false)
      const safeName = doc.clan.name.trim() || 'gia-pha'
      const { id } = await storage.createInWorkspace(safeName)
      await storage.save(doc)
      setActiveFileId(id)
      setWorkspaceEntries(await storage.getWorkspaceFiles())
      localStorage.removeItem('ftree-session-cache')
    } catch (e) {
      if (e instanceof Error && !e.message.includes('cancel') && !e.message.includes('Hủy')) {
        alert(e.message)
      }
    }
  }

  async function handleOpenWorkspace() {
    try {
      const files = await storage.openWorkspace()
      setWorkspaceEntries(files)
      setWorkspaceName(storage.getWorkspaceName())
      setSidebarOpen(true)
      setDoc(null)
      setActiveFileId(null)
      if (files.length > 0) await handleSelectFile(files[0].id)
    } catch (e) {
      if (e instanceof Error && !e.message.includes('cancel') && !e.message.includes('Hủy')) alert(e.message)
    }
  }

  async function handleSelectFile(id: string) {
    if (id === activeFileId) return
    try {
      if (doc && activeFileId) await storage.save(doc)
      const newDoc = await storage.openFromWorkspace(id)
      setDoc(newDoc)
      setActiveFileId(id)
      setSelected(null)
      setHighlight(undefined)
      setKinshipPair(null)
      setQuizPlayerId(null)
    } catch (e) {
      if (e instanceof Error) alert(e.message)
    }
  }

  async function handleCreateInWorkspace() {
    const name = await showPrompt('Tên gia phả mới:')
    if (!name?.trim()) return
    try {
      const { id, doc: newDoc } = await storage.createInWorkspace(name.trim())
      setDoc(newDoc)
      setActiveFileId(id)
      setEditMode(true)
      setWorkspaceEntries(await storage.getWorkspaceFiles())
    } catch (e) {
      if (e instanceof Error) alert(e.message)
    }
  }

  async function handleDeleteFromWorkspace(id: string) {
    const entry = workspaceEntries.find(e => e.id === id)
    if (!await showConfirm(`Xoá "${entry?.displayName ?? id}"? Không thể hoàn tác.`)) return
    try {
      await storage.deleteFromWorkspace(id)
      const files = await storage.getWorkspaceFiles()
      setWorkspaceEntries(files)
      if (activeFileId === id) {
        if (files.length > 0) {
          // Load next file directly — don't go through handleSelectFile (would try to save deleted file)
          const nextDoc = await storage.openFromWorkspace(files[0].id)
          setDoc(nextDoc)
          setActiveFileId(files[0].id)
        } else {
          setDoc(null)
          setActiveFileId(null)
        }
      }
    } catch (e) {
      if (e instanceof Error) alert(e.message)
    }
  }

  async function handleRenameInWorkspace(id: string) {
    const entry = workspaceEntries.find(e => e.id === id)
    const newName = await showPrompt('Tên mới:', entry?.displayName ?? '')
    if (!newName?.trim()) return
    try {
      await storage.renameInWorkspace(id, newName.trim())
      const files = await storage.getWorkspaceFiles()
      setWorkspaceEntries(files)
      if (activeFileId === id) {
        // id changed — find new id by displayName
        const renamed = files.find(e => e.displayName === newName.trim())
        if (renamed) setActiveFileId(renamed.id)
      }
    } catch (e) {
      if (e instanceof Error) alert(e.message)
    }
  }

  async function handleShare() {
    if (!doc) return
    const { encoded, oversized } = await encodeTree(doc)
    const base = shareBaseUrl ?? (window.location.origin + window.location.pathname)
    setShareUrl(`${base}#/?share=${encoded}`)
    setShareOversized(oversized)
    setShowShare(true)
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
      setEditMode(true)
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

  const personCount = doc?.persons.length ?? 0
  const atLimit     = personCount >= 200
  const nearLimit   = personCount >= 180 && !atLimit

  const dragStyle = headerDrag
    ? { WebkitAppRegion: 'drag', userSelect: 'none' } as React.CSSProperties
    : undefined
  const noDragStyle = headerDrag
    ? { WebkitAppRegion: 'no-drag' } as React.CSSProperties
    : undefined

  if (!doc) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--t-bg)', ...dragStyle, position: 'relative' }} {...dropHandlers}>
        {isDraggingOver && storage.hasWorkspace() && <DropOverlay />}
        {sidebarOpen && (
          <WorkspaceSidebar
            name={workspaceName}
            entries={workspaceEntries}
            activeId={activeFileId}
            onSelect={handleSelectFile}
            onCreate={handleCreateInWorkspace}
            onOpenFolder={handleOpenWorkspace}
            onDelete={handleDeleteFromWorkspace}
            onRename={handleRenameInWorkspace}
            onClose={() => setSidebarOpen(false)}
            top={0}
          />
        )}

        {/* Main content area — centers in remaining space */}
        <div style={{
          flex: 1,
          marginLeft: sidebarOpen ? 200 : 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '0 24px',
          ...noDragStyle,
        }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--t-text)', margin: 0 }}>
            Cây Gia Phả
          </h1>

          {sidebarOpen ? (
            workspaceEntries.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--t-text-3)', margin: '0 0 4px' }}>Folder này chưa có gia phả nào.</p>
                <p style={{ fontSize: 12, color: 'var(--t-text-4)', margin: '0 0 16px' }}>Tạo file đầu tiên để bắt đầu.</p>
                <button onClick={handleCreateInWorkspace} style={btn(true)}>+ Tạo gia phả mới</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--t-text-4)', margin: '0 0 12px' }}>Chọn một gia phả ở thanh bên để mở</p>
                <button onClick={handleCreateInWorkspace} style={btn(true)}>+ Tạo gia phả mới</button>
              </div>
            )
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={handleOpen}          style={btn(false)}>📄 Mở file</button>
                <button onClick={handleOpenWorkspace} style={btn(false)}>📁 Mở folder</button>
                <button onClick={handleNew}           style={btn(true)}>+ Tạo mới</button>
              </div>
              {recentFiles.length > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--t-text-4)', marginBottom: 8 }}>File gần đây</p>
                  {recentFiles.map(f => (
                    <div key={f.path} style={{ fontSize: 13, color: 'var(--t-text-2)' }}>
                      {f.name} — {f.path.split('/').pop()}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {welcomeFooter && (
            <div style={{ marginTop: 8 }}>{welcomeFooter}</div>
          )}
        </div>
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

  const sidebarWidth = sidebarOpen ? 200 : 0

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100%', overflow: 'hidden', position: 'relative' }} {...dropHandlers}>
      {isDraggingOver && storage.hasWorkspace() && <DropOverlay />}
      <header style={headerStyle} onDoubleClick={onHeaderDoubleClick}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ ...noDragStyle, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--t-text-3)', padding: '2px 4px', borderRadius: 4 }}
            title={sidebarOpen ? 'Đóng sidebar' : 'Mở sidebar'}
          >☰</button>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: 'var(--t-text)', margin: 0 }}>Cây Gia Phả</h1>
          <button
            onClick={() => setShowClanForm(true)}
            style={{ ...noDragStyle, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--t-text-4)', padding: '2px 6px', borderRadius: 4 }}
            title="Chỉnh tên & thông tin gia phả"
          >
            {doc.clan.name} ✎
          </button>
        </div>

        <div style={noDragStyle}>
          <SearchBar
            doc={doc}
            placeholder={compareMode.active ? 'Tìm người để so sánh…' : undefined}
            onSelect={id => {
              if (compareMode.active) {
                handlePersonClick(id)
              } else {
                setHighlight(id)
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, ...noDragStyle }}>
          {!readOnly && (
            <>
              <button onClick={() => setEditMode(m => !m)} style={editMode ? btnActive : btn(false)}>
                {editMode ? '✓ Xong' : '✏ Sửa'}
              </button>
              <button onClick={handleNew}  style={btn(false)}>Tạo mới</button>
              <button onClick={handleOpen} style={btn(false)}>Mở file</button>
              {!storage.hasWorkspace() && (
                <button onClick={handleMigrateToWorkspace} style={btn(false)} title="Lưu file này vào folder để quản lý nhiều gia phả">📁</button>
              )}
              <button onClick={handleSave} style={btn(true)}>{saved ? '✓ Đã lưu' : 'Lưu'}</button>
            </>
          )}
          <button onClick={() => { setExportScopePersonId(null); setShowExport(true) }} style={btn(false)}>↓ Xuất</button>
          <button onClick={handleShare} style={btn(false)}>↗ Chia sẻ</button>
          {!readOnly && (
            <>
              <button onClick={() => setShowClanForm(true)} style={btn(false)} title="Cài đặt gia phả">⚙</button>
              {issues.length > 0 && (
                <button onClick={() => setShowIssues(true)} style={issueBtn(errorCount > 0)}>
                  {errorCount > 0 ? `■ ${errorCount} lỗi` : `▲ ${warningCount}`}
                </button>
              )}
              {(atLimit || nearLimit) && (
                <span
                  style={personLimitBadge(atLimit)}
                  title={atLimit ? 'Bản miễn phí giới hạn 200 người. Liên hệ để nâng cấp.' : undefined}
                >
                  {personCount}/200 người
                </span>
              )}
            </>
          )}
          <button onClick={toggleTheme} style={btn(false)} title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}>{theme === 'dark' ? '☀' : '🌙'}</button>
          {onAbout && (
            <button onClick={onAbout} style={btn(false)} title="Về ứng dụng">ⓘ</button>
          )}
        </div>
      </header>

      {showMigrateBanner && (
        <div style={migrateBanner}>
          <span>💾 Bạn có dữ liệu lưu trong trình duyệt — có thể mất nếu xóa cache.</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleMigrateToWorkspace} style={cancelBtn}>📁 Lưu vào folder</button>
            <button onClick={() => setShowMigrateBanner(false)} style={{ ...cancelBtn, opacity: 0.7 }}>Bỏ qua</button>
          </div>
        </div>
      )}

      {compareMode.active && (
        <div style={compareBanner}>
          <span>Chọn người thứ 2 để xem quan hệ — nhấn ESC để huỷ</span>
          <button onClick={() => setCompareMode({ active: false })} style={cancelBtn}>✕ Huỷ</button>
        </div>
      )}

      {readOnly && (
        <div style={shareBanner}>
          <span>Bạn đang xem bản chia sẻ — lưu vào folder để chỉnh sửa và giữ lại.</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSaveSharedToWorkspace} style={cancelBtn}>📁 Lưu vào folder</button>
            <button onClick={() => storage.exportFile(doc)} style={{ ...cancelBtn, opacity: 0.75 }}>↓ Tải về .ftree</button>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <WorkspaceSidebar
          name={workspaceName}
          entries={workspaceEntries}
          activeId={activeFileId}
          onSelect={handleSelectFile}
          onCreate={handleCreateInWorkspace}
          onOpenFolder={handleOpenWorkspace}
          onDelete={handleDeleteFromWorkspace}
          onRename={handleRenameInWorkspace}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <div style={{ paddingTop: compareMode.active || readOnly ? 84 : 48, paddingLeft: sidebarWidth, position: 'relative' }}>
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
          atLimit={atLimit}
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
          onQuiz={id => {
            setQuizPlayerId(id)
            setKinshipPair(null)
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

      {quizPlayerId && (
        <QuizPanel
          doc={doc}
          playerId={quizPlayerId}
          onHighlight={setHighlight}
          onClose={() => { setQuizPlayerId(null); setHighlight(undefined) }}
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

      {showShare && (
        <ShareDialog
          url={shareUrl}
          oversized={shareOversized}
          onClose={() => setShowShare(false)}
        />
      )}

      {dialogState && (
        <div style={dialogOverlay}>
          <div style={dialogBox}>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--t-text)', lineHeight: 1.5 }}>
              {dialogState.message}
            </p>
            {dialogState.kind === 'prompt' && (
              <input
                autoFocus
                style={dialogInputStyle}
                value={dialogInput}
                onChange={e => setDialogInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') resolveDialog(dialogInput)
                  if (e.key === 'Escape') resolveDialog(null)
                }}
              />
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={btn(false)} onClick={() => resolveDialog(dialogState.kind === 'confirm' ? false : null)}>Huỷ</button>
              <button
                autoFocus={dialogState.kind === 'confirm'}
                style={btn(true)}
                onClick={() => resolveDialog(dialogState.kind === 'confirm' ? true : dialogInput)}
              >
                {dialogState.kind === 'confirm' ? 'Xoá' : 'OK'}
              </button>
            </div>
          </div>
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

const migrateBanner: React.CSSProperties = {
  position: 'fixed', top: 48, left: 0, right: 0, zIndex: 9,
  background: '#d97706', color: '#fff',
  padding: '8px 20px', fontSize: 13, fontWeight: 600,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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

function personLimitBadge(atLimit: boolean): React.CSSProperties {
  return {
    padding: '4px 8px', borderRadius: 8,
    fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    background: atLimit ? '#fef2f2' : '#fff7ed',
    color:      atLimit ? '#dc2626' : '#ea580c',
    border:     `1px solid ${atLimit ? '#fecaca' : '#fed7aa'}`,
  }
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

const dialogOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const dialogBox: React.CSSProperties = {
  background: 'var(--t-card)',
  borderRadius: 12,
  padding: '20px 24px',
  minWidth: 300,
  maxWidth: 400,
  width: '90%',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
}

const dialogInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 7,
  border: '1px solid var(--t-border)',
  background: 'var(--t-input-bg, var(--t-card))',
  color: 'var(--t-text)',
  fontSize: 14,
  boxSizing: 'border-box',
}

function DropOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(124,58,237,0.15)',
      border: '3px dashed #7c3aed',
      borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'var(--t-card)',
        borderRadius: 12, padding: '16px 28px',
        fontSize: 16, fontWeight: 700, color: '#7c3aed',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}>
        📂 Thả file .ftree vào đây để import vào folder
      </div>
    </div>
  )
}
