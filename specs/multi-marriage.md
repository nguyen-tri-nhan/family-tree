# Đa hôn nhân — Multi-Marriage Plan

Hỗ trợ đa thê lịch sử (1 ông nhiều vợ đồng thời) và ly hôn/tái hôn (hôn nhân tuần tự).

Cập nhật: 2026-06-10

---

## Scope

### Scenario 1 — Đa thê (historical polygamy)

Quan lớn, địa chủ thời phong kiến có thể có 3–4 vợ cùng lúc:

```
Nguyễn Văn Đức
  ├── Vợ cả:  Trần Thị Lan  → Con 1, Con 2, Con 3
  ├── Vợ hai: Lê Thị Hoa   → Con 4, Con 5
  ├── Vợ ba:  Phạm Thị Mai  → Con 6
  └── Vợ tư:  Bùi Thị Xuân → Con 7, Con 8
```

Tất cả con đều có quan hệ huyết thống rõ ràng với cha. Anh/em với nhau nhưng khác mẹ.

### Scenario 2 — Ly hôn / Tái hôn

```
Minh ──── Mai (ly hôn 1995) → Khánh (sinh 1990)
Minh ──── Lan (tái hôn 1997) → Huy (sinh 1999)
Mai  ──── Tuấn (tái hôn 1996) → Linh (sinh 1997)
```

- Khánh và Huy: anh/em cùng cha khác mẹ
- Khánh và Linh: anh/em cùng mẹ khác cha
- Huy và Linh: không có quan hệ huyết thống — chỉ là anh/em kế qua bố/mẹ

### Out of scope (lần này)

- Nuôi con nuôi (adopted) — track riêng
- Quan hệ ngoài giá thú không công nhận — không track

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

## Tree Layout — Tiered Edge Routing

### Nguyên tắc

Giữ nguyên cấu trúc node hiện tại (không đổi FamilyNode layout). Thay đổi chỉ ở **đường nối** và thêm **collapse/expand** cho các hôn nhân phụ.

Thực tế: không ai có tới 20 lần tái hôn hay hàng trăm vợ — thiết kế cho trường hợp phổ biến là 2–4 hôn nhân.

### Edge routing — 90° tiered lanes

Mỗi hôn nhân của cùng 1 người cha/mẹ được cấp 1 **lane ngang** riêng, xếp từ trên xuống. Đường nối dùng toàn góc 90° (không diagonal), tránh đường chồng lên nhau.

```
        [Nguyễn Văn Đức]
               │
    ┌──────────┤  ← lane 1 (vợ cả, luôn mở)
    │          │
[Trần Thị Lan]─┘
    │
 [C1] [C2] [C3]


               │
    ┌──────────┤  ← lane 2 (vợ lẽ, mặc định collapse)
    │          │
[Lê Thị Hoa]──┘ ▶ [+2 con]   ← collapsed badge


               │
    ┌──────────┤  ← lane 3 (vợ ba, collapse)
    │          │
[Phạm Thị Mai]─┘ ▶ [+1 con]
```

- Mỗi lane nằm ở `y = nodeY + ROW_HEIGHT * order` — không chồng nhau theo chiều dọc
- Đường dọc từ node cha chạy xuống liên tục, mỗi lane rẽ ngang sang spouse bằng 1 đoạn thẳng ngang
- Khoảng cách giữa các lane: `MARRIAGE_ROW_GAP = 80px` (đủ để chứa badge label)

### Collapse / Expand

- **Hôn nhân đầu tiên** (`marriageOrder = 1`): luôn expanded — hiển thị spouse + children như node thường
- **Hôn nhân từ thứ 2 trở đi**: mặc định **collapsed**
  - Hiển thị: `[Tên vợ/chồng]  ▶ +N con`
  - Click vào row → expand, render children bên dưới lane đó
  - Click lại → collapse lại

```
  State: collapsed                 State: expanded
  ──────────────────               ─────────────────────────────
  [Lê Thị Hoa] ▶ +3 con     →     [Lê Thị Hoa]
                                        │
                                    [C4] [C5] [C6]
```

### SVG implementation

Dùng `<path>` với lệnh `M … H … V … H` (Move, Horizontal, Vertical) thay vì đường cong cubic Bezier hiện tại.

```ts
// Edge từ node cha (px, py) → lane y → spouse (sx, sy)
function tieredEdgePath(
  px: number, py: number,   // bottom-center của node cha
  laneY: number,            // y của lane ngang
  sx: number, sy: number,   // center của spouse node
): string {
  const midX = (px + sx) / 2
  return [
    `M ${px} ${py}`,
    `V ${laneY}`,           // đi thẳng xuống đến lane
    `H ${sx}`,              // rẽ ngang đến cột spouse
    `V ${sy}`,              // đi xuống đến center spouse
  ].join(' ')
}
```

Edges từ lane xuống children dùng cùng pattern `V → H → V` như parent-child edges hiện tại.

