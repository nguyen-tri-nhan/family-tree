# Track — Tình trạng triển khai

Cập nhật lần cuối: 2026-06-08

---

## Milestones

| # | Milestone | Web | Desktop | Ghi chú |
|---|-----------|-----|---------|---------|
| M1 | Foundation & Types | ✅ | ✅ | types.ts, document.ts, storage.ts |
| M2 | FamilyTree từ FtreeDocument + collapse | ✅ | ✅ | buildTree(), badge +N/− |
| M3 | Storage adapters + IPC | ✅ | ✅ | WebAdapter, ElectronAdapter, prefs.json |
| M4 | App shell cơ bản | ✅ | ✅ | WelcomeScreen, Open/Save. Toolbar đầy đủ để M6-M7 |
| M5 | Person CRUD | ✅ | ✅ | mutations, PersonPanel, PersonForm, DateInput |
| M6 | Search | ✅ | ✅ | normalizeVi, SearchBar, highlight ring + pan |
| M7 | Export PNG / PDF | ✅ | ✅ | SVG → canvas → PNG; jsPDF cho PDF |
| M8 | Xưng hô / Kinship | ✅ | ✅ | computeKinship, KinshipDrawer, compare mode |

---

## Files hiện có

### `packages/tree-lib/src/`

| File | Mô tả |
|------|-------|
| `types.ts` | Toàn bộ interfaces: Person, FamilyUnit, Branch, Clan, FtreeDocument |
| `document.ts` | emptyDocument, encodeDocument, decodeDocument, isValidDocument, touchUpdatedAt |
| `storage.ts` | IStorageAdapter, StorageContext, useStorage() |
| `mutations.ts` | addPerson, addFamilyUnit, setSpouse, updatePerson, deletePerson |
| `FamilyTree.tsx` | D3 tree từ FtreeDocument, collapse/expand, nút + và ⊕ |
| `components/DateInput.tsx` | Input ngày âm/dương, preview Can Chi, solar equivalent |
| `components/PersonForm.tsx` | Modal 3 tab: Cơ bản / Tên / Ngày tháng; 4 mode add-root/add-child/add-spouse/edit |
| `components/PersonPanel.tsx` | Sidebar 280px read-only, format ngày, nút hành động |
| `components/SearchBar.tsx` | Tìm kiếm không dấu, dropdown 8 kết quả |
| `components/KinshipDrawer.tsx` | Modal hiển thị quan hệ A↔B (label + selfLabel + path) |
| `utils/normalizeVi.ts` | NFD + strip marks + đ→d |
| `utils/exportTree.ts` | treeToDataUrl (SVG→canvas), downloadPng, downloadPdf (jsPDF) |
| `kinship.ts` | computeKinship, getSiblingOrdinal; LCA algorithm + branchRank |
| `index.ts` | Export tất cả |

### `packages/web-app/src/`

| File | Mô tả |
|------|-------|
| `adapters/WebAdapter.ts` | IStorageAdapter cho web: localStorage cache + download .ftree |
| `App.tsx` | Shell chính: state doc + formMode + selectedPerson |
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

## Chưa làm

### M4 còn thiếu — Toolbar đầy đủ
_(Đã xong qua M6 + M7)_

---

## Giới hạn đã biết

| Vấn đề | Trạng thái |
|--------|-----------|
| Tối đa 200 người (freemium) | Check khi save — chưa implement UI warning |
| Ảnh cá nhân | Bỏ qua v1 — v2 dùng cloud URL |
| Multi-root (nhiều dòng họ) | Chỉ render root đầu tiên — xem `FamilyTree.tsx:buildTree()` |
| Cross-clan link | Dành cho Phase 2 cloud — xem `plan.md` |
| Recent files trên web | Trả về `[]` — File System Access API để v2 |
