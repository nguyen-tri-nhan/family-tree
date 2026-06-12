# Workspace — Quản lý nhiều file trong một folder

## Mục tiêu

User chọn một **folder** làm workspace. Mỗi file `.ftree` trong folder hiện lên ở sidebar trái. Click để chuyển cây, tạo mới, xoá — tất cả nằm trong folder đó.

Áp dụng cho cả **web app** (File System Access Directory API) và **Electron** (native folder dialog + fs).

---

## UI tổng thể

```
┌──────────────────────────────────────────────────────┐
│  [☰]  Cây Gia Phả         [💾] [↗] [⚙] [?]         │  ← header (unchanged)
├──────────┬───────────────────────────────────────────┤
│ Họ Nguyễn│                                           │
│ Họ Lê ●  │          [family tree SVG]                │
│ Họ Trần  │                                           │
│ ─────────│                                           │
│ [+ Tạo]  │                                           │
│ [📁 Folder]                                          │
└──────────┴───────────────────────────────────────────┘
```

- **Sidebar**: 200px fixed trái, full height bên dưới header
- **Tree area**: `width: calc(100% - 200px)`, shift phải khi sidebar mở
- Active tree: hilight bằng background + chấm `●`
- Sidebar toggle: nút `[☰]` trong header (ẩn/hiện sidebar)
- Khi chưa có workspace: sidebar ẩn, welcome screen như cũ

---

## WorkspaceEntry — interface dùng chung

```ts
// tree-lib/src/storage.ts
export interface WorkspaceEntry {
  id: string          // web: filename (vd "ho-nguyen.ftree"); electron: full path
  displayName: string // filename không có đuôi, update thành clan.name sau khi load
  updatedAt?: string  // ISO 8601 — từ file system
}
```

---

## IStorageAdapter — workspace methods mới

```ts
export interface IStorageAdapter {
  // ... (giữ nguyên tất cả method hiện tại)

  // Workspace
  hasWorkspace(): boolean
  openWorkspace(): Promise<WorkspaceEntry[]>      // mở folder picker
  getWorkspaceFiles(): Promise<WorkspaceEntry[]>  // list folder hiện tại
  openFromWorkspace(id: string): Promise<FtreeDocument>
  createInWorkspace(name: string): Promise<{ id: string; doc: FtreeDocument }>
  deleteFromWorkspace(id: string): Promise<void>
  renameInWorkspace(id: string, newName: string): Promise<void>
}
```

---

## Web App — File System Access Directory API

### `showDirectoryPicker()`

```ts
const dirHandle = await showDirectoryPicker({ mode: 'readwrite' })
```

Enumerate `.ftree` files:
```ts
for await (const [name, handle] of dirHandle.entries()) {
  if (name.endsWith('.ftree') && handle.kind === 'file') { ... }
}
```

Mở file cụ thể:
```ts
const fileHandle = await dirHandle.getFileHandle('ho-nguyen.ftree')
const file = await fileHandle.getFile()
const content = await file.text()
```

Tạo file mới:
```ts
const handle = await dirHandle.getFileHandle('ho-tran.ftree', { create: true })
const writable = await handle.createWritable()
await writable.write(encodeDocument(emptyDocument()))
await writable.close()
```

### IndexedDB schema — mở rộng từ U4

```ts
// DB: ftree-db v2
// Store: 'workspace' (new)
interface WorkspaceRecord {
  id: 'current'                       // chỉ lưu 1 workspace
  dirHandle: FileSystemDirectoryHandle
  lastOpenedId?: string               // filename của file đang mở
}
```

### Permission trên mỗi session

```ts
async function ensurePermission(handle: FileSystemDirectoryHandle) {
  const perm = await handle.queryPermission({ mode: 'readwrite' })
  if (perm !== 'granted') {
    const result = await handle.requestPermission({ mode: 'readwrite' })
    if (result !== 'granted') throw new Error('Cần cấp quyền truy cập folder')
  }
}
```

Browser nhớ permission trong session. Mở tab mới cần confirm lại (Safari luôn cần confirm).

### WebAdapter — method mới

