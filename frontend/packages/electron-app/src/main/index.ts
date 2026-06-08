import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'node:path'
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs'

interface Prefs {
  recentFiles: Array<{ path: string; name: string; openedAt: string }>
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
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── IPC handlers ──────────────────────────────────────────────

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
