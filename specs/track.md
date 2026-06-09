# Track — Tình trạng triển khai

Cập nhật lần cuối: 2026-06-10

---

## Milestones

| # | Milestone | Web | Desktop | Ghi chú |
|---|-----------|-----|---------|---------|
| M1 | Foundation & Types | ✅ | ✅ | types.ts, document.ts, storage.ts |
| M2 | FamilyTree từ FtreeDocument + collapse | ✅ | ✅ | buildTree(), badge +N/− |
| M3 | Storage adapters + IPC | ✅ | ✅ | WebAdapter, ElectronAdapter, prefs.json |
| M4 | App shell cơ bản | ✅ | ✅ | WelcomeScreen, Open/Save. Toolbar đầy đủ |
| M5 | Person CRUD | ✅ | ✅ | mutations, PersonPanel, PersonForm, DateInput |
| M6 | Search | ✅ | ✅ | normalizeVi, SearchBar, highlight ring + pan |
| M7 | Export PNG / PDF | ✅ | ✅ | SVG → canvas → PNG; jsPDF cho PDF |
| M8 | Xưng hô / Kinship v1 | ✅ | ✅ | computeKinship, KinshipDrawer, compare mode |
| M9 | Kinship bug fixes + path UI | ✅ | ✅ | xem chi tiết bên dưới |
| M10 | Kinship §2a/2b — nội/ngoại + Cậu/Dì | ✅ | ✅ | xem chi tiết bên dưới |

---

## M9 — Kinship v2 (2026-06-09 → 2026-06-10)

### Bug fixes — `kinship.ts`

| # | Bug | Fix | Test |
|---|-----|-----|------|
| 2c | Anh/em của Ông/Bà thiếu ordinal ("Ông" thay vì "Ông Cả") | `showOrd` mở rộng: `genDelta===2 && branchRank!==0` | `p5→p11: 'Ông Cả'` ✅ |
| 2f | Con gọi vợ của cha ra "Bố" thay vì "Mẹ" | Thêm `Bố:'Mẹ', Ba:'Má'` vào `applyInLaw` female branch; `Mẹ:'Bố', Má:'Ba'` vào male branch | `p5→p8: 'Mẹ'` ✅ |
| 2g | Con dâu/rể → null cho mọi quan hệ nhà chồng/vợ | Thêm `effectiveViewerId` — nếu viewer là `spouseId` trong `familyBySpouse`, dùng `personId` của FamilyUnit đó để traverse ancestor chain | `p9→p3:'Bố'`, `p9→p4:'Chú Út'`, `p9→p1:'Ông'` ✅ |

### Data thêm — `KinshipResult`

- Thêm `lcaIndex: number` — index trong `path[]` của LCA
- Dùng để split đường nối thành ascending / descending
- Con dâu là in-law: path prepend `viewerId`, `lcaIndex` offset +1

### UI — `KinshipDrawer.tsx` → side panel

- Chuyển từ modal overlay → side panel `position: fixed; right: 0; width: 320px`
- Không có backdrop → cây vẫn scroll/zoom/click được khi panel mở

#### RelRow: generation indicator badge (2e)
- Khi `|genDelta| >= 3` (Cụ/Kỵ/Sơ và các đời xuống), hiển thị badge **"đời thứ N"** bên cạnh label
- Không còn nhập nhằng khi nhiều đời đều ra "Ông Sơ"

#### PathDisplay: annotated path
- Direct line (`lcaIndex === 0` hoặc `lcaIndex === path.length - 1`): vertical chain từ trên xuống, mỗi mũi tên ghi label "người dưới gọi người trên là gì"
- V-split (`0 < lcaIndex < path.length - 1`): LCA ở trên giữa, hai nhánh viewer/target đi xuống song song

### UI — `FamilyTree.tsx`: `highlightPath`

- Prop mới `highlightPath?: string[]`
- Mỗi edge trong path được highlight bằng 2 layer:
  - Outer glow: `stroke-width: 10`, `opacity: 0.15`
  - Inner line: `stroke-width: 4`, `opacity: 0.7`
- Follow đúng elbow path của edge gốc (không vẽ đường thẳng)
- `linksRef` lưu SVG path string của từng edge (key: `parentId:childId`) và spouse line (`personId:spouseId`) trong mỗi lần draw
- Các node trong path có ring indigo; endpoint ring đặc hơn

### App.tsx: wire-up

- `kinshipHighlightPath = useMemo(...)` — tính `ab?.path` từ `kinshipPair + doc`
- `kinshipPairRef` + sửa `handlePersonClick`: khi kinship panel mở, click tree node → update `kinshipPair.b` (thay vì mở PersonPanel)
- ESC đóng kinship panel
- `highlightPath` truyền xuống FamilyTree

### Tests — `kinship.test.ts`

41 tests pass. Bổ sung:
- Fix 2c: ordinal Ông/Bà sibling
- Fix 2f: applyInLaw Bố→Mẹ / Ba→Má
- Fix 2g: con dâu effective viewer (7 cases)
- `lcaIndex` assertions trong path tests
- Fixtures mở rộng lên 4 thế hệ: thêm `p00` (Cụ), `p11` (Ông Cả), `p8` (Mẹ), `p9` (Vợ/Dâu)

---

## Files hiện có

### `packages/tree-lib/src/`

