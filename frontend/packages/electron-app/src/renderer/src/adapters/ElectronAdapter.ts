import { decodeDocument, emptyDocument, encodeDocument } from '@family-tree/tree-lib'
import type { FtreeDocument, IStorageAdapter, RecentFile, WorkspaceEntry } from '@family-tree/tree-lib'

interface ElectronAPI {
  // Single file
  openFile:     () => Promise<{ path: string; b64: string } | null>
  saveFile:     (path: string, b64: string) => Promise<void>
  newFile:      () => Promise<string | null>
  openFilePath: (path: string) => Promise<{ path: string; b64: string }>
  // Folder / Workspace
  selectFolder:       () => Promise<string | null>
  listFolder:         (path: string) => Promise<WorkspaceEntry[]>
  createFile:         (folder: string, name: string) => Promise<string>
  deleteFile:         (path: string) => Promise<void>
  renameFile:         (oldPath: string, newName: string) => Promise<string>
  // Prefs
  getRecent:          () => Promise<Array<{ path: string; name: string; openedAt: string }>>
  addRecent:          (entry: { path: string; name: string; openedAt: string }) => Promise<void>
  getWorkspaceFolder: () => Promise<string | null>
  // Window
  toggleMaximize: () => Promise<void>
}

declare global {
  interface Window { api: ElectronAPI }
}

export class ElectronAdapter implements IStorageAdapter {
  readonly platform = 'electron' as const

  private currentPath:     string | null = null
  private session:         FtreeDocument | null = null
  private workspaceFolder: string | null = null

  // ── Single-file mode ─────────────────────────────────────────

  hasSession(): boolean {
    return this.session !== null
  }

  async load(): Promise<FtreeDocument> {
    if (!this.session) throw new Error('Không có file đang mở')
    return this.session
  }

  async save(doc: FtreeDocument): Promise<void> {
    if (!this.currentPath) {
      const path = await window.api.newFile()
      if (!path) throw new Error('Hủy lưu file')
      this.currentPath = path
    }
    const b64 = encodeDocument(doc)
    await window.api.saveFile(this.currentPath, b64)
    this.session = doc
    await window.api.addRecent({
      path: this.currentPath,
      name: doc.clan.name,
      openedAt: new Date().toISOString(),
    })
  }

  async openFile(): Promise<FtreeDocument> {
    const result = await window.api.openFile()
    if (!result) throw new Error('Không có file được chọn')
    const doc = decodeDocument(result.b64)
    this.currentPath = result.path
    this.session = doc
    // Leave workspace mode when opening standalone file
    this.workspaceFolder = null
    await window.api.addRecent({
      path: result.path,
      name: doc.clan.name,
      openedAt: new Date().toISOString(),
    })
    return doc
  }

  async newFile(): Promise<void> {
    const path = await window.api.newFile()
    if (!path) throw new Error('Hủy tạo file mới')
    this.currentPath = path
    this.workspaceFolder = null
    this.session = emptyDocument()
    await window.api.saveFile(path, encodeDocument(this.session))
  }

  async exportFile(doc: FtreeDocument): Promise<void> {
    await this.save(doc)
  }

  async getRecentFiles(): Promise<RecentFile[]> {
    const recent = await window.api.getRecent()
    return recent.map(r => ({ path: r.path, name: r.name, openedAt: r.openedAt }))
  }

  // ── Workspace mode ───────────────────────────────────────────

  hasWorkspace(): boolean {
    return this.workspaceFolder !== null
  }

  getWorkspaceName(): string | null {
    if (!this.workspaceFolder) return null
    return this.workspaceFolder.split('/').pop() ?? this.workspaceFolder
  }

  async getWorkspaceFiles(): Promise<WorkspaceEntry[]> {
    // Lazy-load stored workspace folder from prefs on first call
    if (!this.workspaceFolder) {
      this.workspaceFolder = await window.api.getWorkspaceFolder()
    }
    if (!this.workspaceFolder) return []
    return window.api.listFolder(this.workspaceFolder)
  }

  async openWorkspace(): Promise<WorkspaceEntry[]> {
    const folder = await window.api.selectFolder()
    if (!folder) throw new Error('Hủy chọn folder')
    this.workspaceFolder = folder
    this.currentPath = null
    this.session = null
    return window.api.listFolder(folder)
  }

  async openFromWorkspace(id: string): Promise<FtreeDocument> {
    const { path, b64 } = await window.api.openFilePath(id)
    const doc = decodeDocument(b64)
    this.currentPath = path
    this.session = doc
    return doc
  }

  async createInWorkspace(name: string): Promise<{ id: string; doc: FtreeDocument }> {
    const fullPath = await window.api.createFile(this.workspaceFolder!, name)
    const doc = emptyDocument()
    await window.api.saveFile(fullPath, encodeDocument(doc))
    this.currentPath = fullPath
    this.session = doc
    return { id: fullPath, doc }
  }

  async deleteFromWorkspace(id: string): Promise<void> {
    await window.api.deleteFile(id)
    if (this.currentPath === id) {
      this.currentPath = null
      this.session = null
    }
  }

  async renameInWorkspace(id: string, newName: string): Promise<void> {
    const newPath = await window.api.renameFile(id, newName)
    if (this.currentPath === id) this.currentPath = newPath
  }
}
