# Implementation Plan — V1

## Cấu trúc file .ftree (raw JSON trước khi base64)

Đây là toàn bộ schema thực tế, với ví dụ đầy đủ:

IDs dùng **UUID v4** (`crypto.randomUUID()`). Ví dụ dưới dùng UUID thật để thể hiện format thực tế.

```json
{
  "version": "1.0",
  "createdAt": "2026-06-07T10:00:00Z",
  "updatedAt": "2026-06-07T15:30:00Z",

  "clan": {
    "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
    "name": "Họ Nguyễn Văn — Làng Đông Ngạc",
    "surname": "Nguyễn",
    "origin": "Làng Đông Ngạc, Từ Liêm, Hà Nội",
    "foundingYear": 1820,
    "motto": "Trung hiếu truyền gia",
    "ancestorPersonId": "a1f6b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "currentHeadId": "a3f6d3e4-f5a6-7b8c-0d1e-2f3a4b5c6d7e",
    "headHistory": [
      {
        "personId": "a1f6b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "startYear": 1850,
        "endYear": 1905
      },
      {
        "personId": "a2f6c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "startYear": 1905,
        "endYear": 1960,
        "reason": "kế thừa từ cha"
      }
    ],
    "ancestralHall": {
      "address": "Số 5 ngõ 12 Đông Ngạc, Từ Liêm, Hà Nội",
      "builtYear": 1890
    },
    "generationPoems": ["An Bình Cường Dũng Lan"],
    "description": "Dòng họ Nguyễn gốc Đông Ngạc, khai tộc từ thời Nguyễn Gia Long"
  },

  "branches": [
    {
      "id": "ba11b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "name": "Chi Trưởng",
      "shortName": "Chi I",
      "type": "main",
      "order": 1,
      "ancestorPersonId": "a1f6b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "clanId": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
      "region": "Hà Nội",
      "description": "Dòng con trai cả, giữ nhà thờ họ"
    },
    {
      "id": "ba22c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Chi Thứ Hai",
      "shortName": "Chi II",
      "type": "secondary",
      "order": 2,
      "ancestorPersonId": "a2f6c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "clanId": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
      "region": "TP. Hồ Chí Minh"
    }
  ],

  "persons": [
    {
      "id": "a1f6b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "displayName": "Nguyễn Văn An",
      "names": {
        "birth": "Nguyễn Văn An",
        "nickname": "Cụ An",
        "courtesy": "Mộng Hà",
        "taboo": "Húy An",
        "sinograph": "阮文安"
      },
      "gender": "male",
      "birthDate": {
        "year": 1900, "month": 3, "day": 15,
        "lunar": { "year": 1900, "month": 2, "day": 15, "leapMonth": false },
        "displayCalendar": "lunar"
      },
      "deathDate": {
        "year": 1975, "month": 4, "day": 20,
        "displayCalendar": "solar"
      },
      "isAlive": false,
      "birthPlace": "Làng Đông Ngạc, Từ Liêm, Hà Nội",
      "deathPlace": "Hà Nội",
      "bio": "Ông là người khai tộc chi trưởng, từng làm quan dưới triều Nguyễn.",
      "education": [
        {
          "level": "university",
          "institution": "Đại học Đông Dương",
          "major": "Luật",
          "graduationYear": 1925
        }
      ],
      "titles": [
        {
          "type": "tien_si",
          "label": "Tiến sĩ",
          "awardedYear": 1960,
          "awardedBy": "Nhà nước Việt Nam"
        }
      ],
      "occupations": [
        {
          "title": "Hiệu trưởng",
          "organization": "Trường THPT Chu Văn An",
          "startYear": 1945,
          "endYear": 1970,
          "sector": "education"
        }
      ],
      "achievements": [
        {
          "title": "Huân chương Lao động hạng Nhì",
          "year": 1965,
          "type": "award",
          "description": "Thành tích xuất sắc trong ngành giáo dục"
        }
      ],
      "clanRoles": [
        {
          "clanId": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
          "role": "truong_ho",
          "startYear": 1950,
          "endYear": 1975
        }
      ],
      "createdAt": "2026-06-07T10:00:00Z",
      "updatedAt": "2026-06-07T10:00:00Z"
    },
    {
      "id": "a2f6c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "displayName": "Trần Thị Bình",
      "gender": "female",
      "birthDate": { "year": 1905, "displayCalendar": "solar" },
      "deathDate": { "year": 1980, "displayCalendar": "solar" },
      "isAlive": false,
      "createdAt": "2026-06-07T10:00:00Z",
      "updatedAt": "2026-06-07T10:00:00Z"
    },
    {
      "id": "a3f6d3e4-f5a6-7b8c-0d1e-2f3a4b5c6d7e",
      "displayName": "Nguyễn Văn Cường",
      "gender": "male",
      "birthDate": { "year": 1930, "displayCalendar": "solar" },
      "isAlive": true,
      "createdAt": "2026-06-07T10:00:00Z",
      "updatedAt": "2026-06-07T10:00:00Z"
    }
  ],

  "families": [
    {
      "id": "f1e2d3c4-b5a6-7980-8b0c-1a2b3c4d5e6f",
      "personId": "a1f6b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "spouseId": "a2f6c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "marriageDate": { "year": 1925, "displayCalendar": "solar" },
      "marriageStatus": "widowed",
      "childIds": ["a3f6d3e4-f5a6-7b8c-0d1e-2f3a4b5c6d7e"],
      "branchId": "ba11b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "generation": 1
    },
    {
      "id": "f2e3d4c5-c6b7-8091-9c0d-2b3c4d5e6f7a",
      "personId": "a3f6d3e4-f5a6-7b8c-0d1e-2f3a4b5c6d7e",
      "spouseId": null,
      "marriageStatus": "single",
      "childIds": [],
      "branchId": "ba11b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "generation": 2
    }
  ]
}
```