| File | Mô tả |
|------|-------|
| `types.ts` | Toàn bộ interfaces: Person, FamilyUnit, Branch, Clan, FtreeDocument |
| `document.ts` | emptyDocument, encodeDocument, decodeDocument, isValidDocument, touchUpdatedAt |
| `storage.ts` | IStorageAdapter, StorageContext, useStorage() |
| `mutations.ts` | addPerson, addFamilyUnit, setSpouse, updatePerson, deletePerson |
| `FamilyTree.tsx` | D3 tree từ FtreeDocument, collapse/expand, nút + và ⊕; `highlightPath` edge glow |
| `kinship.ts` | computeKinship, getSiblingOrdinal; LCA + branchRank + effectiveViewer + lcaIndex |
| `components/DateInput.tsx` | Input ngày âm/dương, preview Can Chi, solar equivalent |
| `components/PersonForm.tsx` | Modal 3 tab: Cơ bản / Tên / Ngày tháng; 4 mode add-root/add-child/add-spouse/edit |
| `components/PersonPanel.tsx` | Sidebar 280px read-only, format ngày, nút hành động |
| `components/SearchBar.tsx` | Tìm kiếm không dấu, dropdown 8 kết quả |
| `components/KinshipDrawer.tsx` | Side panel 320px: RelRow + generation badge + PathDisplay (chain/V-split) + edge highlight |
| `components/ClanForm.tsx` | Form chỉnh thông tin dòng họ |
| `utils/normalizeVi.ts` | NFD + strip marks + đ→d |
| `utils/exportTree.ts` | treeToDataUrl (SVG→canvas), downloadPng, downloadPdf (jsPDF) |
| `index.ts` | Export tất cả |

### `packages/web-app/src/`

| File | Mô tả |
|------|-------|
| `adapters/WebAdapter.ts` | IStorageAdapter cho web: localStorage cache + download .ftree |
| `App.tsx` | Shell chính: state doc + formMode + selectedPerson + kinshipPair + highlightPath |
| `main.tsx` | Inject WebAdapter vào StorageProvider |

### `packages/electron-app/src/`

| File | Mô tả |
|------|-------|
| `main/index.ts` | IPC: file:open/save/new, prefs:getRecent/addRecent, atomic write |
| `preload/index.ts` | contextBridge → window.api |
| `renderer/src/adapters/ElectronAdapter.ts` | IStorageAdapter cho Electron: ghi thẳng vào file |
| `renderer/src/App.tsx` | Shell giống web-app + WebkitAppRegion drag, recent files |
| `renderer/src/main.tsx` | Inject ElectronAdapter |

---

## M10 — Kinship §2a/2b — nội/ngoại + Cậu/Dì (2026-06-10)

### §2a — Phân biệt nội/ngoại

**Root cause**: `getAncestorChain` chỉ đi theo `personId` (cha), bỏ qua `spouseId` (mẹ) → không tìm được quan hệ phía mẹ + không biết bên nào là nội/ngoại.

**Fix** — Thay bằng `buildAncestorSet` (BFS theo cả cha lẫn mẹ):
- Mỗi node lưu `{ depth, parentId, viaMother }` — `viaMother` = true nếu bước đầu tiên từ viewer đi qua `spouseId` (mẹ viewer)
- LCA tìm bằng minimize `vDepth + tDepth` qua hai BFS sets
- Path reconstruct bằng `tracePath` theo `parentId` pointers ngược về start

**Label thay đổi** trong `buildLabel(genDelta=2)`:
- `Ông nội` / `Bà nội` khi `viaMother=false`
- `Ông ngoại` / `Bà ngoại` khi `viaMother=true`
- applyInLaw tự động preserve suffix: "Ông nội" → "Bà nội", "Ông ngoại" → "Bà ngoại"

### §2b — Cậu/Dì

Khi `genDelta=1`, `branchRank≠0`, `isMaternal=true`:
- Male target → `Cậu` (thay vì Chú/Bác)
- Female target → `Dì` (thay vì Cô/Bác)
- Ordinal áp dụng bình thường: Cậu Hai, Dì Út, v.v.
- `applyInLaw` đã có sẵn `Cậu: 'Mợ'` và `Dì: 'Dượng'`

### §2d.Case1 — Fix in-law của anh/em

- `applyInLaw` female: `Anh: 'Chị dâu'` (thay vì `'Chị'`)
- `applyInLaw` male: `Chị: 'Anh rể'` (thay vì `'Anh'`)
- Suffix ` họ` tự động preserve: `'Anh họ'` → `'Chị dâu họ'`, `'Chị họ'` → `'Anh rể họ'`

### Tests — `kinship.test.ts`

84 tests pass (tăng từ 41). Thêm:
- **§2a** (7 cases): Ông nội/ngoại, Bà nội/ngoại, path qua p8, lcaIndex
- **§2b** (4 cases): Cậu Út, Cháu nhìn xuống, path, dâu gọi Cậu chồng
- Cập nhật 8 test cases cũ từ "Ông/Bà" → "Ông nội/ngoại" / "Bà nội/ngoại"
- Fixtures mở rộng: thêm p10 (Ông ngoại), p12 (Bà ngoại), p13 (Cậu Út), f5

---

## Chưa làm (enhancement-v2.md)

| Mục | Section | Độ ưu tiên |
|-----|---------|------------|
| Custom xưng hô per-pair | §3 → v3 | — |
| Quan hệ xuyên nhánh phức tạp (Case 2: họ hàng xa) | §2d | Thấp |

---

## Giới hạn đã biết

| Vấn đề | Trạng thái |
|--------|-----------|
| Tối đa 200 người (freemium) | Check khi save — chưa implement UI warning |
| Ảnh cá nhân | Bỏ qua v1 — v2 dùng cloud URL |
| Multi-root (nhiều dòng họ) | Chỉ render root đầu tiên — xem `FamilyTree.tsx:buildTree()` |
| Cross-clan link | Dành cho Phase 2 cloud — xem `plan.md` |
| Recent files trên web | Trả về `[]` — File System Access API để v2 |
| Highlight path khi node bị collapse | Node không có trong posRef → skip silently |
