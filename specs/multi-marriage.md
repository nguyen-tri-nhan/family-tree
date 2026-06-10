# Đa hôn nhân — Multi-Marriage Plan

Hỗ trợ đa thê lịch sử (1 ông nhiều vợ đồng thời) và ly hôn/tái hôn (hôn nhân tuần tự).

Cập nhật: 2026-06-10

---

## Scope

Chỉ quan tâm **huyết thống trực hệ** — con ruột và cha/mẹ đẻ. Mọi quan hệ phát sinh từ hôn nhân mới của người đã ly hôn (bố dượng, mẹ kế, con riêng của vợ/chồng mới) nằm ngoài phạm vi.

### Scenario 1 — Đa thê (historical polygamy)

Quan lớn, địa chủ thời phong kiến có thể có 3–4 vợ cùng lúc:

```
Nguyễn Văn Đức
  ├── Vợ cả:  Trần Thị Lan  → Con 1, Con 2, Con 3
  ├── Vợ hai: Lê Thị Hoa   → Con 4, Con 5
  └── Vợ ba:  Phạm Thị Mai  → Con 6
```

Tất cả con đều có quan hệ huyết thống với cha. Con khác mẹ → anh/em cùng cha khác mẹ.

### Scenario 2 — Ly hôn / Tái hôn

```
Minh ──── Mai (ly hôn) → Khánh
Minh ──── Lan (tái hôn) → Huy
```

Chỉ track: Khánh và Huy là **anh/em cùng cha khác mẹ**.
Không track: Minh với chồng mới của Mai, hay Mai với Lan.

### Out of scope

- Quan hệ bố dượng / mẹ kế / con riêng của vợ chồng mới
- Nuôi con nuôi (adopted) — track riêng sau
- Quan hệ ngoài giá thú không công nhận

---

## Phân loại vợ/chồng (marriageRole)

Dùng cho scenario 1 (đa thê). Không bắt buộc — chỉ gán khi người dùng muốn ghi rõ.

| Role | Tiếng Việt | Hán Nôm | Ghi chú |
|------|-----------|---------|---------|
| `chinh` | Vợ cả / Chính thất | 正室 | Hôn nhân chính thức, con có địa vị cao hơn |
| `thu` | Vợ lẽ / Thứ thất | 次室 | Có danh phận, con được công nhận |
| `thiep` | Tì thiếp / Nàng hầu | 妾 | Bậc thấp hơn, ít quyền hạn pháp lý |
| `normal` | Bình thường | — | Mặc định — dùng cho hôn nhân hiện đại |

Với ly hôn/tái hôn hiện đại, mọi hôn nhân đều là `normal`, phân biệt nhau bằng `marriageOrder` và `marriageStatus`.

---

## Data Model

### Thay đổi `FamilyUnit`

```ts
type MarriageRole   = 'normal' | 'chinh' | 'thu' | 'thiep'
type MarriageStatus = 'married' | 'divorced' | 'widowed' | 'separated'

interface FamilyUnit {
  id:              string
  personId:        string
  generation:      number
  spouseId?:       string
  childIds:        string[]

  // Mới:
  marriageStatus:  MarriageStatus   // default: 'married'
  marriageRole?:   MarriageRole     // chỉ set khi đa thê, default: 'normal'
  marriageOrder?:  number           // 1 = đầu tiên, 2 = thứ hai... (dùng để sắp thứ tự)
}
```

### Không thay đổi cấu trúc FamilyUnit

Mỗi `FamilyUnit` = 1 cặp (personId + spouseId) + con chung của cặp đó.

Đa thê → nhiều `FamilyUnit` có cùng `personId`.
Tái hôn → nhiều `FamilyUnit` có cùng `personId`, phân biệt bằng `marriageOrder`.

Cách này giữ được:
- Ranh giới rõ ràng: con của ai với ai
- Backward compatible — file `.ftree` cũ vẫn đọc được
- Kinship BFS không cần refactor lớn

---

## Index — Thay đổi `buildIndex`

```ts
// Trước — 1 person chỉ đứng đầu 1 family:
familyByPerson:  Map<string, FamilyUnit>

// Sau — 1 person có thể đứng đầu nhiều family, sorted by marriageOrder:
familiesByPerson: Map<string, FamilyUnit[]>
```

Các chỗ dùng `familyByPerson.get(id)` → cần đổi thành `familiesByPerson.get(id)?.[0]`
(lấy family đầu tiên / chính) hoặc iterate tất cả khi cần.

### childToParentFamily — giữ nguyên

Mỗi child vẫn chỉ có 1 cha + 1 mẹ sinh → `childToParentFamily: Map<string, FamilyUnit>` không đổi.

---

## Tree Layout — Horizontal Spread + 90° Edges

### Nguyên tắc

- Giữ nguyên node hiện tại (không đổi FamilyNode)
- Vợ/chồng phụ trải **ngang** trong cùng generation row — không bị đẩy lên/xuống thế hệ khác
- Tất cả spouse ở cùng `y` → vai vế đọc được, không phân biệt thứ bậc qua vị trí
- Đường nối dùng góc 90° với **offset dọc khác nhau** giữa các marriages để tránh chồng nhau

