const DB_NAME = 'ftree-db'
const DB_VERSION = 1
const STORE = 'workspace'

interface WorkspaceRecord {
  id: 'current'
  dirHandle: FileSystemDirectoryHandle
  name: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror  = () => reject(req.error)
  })
}

function idbGet<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror  = () => reject(req.error)
  })
}

function idbPut(db: IDBDatabase, store: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(value)
    req.onsuccess = () => resolve()
    req.onerror  = () => reject(req.error)
  })
}

function idbDelete(db: IDBDatabase, store: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(key)
    req.onsuccess = () => resolve()
    req.onerror  = () => reject(req.error)
  })
}

export async function getWorkspaceRecord(): Promise<WorkspaceRecord | null> {
  const db = await openDb()
  const record = await idbGet<WorkspaceRecord>(db, STORE, 'current')
  return record ?? null
}

export async function saveWorkspaceRecord(dirHandle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDb()
  await idbPut(db, STORE, { id: 'current', dirHandle, name: dirHandle.name })
}

export async function clearWorkspaceRecord(): Promise<void> {
  const db = await openDb()
  await idbDelete(db, STORE, 'current')
}