```ts
class WebAdapter implements IStorageAdapter {
  private dirHandle: FileSystemDirectoryHandle | null = null

  hasWorkspace() {
    return this.dirHandle !== null
  }

  async openWorkspace(): Promise<WorkspaceEntry[]> {
    this.dirHandle = await showDirectoryPicker({ mode: 'readwrite' })
    await idb.saveWorkspace({ id: 'current', dirHandle: this.dirHandle })
    return this.getWorkspaceFiles()
  }

  async getWorkspaceFiles(): Promise<WorkspaceEntry[]> {
    if (!this.dirHandle) return []
    await ensurePermission(this.dirHandle)
    const entries: WorkspaceEntry[] = []
    for await (const [name, handle] of this.dirHandle.entries()) {
      if (name.endsWith('.ftree') && handle.kind === 'file') {
        const file = await (handle as FileSystemFileHandle).getFile()
        entries.push({ id: name, displayName: name.replace('.ftree', ''), updatedAt: new Date(file.lastModified).toISOString() })
      }
    }
    return entries.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
  }

  async openFromWorkspace(id: string): Promise<FtreeDocument> {
    const handle = await this.dirHandle!.getFileHandle(id)
    const file = await handle.getFile()
    const doc = decodeDocument(await file.text())
    this.handle = handle  // set current file handle for save()
    this.session = doc
    await idb.saveWorkspace({ id: 'current', dirHandle: this.dirHandle!, lastOpenedId: id })
    return doc
  }

  async createInWorkspace(name: string): Promise<{ id: string; doc: FtreeDocument }> {
    const filename = `${name}.ftree`
    const doc = emptyDocument()
    const handle = await this.dirHandle!.getFileHandle(filename, { create: true })
    const writable = await handle.createWritable()
    await writable.write(encodeDocument(doc))
    await writable.close()
    this.handle = handle
    this.session = doc
    return { id: filename, doc }
  }

  async deleteFromWorkspace(id: string): Promise<void> {
    await this.dirHandle!.removeEntry(id)
  }

  async renameInWorkspace(id: string, newName: string): Promise<void> {
    // FSA không có rename — đọc rồi tạo file mới, xoá cũ
    const oldHandle = await this.dirHandle!.getFileHandle(id)
    const file = await oldHandle.getFile()
    const content = await file.text()
    const newHandle = await this.dirHandle!.getFileHandle(`${newName}.ftree`, { create: true })
    const writable = await newHandle.createWritable()
    await writable.write(content)
    await writable.close()
    await this.dirHandle!.removeEntry(id)
    if (this.handle?.name === id) this.handle = newHandle
  }
}
```

> **Lưu ý**: `dirHandle.removeEntry()` cần Chrome 86+. Không có undo — hiện confirm dialog trước.

---

## Electron App

### Prefs — mở rộng

```ts
// main/index.ts
interface Prefs {
  recentFiles: Array<{ path: string; name: string; openedAt: string }>
  workspaceFolder?: string   // NEW — đường dẫn folder đang dùng
}
```

### IPC handlers mới — main/index.ts

```ts
ipcMain.handle('folder:select', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  if (canceled) return null
  const folderPath = filePaths[0]
  const prefs = loadPrefs()
  prefs.workspaceFolder = folderPath
  savePrefs(prefs)
  return folderPath
})

ipcMain.handle('folder:list', (_event, folderPath: string) => {
  const entries = readdirSync(folderPath, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.ftree'))
    .map(e => {
      const fullPath = join(folderPath, e.name)
      const stat = statSync(fullPath)
      return {
        id: fullPath,
        displayName: e.name.replace('.ftree', ''),
        updatedAt: stat.mtime.toISOString(),
      }
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return entries
})

ipcMain.handle('file:open-path', (_event, filePath: string) => {
  const b64 = readFileSync(filePath, 'utf-8').trim()
  return { path: filePath, b64 }
})

ipcMain.handle('folder:delete-file', (_event, filePath: string) => {
  unlinkSync(filePath)
})

ipcMain.handle('folder:rename-file', (_event, { oldPath, newPath }: { oldPath: string; newPath: string }) => {
  renameSync(oldPath, newPath)
})

ipcMain.handle('prefs:getWorkspace', () => {
  return loadPrefs().workspaceFolder ?? null
})
```

### Preload — window.api mở rộng

```ts
selectFolder: (): Promise<string | null> =>
  ipcRenderer.invoke('folder:select'),
listFolder: (path: string): Promise<WorkspaceEntry[]> =>
  ipcRenderer.invoke('folder:list', path),
openFilePath: (path: string): Promise<{ path: string; b64: string }> =>
  ipcRenderer.invoke('file:open-path', path),
deleteFile: (path: string): Promise<void> =>
  ipcRenderer.invoke('folder:delete-file', path),
renameFile: (oldPath: string, newPath: string): Promise<void> =>
  ipcRenderer.invoke('folder:rename-file', { oldPath, newPath }),
getWorkspaceFolder: (): Promise<string | null> =>
  ipcRenderer.invoke('prefs:getWorkspace'),
```

### ElectronAdapter — method mới

