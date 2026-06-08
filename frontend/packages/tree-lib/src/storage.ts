import { createContext, useContext } from 'react'
import type { FtreeDocument } from './types'

export interface RecentFile {
  path: string
  name: string
  openedAt: string  // ISO 8601
}

export interface IStorageAdapter {
  readonly platform: 'web' | 'electron'

  // Có session đang mở không?
  hasSession(): boolean

  // Load FtreeDocument từ storage hiện tại
  load(): Promise<FtreeDocument>

  // Ghi FtreeDocument vào storage hiện tại
  save(doc: FtreeDocument): Promise<void>

  // Mở file picker → load và set session
  openFile(): Promise<FtreeDocument>

  // Tạo session mới (file rỗng)
  newFile(): Promise<void>

  // Export file ra ngoài (web: download, electron: copy)
  exportFile(doc: FtreeDocument): Promise<void>

  // Danh sách file gần đây (web trả về [])
  getRecentFiles(): Promise<RecentFile[]>
}

// ── React Context ───────────────────────────────────────────────

const StorageContext = createContext<IStorageAdapter | null>(null)

export const StorageProvider = StorageContext.Provider

export function useStorage(): IStorageAdapter {
  const adapter = useContext(StorageContext)
  if (!adapter) throw new Error('useStorage must be used inside <StorageProvider>')
  return adapter
}
