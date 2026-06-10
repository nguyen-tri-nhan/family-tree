# Track — Tình trạng triển khai

Cập nhật lần cuối: 2026-06-10 (rev 2)

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
| M11 | Female personId bug fix + demo 7 đời | ✅ | ✅ | xem chi tiết bên dưới |
| M12 | About page + Kinship §2d/§3 + path fix | ✅ | ✅ | xem chi tiết bên dưới |
| **Kế hoạch** | | | | |
| M13 | Điều khoản sử dụng (A1) | 🔲 | 🔲 | TermsModal + /#/terms |
| M14 | Warning 200 người + Recent files web (U3/U4) | 🔲 | 🔲 | — |
| M15 | Collapsed node UX — highlight + SearchBar (U1/U2) | 🔲 | 🔲 | — |
| M16 | Tag vai trò đặc biệt (D1) | 🔲 | 🔲 | Thủy Tổ, Trưởng Họ... |
| M17 | Custom xưng hô per-pair + clan-wide (K6) | 🔲 | 🔲 | — |
| M18 | Quiz trắc nghiệm xưng hô (A2) | 🔲 | 🔲 | — |
| M19 | Ảnh cá nhân — remote URL (D2) | 🔲 | 🔲 | — |

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

## M11 — Kinship §2e: female-as-personId bug fix + demo 7 đời (2026-06-10)

### Bug fix — `kinship.ts` `buildAncestorSet`

**Root cause**: Code giả định `personId` = cha (viaMother=false) và `spouseId` = mẹ (viaMother=true). Sai khi female là personId của family (ví dụ: Cô Út, Dì Hai là head của family riêng).

**Fix**: Tại `depth=0` (bước đầu từ viewer), check gender thật của parent thay vì dùng position:
```ts
const next = depth === 0
  ? idx.personMap.get(pf.personId)?.gender === 'female'
  : viaMother
```
Áp dụng cho cả `personId` lẫn `spouseId`. Tại depth>0, kế thừa viaMother như cũ.

**Test cases bổ sung (5 tests)**:
- `p15 → p7: Mẹ` (female personId là mẹ của viewer)
- `p15 → p14: Bố` (male spouseId là bố của viewer)
- `p15 → p4: Ông ngoại` (trước fix ra "Ông nội" — core bug)
- `p15 → p1: Cụ` → sau M12 đổi thành `Ông Cụ ngoại`
- `p15 → p5: Cậu Út` (genDelta=1, isMaternal=true)

**Fixtures mở rộng**: Thêm `p14` (chồng p7), `p15` (con p7/p14), `f6` (personId=p7 female).

### Demo files

| File | Mô tả |
|------|-------|
| `sample/kinship-demo.json` | **Bắc**, 7 đời (gen 1–8), 42 người, 25 families |
| `sample/kinship-demo-south.json` | **Nam**, cùng cấu trúc, `region=south` |
| `sample/kinship-demo.ftree` | Encoded (28124 chars) |
| `sample/kinship-demo-south.ftree` | Encoded (27616 chars) |

**Cấu trúc 7 đời** (relative to An p10):

| Gen (abs) | Người | An gọi là |
|-----------|-------|-----------|
| 1 | p32/p32w (Ông Sơ/Bà Sơ) | Ông Sơ / Bà Sơ (genDelta=5) |
| 2 | p17/p17w (Ông Kỵ/Bà Kỵ) | Ông Kỵ / Bà Kỵ (genDelta=4) |
| 3 | p18/p18w (Cụ nội), p20/p20w (Cụ ngoại) | Cụ (genDelta=3) |
| 4 | p01/p01w (Ông bà nội), p06/p06w (Ông bà ngoại) | Ông/Bà nội/ngoại (genDelta=2) |
| 5 | p02-p09 + Thím/Dượng | Bác/Chú/Cô/Cậu/Dì/Thím/Dượng (genDelta=1) |
| 6 | p10 (An) + p33/p33w (Anh/Chị dâu) + cousins p12-p16, p25-p26 | — |
| 7 | p11 (Con An), p28/p29 (Cháu họ) | Con / Cháu |
| 8 | p30 (Cháu họ xa) | Cháu (genDelta=-2, selfLabel='Ông') |