```ts
class ElectronAdapter implements IStorageAdapter {
  private workspaceFolder: string | null = null

  hasWorkspace() { return this.workspaceFolder !== null }

  async openWorkspace(): Promise<WorkspaceEntry[]> {
    const path = await window.api.selectFolder()
    if (!path) throw new Error('Hủy chọn folder')
    this.workspaceFolder = path
    return window.api.listFolder(path)
  }

  async getWorkspaceFiles(): Promise<WorkspaceEntry[]> {
    if (!this.workspaceFolder) return []
    return window.api.listFolder(this.workspaceFolder)
  }

  async openFromWorkspace(id: string): Promise<FtreeDocument> {
    const { path, b64 } = await window.api.openFilePath(id)
    const doc = decodeDocument(b64)
    this.currentPath = path
    this.session = doc
    return doc
  }

  async createInWorkspace(name: string): Promise<{ id: string; doc: FtreeDocument }> {
    const fullPath = join(this.workspaceFolder!, `${name}.ftree`)
    const doc = emptyDocument()
    await window.api.saveFile(fullPath, encodeDocument(doc))
    this.currentPath = fullPath
    this.session = doc
    return { id: fullPath, doc }
  }

  async deleteFromWorkspace(id: string): Promise<void> {
    await window.api.deleteFile(id)
  }

  async renameInWorkspace(id: string, newName: string): Promise<void> {
    const dir = id.substring(0, id.lastIndexOf('/'))
    const newPath = join(dir, `${newName}.ftree`)
    await window.api.renameFile(id, newPath)
    if (this.currentPath === id) this.currentPath = newPath
  }
}
```

### Khởi động Electron với workspace

```ts
// ElectronAdapter constructor hoặc init()
async init() {
  this.workspaceFolder = await window.api.getWorkspaceFolder()
}
```

---

## tree-lib — WorkspaceSidebar component

### `src/components/WorkspaceSidebar.tsx`

```tsx
interface Props {
  entries: WorkspaceEntry[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void        // mở prompt nhập tên
  onOpenFolder: () => void    // đổi folder
  onDelete: (id: string) => void
  onRename: (id: string) => void
}
```

UI:
- Danh sách entries, scroll nếu nhiều
- Click item: `onSelect`
- Right-click hoặc `...` menu: Đổi tên / Xoá
- Bottom: `[+ Tạo mới]` + `[📁 Đổi folder]`
- Không có workspace: hiện `[📁 Chọn folder]` to center

---

## App.tsx — state và logic mới

```ts
const [workspaceEntries, setWorkspaceEntries] = useState<WorkspaceEntry[]>([])
const [activeFileId,     setActiveFileId]     = useState<string | null>(null)
const [sidebarOpen,      setSidebarOpen]       = useState(false)
```

```ts
async function handleOpenWorkspace() {
  const entries = await storage.openWorkspace()
  setWorkspaceEntries(entries)
  setSidebarOpen(true)
  // Auto-mở file đầu tiên
  if (entries.length > 0) handleSelectFile(entries[0].id)
}

async function handleSelectFile(id: string) {
  if (id === activeFileId) return
  // Auto-save file hiện tại trước khi switch
  if (doc && activeFileId) await storage.save(doc)
  const newDoc = await storage.openFromWorkspace(id)
  setDoc(newDoc)
  setActiveFileId(id)
  setSelected(null)
  // Update displayName trong entries sau khi biết clan.name
  setWorkspaceEntries(prev => prev.map(e =>
    e.id === id ? { ...e, displayName: newDoc.clan.name || e.displayName } : e
  ))
}

async function handleCreateInWorkspace() {
  const name = prompt('Tên gia phả mới:')
  if (!name) return
  const { id, doc: newDoc } = await storage.createInWorkspace(name)
  setDoc(newDoc)
  setActiveFileId(id)
  setWorkspaceEntries(await storage.getWorkspaceFiles())
}
```

### Layout

```tsx
<div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
  <Header ... />
  <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
    {sidebarOpen && (
      <WorkspaceSidebar
        entries={workspaceEntries}
        activeId={activeFileId}
        onSelect={handleSelectFile}
        onCreate={handleCreateInWorkspace}
        onOpenFolder={handleOpenWorkspace}
        onDelete={handleDeleteFromWorkspace}
        onRename={handleRenameInWorkspace}
      />
    )}
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* FamilyTree + panels như cũ */}
    </div>
  </div>
</div>
```

---

## Thứ tự implement

| Bước | Nội dung | Effort |
|------|----------|--------|
| 1 | `IStorageAdapter` — thêm workspace methods | Nhỏ |
| 2 | Electron main + preload — IPC handlers mới | Nhỏ |
| 3 | `ElectronAdapter` — implement workspace | Vừa |
| 4 | `WebAdapter` — FSA directory + IndexedDB | Lớn |
| 5 | `WorkspaceSidebar` component | Vừa |
| 6 | `App.tsx` — workspace state + layout | Vừa |

Nên làm Electron trước (dễ test, file system rõ ràng), sau đó web. Bước 1 unblock tất cả bước còn lại.

---

## Không làm trong scope này
- Drag-drop để sắp xếp thứ tự cây trong sidebar
- Tag / nhóm các cây
- Merge hai file `.ftree` thành một
- Nested folder (chỉ scan 1 cấp folder)
