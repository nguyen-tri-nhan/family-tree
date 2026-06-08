import { describe, test, expect } from 'vitest'
import {
  emptyDocument, encodeDocument, decodeDocument,
  isValidDocument, touchUpdatedAt,
} from '../document'
import { FTREE_VERSION } from '../types'

describe('emptyDocument', () => {
  test('returns correct version', () => {
    expect(emptyDocument().version).toBe(FTREE_VERSION)
  })

  test('has empty arrays', () => {
    const doc = emptyDocument()
    expect(doc.persons).toHaveLength(0)
    expect(doc.families).toHaveLength(0)
    expect(doc.branches).toHaveLength(0)
  })

  test('createdAt and updatedAt are ISO 8601', () => {
    const doc = emptyDocument()
    expect(() => new Date(doc.createdAt)).not.toThrow()
    expect(() => new Date(doc.updatedAt)).not.toThrow()
  })
})

describe('encodeDocument / decodeDocument', () => {
  test('roundtrip produces identical document', () => {
    const doc = emptyDocument()
    const decoded = decodeDocument(encodeDocument(doc))
    expect(decoded.version).toBe(doc.version)
    expect(decoded.clan.name).toBe(doc.clan.name)
    expect(decoded.persons).toHaveLength(0)
  })

  test('roundtrip preserves Vietnamese characters', () => {
    const doc = emptyDocument()
    doc.clan.name = 'Họ Nguyễn Văn — Làng Đông Ngạc'
    const decoded = decodeDocument(encodeDocument(doc))
    expect(decoded.clan.name).toBe('Họ Nguyễn Văn — Làng Đông Ngạc')
  })

  test('decodeDocument throws on garbage input', () => {
    expect(() => decodeDocument('!!not-base64!!')).toThrow()
  })

  test('decodeDocument throws on valid base64 but invalid structure', () => {
    const invalid = btoa(JSON.stringify({ foo: 'bar' }))
    expect(() => decodeDocument(invalid)).toThrow('File không hợp lệ hoặc bị lỗi')
  })

  test('decodeDocument throws when version mismatches', () => {
    const doc = { ...emptyDocument(), version: '0.9' }
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(doc))))
    expect(() => decodeDocument(b64)).toThrow('File không hợp lệ hoặc bị lỗi')
  })
})

describe('isValidDocument', () => {
  test('accepts a valid document', () => {
    expect(isValidDocument(emptyDocument())).toBe(true)
  })

  test('rejects null', () => {
    expect(isValidDocument(null)).toBe(false)
  })

  test('rejects non-object', () => {
    expect(isValidDocument('string')).toBe(false)
    expect(isValidDocument(42)).toBe(false)
  })

  test('rejects wrong version', () => {
    expect(isValidDocument({ ...emptyDocument(), version: '0.9' })).toBe(false)
  })

  test('rejects missing persons array', () => {
    const doc = emptyDocument() as unknown as Record<string, unknown>
    delete doc.persons
    expect(isValidDocument(doc)).toBe(false)
  })

  test('rejects missing families array', () => {
    const doc = emptyDocument() as unknown as Record<string, unknown>
    delete doc.families
    expect(isValidDocument(doc)).toBe(false)
  })
})

describe('touchUpdatedAt', () => {
  test('updates updatedAt timestamp', async () => {
    const doc = emptyDocument()
    const before = doc.updatedAt
    await new Promise(r => setTimeout(r, 5))
    const updated = touchUpdatedAt(doc)
    expect(updated.updatedAt >= before).toBe(true)
  })

  test('does not mutate original document', () => {
    const doc = emptyDocument()
    const original = doc.updatedAt
    touchUpdatedAt(doc)
    expect(doc.updatedAt).toBe(original)
  })
})
