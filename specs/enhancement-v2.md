# Enhancement v2 — Trạng thái

| § | Tên | Trạng thái |
|---|---|---|
| 1 | Export sạch | ✅ Done |
| 2a | Phân biệt nội / ngoại | ✅ Done |
| 2b | Cậu / Dì phía mẹ | ✅ Done |
| 2c | Ordinal cho Ông/Bà ngang hệ | ✅ Done |
| 2d | Quan hệ xuyên nhánh phức tạp | ✅ Done (Case1: vợ/chồng anh em họ; Case2: họ hàng xa đời) |
| 2e | Chỉ số đời Cụ/Kỵ/Sơ | ✅ Done (hiển thị trong KinshipDrawer) |
| 2f | Con gọi vợ/chồng của cha/mẹ | ✅ Done |
| 2g | Con dâu/rể dùng kinship chồng/vợ | ✅ Done |
| 3 | Custom xưng hô | → v3 |
| 4 | Đường nối có chú thích (path annotated) | ✅ Done |
| 5 | Kiểm tra tính nhất quán dữ liệu | ✅ Done |

---

## 2a. Phân biệt nội / ngoại — Implementation Plan

### Vấn đề hiện tại

`getAncestorChain` chỉ đi theo `personId` (cha) ở mỗi bước. Điều này có hai hậu quả:

1. **Mất quan hệ phía mẹ hoàn toàn** — nếu LCA của viewer và target chỉ tìm được qua bên mẹ (ví dụ: cậu/dì là anh/em ruột của mẹ viewer), hàm trả về `null` vì chuỗi tổ tiên không bao giờ chứa mẹ viewer.
2. **Không có nội/ngoại** — ngay cả khi tìm được LCA qua bên cha, không có thông tin để biết ta đi lên qua cha hay mẹ.

### Root cause

```ts
function getAncestorChain(startId: string, idx: FtreeIndex): string[] {
  // ...
  const pf = idx.childToParentFamily.get(cur)
  if (!pf || visited.has(pf.personId)) break
  cur = pf.personId   // ← CHỈ đi theo cha, bỏ qua pf.spouseId (mẹ)
  // ...
}
```

### Thiết kế mới — `buildAncestorSet`

Thay thế `getAncestorChain` bằng BFS theo cả hai nhánh cha/mẹ:

```ts
interface AncestorEntry {
  depth:     number    // số bước từ start đến node này
  parentId:  string    // ID của người đứng trước trong đường đi ngắn nhất
  viaMother: boolean   // bước từ start → tổ tiên này đi qua spouseId (mẹ) lần đầu tiên không?
}

function buildAncestorSet(startId: string, idx: FtreeIndex): Map<string, AncestorEntry> {
  const map = new Map<string, AncestorEntry>()
  map.set(startId, { depth: 0, parentId: '', viaMother: false })
  const queue: Array<{ id: string; depth: number; viaMother: boolean }> = [
    { id: startId, depth: 0, viaMother: false }
  ]
  while (queue.length > 0) {
    const { id, depth, viaMother } = queue.shift()!
    const pf = idx.childToParentFamily.get(id)
    if (!pf) continue
    // Nhánh cha (personId)
    if (pf.personId && !map.has(pf.personId)) {
      map.set(pf.personId, { depth: depth + 1, parentId: id, viaMother })
      queue.push({ id: pf.personId, depth: depth + 1, viaMother })
    }
    // Nhánh mẹ (spouseId)
    if (pf.spouseId && !map.has(pf.spouseId)) {
      map.set(pf.spouseId, { depth: depth + 1, parentId: id, viaMother: true })
      queue.push({ id: pf.spouseId, depth: depth + 1, viaMother: true })
    }
  }
  return map
}
```

**Lưu ý `viaMother`**: một khi đi qua `spouseId` lần đầu, mọi tổ tiên tiếp theo kế thừa `viaMother: true`. Điều này đủ để xác định "bên ngoại" — viewer đi lên qua mẹ để đến LCA.

### Thay đổi trong `computeKinship`

```ts
// Thay thế
const vChain = getAncestorChain(effectiveViewerId, idx)
const tChain = getAncestorChain(bloodTargetId, idx)
const vSet   = new Map(vChain.map((id, i) => [id, i]))

// Bằng
const vSet = buildAncestorSet(effectiveViewerId, idx)
const tSet = buildAncestorSet(bloodTargetId, idx)
```

