# Design — Storage Adapter Pattern

## Vấn đề

Web app và Electron app đang phát triển riêng biệt, mỗi bên gọi storage theo cách khác nhau:

```
web-app/App.jsx          electron-app/App.jsx
  localStorage.getItem()   window.api.loadData()
  localStorage.setItem()   window.api.saveData()
  <input type="file">      window.api.openFile()
  <a download>             window.api.saveFile()
```

`FamilyTree` component trong `tree-lib` không quan tâm đến storage — nhưng `App.jsx` ở mỗi platform thì lại viết logic storage khác nhau hoàn toàn. Kết quả: duplicate code, logic drift theo thời gian.

---

## Giải pháp: Storage Adapter (Ports & Adapters)

Định nghĩa một **interface chung**, mỗi platform implement riêng, component chỉ biết đến interface.

```
┌─────────────────────────────────────────────┐
│              React Components               │
│         (App.jsx, Toolbar, v.v.)            │
│                    │                        │
│           useStorage() hook                 │
│                    │                        │
│         IStorageAdapter (interface)         │
└────────────┬────────────────┬───────────────┘
             │                │
   ┌──────────▼──────┐  ┌─────▼──────────────┐
   │  WebAdapter     │  │  ElectronAdapter   │
   │  localStorage   │  │  window.api (IPC)  │
   │  + file input   │  │  + native dialog   │
   └─────────────────┘  └────────────────────┘
```

---

## Interface

```typescript
// packages/tree-lib/src/storage.ts

export interface RecentFile {
  path: string
  name: string        // tên file không có đường dẫn
  openedAt: string    // ISO timestamp
}

export interface IStorageAdapter {
  readonly platform: 'web' | 'electron'

  // Có đang mở file/session nào không?
  hasSession(): boolean

  // Load data từ session hiện tại
  // Web:      đọc localStorage
  // Electron: đọc file .ftree hiện tại
  load(): Promise<FtreeDocument>

  // Ghi data vào session hiện tại
  // Web:      ghi localStorage
  // Electron: ghi file .ftree hiện tại (atomic write)
  save(data: FtreeDocument): Promise<void>

  // Mở file picker và load
  // Web:      <input type="file"> → đọc .ftree
  // Electron: showOpenDialog → đọc .ftree
  openFile(): Promise<FtreeDocument>

  // Tạo/khởi tạo session mới với document rỗng
  // Web:      clear localStorage, set empty doc
  // Electron: showSaveDialog → tạo file .ftree mới
  newFile(): Promise<void>

  // Export file ra ngoài
  // Web:      tạo Blob → trigger download
  // Electron: showSaveDialog (copy) hoặc no-op nếu đã có file
  exportFile(data: FtreeDocument): Promise<void>

  // Danh sách file gần đây
  // Web:      trả về [] (không có khái niệm file path)
  // Electron: đọc prefs.json trong userData
  getRecentFiles(): Promise<RecentFile[]>
}
```

---

## Web Implementation

`.ftree` là nguồn dữ liệu chính. `localStorage` chỉ là session cache để restore nếu đóng tab.

