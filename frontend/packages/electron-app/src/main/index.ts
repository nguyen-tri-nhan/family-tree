import * as electronMain from 'electron/main'
const { app, BrowserWindow, ipcMain, dialog } = electronMain
import { join, basename, dirname } from 'node:path'
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'

interface Prefs {
  recentFiles: Array<{ path: string; name: string; openedAt: string }>
  workspaceFolder?: string
}

function prefsPath(): string {
  return join(app.getPath('userData'), 'prefs.json')
}

function loadPrefs(): Prefs {
  try {
    const p = prefsPath()
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf-8')) as Prefs
  } catch {}
  return { recentFiles: [] }
}

function savePrefs(prefs: Prefs): void {
  const p = prefsPath()
  mkdirSync(join(p, '..'), { recursive: true })
  writeFileSync(p, JSON.stringify(prefs, null, 2), 'utf-8')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── File IPC ──────────────────────────────────────────────────

ipcMain.handle('file:open', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Family Tree', extensions: ['ftree'] }],
    properties: ['openFile'],
  })
  if (canceled || filePaths.length === 0) return null
  const filePath = filePaths[0]
  const b64 = readFileSync(filePath, 'utf-8').trim()
  return { path: filePath, b64 }
})

ipcMain.handle('file:save', async (_event, { path, b64 }: { path: string; b64: string }) => {
  const tmp = path + '.tmp'
  writeFileSync(tmp, b64, 'utf-8')
  renameSync(tmp, path)
})

ipcMain.handle('file:new', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: 'gia-pha.ftree',
    filters: [{ name: 'Family Tree', extensions: ['ftree'] }],
  })
  return canceled ? null : filePath
})

ipcMain.handle('file:open-path', (_event, filePath: string) => {
  const b64 = readFileSync(filePath, 'utf-8').trim()
  return { path: filePath, b64 }
})

// ── Folder / Workspace IPC ────────────────────────────────────

ipcMain.handle('folder:select', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  if (canceled || filePaths.length === 0) return null
  const folderPath = filePaths[0]
  const prefs = loadPrefs()
  prefs.workspaceFolder = folderPath
  savePrefs(prefs)
  return folderPath
})

ipcMain.handle('folder:list', (_event, folderPath: string) => {
  if (!existsSync(folderPath)) return []
  return readdirSync(folderPath, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.ftree'))
    .map(e => {
      const fullPath = join(folderPath, e.name)
      const stat = statSync(fullPath)
      return {
        id: fullPath,
        displayName: e.name.replace(/\.ftree$/, ''),
        updatedAt: stat.mtime.toISOString(),
      }
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

ipcMain.handle('folder:create-file', (_event, { folder, name }: { folder: string; name: string }) => {
  const fullPath = join(folder, `${name}.ftree`)
  writeFileSync(fullPath, '', 'utf-8')
  return fullPath
})

ipcMain.handle('folder:delete-file', (_event, filePath: string) => {
  unlinkSync(filePath)
})

ipcMain.handle('folder:rename-file', (_event, { oldPath, newName }: { oldPath: string; newName: string }) => {
  const newPath = join(dirname(oldPath), `${newName}.ftree`)
  renameSync(oldPath, newPath)
  return newPath
})

// ── Prefs IPC ─────────────────────────────────────────────────

ipcMain.handle('prefs:getRecent', () => {
  return loadPrefs().recentFiles
})

ipcMain.handle('prefs:addRecent', (
  _event,
  entry: { path: string; name: string; openedAt: string },
) => {
  const prefs = loadPrefs()
  prefs.recentFiles = [
    entry,
    ...prefs.recentFiles.filter(f => f.path !== entry.path),
  ].slice(0, 10)
  savePrefs(prefs)
})

ipcMain.handle('prefs:getWorkspace', () => {
  return loadPrefs().workspaceFolder ?? null
})

ipcMain.handle('window:toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  if (win.isMaximized()) win.unmaximize()
  else win.maximize()
})

// ── App lifecycle ─────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
