# Storage — U3 Size Warning + U4 File System Access

## Bối cảnh

`WebAdapter` hiện tại lưu toàn bộ document vào `localStorage` và **tải file xuống mỗi lần save** — đây là design tạm thời cho MVP. Khi cây lớn, cần hai thứ:

1. **U3**: Cảnh báo hiệu suất khi có quá nhiều người
2. **U4**: Thay localStorage bằng File System Access API — lưu trực tiếp vào file của user, không download mỗi lần

---

## U3 — Size Warning

### Mục tiêu
Cảnh báo sớm khi cây đang lớn, nhắc user lưu file để đảm bảo dữ liệu không bị mất theo localStorage.

### Ngưỡng

| Ngưỡng | Giá trị | Hiển thị |
|--------|---------|----------|
| `WARN`  | 150 người | Badge header chuyển cam, banner dismissable |
| `LARGE` | 200 người | Badge header chuyển đỏ, banner mạnh hơn |

### UI

**Badge trong header** (cạnh tên clan):
```
Cây Nguyễn  [152 người ⚠]
```
- < 150: không hiện badge
- 150–199: `#f97316` (cam)
- ≥ 200: `#dc2626` (đỏ)

**Banner phía trên tree** (dismissable, 1 lần/session):
```
⚠ Cây đang có 152 người — nên lưu file để tránh mất dữ liệu nếu browser xoá cache.
[Lưu file ngay]  [Bỏ qua]
```

### Files thay đổi

| File | Loại | Nội dung |
|------|------|----------|
| `tree-lib/src/App.tsx` | EDIT | Derive `personCount`, truyền badge vào header, render banner |
| `tree-lib/src/App.tsx` | EDIT | State `sizeWarningDismissed`, handler `handleSaveFromBanner` |

### Không làm (scope giới hạn)
- Không disable "thêm người" — không có tier freemium nào hiện tại
- Không giới hạn render — chỉ cảnh báo

---

## U4 — File System Access API

### Mục tiêu

| Hiện tại (WebAdapter) | Sau U4 |
|-----------------------|--------|
| Save = download file mỗi lần | Save = ghi trực tiếp vào file user đang mở |
| Không có recent files | Recent files list với preview |
| Mất dữ liệu nếu browser clear cache | File là source of truth |
| `<input type="file">` để mở | FSA picker hoặc fallback `<input>` |

### Điều kiện

File System Access API được hỗ trợ trên Chrome/Edge (>= 2020), **không hỗ trợ Firefox**. Cần fallback.

```ts
const FSA_SUPPORTED = 'showOpenFilePicker' in window
```

### Data model — IndexedDB

Database: `ftree-db` v1  
Store: `recent-files`

```ts
interface RecentHandle {
  id: string                      // UUID
  name: string                    // clan.name tại thời điểm lưu
  handle: FileSystemFileHandle    // FSA handle
  openedAt: string                // ISO 8601
  personCount: number             // để hiện preview
}
```

`FileSystemFileHandle` serialize được vào IndexedDB (spec cho phép, Chrome hỗ trợ).

### WebAdapter mới — luồng xử lý

#### `openFile()`
```
if FSA_SUPPORTED:
  handle = await showOpenFilePicker({ types: [{ accept: { 'text/plain': ['.ftree'] } }] })
  file = await handle[0].getFile()
  doc = decodeDocument(await file.text())
  lưu handle vào IndexedDB (upsert theo handle.name)
  this.handle = handle[0]
else:
  // fallback hiện tại: <input type="file">
```

#### `save(doc)`
```
if this.handle:
  writable = await this.handle.createWritable()
  await writable.write(encodeDocument(doc))
  await writable.close()
  cập nhật IndexedDB (openedAt, personCount)
  cập nhật localStorage backup
else:
  // fallback: localStorage + download (như cũ)
```