```typescript
// packages/web-app/src/adapters/WebAdapter.ts

import type { IStorageAdapter, RecentFile } from '@family-tree/tree-lib'

const CACHE_KEY = 'family-tree-session-cache'

function decode(b64: string): FtreeDocument {
  return JSON.parse(decodeURIComponent(escape(atob(b64))))
}

function encode(data: FtreeDocument): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))))
}

export class WebAdapter implements IStorageAdapter {
  readonly platform = 'web' as const
  private sessionData: FtreeDocument | null = null

  hasSession(): boolean {
    // Có data trong memory hoặc còn cache chưa expired
    return this.sessionData !== null || localStorage.getItem(CACHE_KEY) !== null
  }

  async load(): Promise<FtreeDocument> {
    if (this.sessionData) return this.sessionData
    const b64 = localStorage.getItem(CACHE_KEY)
    if (!b64) throw new Error('Không có dữ liệu')
    this.sessionData = decode(b64)
    return this.sessionData
  }

  async save(data: FtreeDocument): Promise<void> {
    // Lưu cache (để restore nếu đóng tab)
    localStorage.setItem(CACHE_KEY, encode(data))
    this.sessionData = data
    // Download .ftree về máy — đây là "save" thật sự trên web
    await this.exportFile(data)
  }

  async openFile(): Promise<FtreeDocument> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.ftree'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return reject(new Error('Không chọn file'))
        const b64 = await file.text()
        const data = decode(b64)
        localStorage.setItem(CACHE_KEY, b64)  // cache session
        this.sessionData = data
        resolve(data)
      }
      input.click()
    })
  }

  async newFile(): Promise<void> {
    localStorage.removeItem(CACHE_KEY)
    this.sessionData = null
  }

  async exportFile(data: FtreeDocument): Promise<void> {
    const b64 = encode(data)
    const blob = new Blob([b64], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gia-pha.ftree`
    a.click()
    URL.revokeObjectURL(url)
  }

  async getRecentFiles(): Promise<RecentFile[]> {
    return []  // web không lưu file path
  }
}
```

---

## Electron Implementation

```typescript
// packages/electron-app/src/renderer/src/adapters/ElectronAdapter.ts

import type { IStorageAdapter, RecentFile } from '@family-tree/tree-lib'

export class ElectronAdapter implements IStorageAdapter {
  readonly platform = 'electron' as const
  private currentPath: string | null = null

  hasSession(): boolean {
    return this.currentPath !== null
  }

  async load(): Promise<FtreeDocument> {
    if (!this.currentPath) throw new Error('Chưa mở file')
    return window.api.loadData(this.currentPath)
  }

  async save(data: FtreeDocument): Promise<void> {
    if (!this.currentPath) throw new Error('Chưa mở file')
    await window.api.saveData(this.currentPath, data)
  }

  async openFile(): Promise<FtreeDocument> {
    const result = await window.api.openFile()   // showOpenDialog → trả về { path, data }
    if (!result) throw new Error('Người dùng huỷ')
    this.currentPath = result.path
    await window.api.addRecentFile(result.path)
    return result.data
  }

  async newFile(): Promise<void> {
    const path = await window.api.saveFile()     // showSaveDialog → trả về path
    if (!path) throw new Error('Người dùng huỷ')
    this.currentPath = path
    await window.api.saveData(path, emptyDocument())
    await window.api.addRecentFile(path)
  }

  async exportFile(data: FtreeDocument): Promise<void> {
    // Với Electron, save đã ghi vào file thật → export là no-op
    // Hoặc showSaveDialog để copy sang vị trí khác
    await this.save(data)
  }

  async getRecentFiles(): Promise<RecentFile[]> {
    return window.api.getRecentFiles()
  }
}
```

---

## React Integration — Context + Hook

```typescript
// packages/tree-lib/src/StorageContext.tsx

import { createContext, useContext } from 'react'
import type { IStorageAdapter } from './storage'

const StorageContext = createContext<IStorageAdapter | null>(null)

export const StorageProvider = StorageContext.Provider

export function useStorage(): IStorageAdapter {
  const adapter = useContext(StorageContext)
  if (!adapter) throw new Error('StorageProvider missing')
  return adapter
}
```

**Web app — inject WebAdapter:**

```tsx
// packages/web-app/src/main.tsx

import { WebAdapter } from './adapters/WebAdapter'
import { StorageProvider } from '@family-tree/tree-lib'

const adapter = new WebAdapter()

createRoot(document.getElementById('root')!).render(
  <StorageProvider value={adapter}>
    <App />
  </StorageProvider>
)
```

**Electron app — inject ElectronAdapter:**

```tsx
// packages/electron-app/src/renderer/src/main.tsx

import { ElectronAdapter } from './adapters/ElectronAdapter'
import { StorageProvider } from '@family-tree/tree-lib'

const adapter = new ElectronAdapter()

