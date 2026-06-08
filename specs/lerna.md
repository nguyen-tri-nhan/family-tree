# Lerna & Monorepo — Cây Gia Phả

## Lerna là gì

Lerna là công cụ quản lý **monorepo** — một repo chứa nhiều package độc lập.
Nó không thay thế npm/yarn workspaces mà chạy **trên** chúng, bổ sung:

- `lerna run <script>` — chạy script trên nhiều package song song
- `lerna publish` — bump version, tag git, publish npm tự động
- `lerna changed` — liệt kê package nào có thay đổi kể từ lần release trước
- Dependency graph — biết package nào phụ thuộc package nào để build đúng thứ tự

**Khi nào cần Lerna?** Khi muốn publish thư viện lên npm hoặc manage nhiều app dùng chung code.
**Khi nào không cần?** Nếu chỉ dùng nội bộ, npm workspaces đơn giản hơn.

---

## Cấu trúc monorepo đề xuất

```
family-tree/
├── package.json          ← root workspace config
├── lerna.json
├── packages/
│   ├── tree-lib/         ← React + D3 component (có thể publish npm)
│   │   ├── src/
│   │   │   ├── FamilyTree.jsx
│   │   │   ├── drawPerson.js
│   │   │   └── index.js
│   │   ├── package.json  (@family-tree/tree-lib)
│   │   └── vite.config.js  ← build as library
│   │
│   └── electron-app/     ← Desktop app, consume tree-lib
│       ├── src/
│       │   ├── main/     ← Electron main process (Node)
│       │   │   ├── index.js
│       │   │   └── crypto.js   ← đọc/ghi file .ftree mã hóa
│       │   └── renderer/ ← UI (React, dùng tree-lib)
│       │       └── App.jsx
│       ├── package.json  (@family-tree/electron-app)
│       └── electron-builder.yml
│
└── specs/                ← docs (file này)
```

---

## Setup

### 1. Root package.json

```json
{
  "name": "family-tree",
  "private": true,
  "workspaces": ["packages/*"],
  "devDependencies": {
    "lerna": "^8"
  }
}
```

### 2. lerna.json

```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "independent",
  "npmClient": "npm",
  "packages": ["packages/*"]
}
```

`"version": "independent"` — mỗi package có version riêng (tree-lib v1.2, electron-app v2.0).

### 3. packages/tree-lib/package.json

```json
{
  "name": "@family-tree/tree-lib",
  "version": "0.1.0",
  "main": "dist/index.js",
  "module": "dist/index.es.js",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.js"
    }
  },
  "peerDependencies": {
    "react": ">=18",
    "d3": ">=7"
  },
  "scripts": {
    "build": "vite build --mode library",
    "dev": "vite build --watch --mode library"
  }
}
```

### 4. packages/electron-app/package.json

```json
{
  "name": "@family-tree/electron-app",
  "version": "1.0.0",
  "dependencies": {
    "@family-tree/tree-lib": "*"
  },
  "scripts": {
    "dev":   "vite",
    "build": "vite build && electron-builder",
    "dist":  "electron-builder --publish never"
  }
}
```

`"@family-tree/tree-lib": "*"` — npm workspace sẽ link local, không cần publish.

---

## Các lệnh thường dùng

```bash
# Cài tất cả dependencies
npm install

# Build tất cả package (đúng thứ tự dependency)
npx lerna run build

# Chỉ build tree-lib
npx lerna run build --scope=@family-tree/tree-lib

# Dev electron-app (tự động dùng tree-lib local)
npx lerna run dev --scope=@family-tree/electron-app

# Xem package nào thay đổi
npx lerna changed

# Bump version và publish (nếu muốn publish npm)
npx lerna publish
```

---

## Electron — Multi-platform Build

### Hỗ trợ

| Platform | Format | Build được từ macOS |
|----------|--------|---------------------|
| macOS | `.dmg`, `.pkg`, Mac App Store | ✅ Native |
| Windows | `.exe` (NSIS), `.msi`, portable | ⚠️ Cần Wine hoặc CI |
| Linux | `.AppImage`, `.deb`, `.rpm` | ✅ Được |

### electron-builder config (`electron-builder.yml`)

```yaml
appId: com.familytree.app
productName: Cây Gia Phả

directories:
  output: dist-electron

files:
  - packages/electron-app/dist/**
  - packages/electron-app/src/main/**

mac:
  category: public.app-category.lifestyle
  target:
    - target: dmg
      arch: [x64, arm64]    # Intel + Apple Silicon
    - target: zip

win:
  target:
    - target: nsis
      arch: [x64]
  artifactName: CayGiaPha-Setup-${version}.${ext}

linux:
  target:
    - target: AppImage
    - target: deb
  category: Utility
```

### Build local

```bash
# macOS only (chạy trên máy Mac)
npx electron-builder --mac

# Linux (chạy trên máy Mac hoặc Linux)
npx electron-builder --linux

# Windows (cần Wine trên Mac — thường dùng CI thay)
npx electron-builder --win
```

### Build tất cả platform qua GitHub Actions *(recommended)*

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install
      - run: npx lerna run build --scope=@family-tree/tree-lib
      - run: npx electron-builder
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.os }}
          path: packages/electron-app/dist-electron/
```

Push tag `v1.0.0` → GitHub tự build 3 platform → upload artifact.

---

## So sánh Electron vs Tauri (đã đề cập trong plan.md)

| | Electron | Tauri |
|---|---|---|
| Bundle size | ~100 MB | ~10 MB |
| Multi-platform | ✅ macOS, Windows, Linux | ✅ macOS, Windows, Linux |
| GitHub Actions | Rất nhiều ví dụ | Đang phổ biến |
| File system / crypto | Node.js built-in | Rust commands |
| React reuse | 100% | 100% |
| Khó setup monorepo | Trung bình | Trung bình |

Nếu bundle size quan trọng → Tauri. Nếu muốn ecosystem lớn, nhiều ví dụ → Electron.

---

## Migration path (lib → standalone npm package)

Khi `tree-lib` đủ trưởng thành, publish lên npm:

```bash
npx lerna publish --scope=@family-tree/tree-lib
```

Sau đó bất kỳ dự án nào cũng có thể dùng:

```bash
npm install @family-tree/tree-lib
```

```jsx
import { FamilyTree } from '@family-tree/tree-lib'
```
