# Family Tree

Vietnamese family tree manager — runs in the browser and as a desktop app (Electron).  
Data is stored as `.ftree` files (base64 JSON), fully **local-first**, no account required.

[![CI](https://github.com/nguyen-tri-nhan/family-tree/actions/workflows/ci.yml/badge.svg)](https://github.com/nguyen-tri-nhan/family-tree/actions/workflows/ci.yml)

---

## Features

- Multi-generation, multi-branch family trees
- Automatic kinship labeling (Uncle, Aunt, Cousin… dialect-aware for Northern/Southern Vietnamese)
- Lunar and solar calendar support
- Export to PNG / PDF
- Web app + Desktop app (Windows/macOS) sharing the same codebase

---

## Monorepo

```
family-tree/
├── Makefile
├── frontend/                        npm workspaces + Lerna
│   ├── packages/
│   │   ├── tree-lib/                @family-tree/tree-lib
│   │   ├── web-app/                 @family-tree/web-app
│   │   └── electron-app/            @family-tree/electron-app
│   └── package.json
├── sample/                          Sample .ftree files
└── specs/                           Design documents
```

```mermaid
graph LR
  tree-lib["@family-tree/tree-lib\n(shared logic + components)"]
  web["@family-tree/web-app\n(Vite React)"]
  electron["@family-tree/electron-app\n(electron-vite)"]

  tree-lib --> web
  tree-lib --> electron
```

---

## Architecture

### Storage Adapter Pattern

Both web and desktop share the same `App.tsx` from `tree-lib`. The only difference is the **adapter** — injected via React Context.

```mermaid
classDiagram
  class IStorageAdapter {
    <<interface>>
    +platform: 'web' | 'electron'
    +hasSession() bool
    +load() Promise~FtreeDocument~
    +save(doc) Promise~void~
    +openFile() Promise~FtreeDocument~
    +newFile() Promise~void~
    +exportFile(doc) Promise~void~
    +getRecentFiles() Promise~RecentFile[]~
  }

  class WebAdapter {
    localStorage cache
    File input picker
    Blob download
  }

  class ElectronAdapter {
    window.api IPC bridge
    Native file dialog
    Atomic write (.tmp → rename)
  }

  IStorageAdapter <|-- WebAdapter
  IStorageAdapter <|-- ElectronAdapter
```

| Action | WebAdapter | ElectronAdapter |
|---|---|---|
| Open file | `<input type="file">` | `dialog.showOpenDialog` |
| Save | `localStorage` + download | `writeFileSync` atomic |
| Recent files | Not supported | `prefs.json` in userData |

---

### Data Model — FtreeDocument

A `.ftree` file is `base64(encodeURIComponent(JSON.stringify(FtreeDocument)))`.

```mermaid
erDiagram
  FtreeDocument ||--|| Clan : clan
  FtreeDocument ||--o{ Branch : branches
  FtreeDocument ||--o{ Person : persons
  FtreeDocument ||--o{ FamilyUnit : families

  FamilyUnit {
    string id
    string personId
    string spouseId
    string[] childIds
    number generation
    string branchId
  }

  Person {
    string id
    string displayName
    string gender
    PartialDate birthDate
    PartialDate deathDate
    bool isAlive
  }

  Clan {
    string id
    string name
    string surname
    string region
  }

  FamilyUnit }o--|| Person : personId
  FamilyUnit }o--o| Person : "spouseId (optional)"
  FamilyUnit }o--o{ Person : childIds
  Branch }o--|| Person : ancestorPersonId
```

`region: 'north' | 'south'` on Clan controls kinship terminology (Bố/Mẹ vs Ba/Má, ordinals Cả/Hai…).

---

### Electron IPC Flow

The main process does not expose Node.js to the renderer — all file operations go through IPC.

```mermaid
sequenceDiagram
  participant R as Renderer (React)
  participant W as window.api (preload)
  participant M as Main Process
  participant FS as File System

  R->>W: window.api.openFile()
  W->>M: ipcRenderer.invoke('file:open')
  M->>FS: dialog.showOpenDialog()
  FS-->>M: filePath
  M->>FS: readFileSync(filePath, 'utf-8')
  FS-->>M: b64 string
  M-->>W: { path, b64 }
  W-->>R: { path, b64 }
  R->>R: decodeDocument(b64)
```

Preload is built as **CJS** (`index.cjs`) — Electron's sandbox does not support ESM `import` in preload scripts.  
Main process is built as **ESM** (`index.js`) with `"type": "module"`.

---

### Kinship Algorithm

Uses **Lowest Common Ancestor (LCA)** on the family tree graph.

```mermaid
flowchart TD
  A([computeKinship\nviewer, target]) --> SP{Direct\nspouse?}
  SP -->|Yes| RV[return Husband / Wife]
  SP -->|No| IL{target is\na spouseId?}
  IL -->|Yes| BL[bloodTarget = personId\nisInLaw = true]
  IL -->|No| BL2[bloodTarget = target]
  BL & BL2 --> CH[Build ancestor chains\nviewer → root\nbloodTarget → root]
  CH --> LCA[Find LCA]
  LCA -->|Not found| NULL[return null]
  LCA -->|Found| GD["genDelta = vDepth − tDepth\nbranchRank = viBranch − tiBranch\nordinal = position among siblings"]
  GD --> BLD[buildLabel\ngenDelta, branchRank,\nisSibling, gender, region]
  BLD --> INL{isInLaw?}
  INL -->|Yes| AIL["applyInLaw\nUncle→Aunt, Aunt→Uncle-in-law\nChild→Daughter/Son-in-law…"]
  INL -->|No| RES([return KinshipResult])
  AIL --> RES
```

- `genDelta > 0` — target is an older generation (Grandfather, Father…)
- `branchRank > 0` — viewer's branch is junior → target is senior (Elder uncle, Elder brother…)
- `branchRank < 0` — viewer's branch is senior → target is junior (Younger uncle, Younger sibling…)

---

## CI/CD

```mermaid
flowchart LR
  subgraph CI["CI — push / PR to main"]
    TC[typecheck] & TS[test 56 cases] --> BL[build\ntree-lib + web + electron]
  end

  subgraph Release["Release — push to release branch"]
    MAC["macos-latest\nelectron-builder\n→ .dmg x64 + arm64"]
    WIN["windows-latest\nelectron-builder\n→ .exe x64"]
    MAC & WIN --> GH["GitHub Release\nv{package.json version}"]
  end

  subgraph Web["Web — push to release branch"]
    VC[Vercel auto-deploy]
  end
```

| Workflow | Trigger | Output |
|---|---|---|
| `ci.yml` | push / PR → `main` | typecheck + test + build |
| `release.yml` | push → `release` | `.dmg` + `.exe` → GitHub Release |
| Vercel | push → `release` | Deploy `<project>.vercel.app` |

`node_modules` is cached per `runner.os × hash(package-lock.json)` — `npm ci` only runs on cache miss.

---

## Getting Started

```bash
make install        # npm ci

make dev-web        # localhost:5173
make dev-electron   # Electron window

make test           # 56 unit tests (vitest)
make typecheck      # TypeScript check all packages

make build          # Build everything (tree-lib → web + electron)
```

---

## Releasing

1. Bump `version` in `frontend/packages/electron-app/package.json`
2. Merge into the `release` branch
3. GitHub Actions builds and publishes release `v{version}` automatically

---

## File Format `.ftree`

```
encode: base64( encodeURIComponent( JSON.stringify(FtreeDocument) ) )
decode: JSON.parse( decodeURIComponent( atob(b64) ) )
```

Full UTF-8/Unicode support. Files can be opened in any text editor for debugging.

---

## Specs

| File | Description |
|---|---|
| [specs/plan.md](specs/plan.md) | Project plan and tech stack |
| [specs/data.md](specs/data.md) | Detailed data model |
| [specs/design.md](specs/design.md) | IStorageAdapter pattern |
| [specs/impl-v1.md](specs/impl-v1.md) | v1 implementation plan + .ftree schema |
| [specs/render.md](specs/render.md) | Render strategy by node count |