createRoot(document.getElementById('root')!).render(
  <StorageProvider value={adapter}>
    <App />
  </StorageProvider>
)
```

**App.jsx — chỉ biết đến interface, không biết platform:**

```tsx
// Dùng chung cho cả web và electron
export default function App() {
  const storage = useStorage()
  const [data, setData] = useState<FtreeDocument | null>(null)

  useEffect(() => {
    if (storage.hasSession()) {
      storage.load().then(setData).catch(console.error)
    }
  }, [])

  async function handleSave() {
    if (!data) return
    await storage.save(data)
  }

  async function handleOpen() {
    const doc = await storage.openFile()
    setData(doc)
  }

  async function handleNew() {
    await storage.newFile()
    setData(emptyDocument())
  }

  return (
    <>
      <Toolbar onSave={handleSave} onOpen={handleOpen} onNew={handleNew}
               platform={storage.platform} />
      {data ? <FamilyTree data={data} /> : <WelcomeScreen storage={storage} />}
    </>
  )
}
```

---

## Cấu trúc package sau khi áp dụng

```
packages/
├── tree-lib/
│   └── src/
│       ├── FamilyTree.jsx        ← visualization
│       ├── storage.ts            ← IStorageAdapter interface + StorageContext
│       └── index.js              ← export tất cả
│
├── web-app/
│   └── src/
│       ├── adapters/
│       │   └── WebAdapter.ts     ← implement IStorageAdapter
│       ├── App.jsx               ← dùng useStorage(), không biết platform
│       └── main.tsx              ← inject WebAdapter
│
└── electron-app/
    └── src/renderer/src/
        ├── adapters/
        │   └── ElectronAdapter.ts ← implement IStorageAdapter
        ├── App.jsx               ← cùng App.jsx với web (hoặc import từ tree-lib)
        └── main.tsx              ← inject ElectronAdapter
```

---

## Web cũng đọc .ftree — gap còn lại là gì?

Nếu web có thể mở file `.ftree` qua `<input type="file">`, thì hai platform chỉ còn **một điểm khác nhau**:

| | Web | Electron |
|---|---|---|
| Mở file | `<input type="file">` | native dialog |
| Đọc .ftree | ✓ | ✓ |
| Lưu in-place | ✗ (không ghi đè file gốc được) | ✓ |
| Save = | download file mới | overwrite file cũ |
| Nhớ path | ✗ | ✓ (prefs.json) |

**localStorage trở thành session cache** — không phải primary storage:
- Dùng để restore nếu user lỡ đóng tab
- Khi mở lại, hỏi "Tiếp tục phiên trước?" thay vì tự load
- `.ftree` file là nguồn dữ liệu duy nhất, giống desktop

**Web flow mới (file-centric, giống desktop hơn):**
```
Mở app
  ├── Có session cache → [Tiếp tục] hoặc [Mở file khác]
  └── Không có gì     → [Mở file .ftree] | [Tạo mới]

Sửa xong → [Save] → download file .ftree mới về máy
```

Pattern này giống Figma web — cùng format file với desktop, chỉ khác cơ chế ghi.

---

## Đánh giá pattern

**Ưu điểm:**
- `App.jsx` dùng chung hoàn toàn giữa 2 platform
- Thêm platform mới chỉ cần implement `IStorageAdapter`, không đụng component
- Test dễ: mock `IStorageAdapter` thay vì mock `localStorage` hay `window.api`
- `.ftree` là single source of truth — không có data sống ở 2 nơi

**Nhược điểm / lưu ý:**
- `save()` trên web = download file mới — user phải quản lý file trong thư mục Downloads
- `openFile()` trên web dùng DOM hack (`input.click()`) — không đẹp nhưng hoạt động đúng
- Interface cần giữ ổn định; thêm method mới phải implement ở **cả hai** adapter

**Kết luận:** Pattern này ổn. Web và Electron dùng chung mọi thứ trừ cơ chế đọc/ghi file.

---

## Những gì KHÔNG nên đưa vào IStorageAdapter

- Logic render cây (thuộc FamilyTree)
- Validate data (thuộc domain model)
- Format hiển thị tên, ngày tháng (thuộc UI component)

Adapter chỉ làm một việc: **đọc và ghi FtreeDocument**.
