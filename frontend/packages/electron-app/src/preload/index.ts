import * as electronRenderer from 'electron/renderer'
const { contextBridge, ipcRenderer } = electronRenderer

contextBridge.exposeInMainWorld('api', {
  // Single file
  openFile:       (): Promise<{ path: string; b64: string } | null> =>
    ipcRenderer.invoke('file:open'),
  saveFile:       (path: string, b64: string): Promise<void> =>
    ipcRenderer.invoke('file:save', { path, b64 }),
  newFile:        (): Promise<string | null> =>
    ipcRenderer.invoke('file:new'),
  openFilePath:   (path: string): Promise<{ path: string; b64: string }> =>
    ipcRenderer.invoke('file:open-path', path),

  // Folder / Workspace
  selectFolder:   (): Promise<string | null> =>
    ipcRenderer.invoke('folder:select'),
  listFolder:     (path: string): Promise<Array<{ id: string; displayName: string; updatedAt: string }>> =>
    ipcRenderer.invoke('folder:list', path),
  createFile:     (folder: string, name: string): Promise<string> =>
    ipcRenderer.invoke('folder:create-file', { folder, name }),
  deleteFile:     (path: string): Promise<void> =>
    ipcRenderer.invoke('folder:delete-file', path),
  renameFile:     (oldPath: string, newName: string): Promise<string> =>
    ipcRenderer.invoke('folder:rename-file', { oldPath, newName }),

  // Prefs
  getRecent:      (): Promise<Array<{ path: string; name: string; openedAt: string }>> =>
    ipcRenderer.invoke('prefs:getRecent'),
  addRecent:      (entry: { path: string; name: string; openedAt: string }): Promise<void> =>
    ipcRenderer.invoke('prefs:addRecent', entry),
  getWorkspaceFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('prefs:getWorkspace'),

  // Window
  toggleMaximize: (): Promise<void> =>
    ipcRenderer.invoke('window:toggle-maximize'),
})