**Tìm LCA**: scan tSet, tìm node có trong vSet, tối thiểu `vEntry.depth + tEntry.depth`:

```ts
let lcaId: string | null = null
let vDepth = 0, tDepth = 0
let minCost = Infinity
for (const [id, tEntry] of tSet) {
  const vEntry = vSet.get(id)
  if (!vEntry) continue
  const cost = vEntry.depth + tEntry.depth
  if (cost < minCost) {
    minCost = cost; lcaId = id
    vDepth = vEntry.depth; tDepth = tEntry.depth
  }
}
```

**Reconstruct path**: backtrack parent pointers từ LCA về viewer và target:

```ts
function tracePath(endId: string, ancestorSet: Map<string, AncestorEntry>): string[] {
  const path: string[] = []
  let cur = endId
  while (cur) {
    path.push(cur)
    const e = ancestorSet.get(cur)
    if (!e || e.depth === 0) break
    cur = e.parentId
  }
  return path.reverse()
}

const vPath = tracePath(lcaId, vSet)  // [effectiveViewerId, ..., LCA]
const tPath = tracePath(lcaId, tSet)  // [bloodTargetId, ..., LCA]
const rawPath = [...vPath, ...tPath.slice(1).reverse()]
```

### Label nội/ngoại

Sau khi tìm được LCA và `viaMother` của LCA:

```ts
const isMaternal = vSet.get(lcaId)!.viaMother  // true = bên ngoại

// Trong buildLabel hoặc sau buildLabel:
// genDelta === 2:
if (isMaternal) {
  // Ông ngoại / Bà ngoại
  label = g(tg, 'Ông ngoại', 'Bà ngoại')
} else {
  // Ông nội / Bà nội (hoặc chỉ "Ông" nếu không muốn phân biệt đơn giản)
  label = g(tg, 'Ông nội', 'Bà nội')
}
```

Tương tự cho `genDelta === 1` (bên cha → Bố/Ba, bên mẹ → vẫn Bố/Ba nhưng là cha dượng/cha kế — edge case phức tạp, skip lần đầu).

**Câu hỏi UX cần quyết định trước khi implement**:
- Hiển thị "Ông nội" / "Ông ngoại" hay chỉ "Ông" + badge "(nội)" / "(ngoại)"?
- Áp dụng từ `genDelta >= 2` (ông/bà trở lên) hay cả `genDelta === 1` (cha/mẹ)?

---

## 2b. Cậu / Dì phía mẹ — Implementation Plan

**Phụ thuộc**: §2a phải xong trước.

### Logic sau khi có `isMaternal`

Trong `buildLabel`, khi `genDelta === 1` (một đời trên viewer):

```ts
if (genDelta === 1) {
  if (branchRank === 0) {
    // Cha / mẹ trực tiếp — giữ nguyên
    return { label: g(tg, region==='south'?'Ba':'Bố', ...), ... }
  }
  if (isMaternal) {
    // Anh/em của mẹ
    return {
      label:     g(tg, `Cậu${N}`, `Dì${N}`),
      selfLabel: 'Cháu',
      ordinal,
    }
  }
  // Anh/em của cha — như cũ
  if (branchRank > 0) return { label: g(tg, `Bác${N}`, `Bác${N}`), selfLabel: 'Cháu', ordinal }
  return { label: g(tg, `Chú${N}`, `Cô${N}`), selfLabel: 'Cháu', ordinal }
}
```

### `applyInLaw` cần bổ sung

```ts
// Nhánh female (vợ của Cậu):
Cậu: 'Mợ',    // vợ của cậu = mợ (đã có)

// Nhánh male (chồng của Dì):
Dì: 'Dượng',  // chồng của dì = dượng (đã có)
```

Các mapping này đã tồn tại trong `applyInLaw`. Chỉ cần đảm bảo `buildLabel` sinh ra "Cậu"/"Dì" đúng trước.

### Ordinal cho Cậu/Dì

Dùng lại `ordinal` của `branchRank` — cùng logic như Bác/Chú/Cô. Cậu Hai, Cậu Ba, Dì Út, v.v.

### `branchRank` cho maternal side