**Cases cover trong demo**:
- ✅ Ông/Bà nội/ngoại (nội/ngoại distinction)
- ✅ Cụ nội/ngoại (genDelta=3)
- ✅ Ông Kỵ/Bà Kỵ (genDelta=4)
- ✅ Ông Sơ/Bà Sơ (genDelta=5)
- ✅ Bác Cả, Chú Ba/Tư, Cô Út (genDelta=1, nội side)
- ✅ Cậu Cả/Hai, Dì Hai/Ba (genDelta=1, ngoại side)
- ✅ Thím (vợ Chú) — applyInLaw(Chú→Thím)
- ✅ Dượng (chồng Cô, bắc) / Chú (chồng Cô, nam)
- ✅ Mợ (vợ Cậu) — applyInLaw(Cậu→Mợ)
- ✅ Dượng (chồng Dì) — applyInLaw(Dì→Dượng)
- ✅ Anh ruột + Chị dâu (applyInLaw Anh→Chị dâu)
- ✅ Anh/Chị họ / Em họ (genDelta=0)
- ✅ Chị dâu họ (vợ Anh họ)
- ✅ Con dâu (Kim Chi, effectiveViewerId = An)
- ✅ Con / Cháu (genDelta=-1, -2)
- ✅ **BUG FIX DEMO**: p26 (con Cô Út, female personId family) → p01 = Ông ngoại

---

---

## M12 — About page + Kinship §2d/§3 + path fix (2026-06-10)

### About page (§4 ✅)

- Hash routing (`createHashRouter`) — hoạt động đồng nhất web và Electron (`file://`)
- `Router.tsx`: `AppRouter` + `PropsCtx` để pass `AppProps` qua RouterProvider
- `AboutPage.tsx`: card layout, ContactRow, link Website/Email/LinkedIn; không có GitHub (closed-source)
- `App.tsx`: thêm `onAbout?: () => void` prop + nút `ⓘ` header

### Kinship §3 — Ông Cụ/Bà Cụ + Ông Cố/Bà Cố nội/ngoại (K5 ✅)

- `genDelta=3`: phân biệt giới tính + nội/ngoại
  - Bắc: `Ông Cụ nội` / `Ông Cụ ngoại` / `Bà Cụ nội` / `Bà Cụ ngoại`
  - Nam: `Ông Cố nội` / `Ông Cố ngoại` / `Bà Cố nội` / `Bà Cố ngoại`
- `genDelta=-3` selfLabel: `Ông Cụ`/`Bà Cụ` (Bắc) / `Ông Cố`/`Bà Cố` (Nam) theo giới tính viewer
- `applyInLaw` tự xử lý đúng: base `Ông`/`Bà` → swap nhờ mapping sẵn

### Kinship §2d — Case 1 & 2 (K3/K4 ✅)

**Case 1 — vợ/chồng anh em họ**:
- `Anh họ` → vợ → `Chị (dâu) họ`; `Chị họ` → chồng → `Anh (rể) họ`
- selfLabel "Anh họ" giờ trả về `Em họ` (không phải `Em` — sửa lỗi ngữ nghĩa)

**Case 2 — họ hàng xa chi tiết**:
- Thêm `minLcaDepth` parameter vào `buildLabel`
- First cousins (depth 2): `Anh họ` / `Em họ` (như cũ)
- Second cousins (depth 3): `Anh họ 2 đời` / `Em họ 2 đời`
- Third cousins+: `Anh họ 3 đời`...

### Fix path highlight cho in-law (✅)

**Bug**: `rawPath[last] = targetId` thay thế blood relative → edge blood→in-law bị mất.

**Fix**: `rawPath.push(targetId)` — giữ blood relative trong path, append in-law sau.

