# Plan — Cây Gia Phả

## Triết lý: Local-first

Dữ liệu gia đình là riêng tư — lưu trên máy của chính mình, không phụ thuộc cloud.
Cloud là tùy chọn thêm sau, không phải yêu cầu để chạy được.

```
Phase 1 (local)   → Desktop + localhost
Phase 2 (cloud)   → Web app + sync
Phase 3 (mobile)  → iOS / Android
```

---

## Phase 1 — Local

### Kiến trúc

```
┌─────────────────────────────────────────┐
│              Desktop App                │
│                                         │
│  ┌───────────────┐   ┌───────────────┐  │
│  │  React + D3   │   │  Local API    │  │
│  │  (frontend)   │◄──│  (Electron /  │  │
│  │               │   │   Tauri)      │  │
│  └───────────────┘   └──────┬────────┘  │
│                             │           │
│                    ┌────────▼────────┐  │
│                    │  data.ftree     │  │
│                    │  (JSON mã hóa)  │  │
│                    └─────────────────┘  │
└─────────────────────────────────────────┘
```

### Desktop wrapper: Tauri

| | Tauri | Electron |
|---|---|---|
| Bundle size | ~10 MB | ~100 MB |
| RAM | Thấp | Cao |
| Frontend | React (giữ nguyên) | React (giữ nguyên) |
| Backend | Rust commands | Node.js |
| Ecosystem | Đang lớn | Rất lớn |

**Chọn Tauri** — nhẹ hơn đáng kể, React frontend giữ nguyên hoàn toàn.
Nếu không muốn build desktop ngay, có thể chạy `vite dev` + truy cập qua browser trước.

### Chạy không cần build desktop

```
npm run dev   →  localhost:5173   →  mở browser
```

Phù hợp cho giai đoạn phát triển, người dùng kỹ thuật.

---

## Lưu data: base64 JSON

### Format file — thống nhất giữa web và desktop

```
.ftree = base64( JSON.stringify(payload) )
```

Cùng một format cho cả hai platform — file tạo từ desktop mở được trên web và ngược lại.
Không cần mật khẩu, không cần mã hóa. Có thể thêm sau nếu cần.

### Cấu trúc JSON bên trong

Xem schema đầy đủ và ví dụ thực tế tại [impl-v1.md](impl-v1.md).

Tóm tắt cấu trúc:

```
{
  version, createdAt, updatedAt,
  clan:     { id (uuid), name, surname, origin, ... },
  branches: [ { id (uuid), name, type: "main"|"secondary", ... } ],
  persons:  [ { id (uuid), displayName, names, gender, birthDate, titles, ... } ],
  families: [ { id (uuid), personId, spouseId, childIds, generation, ... } ]
}
```

Tất cả `id` là **UUID v4** — `crypto.randomUUID()`, không cần thư viện.

### Encode / decode

```js
// Save
const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data))))

// Load
const data = JSON.parse(decodeURIComponent(escape(atob(b64))))
```

`encodeURIComponent` + `unescape` để xử lý đúng UTF-8 tiếng Việt.

### Web app — localStorage

```
localStorage['family-tree-data'] = base64 string
```

Nút **Import .ftree** → `<input type="file">` → đọc file → decode → render.
Nút **Export .ftree** → tạo Blob từ base64 string → download.

### Desktop app — file trên disk

File lưu tại bất kỳ đâu user chọn, extension `.ftree`.
App nhớ path file gần nhất trong `prefs.json` (userData).

### Backup

User tự copy file `.ftree` — có thể gửi qua Zalo, lưu USB, Google Drive.
File là plain text (base64) nên nhẹ, dễ chia sẻ.

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| UI | React + D3.js (đã có) |
| Desktop wrapper | Electron (đã có) |
| File I/O | Node.js (Electron IPC) |
| Data format | base64 JSON (.ftree) |
| Lịch âm dương | `lunar-date-vn` |
| Build tool | Vite + electron-vite |

---

## Roadmap

### Phase 1 — Local *(ưu tiên)*

