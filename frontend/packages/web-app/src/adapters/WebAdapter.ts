import { decodeDocument, emptyDocument, encodeDocument } from '@family-tree/tree-lib'
import type { FtreeDocument, IStorageAdapter, RecentFile, WorkspaceEntry } from '@family-tree/tree-lib'
import { getWorkspaceRecord, saveWorkspaceRecord, clearWorkspaceRecord } from './idb'

const CACHE_KEY      = 'ftree-session-cache'
const WORKSPACE_LAST = 'ftree-workspace-last'

async function ensurePermission(handle: FileSystemDirectoryHandle): Promise<void> {
  // queryPermission/requestPermission exist at runtime but are missing from TS lib defs
  const h = handle as FileSystemDirectoryHandle & {
    queryPermission(desc: { mode: string }): Promise<string>
    requestPermission(desc: { mode: string }): Promise<string>
  }
  const perm = await h.queryPermission({ mode: 'readwrite' })
  if (perm === 'granted') return
  const result = await h.requestPermission({ mode: 'readwrite' })
  if (result !== 'granted') throw new Error('Cần cấp quyền truy cập folder')
}

export class WebAdapter implements IStorageAdapter {
  readonly platform = 'web' as const

  private session:             FtreeDocument | null = null
  private dirHandle:           FileSystemDirectoryHandle | null = null
  private currentWorkspaceId:  string | null = null
  private _workspaceName:      string | null = null

  // ── Single-file mode ─────────────────────────────────────────

  hasSession(): boolean {
    if (this.dirHandle) return false  // workspace mode takes over
    return this.session !== null || localStorage.getItem(CACHE_KEY) !== null
  }

  async load(): Promise<FtreeDocument> {
    if (this.session) return this.session
    const b64 = localStorage.getItem(CACHE_KEY)
    if (!b64) throw new Error('Không có dữ liệu trong cache')
    this.session = decodeDocument(b64)
    return this.session
  }

  async save(doc: FtreeDocument): Promise<void> {
    this.session = doc
    if (this.dirHandle && this.currentWorkspaceId) {
      // Workspace mode — write directly into the folder file
      const fileHandle = await this.dirHandle.getFileHandle(this.currentWorkspaceId)
      const writable = await fileHandle.createWritable()
      await writable.write(encodeDocument(doc))
      await writable.close()
      localStorage.setItem(WORKSPACE_LAST, this.currentWorkspaceId)
    } else {
      // Single-file fallback — localStorage + download
      localStorage.setItem(CACHE_KEY, encodeDocument(doc))
      await this.exportFile(doc)
    }
  }

  async openFile(): Promise<FtreeDocument> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.ftree'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return reject(new Error('Không có file được chọn'))
        const b64 = await file.text()
        const doc = decodeDocument(b64)
        // Leave workspace mode when opening a standalone file
        this.dirHandle = null
        this.currentWorkspaceId = null
        this._workspaceName = null
        localStorage.setItem(CACHE_KEY, b64)
        this.session = doc
        resolve(doc)
      }
      input.click()
    })
  }

  async newFile(): Promise<void> {
    this.dirHandle = null
    this.currentWorkspaceId = null
    this._workspaceName = null
    localStorage.removeItem(CACHE_KEY)
    this.session = emptyDocument()
  }

  async exportFile(doc: FtreeDocument): Promise<void> {
    const b64  = encodeDocument(doc)
    const blob = new Blob([b64], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'gia-pha.ftree'
    a.click()
    URL.revokeObjectURL(url)
  }

  async getRecentFiles(): Promise<RecentFile[]> {
    return []
  }

  // ── Workspace mode ───────────────────────────────────────────

  hasWorkspace(): boolean {
    return this.dirHandle !== null
  }

  getWorkspaceName(): string | null {
    return this._workspaceName
  }

  async getWorkspaceFiles(): Promise<WorkspaceEntry[]> {
    // Lazy-load stored handle from IndexedDB on first call
    if (!this.dirHandle) {
      const record = await getWorkspaceRecord()
      if (!record) return []
      try {
        await ensurePermission(record.dirHandle)
        this.dirHandle = record.dirHandle
        this._workspaceName = record.name
      } catch {
        return []
      }
    }
    return this._listFiles()
  }

  async openWorkspace(): Promise<WorkspaceEntry[]> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('Trình duyệt không hỗ trợ mở folder. Vui lòng dùng Chrome hoặc Edge.')
    }
    let handle: FileSystemDirectoryHandle
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' }) as FileSystemDirectoryHandle
    } catch (e) {
      if (e instanceof DOMException) {
        if (e.name === 'AbortError') throw new Error('Hủy chọn folder')
        if (e.name === 'SecurityError') throw new Error('Folder này chứa file hệ thống và không thể mở. Vui lòng chọn folder khác.')
      }
      throw e
    }
    await saveWorkspaceRecord(handle)
    this.dirHandle = handle
    this._workspaceName = handle.name
    this.currentWorkspaceId = null
    this.session = null
    return this._listFiles()
  }

  async openFromWorkspace(id: string): Promise<FtreeDocument> {
    const fileHandle = await this.dirHandle!.getFileHandle(id)
    const file = await fileHandle.getFile()
    const doc = decodeDocument(await file.text())
    this.session = doc
    this.currentWorkspaceId = id
    localStorage.setItem(WORKSPACE_LAST, id)
    return doc
  }

  async createInWorkspace(name: string): Promise<{ id: string; doc: FtreeDocument }> {
    const filename = `${name}.ftree`
    const doc = emptyDocument()
    const fileHandle = await this.dirHandle!.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(encodeDocument(doc))
    await writable.close()
    this.session = doc
    this.currentWorkspaceId = filename
    return { id: filename, doc }
  }

  async deleteFromWorkspace(id: string): Promise<void> {
    await this.dirHandle!.removeEntry(id)
    if (this.currentWorkspaceId === id) {
      this.currentWorkspaceId = null
      this.session = null
    }
  }

  async renameInWorkspace(id: string, newName: string): Promise<void> {
    const newId = `${newName}.ftree`
    // FSA has no rename — read + create new + delete old
    const oldHandle = await this.dirHandle!.getFileHandle(id)
    const file = await oldHandle.getFile()
    const content = await file.text()
    const newHandle = await this.dirHandle!.getFileHandle(newId, { create: true })
    const writable = await newHandle.createWritable()
    await writable.write(content)
    await writable.close()
    await this.dirHandle!.removeEntry(id)
    if (this.currentWorkspaceId === id) this.currentWorkspaceId = newId
  }

  // ── Private ───────────────────────────────────────────────────

  private async _listFiles(): Promise<WorkspaceEntry[]> {
    const entries: WorkspaceEntry[] = []
    for await (const [name, handle] of (this.dirHandle as any)) {
      if (handle.kind === 'file' && name.endsWith('.ftree')) {
        const file = await (handle as FileSystemFileHandle).getFile()
        entries.push({
          id: name,
          displayName: name.replace(/\.ftree$/, ''),
          updatedAt: new Date(file.lastModified).toISOString(),
        })
      }
    }
    return entries.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
  }
}
