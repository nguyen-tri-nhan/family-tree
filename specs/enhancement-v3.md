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
| 5 | Ảnh cá nhân | cloud hoặc local | Trung bình | Avatar trên node |
| 6 | Recent files trên web | — | Thấp | File System Access API |
| 7 | Highlight path khi node bị collapse | — | Trung bình | Node không có trong posRef → expand hoặc scroll |
| 8 | UI warning giới hạn 200 người | — | Thấp | Hiện chỉ check khi save, không báo UI |
| 9 | Multi-root / nhiều dòng họ | lớn | Cao | Chỉ render root đầu tiên hiện tại |
| 10 | Cross-clan link | Phase 2 cloud | Rất cao | Dành cho cloud version |
| 11 | Điều khoản sử dụng | — | Thấp | Xem [terms.md](terms.md) |
| 12 | Quiz trắc nghiệm xưng hô | — | Trung bình | Xem [quiz.md](quiz.md) |

---

## §1. Custom xưng hô per-pair

### Vấn đề

Xưng hô tự động đúng cho đại đa số, nhưng có trường hợp gia đình muốn dùng cách gọi riêng (ví dụ: gọi ông nội là "Ông Ba" theo truyền thống, hoặc family có gốc Hoa gọi khác, hoặc bố dượng/mẹ kế muốn gọi theo tên khác).

### Thiết kế

Thêm field `customKinship?: Record<string, string>` vào `Person`:

```ts
interface Person {
  // ...existing fields...
  customKinship?: Record<string, string>  // { [viewerId]: "cách gọi tuỳ chỉnh" }
}
```

Hoặc tách thành một collection riêng ở cấp document:

```ts
interface FtreeDocument {
  // ...
  kinshipOverrides?: Array<{
    viewerId:  string  // người xem
    targetId:  string  // người được gọi
    label:     string  // cách gọi tuỳ chỉnh
    selfLabel: string  // target gọi lại viewer là gì
  }>
}
```

### UI

- Trong `KinshipDrawer`, thêm nút "Tuỳ chỉnh" bên cạnh label
- Hoặc trong `PersonPanel`, tab "Xưng hô" với danh sách override

### Logic

Trong `computeKinship`, kiểm tra `kinshipOverrides` trước; nếu có override thì return trực tiếp, bỏ qua tính toán tự động.

---

## §2. Tag Thủy Tổ / Khai Tổ

### Vấn đề

Root node trong data không nhất thiết là Thủy Tổ thực sự (có thể chỉ là ông cao nhất *đã biết*). Nhãn "Thủy Tổ" / "Khai Tổ" mang ý nghĩa trang nghiêm, không nên tự động gán.

### Thiết kế

Thêm field `role?: 'thuytoc' | 'khaito' | 'truongboi'` vào `Person` (hoặc tag array).

```ts
interface Person {
  // ...
  role?: 'thuytoc' | 'khaito' | 'truongboi'
}
```

### UI

- Trong `PersonForm`, dropdown "Vai trò đặc biệt": Không có / Thủy Tổ / Khai Tổ / Trưởng Bối
- Trong node trên cây: badge/icon nhỏ đặc biệt (ví dụ: ☆ hoặc màu viền khác)
- Trong `PersonPanel`: hiển thị nhãn nổi bật

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

### Thiết kế v3 (cloud URL)

```ts
interface Person {
  // ...
  avatarUrl?: string  // remote URL (https://...) hoặc data URI
}
```

Trong node: nếu có `avatarUrl`, thay icon bằng `<image>` SVG với clip-path tròn.

### Lưu ý

- File `.ftree` là JSON mã hóa → không nhúng ảnh base64 trực tiếp (tăng kích thước file)
- V3: chỉ hỗ trợ remote URL (user tự host hoặc dùng Google Drive public link)
- V4+: upload + lưu trữ cloud kèm file tree

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

## §7. Highlight path khi node bị collapse

### Vấn đề

Khi `KinshipDrawer` hiển thị path giữa hai người, nếu một node trong path đang bị collapse (ẩn), `posRef.current` không có vị trí của node đó → path highlight bị skip silently, người dùng thấy đường đứt quãng hoặc không có gì.

### Giải pháp — Option A (auto-expand)

Khi `highlightPath` thay đổi, nếu có node trong path không có trong `posRef`, tự động expand các ancestor cần thiết để path hiển thị đủ.

```ts
useEffect(() => {
  if (!highlightPath) return
  const missing = highlightPath.filter(id => !posRef.current.has(id))
  if (missing.length > 0) {
    // find familyIds to expand and remove from collapsed set
    setCollapsed(prev => { /* ... */ })
  }
}, [highlightPath])
```

### Giải pháp — Option B (toast warning)

Hiển thị toast: "Một số người trong đường kết nối đang bị ẩn. Mở rộng cây để xem đầy đủ."

### Khuyến nghị

Option A UX tốt hơn nhưng cần logic tìm ancestor families để expand.

---

## §8. UI warning giới hạn 200 người

### Vấn đề

Giới hạn 200 người (freemium plan) đã được check khi save nhưng không có UI warning proactive khi gần đến giới hạn.

### Giải pháp

- Khi `persons.length >= 180`: hiển thị warning banner hoặc badge trên toolbar
- Khi `persons.length >= 200`: disable nút "Thêm người", hiển thị upgrade prompt
- Trong `IssuePanel`: thêm loại issue `limit-approaching`

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

Dành cho **Phase 2 cloud**. Cho phép link giữa hai document `.ftree` khác nhau (ví dụ: con gái lấy chồng → link sang gia phả họ nhà chồng).

Yêu cầu cloud infrastructure, authentication, shared document ID. Không trong scope desktop/web-only.

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
| 9 | §5 Ảnh | Cần quyết định storage strategy trước |
| 10 | §9 Multi-root | Lớn, để sau |
| 11 | §10 Cross-clan | Phase 2 cloud |
| 12 | §12 Quiz | Sau khi kinship ổn định |
