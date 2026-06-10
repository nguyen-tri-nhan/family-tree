# Enhancement v3 — Backlog

Tập hợp các tính năng đã được mention nhưng chưa implement, từ v1/v2 carryover + ý tưởng mới.

---

## Tổng quan

| § | Tên | Phụ thuộc | Độ khó | Ghi chú |
|---|-----|-----------|--------|---------|
| 1 | Custom xưng hô per-pair | — | Trung bình | Carryover từ v2 §3 |
| 2 | Tag Thủy Tổ / Khai Tổ | — | Thấp | User-designated annotation |
| 3 | Ông Cố / Bà Cố + nội/ngoại (genDelta=3) | 2a done | Thấp | Sau khi có nội/ngoại từ v2 |
| 4 | About / Tác giả | — | Thấp | Modal hoặc hash-routed page |
| 5 | Ảnh cá nhân | local (remote URL) | Trung bình | Avatar trên node; cloud upload → backlog C1 |
| 6 | Recent files trên web | — | Thấp | File System Access API |
| 7 | Highlight path khi node bị collapse | — | Trung bình | Node không có trong posRef → expand hoặc scroll |
| 8 | UI warning giới hạn 200 người | — | Thấp | Hiện chỉ check khi save, không báo UI |
| 9 | Multi-root / nhiều dòng họ | lớn | Cao | Chỉ render root đầu tiên hiện tại |
| 10 | Cross-clan link | ☁ Cloud — xem backlog C2 | Rất cao | Cần backend/auth |
| 11 | Điều khoản sử dụng | — | Thấp | Xem [terms.md](terms.md) |
| 12 | Quiz trắc nghiệm xưng hô | — | Trung bình | Xem [quiz.md](quiz.md) |

---

## §1. Custom xưng hô

Hai cấp độ: **per-pair** (1 cặp người cụ thể) và **clan-wide rule** (áp dụng cho cả dòng họ theo loại quan hệ).

### Vấn đề

- Per-pair: gia đình muốn gọi tên riêng cho 1 người cụ thể (ví dụ: bố dượng gọi là "Bố Tâm")
- Clan-wide: cả dòng họ dùng cách gọi khác với mặc định — ví dụ gốc Hoa gọi "Nội" thay "Ông nội", hoặc muốn đổi tất cả genDelta=3 thành "Ông cố / Bà cố" thay vì "Cụ"

### Data model

```ts
// Per-pair override — ưu tiên cao nhất
interface KinshipOverride {
  viewerId:   string
  targetId:   string
  label:      string
  selfLabel?: string
}

// Clan-wide rule — match theo điều kiện, áp dụng cho mọi cặp thoả
interface KinshipRule {
  id:          string
  // Điều kiện match (tất cả phải thoả — AND logic):
  genDelta?:   number           // ví dụ: 3 → chỉ áp dụng cho genDelta=3
  baseLabel?:  string           // match label tự động hiện tại (ví dụ: 'Cụ')
  viaMother?:  boolean          // nội (false) hay ngoại (true)
  gender?:     'male' | 'female'
  // Override:
  label:       string           // label mới
  selfLabel?:  string
}

interface FtreeDocument {
  // ...
  kinshipOverrides?: KinshipOverride[]
  kinshipRules?:     KinshipRule[]
}
```

### Thứ tự ưu tiên trong `computeKinship`

```
1. kinshipOverrides  — per-pair (exact match viewerId + targetId)
2. kinshipRules      — clan-wide (match theo điều kiện)
3. Auto-computed     — kết quả tính toán hiện tại
```

### Ví dụ clan-wide rule

```jsonc
// Đổi tất cả "Cụ" (genDelta=3, male) → "Ông cố"
{ "id": "r1", "genDelta": 3, "gender": "male",   "label": "Ông cố" }
{ "id": "r2", "genDelta": 3, "gender": "female", "label": "Bà cố"  }

// Dòng họ gốc Hoa: đổi Ông nội → "Nội"
{ "id": "r3", "baseLabel": "Ông nội", "label": "Nội" }
```

### UI

- **KinshipDrawer**: nút ✏ bên cạnh label → inline edit → lưu thành per-pair override
- **ClanForm** (⚙ settings): tab "Xưng hô" → quản lý danh sách `kinshipRules` (thêm/sửa/xoá)
- Rules hiển thị dạng bảng: Điều kiện | Label mới | Xoá

---