**Sau khi base64:**
```
eyJ2ZXJzaW9uIjoiMS4wIiwiY3JlYXRlZEF0IjoiMjAyNi0wNi0wN1QxM...
```

File `.ftree` chứa đúng chuỗi base64 này, không có gì khác.

---

## Milestones

```
M1  Foundation & Types        ← làm trước, mọi thứ phụ thuộc vào đây
M2  tree-lib hoàn thiện       ← FamilyTree + collapse + StorageContext
M3  Storage adapters          ← WebAdapter + ElectronAdapter + IPC
M4  Shared App shell          ← WelcomeScreen + Toolbar + routing
M5  Person management         ← CRUD + date input (âm/dương)
M6  Search                    ← tìm tên, highlight node
M7  Export                    ← PNG + PDF
```

---

## M1 — Foundation & Types

**Mục tiêu**: Định nghĩa toàn bộ TypeScript types, tạo `emptyDocument()`, validate schema.

**Files cần tạo/sửa:**

```
packages/tree-lib/src/
  types.ts          ← tất cả interfaces (FtreeDocument, Person, FamilyUnit, ...)
  storage.ts        ← IStorageAdapter, StorageContext, useStorage()
  document.ts       ← emptyDocument(), validateDocument(), CURRENT_VERSION
  index.js          ← export thêm types mới
```

**Nội dung `document.ts`:**
```typescript
export const CURRENT_VERSION = '1.0'
export const MAX_PERSONS = 200

export function emptyDocument(): FtreeDocument {
  return {
    version: CURRENT_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clan: {
      id: crypto.randomUUID(),
      name: 'Gia phả mới',
      surname: '',
      currentHeadId: undefined,
      headHistory: [],
    },
    branches: [],
    persons: [],
    families: [],
  }
}

export function validateDocument(doc: unknown): doc is FtreeDocument {
  // Kiểm tra version, required fields
  // Trả về false nếu file bị corrupt hoặc sai format
}

export function encodeDocument(doc: FtreeDocument): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(doc))))
}

export function decodeDocument(b64: string): FtreeDocument {
  const doc = JSON.parse(decodeURIComponent(escape(atob(b64))))
  if (!validateDocument(doc)) throw new Error('File không hợp lệ hoặc bị lỗi')
  return doc
}
```

**Dependencies cần cài:**
```bash
cd packages/tree-lib && npm install lunar-date-vn
```

---

## M2 — tree-lib hoàn thiện

**Mục tiêu**: FamilyTree nhận `FtreeDocument` thay vì tree data thô, thêm collapse/expand.

**Thay đổi `FamilyTree.jsx`:**

```
Hiện tại:  FamilyTree({ data })          ← data là tree node thô
Mới:       FamilyTree({ document, collapsedIds, onToggleCollapse, onPersonClick })
```

Bên trong component: convert `FtreeDocument` → D3 hierarchy thay vì nhận trực tiếp.

**Collapse/expand:**
```typescript
// collapsedIds: Set<string> — tập FamilyUnit id đang bị collapse
// Node bị collapse: không render children, hiện badge "+N"

const root = d3.hierarchy(buildTreeData(document, collapsedIds), d => d.children)
```

**`buildTreeData(doc, collapsedIds)`** — hàm convert FtreeDocument → tree node:
```typescript
function buildTreeData(doc: FtreeDocument, collapsed: Set<string>) {
  // Tìm root family (generation = 1 hoặc không có parentFamilyId)
  // Đệ quy build children, bỏ qua nếu familyId trong collapsed
  // Tính "+N" = số descendants bị ẩn
}
```