`branchRank` hiện tính bằng cách compare `childIds` index tại LCA. Nếu LCA là mẹ viewer (người là `spouseId` trong FamilyUnit), ta cần lookup `familyByPerson.get(maternalGrandfather)` và xem childIds. Cần đảm bảo path reconstruction đúng để tính `branchRank` chính xác.

---

## 2d. Quan hệ xuyên nhánh phức tạp — Implementation Plan

### Case 1: Vợ/chồng của anh/em họ

Ví dụ: viewer gọi vợ của anh họ là gì?

Hiện tại `applyInLaw` nhận `bloodLabel` từ anh họ:
```ts
// bloodLabel = 'Anh họ' → base = 'Anh'
// applyInLaw('Anh họ', 'female') → nb = 'Chị' → return 'Chị họ'
// ← Sai! Vợ của anh họ phải là 'Chị dâu họ', không phải 'Chị họ'
```

**Fix**: trong `applyInLaw`, detect suffix "họ" và preserve nó:

```ts
function applyInLaw(bloodLabel, targetGender, region, ordinal) {
  const suffix = bloodLabel.endsWith(' họ') ? ' họ' : ''
  const label  = suffix ? bloodLabel.slice(0, -3) : bloodLabel
  // ... compute nb từ label (không có ' họ')
  // ... cuối cùng append suffix lại:
  return `${nb}${rest}${suffix}`
}
```

Mapping cần điều chỉnh cho "họ" suffix:
- `Anh họ` → vợ của → `Chị dâu họ`
  - base = 'Anh', female → 'Chị dâu' (thay vì 'Chị')
  - cần thêm: `'Anh' → female → 'Chị dâu'` khi context là in-law? Nhưng đây là blood 'Chị' nếu không suffix.

Thực ra vấn đề là `Anh` cho blood relationship → vợ = `Chị dâu`, không phải `Chị`. Nhưng hiện tại `Anh → 'Chị'` vì viewer tự xưng là em, thì vợ anh = chị dâu. Mapping phải là `Anh: 'Chị dâu'` cho in-law female, không phải `'Chị'`.

```ts
// applyInLaw female branch — sửa:
Anh: 'Chị dâu',     // vợ của anh = chị dâu (không phải chị)
// + suffix ' họ' → 'Chị dâu họ'
```

Tương tự:
- `Chị họ` → chồng của → `Anh rể họ`
  - `Chị: 'Anh rể'` (thay vì `'Anh'`)

### Case 2: Quan hệ ≥ 3 nhánh (rất xa)

Hiện tại trả về `"Họ hàng xa"`. Cải thiện: khi có LCA nhưng `genDelta = 0` và `depth >= 3` đôi bên → thêm thông tin số đời:

```ts
if (genDelta === 0 && vDepth >= 3 && tDepth >= 3) {
  return { label: `Anh/em họ ${Math.min(vDepth, tDepth) - 1} đời`, ... }
}
```

(Đã được `Anh họ` / `Em họ` cover cho `depth = 2`; extend cho depth >= 3.)

### Phụ thuộc

2d.Case1 (vợ/chồng của anh/em họ): **độc lập**, có thể làm ngay.
2d.Case2 (quan hệ xa): **độc lập**, nhỏ.

---

## 1. Export sạch ✅

Done — `data-no-export` trên badge, addBtn, addSpouseBtn, hlG; `treeToDataUrl` remove trước serialize; bg lấy từ `--t-tree-bg` CSS var.

---

## 3. Custom xưng hô → v3

Moved to enhancement-v3.

---

## 4. Đường nối có chú thích ✅

Done — KinshipDrawer hiển thị path dạng side panel với V-split layout và edge highlight trên cây.

---

## 5. Kiểm tra tính nhất quán ✅

Done — `validateDocument`, `IssuePanel`, warning inline trong `PersonForm`, badge `!` trên node.

---

## Thứ tự ưu tiên còn lại

| # | Enhancement | Phụ thuộc | Độ khó | Giá trị |
|---|---|---|---|---|
| 1 | **2a** nội/ngoại + BFS ancestry | — | Cao | Cao |
| 2 | **2b** Cậu/Dì | 2a | Thấp | Cao |
| 3 | **2d.Case1** vợ/chồng anh/em họ | — | Thấp | Vừa |
| 4 | **2d.Case2** họ hàng xa chi tiết | — | Thấp | Thấp |
