import * as electronRenderer from 'electron/renderer'
const { contextBridge, ipcRenderer } = electronRenderer

contextBridge.exposeInMainWorld('api', {
  openFile: (): Promise<{ path: string; b64: string } | null> =>
    ipcRenderer.invoke('file:open'),
  saveFile: (path: string, b64: string): Promise<void> =>
    ipcRenderer.invoke('file:save', { path, b64 }),
  newFile: (): Promise<string | null> =>
    ipcRenderer.invoke('file:new'),
  getRecent: (): Promise<Array<{ path: string; name: string; openedAt: string }>> =>
    ipcRenderer.invoke('prefs:getRecent'),
  addRecent: (entry: { path: string; name: string; openedAt: string }): Promise<void> =>
    ipcRenderer.invoke('prefs:addRecent', entry),
  toggleMaximize: (): Promise<void> =>
    ipcRenderer.invoke('window:toggle-maximize'),
})
