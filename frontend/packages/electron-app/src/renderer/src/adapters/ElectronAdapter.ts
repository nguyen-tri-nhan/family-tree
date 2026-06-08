import { decodeDocument, emptyDocument, encodeDocument } from '@family-tree/tree-lib'
import type { FtreeDocument, IStorageAdapter, RecentFile } from '@family-tree/tree-lib'

interface ElectronAPI {
  openFile: () => Promise<{ path: string; b64: string } | null>
  saveFile: (path: string, b64: string) => Promise<void>
  newFile: () => Promise<string | null>
  getRecent: () => Promise<Array<{ path: string; name: string; openedAt: string }>>
  addRecent: (entry: { path: string; name: string; openedAt: string }) => Promise<void>
  toggleMaximize: () => Promise<void>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}

export class ElectronAdapter implements IStorageAdapter {
  readonly platform = 'electron' as const
  private currentPath: string | null = null
  private session: FtreeDocument | null = null

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
}