## §2. Tag vai trò đặc biệt

### Các role

| Role | Ý nghĩa | Ghi chú |
|------|---------|---------|
| `thuytoc` | Thủy Tổ | Tổ tiên khai lập dòng họ — trang nghiêm, không tự động gán |
| `khaito` | Khai Tổ | Người đầu tiên đến vùng đất mới lập nghiệp |
| `truongboi` | Trưởng Bối | Người cao tuổi nhất / bậc trưởng thượng đang còn sống |
| `truonghọ` | Trưởng Họ | Đại diện toàn bộ dòng họ (họ = surname group) |
| `truongtoc` | Trưởng Tộc | Đại diện một chi/ngành trong dòng họ |

**Phân biệt Trưởng Họ vs Trưởng Tộc**: Trưởng Họ quản lý toàn bộ dòng họ (ví dụ: họ Nguyễn ở một làng), Trưởng Tộc quản lý một ngành/chi cụ thể. Một cây gia phả có thể có 1 Trưởng Họ và nhiều Trưởng Tộc.

### Thiết kế

```ts
type PersonRole = 'thuytoc' | 'khaito' | 'truongboi' | 'truonghọ' | 'truongtoc'

interface Person {
  // ...
  roles?: PersonRole[]   // array để 1 người có thể giữ nhiều vai trò
}
```

Dùng `roles[]` thay vì `role?` đơn lẻ vì một người có thể vừa là Trưởng Họ vừa là Trưởng Tộc ngành trưởng.

### UI — node trên cây

Mỗi role có badge icon riêng, hiển thị góc trên-phải của node:

| Role | Badge |
|------|-------|
| Thủy Tổ / Khai Tổ | ★ (vàng) |
| Trưởng Bối | 長 (xanh đậm) |
| Trưởng Họ | 族 (đỏ) |
| Trưởng Tộc | 宗 (cam) |

### UI — PersonForm

Dropdown multi-select "Vai trò đặc biệt" trong PersonForm (hoặc tab riêng nếu form dài).

### UI — PersonPanel

Hiển thị chip/badge tên role nổi bật bên dưới tên người.

---

## §3. Ông Cố / Bà Cố + phân biệt nội/ngoại (genDelta=3)

### Vấn đề

Hiện tại `genDelta=3` trả về "Cụ" không phân biệt giới tính hoặc nội/ngoại. Theo tiếng Việt miền Bắc trực hệ:
- Cụ nội / Cụ ngoại (phân biệt nhánh)
- Một số gia đình gọi là "Ông cố" / "Bà cố" (phổ biến ở miền Nam/Trung)

### Phụ thuộc

Cần §2a (nội/ngoại BFS) từ enhancement-v2 hoàn thành trước.

### Thiết kế

Sau khi có `isMaternal` từ v2:

```ts
// genDelta === 3:
if (isMaternal) {
  label = g(tg, 'Cụ ngoại', 'Cụ ngoại')
  // south: 'Cố ngoại'
} else {
  label = g(tg, 'Cụ nội', 'Cụ nội')
  // south: 'Cố nội'
}
```

Hoặc nếu không muốn "nội/ngoại" ở genDelta=3 (nhiều gia đình chỉ gọi "Cụ"):
- Thêm option cấu hình per-document: `showNestingBeyondGrandparents: boolean`

---

## §4. About / Tác giả

### Thông tin tác giả

| Field | Value |
|-------|-------|
| Tên | Nguyễn Trí Nhân |
| Email | nguyentrinhan.dev@gmail.com |
| Website | https://nguyen-tri-nhan.github.io |
| LinkedIn | https://www.linkedin.com/in/nguyen-tri-nhan |

### Approach: Hash routing

Dùng `createHashRouter` từ `react-router-dom`:
- Hash URL (`/#/`, `/#/about`) hoạt động giống nhau trên **web** lẫn **Electron** — Electron load `file://` nên không có server, chỉ hash fragment là đủ
- `BrowserRouter` sẽ lỗi trên Electron vì cần server rewrite URL

### Cấu trúc file

```
packages/tree-lib/src/
  pages/
    AboutPage.tsx          ← trang About
  Router.tsx               ← createHashRouter, export AppRouter
  App.tsx                  ← thêm nav link "ⓘ" trên header

packages/web-app/src/
  App.tsx                  ← đổi <App> → <AppRouter>, truyền welcomeFooter qua RouterProvider

packages/electron-app/src/renderer/src/
  App.tsx                  ← đổi <App> → <AppRouter>
```