#### `openRecentFile(id)`
```
record = lấy từ IndexedDB bằng id
perm = await record.handle.queryPermission({ mode: 'readwrite' })
if perm !== 'granted':
  perm = await record.handle.requestPermission({ mode: 'readwrite' })
if perm !== 'granted':
  throw new Error('Cần cấp quyền để mở file')
file = await record.handle.getFile()
doc = decodeDocument(await file.text())
this.handle = record.handle
```

#### `getRecentFiles()`
Đọc từ IndexedDB, sort by `openedAt` desc, trả về max 5.

#### `newFile()`
```
if FSA_SUPPORTED:
  handle = await showSaveFilePicker({ suggestedName: 'gia-pha.ftree', ... })
  this.handle = handle
  doc = emptyDocument()
  ghi doc vào file + lưu handle vào IndexedDB
else:
  // như cũ: set session, không lưu file ngay
```

### Interface changes — `IStorageAdapter`

```ts
export interface RecentFile {
  path: string          // Electron: file path; web: IDB record id
  name: string
  openedAt: string
  preview?: {
    personCount: number
  }
}

export interface IStorageAdapter {
  // ... (giữ nguyên các method hiện tại)

  // NEW — optional, web-only
  openRecentFile?(id: string): Promise<FtreeDocument>
}
```

`ElectronAdapter` không implement `openRecentFile` (Electron mở recent file qua native menu).

### `App.tsx` — changes

```ts
async function handleOpenRecent(id: string) {
  try {
    const d = storage.openRecentFile
      ? await storage.openRecentFile(id)
      : await storage.openFile()       // fallback cho Electron
    setDoc(d)
    setSelected(null)
  } catch (e) {
    if (e instanceof Error) alert(e.message)
  }
}
```

Truyền `onOpenRecent={handleOpenRecent}` vào welcome screen / recent files list.

### Welcome screen — recent files

Thêm list recent files vào màn hình welcome (hiện tại đã có `recentFiles` state trong App.tsx):

```
Mở gần đây
┌──────────────────────────────────┐
│ Họ Nguyễn Trí          52 người │  ← click → openRecentFile
│ 3 ngày trước                     │
├──────────────────────────────────┤
│ Dòng họ Lê             18 người │
│ 2 tuần trước                     │
└──────────────────────────────────┘
```

### localStorage vai trò sau U4

| Mục đích | Giữ không? |
|----------|------------|
| Session cache (crash recovery) | ✅ Vẫn ghi sau mỗi save |
| Primary storage khi không có FSA | ✅ Fallback |
| Primary storage khi có FSA handle | ❌ Không còn là source of truth |
| Theme preference | ✅ Không liên quan, giữ nguyên |

### Files thay đổi

| File | Loại | Nội dung |
|------|------|----------|
| `web-app/src/adapters/idb.ts` | NEW | IndexedDB helpers: `getRecentHandles`, `saveHandle`, `removeHandle` |
| `web-app/src/adapters/WebAdapter.ts` | REWRITE | FSA openFile/save/newFile + openRecentFile + getRecentFiles |
| `tree-lib/src/storage.ts` | EDIT | Thêm `preview?` vào `RecentFile`; thêm `openRecentFile?` optional vào interface |
| `tree-lib/src/App.tsx` | EDIT | `handleOpenRecent`, pass to welcome screen |
| Welcome screen component | EDIT | Hiện recent files list với preview |

### Thứ tự implement

1. `idb.ts` — IndexedDB helpers (pure utility, dễ test)
2. `WebAdapter.ts` — rewrite với FSA + fallback
3. `storage.ts` — mở rộng interface nhỏ
4. `App.tsx` — `handleOpenRecent`
5. Welcome screen — recent files UI

---

## Thứ tự làm giữa U3 và U4

Làm **U3 trước** — nhỏ, độc lập, không thay đổi interface gì. U4 là refactor lớn của WebAdapter, nên làm sau khi U3 đã stable.