**StorageContext** (đã spec trong design.md) — thêm vào `src/StorageContext.tsx`.

---

## M3 — Storage Adapters

### 3a. WebAdapter

File: `packages/web-app/src/adapters/WebAdapter.ts`
Code đã có đầy đủ trong design.md — implement theo đúng spec.

### 3b. ElectronAdapter

File: `packages/electron-app/src/renderer/src/adapters/ElectronAdapter.ts`
Code đã có đầy đủ trong design.md.

### 3c. Electron main process — IPC handlers mới

Thay thế toàn bộ IPC cũ (có mã hóa) bằng handlers mới (base64 plain):

```typescript
// packages/electron-app/src/main/index.js

ipcMain.handle('file:open', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Gia phả', extensions: ['ftree'] }],
    properties: ['openFile'],
  })
  if (canceled) return null
  const b64 = fs.readFileSync(filePaths[0], 'utf-8')
  return { path: filePaths[0], b64 }   // trả về b64 raw, renderer tự decode
})

ipcMain.handle('file:save', async (_, { path, b64 }) => {
  // Atomic write: ghi vào .tmp rồi rename
  const tmp = path + '.tmp'
  fs.writeFileSync(tmp, b64, 'utf-8')
  fs.renameSync(tmp, path)
})

ipcMain.handle('file:new', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: 'gia-pha.ftree',
    filters: [{ name: 'Gia phả', extensions: ['ftree'] }],
  })
  if (canceled) return null
  return filePath
})

ipcMain.handle('prefs:getRecent', () => loadPrefs().recentFiles)

ipcMain.handle('prefs:addRecent', (_, path) => {
  const prefs = loadPrefs()
  prefs.recentFiles = [
    { path, name: basename(path), openedAt: new Date().toISOString() },
    ...prefs.recentFiles.filter(f => f.path !== path),
  ].slice(0, 10)  // giữ 10 file gần nhất
  savePrefs(prefs)
})
```

**`prefs.json`** lưu ở `app.getPath('userData')/prefs.json`:
```json
{
  "recentFiles": [
    { "path": "/Users/nhan/Documents/nha-noi.ftree", "name": "nha-noi.ftree", "openedAt": "2026-06-07T10:00:00Z" }
  ]
}
```

### 3d. Preload — cập nhật contextBridge

```typescript
contextBridge.exposeInMainWorld('api', {
  openFile:     ()           => ipcRenderer.invoke('file:open'),
  saveFile:     (path, b64)  => ipcRenderer.invoke('file:save', { path, b64 }),
  newFile:      ()           => ipcRenderer.invoke('file:new'),
  getRecent:    ()           => ipcRenderer.invoke('prefs:getRecent'),
  addRecent:    (path)       => ipcRenderer.invoke('prefs:addRecent', path),
})
```

---

## M4 — Shared App Shell

**Mục tiêu**: `App.jsx` dùng chung, `WelcomeScreen`, `Toolbar`.

**Folder structure mới của web-app và electron-app renderer:**
```
src/
  adapters/         ← platform-specific
  components/
    WelcomeScreen/  ← màn hình đầu: mở file / tạo mới / gần đây
    Toolbar/        ← header: save, open, new, tìm kiếm, export
    PersonPanel/    ← sidebar xem thông tin 1 người
  App.jsx           ← shell chính, dùng chung
  main.tsx          ← inject adapter
```

**WelcomeScreen logic:**
```
Electron:
  ├── Có recent files → hiện danh sách, click để mở
  └── Luôn có: [Mở file...] [Tạo mới]

Web:
  ├── Có session cache → [Tiếp tục phiên trước] [Bỏ qua]
  └── Luôn có: [Mở file .ftree] [Tạo mới]
```

**Toolbar:**
```
[Tên file]   [Tìm kiếm...]   [Mở]  [Lưu]  [Xuất PNG]  [Xuất PDF]
```

---

## M5 — Person Management

### 5a. PersonPanel (read-only sidebar)

Click vào node → mở panel bên phải:

```
┌─────────────────────────┐
│  [●] Nguyễn Văn An      │
│  GS.TS                  │
│                         │
│  Sinh: 15/2/Canh Tý     │
│        (15/3/1900)      │
│  Mất:  20/4/1975        │
│  Nơi sinh: Đông Ngạc    │
│                         │
│  Học vị: Tiến sĩ 1960   │
│  Chức vụ: Hiệu trưởng   │
│           Chu Văn An     │
│                         │
│  Huân chương Lao động   │
│  hạng Nhì (1965)        │
│                         │
│  [Sửa]  [Xoá]          │
└─────────────────────────┘
```