### Layout — cùng generation, trải ngang

```
Gen N:
  [Vợ 2]═══╗         ╔═══[Nguyễn Văn Đức]═══[Vợ 1]
            ╚═════════╝          (▼ thêm hôn nhân trong panel)

Gen N+1:
  [C4] [C5]                [C1] [C2] [C3]
```

- Hôn nhân #1 (`marriageOrder=1`): luôn hiển thị, vợ bên phải — giữ nguyên như hiện tại
- Hôn nhân #2 trở đi: vợ bên trái (hoặc tiếp tục sang phải theo thứ tự), **mặc định collapsed**
- Không có vợ nào cao hơn hoặc thấp hơn vợ khác — tất cả cùng `y`

### 90° Edge routing — offset lane

Các đường nối từ cặp cha-mẹ xuống con dùng **lane dọc riêng** tại `x` offset nhỏ để không đè lên nhau:

```
          [Vợ 2]═══[Cha]═══[Vợ 1]
               ↓         ↓
           laneX-8    laneX+8     ← offset theo marriageOrder
               │         │
          [C4][C5]  [C1][C2][C3]
```

Mỗi marriage dùng `laneX = parentCenterX + (order - 1) * LANE_OFFSET` làm điểm rẽ đứng xuống children. `LANE_OFFSET = 12px` — nhỏ đủ để phân biệt mà không lệch nhiều.

```ts
function marriageEdgePath(
  parentX: number, parentBottomY: number,
  childX: number,  childTopY: number,
  laneX: number,   // offset theo từng marriage
): string {
  const midY = (parentBottomY + childTopY) / 2
  return [
    `M ${parentX} ${parentBottomY}`,
    `V ${midY}`,          // xuống đến giữa khoảng cách
    `H ${laneX}`,         // rẽ ngang sang lane
    `V ${midY}`,          // đứng tại lane (nối với nhánh ngang chung)
    `H ${childX}`,        // sang cột của child
    `V ${childTopY}`,     // lên đến top của child node
  ].join(' ')
}
```

Với 1 hôn nhân (trường hợp phổ biến): `laneX = parentX`, không rẽ, behavior giống như hiện tại.

### Collapse / Expand — toggle từ PersonPanel

Hôn nhân phụ có thể collapse để giảm rộng cây:

- **Expanded**: spouse node hiển thị bình thường, children render dưới theo layout D3
- **Collapsed**: spouse node thu lại thành chip nhỏ `[Tên · +N con ▶]` cùng generation row, children không chiếm layout

Toggle được kích hoạt từ **PersonPanel** (không phải click trực tiếp lên cây):

```
PersonPanel — Nguyễn Văn Đức
─────────────────────────────
Hôn nhân 1   [Trần Thị Lan]  ●  [▼ đang hiện]   3 con
Hôn nhân 2   [Lê Thị Hoa]       [▶ ẩn]           2 con
Hôn nhân 3   [Phạm Thị Mai]     [▶ ẩn]           1 con
─────────────────────────────
[+ Thêm hôn nhân]
```

Click `▼/▶` trong panel → toggle `expandedMarriages` state → cây re-layout.

### State

```ts
expandedMarriages: Set<string>  // familyUnitId — chỉ hôn nhân #1 mặc định
```

D3 `buildTree` chỉ đưa vào layout children của family đang trong set. Collapsed family vẫn render spouse chip nhưng không tính `size` cho D3 separation.

### Không thay đổi

- `FamilyNode` component: không đổi
- Edge cho hôn nhân đơn: không đổi
- Generation alignment: tất cả spouse ở cùng `y` như cũ

---

## Kinship — Anh/Em Cùng Cha Khác Mẹ

### Phát hiện

Hai người là **anh/em cùng cha khác mẹ** khi:
- LCA = cha chung (genDelta = 0 sau khi cả hai đi lên 1 bước)
- `childToParentFamily` của mỗi người trỏ tới **FamilyUnit khác nhau** (dù cùng personId)

```ts
const vPF = idx.childToParentFamily.get(effectiveViewerId)
const tPF = idx.childToParentFamily.get(bloodTargetId)

const isSibling   = vPF?.id === tPF?.id           // cùng cha cùng mẹ
const isHalfSibling = vPF?.personId === tPF?.personId  // cùng cha khác mẹ
                   || vPF?.spouseId === tPF?.spouseId  // cùng mẹ khác cha
```

### Labels mới trong `buildLabel`

Chỉ track quan hệ huyết thống trực hệ:

| Loại | Label | selfLabel |
|------|-------|-----------|
| Cùng cha cùng mẹ | `Anh/Chị/Em` (giữ nguyên) | `Em/Anh/Chị` |
| Cùng cha khác mẹ | `Anh/Chị/Em cùng cha` | `Em/Anh/Chị cùng cha` |
| Cùng mẹ khác cha | `Anh/Chị/Em cùng mẹ` | `Em/Anh/Chị cùng mẹ` |

