#!/usr/bin/env node
// Encode .json source → .ftree (base64 UTF-8)
// Usage: node encode.mjs [name]   default: ho-nguyen-van
//
// Encoding matches browser's btoa(unescape(encodeURIComponent(json))):
//   Buffer.from(json, 'utf8').toString('base64')

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname, basename } from 'path'

const dir  = dirname(fileURLToPath(import.meta.url))
const arg  = process.argv[2]

const files = arg
  ? [`${arg}.json`]
  : readdirSync(dir).filter(f => f.endsWith('.json') && !f.includes('node_modules'))

for (const file of files) {
  const src  = join(dir, file)
  const dest = join(dir, file.replace(/\.json$/, '.ftree'))
  const json = readFileSync(src, 'utf8')
  const b64  = Buffer.from(json, 'utf8').toString('base64')
  writeFileSync(dest, b64)
  console.log(`✓ ${basename(dest)}  (${b64.length} chars)`)
}