### 5b. PersonForm (add/edit modal)

Các field chia tab:
- **Cơ bản**: displayName, giới tính, còn sống/đã mất
- **Tên**: birth, nickname, courtesy, taboo, sinograph
- **Ngày tháng**: birthDate, deathDate (âm/dương toggle)
- **Công trạng**: titles[], occupations[], achievements[]
- **Vai trò họ**: clanRoles[]

### 5c. DateInput component

```
[●Solar  ○Lunar]  [Năm: ____]  [Tháng: __]  [Ngày: __]

Khi chọn Lunar:
  → Hiện thêm checkbox [□ Tháng nhuận]
  → Hiện preview: "→ Dương lịch: 15/3/1900"
  → Hiện Can-Chi: "Canh Tý"
```

Dùng `lunar-date-vn`:
```typescript
import { LunarDate } from 'lunar-date-vn'

function lunarToSolar(lunar: LunarPartialDate): PartialDate {
  const ld = new LunarDate({ day: lunar.day, month: lunar.month, year: lunar.year })
  ld.init()
  const solar = ld.toSolarDate()
  return { year: solar.year, month: solar.month, day: solar.day, lunar, displayCalendar: 'lunar' }
}

function getCanChi(year: number): string {
  const ld = new LunarDate({ day: 1, month: 1, year })
  ld.init()
  return ld.getYearName()  // "Canh Tý", "Nhâm Thìn"...
}
```

### 5d. Thêm node vào cây

Hai cách:
1. **Thêm con**: click nút `+` trên một FamilyUnit → form tạo Person mới + tạo FamilyUnit mới
2. **Thêm vợ/chồng**: click nút `⊕` trên single node → gán spouse cho FamilyUnit hiện tại

---

## M6 — Search

**SearchBar** trong Toolbar:
- Input text → lọc `persons[]` theo `displayName` (và `names.birth`, `names.nickname`)
- Tìm không dấu: normalize cả query lẫn tên về ASCII trước khi so sánh
- Kết quả: danh sách dropdown → click để focus node trên cây (pan + highlight)

```typescript
function normalizeVi(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
```

Highlight node: thêm class `highlighted` → CSS ring màu vàng quanh circle.

---

## M7 — Export PNG / PDF

### PNG

Dùng `html-to-image` (lightweight, không cần canvas thủ công):
```typescript
import { toPng } from 'html-to-image'

async function exportPng(svgRef: SVGElement) {
  const dataUrl = await toPng(svgRef, { pixelRatio: 2 })  // 2x cho in rõ
  const a = document.createElement('a')
  a.download = 'gia-pha.png'
  a.href = dataUrl
  a.click()
}
```

### PDF

Dùng `jsPDF` + `html-to-image`:
```typescript
import jsPDF from 'jspdf'

async function exportPdf(svgRef: SVGElement) {
  const png = await toPng(svgRef, { pixelRatio: 2 })
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
  pdf.addImage(png, 'PNG', 10, 10, 277, 190)
  pdf.save('gia-pha.pdf')
}
```

**Thư viện cần cài:**
```bash
npm install html-to-image jspdf --workspace=packages/tree-lib
```

---

## Thứ tự implement

| Bước | Milestone | Prerequisite | Ước tính |
|------|-----------|-------------|---------|
| 1 | M1: types + schema | — | 1 ngày |
| 2 | M2: FamilyTree refactor | M1 | 2 ngày |
| 3 | M3: Storage adapters + IPC | M1 | 2 ngày |
| 4 | M4: App shell + WelcomeScreen | M2, M3 | 1 ngày |
| 5 | M5a: PersonPanel (read) | M4 | 1 ngày |
| 6 | M5b-c: PersonForm + DateInput | M5a | 2 ngày |
| 7 | M5d: Add/edit node trong cây | M5b | 1 ngày |
| 8 | M6: Search | M4 | 1 ngày |
| 9 | M7: Export PNG/PDF | M2 | 1 ngày |
| | **Tổng** | | **~12 ngày** |

---

## Dependency map

```
M1 (types)
  └── M2 (FamilyTree)
        └── M4 (App shell)
              ├── M5 (Person CRUD)
              │     └── M6 (Search)
              └── M7 (Export)
  └── M3 (Storage)
        └── M4 (App shell)
```

M2 và M3 có thể làm song song sau M1.
M5, M6, M7 có thể làm song song sau M4.

---

## Packages cần cài thêm

```bash
# tree-lib
npm install lunar-date-vn html-to-image jspdf --workspace=packages/tree-lib

# Không cần cài thêm gì cho web-app hay electron-app
# (các dep dùng từ tree-lib hoặc đã có)
```