Không track "anh/em kế" (con riêng của vợ/chồng mới) — nằm ngoài huyết thống trực hệ.

### Vợ/chồng của cha gọi là gì?

Không hard-code — xưng hô phụ thuộc gia đình và thời đại. Để vào **custom xưng hô (K6)**. `applyInLaw` trả về "Vợ cha" / "Chồng mẹ" làm fallback nếu không có override.

---

## UI Changes

### PersonPanel — mở rộng (không tạo tab mới)

Khi người được chọn có nhiều hôn nhân, PersonPanel hiển thị thêm section "Hôn nhân" thay thế dòng vợ/chồng đơn hiện tại:

```
Nguyễn Văn Đức
────────────────────────────────────
Sinh: 1820  Mất: 1895

Hôn nhân
  ① Trần Thị Lan   (Vợ cả · đã mất)  3 con  [▼]
  ② Lê Thị Hoa    (Vợ lẽ · ly hôn)  2 con  [▶]
  ③ Phạm Thị Mai  (Vợ ba)            1 con  [▶]

[+ Thêm hôn nhân]
────────────────────────────────────
```

- `[▼]` / `[▶]` toggle collapse/expand trực tiếp trên cây
- Click tên vợ/chồng → mở PersonPanel của người đó
- `[+ Thêm hôn nhân]` → tạo FamilyUnit mới với personId = người hiện tại

Với hôn nhân đơn: section "Hôn nhân" không thay đổi so với hiện tại (chỉ hiện 1 dòng vợ/chồng, không có toggle).

### FamilyUnit form — inline trong PersonPanel

Khi click vào 1 hôn nhân → mở rộng inline (accordion):

```
  ① Trần Thị Lan   (Vợ cả · đã mất)  [▼]
     Vai trò:   [Vợ cả ▼]
     Tình trạng: [Đã mất ▼]
     Con:        An, Bình, Cường  [+ thêm con]
```

Không cần form riêng — tất cả trong panel.

---

## Migration — Backward Compatibility

File `.ftree` cũ không có `marriageStatus` và `marriageRole`:

```ts
// Trong decodeDocument hoặc buildIndex:
function normalizeFamilyUnit(f: Partial<FamilyUnit>): FamilyUnit {
  return {
    ...f,
    marriageStatus: f.marriageStatus ?? 'married',
    marriageRole:   f.marriageRole   ?? 'normal',
    marriageOrder:  f.marriageOrder  ?? 1,
  }
}
```

Không breaking — file cũ vẫn load và hiển thị bình thường.

---

## Files cần sửa

| File | Thay đổi |
|------|---------|
| `types.ts` | Thêm `MarriageRole`, `MarriageStatus`; cập nhật `FamilyUnit` |
| `document.ts` | `normalizeFamilyUnit` trong decode, cập nhật `emptyDocument` |
| `kinship.ts` | `buildIndex`: `familiesByPerson`; `buildLabel`: thêm half-sibling logic |
| `mutations.ts` | `addFamilyUnit`, `setSpouse`: cho phép personId đã có family |
| `FamilyTree.tsx` | `buildTree`: multi-family node; `marriageEdgePath` 90° + offset lane |
| `components/PersonPanel.tsx` | Section "Hôn nhân" với toggle collapse/expand + inline accordion |

---

## Phases

### Phase 1 — Data layer (không breaking)
- Thêm fields vào `FamilyUnit` (với migration defaults)
- Đổi `familyByPerson` → `familiesByPerson` trong `buildIndex`
- Cập nhật `mutations.ts` cho phép multi-family
- Tests cho kinship half-sibling

### Phase 2 — Kinship labels
- Phát hiện half-sibling trong `buildLabel`
- Labels "cùng cha", "cùng mẹ"
- Tests đầy đủ

### Phase 3 — UI tree layout
- `marriageEdgePath`: đường nối 90° với `laneX` offset theo `marriageOrder`
- `expandedMarriages` state + toggle
- Spouse chip (collapsed state) — cùng generation row, không đẩy xuống thế hệ khác
- PersonPanel: section "Hôn nhân" + accordion inline + `[+ Thêm hôn nhân]`

### Phase 4 — Export
- PDF export: thêm chú thích vợ/chồng theo số
- Sách phả hệ cổ điển (dạng danh sách): mỗi ông liệt kê vợ + con theo thứ tự

---

## Câu hỏi mở

1. **Màu sắc phân biệt nhánh**: Dùng stroke-color khác nhau cho edge của từng hôn nhân không? Mỗi marriage 1 màu → con của từng vợ dễ nhận ra. Ưu điểm: trực quan. Nhược điểm: dễ rối nếu nhiều màu, và ngầm tạo cảm giác phân biệt. Phương án trung lập: dùng dash pattern khác nhau thay vì màu.
2. **Import dữ liệu GEDCOM**: Format chuẩn genealogy có hỗ trợ đa thê — có cần xét tới không?
3. **Số hôn nhân tối đa gợi ý**: Giới hạn mềm trong UI (cảnh báo nếu > 5)? Hay để tự do hoàn toàn?
