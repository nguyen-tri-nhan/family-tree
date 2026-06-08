import type { FtreeDocument } from './types'
import { FTREE_VERSION } from './types'

export const MAX_PERSONS = 200

export function emptyDocument(): FtreeDocument {
  const now = new Date().toISOString()
  return {
    version: FTREE_VERSION,
    createdAt: now,
    updatedAt: now,
    clan: {
      id: crypto.randomUUID(),
      name: 'Gia phả mới',
      surname: '',
      headHistory: [],
    },
    branches: [],
    persons: [],
    families: [],
  }
}

export function encodeDocument(doc: FtreeDocument): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(doc))))
}

export function decodeDocument(b64: string): FtreeDocument {
  const raw = JSON.parse(decodeURIComponent(escape(atob(b64))))
  if (!isValidDocument(raw)) throw new Error('File không hợp lệ hoặc bị lỗi')
  return raw as FtreeDocument
}

export function isValidDocument(raw: unknown): raw is FtreeDocument {
  if (typeof raw !== 'object' || raw === null) return false
  const doc = raw as Record<string, unknown>
  return (
    doc.version === FTREE_VERSION &&
    typeof doc.createdAt === 'string' &&
    typeof doc.clan === 'object' &&
    Array.isArray(doc.persons) &&
    Array.isArray(doc.families)
  )
}

export function touchUpdatedAt(doc: FtreeDocument): FtreeDocument {
  return { ...doc, updatedAt: new Date().toISOString() }
}
