import type { FtreeDocument } from '../types'
import { isValidDocument } from '../document'

async function compress(data: string): Promise<string> {
  const stream = new CompressionStream('deflate-raw')
  const writer = stream.writable.getWriter()
  writer.write(new TextEncoder().encode(data))
  writer.close()
  const chunks: Uint8Array[] = []
  const reader = stream.readable.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const merged = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let off = 0
  for (const c of chunks) { merged.set(c, off); off += c.length }
  return btoa(String.fromCharCode(...merged))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function decompress(encoded: string): Promise<string> {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const stream = new DecompressionStream('deflate-raw')
  const writer = stream.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const chunks: Uint8Array[] = []
  const reader = stream.readable.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const merged = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let off = 0
  for (const c of chunks) { merged.set(c, off); off += c.length }
  return new TextDecoder().decode(merged)
}

const OVERSIZED_THRESHOLD = 4000

export async function encodeTree(doc: FtreeDocument): Promise<{ encoded: string; oversized: boolean }> {
  const encoded = await compress(JSON.stringify(doc))
  return { encoded, oversized: encoded.length > OVERSIZED_THRESHOLD }
}

export async function decodeTree(encoded: string): Promise<FtreeDocument> {
  const json = await decompress(encoded)
  const raw = JSON.parse(json)
  if (!isValidDocument(raw)) throw new Error('Dữ liệu chia sẻ không hợp lệ')
  return raw as FtreeDocument
}