### State quản lý collapse

```ts
// Trong FamilyTree component state:
expandedMarriages: Set<string>  // key = familyUnitId
// Mặc định: chỉ có familyUnit với marriageOrder=1 trong set

function toggleMarriage(familyId: string) {
  setExpandedMarriages(prev => {
    const next = new Set(prev)
    next.has(familyId) ? next.delete(familyId) : next.add(familyId)
    return next
  })
}
```

D3 layout chỉ tính vị trí cho children của các family đang expanded. Collapsed family chỉ render spouse row + badge, không chiếm không gian layout.

### Node thay đổi tối thiểu

Không đổi FamilyNode component. Chỉ thêm:
1. **SpouseRow** component nhỏ — render 1 hàng vợ/chồng phụ (collapsed state)
2. **tieredEdgePath** function — thay edge drawing cho node có `families.length > 1`
3. **expandedMarriages** state trong FamilyTree

Node bình thường (`families.length === 1`): không thay đổi gì.

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

| Loại | Label | selfLabel |
|------|-------|-----------|
| Cùng cha cùng mẹ | `Anh/Chị/Em` (giữ nguyên) | `Em/Anh/Chị` |
| Cùng cha khác mẹ | `Anh/Chị/Em cùng cha` | `Em/Anh/Chị cùng cha` |
| Cùng mẹ khác cha | `Anh/Chị/Em cùng mẹ` | `Em/Anh/Chị cùng mẹ` |
| Không có huyết thống | `Anh/Chị/Em kế` | — (không track kinship) |

### Vợ/chồng của cha gọi là gì?

Không có công thức chung — phụ thuộc gia đình và thời đại:
- Con vợ cả gọi vợ lẽ: "Dì", "Mẹ Hai", "Bà Hai"
- Con vợ lẽ gọi vợ cả: "Mẹ Cả", "Mẹ Lớn", "Bà Lớn"

→ Để vào **custom xưng hô (K6)**, không hard-code. `applyInLaw` chỉ trả về label mặc định "Vợ cha" nếu không có override.

---

## UI Changes

### PersonForm — Tab "Gia đình"

Hiện tại: 1 ô "Vợ/chồng" (read-only, link sang FamilyUnit).

Mới:

```
Tab: Gia đình
──────────────────────────────────────
Hôn nhân #1  [Vợ cả · đã mất]          ← click để xem/sửa FamilyUnit
  Con: An, Bình, Cường

[+ Thêm hôn nhân]

Hôn nhân #2  [Vợ lẽ · còn sống]
  Con: Dũng

Vai trò trong hôn nhân: [Vợ cả ▼]
```

### PersonPanel

Hiển thị tóm tắt:

```
Nguyễn Văn Đức
─────────────────
Vợ cả:  Trần Thị Lan (đã mất)
Vợ hai: Lê Thị Hoa
─────────────────
12 người con
```

### FamilyForm (mới hoặc mở rộng)

Khi click vào 1 FamilyUnit cụ thể trong node:
- Sửa `marriageStatus`, `marriageRole`, `marriageOrder`
- Thêm/xóa con trong gia đình đó
- Sửa thông tin vợ/chồng

### Node trên cây — badge

Node bình thường: không đổi.
Node có nhiều hôn nhân: hiển thị số `×N` nhỏ góc phải node (ví dụ `×4` nếu có 4 vợ).

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
| `FamilyTree.tsx` | `buildTree`: gộp multi-family thành 1 TreeNode; render MultiFamily node |
| `components/PersonForm.tsx` | Tab "Gia đình" với danh sách hôn nhân |
| `components/PersonPanel.tsx` | Hiển thị multi-spouse summary |

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
- `tieredEdgePath`: đường nối 90° với lanes xếp tầng
- `SpouseRow`: component hàng vợ/chồng phụ (collapsed state + badge +N con)
- `expandedMarriages` state + toggle handler
- PersonPanel multi-spouse summary
- PersonForm tab Gia đình + "Thêm hôn nhân"
- FamilyForm sửa marriageStatus/Role

### Phase 4 — Export
- PDF export: thêm chú thích vợ/chồng theo số
- Sách phả hệ cổ điển (dạng danh sách): mỗi ông liệt kê vợ + con theo thứ tự

---

## Câu hỏi mở

1. **Màu sắc phân biệt nhánh**: Dùng màu khác nhau cho các lane của từng vợ trên cây không? Hay chỉ dùng số thứ tự?
2. **"Anh/em kế" (bố dượng/mẹ kế)**: Có track không hay để người dùng tự ghi chú?
3. **Import dữ liệu GEDCOM**: Format chuẩn genealogy có hỗ trợ đa thê — có cần xét tới không?
4. **Default expand**: Có nên expand tất cả hôn nhân khi mới mở file (thay vì chỉ hôn nhân đầu) không?