Ví dụ `p6 → p9` (vợ của Anh họ p5):
- Trước: `[p6, p4, p1, p3, p9]` — cạnh p3→p9 không tồn tại trong tree
- Sau: `[p6, p4, p1, p3, p5, p9]` — cạnh p5→p9 là marriage edge có sẵn trong edgeMap ✓

### dâu/rể in parentheses (✅)

Toàn bộ in-law label dùng ngoặc: `Con (dâu)`, `Con (rể)`, `Cháu (dâu)`, `Cháu (rể)`, `Chị (dâu)`, `Anh (rể)`, v.v. Suffix ` họ` / ` 2 đời` vẫn nối sau: `Chị (dâu) họ`, `Chị (dâu) họ 2 đời`.

### Tests — `kinship.test.ts`

69 tests pass. Thêm:
- K5: 4 cases (Ông Cụ nội/ngoại, Ông Cố nội, Chắt selfLabel)
- §2d Case1: 3 cases (Chị (dâu) họ, fallback Em họ)
- §2d Case2: 4 cases (second cousin fixture + selfLabel)
- path in-law: 3 cases (blood stays in path, in-law appended)

---

## Kế hoạch chi tiết — Enhancement v3 (non-cloud)

Tham chiếu: [backlog.md](backlog.md), [enhancement-v3.md](enhancement-v3.md)

| Milestone | ID | Nội dung | Spec | Ghi chú |
|-----------|----|-----------|----|---------|
| **M13** | A1 | Điều khoản sử dụng | terms.md | TermsModal (first-launch) + TermsPage (`/#/terms`) + link từ AboutPage |
| **M14** | U3 | UI warning 200 người | v3 §8 | Badge cam/đỏ trên toolbar + disable Add buttons |
| **M14** | U4 | Recent files trên web | v3 §6 | File System Access API + IndexedDB serialize handle |
| **M15** | U1 | Highlight path khi node collapse (auto-expand) | v3 §7a | `highlightPath` → tìm missing nodes → remove khỏi collapsed set |
| **M15** | U2 | Chọn node collapse qua SearchBar | v3 §7b | SearchBar trong compare mode → `handlePersonClick(id)` |
| **M16** | D1 | Tag vai trò đặc biệt | v3 §2 | `roles?: PersonRole[]` trên Person; badge node; multi-select PersonForm |
| **M17** | K6 | Custom xưng hô per-pair + clan-wide | v3 §1 | `kinshipOverrides[]` + `kinshipRules[]` trên FtreeDocument; UI KinshipDrawer + ClanForm |
| **M18** | A2 | Quiz trắc nghiệm xưng hô | quiz.md | `quizEngine.ts` + `QuizPanel.tsx`; highlight target trên cây |
| **M19** | D2 | Ảnh cá nhân (remote URL) | v3 §5 | `avatarUrl?` trên Person; `<image>` SVG clip-path tròn trong node |

**Deferred (non-cloud)**:
- D3: Multi-root / nhiều dòng họ — lớn, sau khi có feedback nhiều hơn

**Cloud / Phase 2** (cần backend — không trong scope hiện tại):
- C1: Ảnh cloud upload; C2: Cross-clan link → xem [backlog.md §Cloud](backlog.md)

---

## Giới hạn đã biết

| Vấn đề | Trạng thái |
|--------|-----------|
| Tối đa 200 người (freemium) | Check khi save — UI warning planned (M14/U3) |
| Ảnh cá nhân | Remote URL planned (M19/D2); cloud upload → backlog C1 |
| Multi-root (nhiều dòng họ) | Chỉ render root đầu tiên — deferred (D3) |
| Cross-clan link | Cloud Phase 2 — backlog C2 |
| Recent files trên web | Trả về `[]` — File System Access API planned (M14/U4) |
| Highlight path khi node bị collapse | Node không có trong posRef → skip silently — planned (M15/U1) |
| Em rể họ (chồng của Em họ gái) | applyInLaw không biết blood gender từ label — deferred |
