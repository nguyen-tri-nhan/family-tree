import { describe, it, expect } from 'vitest'
import { encodeTree, decodeTree } from '../utils/shareUrl'
import { makeTestDoc } from './fixtures'

describe('encodeTree / decodeTree', () => {
  it('round-trips a document losslessly', async () => {
    const doc = makeTestDoc()
    const { encoded } = await encodeTree(doc)
    const decoded = await decodeTree(encoded)
    expect(decoded).toEqual(doc)
  })

  it('encoded string is URL-safe (no +, /, =)', async () => {
    const { encoded } = await encodeTree(makeTestDoc())
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('small doc is not oversized', async () => {
    const { oversized } = await encodeTree(makeTestDoc())
    expect(oversized).toBe(false)
  })

  it('decodeTree throws on garbage input', async () => {
    await expect(decodeTree('not-valid-base64!!!!')).rejects.toThrow()
  })

  it('decodeTree throws when decoded JSON is not a valid FtreeDocument', async () => {
    // encode a valid-looking doc missing required fields
    const { encoded } = await encodeTree({ foo: 'bar' } as never)
    await expect(decodeTree(encoded)).rejects.toThrow('Dữ liệu chia sẻ không hợp lệ')
  })
})