- [ ] Mở / tạo file `.ftree` — không cần mật khẩu, format base64 JSON thống nhất với web
- [ ] User tự chọn nơi lưu file qua native dialog (`showSaveDialog` / `showOpenDialog`)
- [ ] **Nhớ file gần nhất** — lưu path vào `prefs.json` trong userData; lần sau mở app hiện sẵn; nếu file bị xóa/di chuyển thì báo lỗi và xóa khỏi danh sách
- [ ] Web: Import `.ftree` từ file, Export `.ftree` để chia sẻ / mở trên desktop
- [ ] Hiển thị cây (D3, đã demo)
- [ ] **Collapse / expand nhánh** — click để ẩn/hiện chi, badge `+N` cho nhánh bị ẩn
- [ ] Thêm / sửa / xóa thành viên (tên khai sinh, tên tự, tên húy, tên thường gọi, tên chữ Hán)
- [ ] **Ngày âm / dương lịch** — input hỗ trợ cả hai, dùng `lunar-date-vn` convert; lưu dương lịch làm canonical, giữ âm lịch gốc để hiển thị; hiển thị Can-Chi năm (Nhâm Thìn, Quý Mão)
- [ ] Giới hạn 200 người — báo lỗi khi vượt ngưỡng khi save
- [ ] Tìm kiếm tên
- [ ] Export backup
- [ ] **Export PNG / PDF** *(v1 late)* — in gia phả cho họp họ, in bảng vàng công trạng treo nhà thờ; quan trọng hơn khi có đủ dữ liệu âm lịch / Can-Chi
- [ ] Ảnh: placeholder SVG nam/nữ, chưa hỗ trợ upload (v2 khi có cloud)

> **Render strategy (xem render.md)**: SVG đủ dùng đến ~500 node. Collapse/expand là
> ưu tiên vì giải quyết cả UX lẫn performance mà không cần đổi stack. Nếu cây vượt
> 500 node thì thêm viewport culling; Canvas chỉ cần thiết từ 2.000 node trở lên.

### Phase 2 — Cloud sync *(sau)*

- [ ] Backend API (Node.js + PostgreSQL theo DB.md)
- [ ] Tài khoản người dùng
- [ ] Sync local ↔ cloud (last-write-wins hoặc merge)
- [ ] Web app public (`caygiapha.vn`)

### Phase 3 — Mobile *(sau)*

- [ ] React Native hoặc Capacitor (tái dùng React code)
- [ ] Sync qua cloud API

---

## Migration path local → cloud

Khi chuyển lên cloud, không cần viết lại — chỉ thay data layer:

```
Phase 1:  React  ──►  Tauri (file system)
Phase 2:  React  ──►  REST API  ──►  PostgreSQL
```

React component và D3 tree giữ nguyên.
Chỉ thay hàm `loadData()` / `saveData()` từ đọc file → gọi API.

---

## Rủi ro cần lưu ý

| Rủi ro | Giải pháp |
|--------|-----------|
| File corrupt | Luôn save vào file tạm, rename khi xong |
| Ảnh làm phình file | Lưu ảnh trong thư mục riêng cạnh `.ftree`, JSON chỉ lưu path tương đối |
| Conflict khi sync lên cloud | Dùng `updatedAt` timestamp, ưu tiên version mới hơn |

---

## Cross-clan linking *(Phase 2 — cloud)*

Mỗi `.ftree` là một dòng họ độc lập. Khi lên cloud, một `Person` có thể link sang dòng họ khác (ví dụ: vợ/chồng thuộc dòng họ khác có gia phả riêng):

```typescript
interface Person {
  // ... các field hiện tại
  linkedClanId?: string   // clan.id của dòng họ bên kia (cloud: resolve qua API)
}
```

UX: click vào người có `linkedClanId` → nút **"Xem gia phả nhà [họ] →"** → navigate sang clan đó.
Trên cloud mỗi clan có URL riêng. Trên local thì mở file `.ftree` tương ứng (Electron) hoặc bỏ qua (Web).
