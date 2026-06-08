import { decodeDocument, emptyDocument, encodeDocument } from '@family-tree/tree-lib'
import type { FtreeDocument, IStorageAdapter, RecentFile } from '@family-tree/tree-lib'

const CACHE_KEY = 'ftree-session-cache'

export class WebAdapter implements IStorageAdapter {
  readonly platform = 'web' as const
  private session: FtreeDocument | null = null

  hasSession(): boolean {
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
    localStorage.setItem(CACHE_KEY, encodeDocument(doc))
    await this.exportFile(doc)
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
        localStorage.setItem(CACHE_KEY, b64)
        this.session = doc
        resolve(doc)
      }
      input.click()
    })
  }

  async newFile(): Promise<void> {
    localStorage.removeItem(CACHE_KEY)
    this.session = emptyDocument()
  }

  async exportFile(doc: FtreeDocument): Promise<void> {
    const b64   = encodeDocument(doc)
    const blob  = new Blob([b64], { type: 'text/plain' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href      = url
    a.download  = `gia-pha.ftree`
    a.click()
    URL.revokeObjectURL(url)
  }

  async getRecentFiles(): Promise<RecentFile[]> {
    return []
  }
}
