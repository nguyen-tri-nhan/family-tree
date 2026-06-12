import { createContext, useContext } from 'react'
import type { FtreeDocument } from './types'

export interface RecentFile {
  path: string
  name: string
  openedAt: string  // ISO 8601
}

export interface WorkspaceEntry {
  id: string          // web: 'family.ftree'; electron: '/Users/.../family.ftree'
  displayName: string // filename without .ftree, updated to clan.name after load
  updatedAt?: string  // ISO 8601
}

export interface IStorageAdapter {
  readonly platform: 'web' | 'electron'

  // Session (single-file mode)
  hasSession(): boolean
  load(): Promise<FtreeDocument>
  save(doc: FtreeDocument): Promise<void>
  openFile(): Promise<FtreeDocument>
  newFile(): Promise<void>
  exportFile(doc: FtreeDocument): Promise<void>
  getRecentFiles(): Promise<RecentFile[]>

  // Workspace (folder mode)
  hasWorkspace(): boolean
  getWorkspaceName(): string | null
  getWorkspaceFiles(): Promise<WorkspaceEntry[]>   // lazy-loads stored workspace on first call
  openWorkspace(): Promise<WorkspaceEntry[]>        // shows folder picker
  openFromWorkspace(id: string): Promise<FtreeDocument>
  createInWorkspace(name: string): Promise<{ id: string; doc: FtreeDocument }>
  deleteFromWorkspace(id: string): Promise<void>
  renameInWorkspace(id: string, newName: string): Promise<void>
}

// ── React Context ───────────────────────────────────────────────

const StorageContext = createContext<IStorageAdapter | null>(null)

export const StorageProvider = StorageContext.Provider

export function useStorage(): IStorageAdapter {
  const adapter = useContext(StorageContext)
  if (!adapter) throw new Error('useStorage must be used inside <StorageProvider>')
  return adapter
}