### Router.tsx

```tsx
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { App } from './App'
import { AboutPage } from './pages/AboutPage'

const router = createHashRouter([
  { path: '/',      element: <App /> },
  { path: '/about', element: <AboutPage /> },
])

export function AppRouter(props: AppProps) {
  // props (welcomeFooter, headerPadding, ...) được pass xuống App qua context hoặc RouterProvider future API
  return <RouterProvider router={router} />
}
```

Vì `AppProps` cần reach vào route `/`, dùng một context nhỏ để pass props xuống:

```tsx
const AppPropsCtx = React.createContext<AppProps>({})

export function AppRouter(props: AppProps) {
  return (
    <AppPropsCtx.Provider value={props}>
      <RouterProvider router={router} />
    </AppPropsCtx.Provider>
  )
}

// Trong App.tsx:
export function App() {
  const props = useContext(AppPropsCtx)
  // ...
}
```

### App.tsx — thêm nav link

Trong header, sau các action buttons:

```tsx
import { useNavigate } from 'react-router-dom'

// trong component:
const navigate = useNavigate()

// trong JSX:
<button onClick={() => navigate('/about')} style={btn(false)} title="Về ứng dụng">ⓘ</button>
```

### AboutPage.tsx — nội dung

```
┌─────────────────────────────────┐
│  🌳  Cây Gia Phả                │
│  v1.x.x                        │
│                                 │
│  Ứng dụng quản lý và hiển thị  │
│  phả hệ gia đình.               │
│                                 │
│  Tác giả                        │
│  Nguyễn Trí Nhân               │
│  ✉  nguyentrinhan.dev@gmail.com │
│  🌐  nguyen-tri-nhan.github.io  │
│  in  linkedin.com/in/...        │
│                                 │
│  [← Quay lại]                  │
└─────────────────────────────────┘
```

Version lấy từ `import pkg from '../../package.json'` (với `resolveJsonModule: true` trong tsconfig).

### Phụ thuộc mới

- `react-router-dom` (và `@types/react-router-dom`) vào `packages/tree-lib/package.json`

### Lưu ý

- `index.ts` của tree-lib export `AppRouter` thay thế (hoặc thêm bên cạnh) `App`
- Web-app và electron-app import `AppRouter` từ `@family-tree/tree-lib`
- `AboutPage` không cần access vào FamilyTree state → component đơn giản, fully static

---

## §5. Ảnh cá nhân

### Vấn đề

Node hiện chỉ hiển thị icon SVG mặc định (người nam/nữ). Ảnh thực của người trong gia phả tăng giá trị cảm xúc đáng kể.

### Thiết kế — remote URL (D2, không cần cloud)

```ts
interface Person {
  // ...
  avatarUrl?: string  // remote URL do user tự cung cấp (Google Drive, Imgur, v.v.)
}
```

Trong node: nếu có `avatarUrl`, thay icon bằng `<image>` SVG với clip-path tròn.

### Lưu ý

- Không nhúng ảnh base64 vào file `.ftree` (tăng kích thước file)
- User tự host ảnh hoặc dùng link public từ Google Drive / GitHub / Imgur
- Upload server: xem **backlog C1** (Cloud / Phase 2)

---

## §6. Recent files trên web

### Vấn đề

`WebStorageAdapter.getRecentFiles()` trả về `[]` vì web không có filesystem access. Người dùng phải "Mở file" thủ công mỗi lần.

### Giải pháp

Dùng **File System Access API** (Chrome 86+, Edge 86+):
- `showOpenFilePicker()` trả về `FileSystemFileHandle`
- Có thể serialize handle bằng `IndexedDB` (handle persist across sessions với `queryPermission`)
- Khi reload: request lại permission → nếu granted, load file ngay

### Fallback

Browser không support File System Access API → giữ behavior hiện tại (mở file mỗi lần).

### Scope

Chỉ ảnh hưởng `WebStorageAdapter`. ElectronAdapter đã có recent files qua `prefs.json`.

---

## §7. Collapsed node — hai vấn đề

### §7a. Highlight path bị đứt khi node collapse

**Vấn đề**: `posRef.current` không có vị trí node đang bị ẩn → path vẽ lên cây bị thiếu đoạn.

**Giải pháp**: Khi `highlightPath` thay đổi, auto-expand các family cần thiết:

```ts
useEffect(() => {
  if (!highlightPath) return
  const missing = highlightPath.filter(id => !posRef.current.has(id))
  if (missing.length === 0) return
  // Với mỗi missing id: tìm familyId chứa nó (childToParentFamily hoặc familyByPerson)
  // rồi remove khỏi collapsed set
  setCollapsed(prev => {
    const next = new Set(prev)
    missing.forEach(id => {
      const pf = idx.childToParentFamily.get(id)
      if (pf) next.delete(pf.id)
    })
    return next
  })
}, [highlightPath])
```

### §7b. Không chọn được node đang bị collapse để so sánh quan hệ

**Vấn đề**: Compare mode yêu cầu click trực tiếp lên node. Node đang ẩn dưới badge `+N` → không click được.

**Giải pháp**: Cho phép chọn người thứ 2 qua **SearchBar** thay vì chỉ click tree.

Hai thay đổi nhỏ:
1. Khi đang ở compare mode, SearchBar hiển thị placeholder *"Tìm người để so sánh..."* thay vì placeholder thông thường
2. Khi chọn kết quả từ SearchBar trong compare mode → trigger `handlePersonClick(id)` như thể đã click node đó trên cây (sẽ mở KinshipDrawer) — không cần expand cây

```ts
// Trong App.tsx:
<SearchBar
  doc={doc}
  placeholder={compareMode.active ? 'Tìm người để so sánh…' : undefined}
  onSelect={id => {
    if (compareMode.active) {
      handlePersonClick(id)   // reuse existing logic
    } else {
      setHighlight(id)
    }
  }}
/>
```

Không cần auto-expand; người dùng thấy kết quả kinship mà không cần tree phải mở rộng.

---

## §8. UI warning giới hạn 200 người ✅ Approach confirmed

### Giải pháp

- `persons.length >= 180` → badge cam trên toolbar: *"180/200 người"*
- `persons.length >= 200` → badge đỏ + disable các nút "Thêm người/Thêm con/Thêm vợ/chồng" trong PersonPanel và PersonForm
- Tooltip khi hover badge: *"Bản miễn phí giới hạn 200 người. Liên hệ để nâng cấp."*
- Không cần `IssuePanel` entry (không phải data issue, là giới hạn plan)

### Files cần sửa

- `App.tsx` — tính `personCount`, truyền xuống header badge
- `PersonPanel.tsx` — disable Add buttons khi `atLimit`
- `PersonForm.tsx` — guard submit khi `atLimit`

---

## §9. Multi-root / nhiều dòng họ

### Vấn đề

`buildTree()` trong `FamilyTree.tsx` chỉ render từ root đầu tiên (family không có parent). Nếu doc có nhiều gốc (ví dụ: bên nội + bên ngoại đều có data), chỉ một bên được hiển thị.

### Giải pháp

- Detect tất cả root families
- Render nhiều cây song song hoặc cho phép user chọn root
- Phức tạp về layout (nhiều cây song song cần spacing hợp lý)

### Scope

Lớn, dành cho version sau khi có nhiều user feedback hơn.

---

## §10. Cross-clan link

→ **Xem backlog C2** (Cloud / Phase 2).

Yêu cầu cloud infrastructure, authentication, shared document ID. Không trong scope bản local/desktop hiện tại.

---

---

## Thứ tự ưu tiên gợi ý

| # | § | Lý do |
|---|---|-------|
| 1 | §4 About | ✅ Done |
| 2 | §11 Điều khoản | Cần trước khi distribute rộng |
| 3 | §3 Ông Cố/Bà Cố | Phụ thuộc v2 §2a — làm sau khi nội/ngoại xong |
| 4 | §2 Tag Thủy Tổ | Độc lập, nhỏ |
| 5 | §6 Recent files web | Cải thiện UX đáng kể cho web |
| 6 | §7 Highlight collapse | Bug UX — nên fix |
| 7 | §8 Warning 200 người | Nhỏ, cần cho freemium |
| 8 | §1 Custom xưng hô | Phức tạp hơn, làm sau các items nhỏ |
| 9 | §5 Ảnh (remote URL) | Không cần cloud, user tự host link |
| 10 | §9 Multi-root | Lớn, để sau |
| 11 | §12 Quiz | Sau khi kinship ổn định |
| — | §10 Cross-clan | ☁ Cloud — xem backlog C2 |
