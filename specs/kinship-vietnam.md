# Văn hóa & Cách xưng hô trong dòng họ Việt Nam

## Đặc điểm của hệ thống xưng hô Việt Nam

Khác tiếng Anh chỉ có "uncle / aunt / cousin", tiếng Việt phân biệt chi tiết theo:
- **Thứ bậc thế hệ** — ông bà, cha mẹ, anh chị, em, con, cháu…
- **Bên nội hay ngoại** — họ cha (nội) vs họ mẹ (ngoại)
- **Lớn hay nhỏ hơn cha/mẹ** — bác (lớn hơn) vs chú/cô/cậu/dì (nhỏ hơn)
- **Giới tính**

Điều này ảnh hưởng trực tiếp đến cách hiển thị quan hệ trong ứng dụng — cùng một người nhưng gọi khác nhau tùy góc nhìn của người xem.

---

## Các thế hệ trong dòng họ (±5 đời)

| Delta | Miền Bắc | Miền Nam | Ghi chú |
|-------|----------|----------|---------|
| +5 | Sơ / Ông Sơ | Sơ | Ít gặp, một số vùng gọi "Ông Cao" |
| +4 | Kỵ (Cụ Kỵ) | Kỵ | |
| +3 | Cụ | Cố | Khác nhau rõ nhất |
| +2 | Ông / Bà | Ông / Bà | |
| +1 | Cha / Mẹ | Ba / Má | |
| 0 | Bản thân | Bản thân | |
| −1 | Con | Con | |
| −2 | Cháu | Cháu | |
| −3 | Chắt | Chắt | |
| −4 | Chút | Chít | Khác nhau |
| −5 | Chít | Chút | Bắc–Nam **đổi chiều** so với −4 |

---

## Bảng xưng hô đầy đủ

### Họ Nội (bên cha)

| Quan hệ | Miền Bắc | Miền Nam | Tự xưng là |
|---------|----------|----------|------------|
| Ông cha | Ông nội | Ông nội | Cháu |
| Bà cha | Bà nội | Bà nội | Cháu |
| Anh lớn hơn cha | Bác (trai) | Bác (trai) | Cháu |
| Vợ bác trai | Bác (gái) | Bác (gái) | Cháu |
| Em trai của cha | Chú | Chú | Cháu |
| Vợ chú | Thím | Thím | Cháu |
| Chị gái lớn hơn cha | Bác (gái) | Bác (gái) | Cháu |
| Em gái của cha | Cô | Cô | Cháu |
| Chồng cô | Dượng | Dượng / Chú | Cháu |

### Họ Ngoại (bên mẹ)

| Quan hệ | Miền Bắc | Miền Nam | Tự xưng là |
|---------|----------|----------|------------|
| Ông mẹ | Ông ngoại | Ông ngoại | Cháu |
| Bà mẹ | Bà ngoại | Bà ngoại | Cháu |
| Anh/chị lớn hơn mẹ | Bác | Bác | Cháu |
| Em trai của mẹ | Cậu | Cậu | Cháu |
| Vợ cậu | Mợ | Mợ | Cháu |
| Em gái của mẹ | Dì | Dì | Cháu |
| Chồng dì | Dượng | Dượng / Chú | Cháu |

### Trong hạt nhân gia đình

| Quan hệ | Miền Bắc | Miền Nam | Tự xưng là |
|---------|----------|----------|------------|
| Cha | Bố / Cha | Ba / Cha | Con |
| Mẹ | Mẹ | Má / Mẹ | Con |
| Anh trai | Anh | Anh | Em |
| Chị gái | Chị | Chị | Em |
| Em (nam/nữ) | Em | Em | Anh / Chị |
| Chồng | Anh / Chồng | Anh / Ổng | Em / Tôi |
| Vợ | Em / Vợ | Em / Bả | Anh / Tôi |

---

## Hệ thống số thứ tự anh chị em (thứ danh)

Khi con cháu gọi bác/chú/cô… thường kèm **số thứ tự** của người đó trong gia đình.  
Số này lấy từ **vị trí trong `childIds`** của cha/mẹ họ, nhưng quy tắc đánh số **khác nhau giữa hai miền**.

### Miền Nam

| Vị trí (`childIds` index) | Thứ danh | Ví dụ |
|--------------------------|----------|-------|
| 0 (con cả) | **Hai** | Bác Hai, Chú Hai, Cô Hai |
| 1 | Ba | Bác Ba, Chú Ba, Cô Ba |
| 2 | Tư | Chú Tư, Cô Tư |
| 3 | Năm | Chú Năm |
| 4 | Sáu | Cô Sáu |
| … | Bảy, Tám, Chín, Mười… | |
| cuối (con út) | **Út** _(ghi đè số)_ | Chú Út, Cô Út |

> Miền Nam **không dùng "Cả"** — người lớn nhất bắt đầu từ **Hai**.  
> Con út luôn được gọi là **Út** dù số thứ tự là bao nhiêu.

### Miền Bắc

| Vị trí (`childIds` index) | Thứ danh | Ví dụ |
|--------------------------|----------|-------|
| 0 (con cả) | **Cả** | Bác Cả, Anh Cả |
| 1 | Hai | Bác Hai, Chú Hai |
| 2 | Ba | Chú Ba, Cô Ba |
| 3 | Tư | Chú Tư |
| … | Năm, Sáu… | |
| cuối (con út) | **Út** _(ghi đè số, tuỳ gia đình)_ | Chú Út |

> Miền Bắc dùng **"Cả"** cho con trưởng, rồi đánh số từ Hai.  
> Con út đôi khi vẫn gọi theo số nếu gia đình không dùng tục lệ "Út".

### Công thức tính thứ danh từ data

```ts
function getSiblingOrdinal(
  index: number,        // vị trí trong childIds (0-based)
  isYoungest: boolean,  // index === childIds.length - 1
  region: Region,
): string {
  if (isYoungest) return 'Út'

  if (region === 'south') {
    // index 0 → Hai, index 1 → Ba, …
    const ordinals = ['Hai','Ba','Tư','Năm','Sáu','Bảy','Tám','Chín','Mười']
    return ordinals[index] ?? `${index + 2}`
  } else {
    // index 0 → Cả, index 1 → Hai, …
    if (index === 0) return 'Cả'
    const ordinals = ['Hai','Ba','Tư','Năm','Sáu','Bảy','Tám','Chín','Mười']
    return ordinals[index - 1] ?? `${index + 1}`
  }
}
```

### Áp dụng vào label quan hệ

```
label = role + ' ' + ordinal

Ví dụ (Miền Nam):
  childIds = ['p_bac', 'p_cha', 'p_chu', 'p_co_ut']
  p_bac  → index 0, không phải út → "Hai"  → "Bác Hai"
  p_cha  → index 1                → "Ba"   → (cha bạn, không label)
  p_chu  → index 2                → "Tư"   → "Chú Tư"
  p_co_ut→ index 3, là út         → "Út"   → "Cô Út"

Ví dụ (Miền Bắc):
  p_bac  → index 0 → "Cả"  → "Bác Cả"
  p_cha  → index 1 → "Hai" → (cha bạn)
  p_chu  → index 2 → "Ba"  → "Chú Ba"
  p_co_ut→ index 3, là út  → "Út"  → "Cô Út"
```

### Input cần cho `computeKinship`

Để tính thứ danh, thuật toán cần biết:
- **`parentFamilyId`** của target → lấy `childIds` → tìm index của target → tính ordinal
- **`region`** → áp dụng quy tắc đánh số đúng vùng

---

## Khác biệt Bắc — Nam

| Điểm khác | Miền Bắc | Miền Nam |
|-----------|----------|----------|
| Gọi cha | **Bố** | **Ba** |
| Gọi mẹ | **Mẹ** | **Má** |
| Con trưởng | **Anh/Chị Cả** | **Anh/Chị Hai** |
| Đánh số từ | **Cả, Hai, Ba…** | **Hai, Ba, Tư…** |
| Thế hệ cụ (+3) | **Cụ** | **Cố** |
| Thế hệ chắt (−4) | **Chút** | **Chít** |
| Thế hệ chít (−5) | **Chít** | **Chút** |
| Chú (chồng dì) | Dượng | Dượng hoặc **Chú** |
| Ngôi thứ nhất thân mật | Tao / Tôi | Tui / Tao |
| Ngôi thứ hai thân mật | Mày | Mày / Bạn |

---

## Cách xưng hô khi nói chuyện (ngôi thứ nhất)

Trong tiếng Việt, "tôi" khi nói chuyện với người thân thường được thay bằng vai vế:

| Nói chuyện với | Tự gọi mình là |
|----------------|----------------|
| Ông / Bà | Cháu |
| Bố / Mẹ (Ba / Má) | Con |
| Bác / Chú / Cô / Cậu / Dì | Cháu |
| Anh / Chị | Em |
| Em | Anh / Chị |
| Con | Bố/Mẹ (Ba/Má) |
| Cháu | Ông / Bà |

---

## Anh chị em họ — phân biệt xa gần

| Mức độ | Cách gọi | Giải thích |
|--------|----------|------------|
| Ruột | Anh / Chị / Em | Cùng cha mẹ |
| Họ (con chú bác) | Anh họ / Chị họ / Em họ | Con của anh chị em cha |
| Xa hơn | Anh họ xa / Bà con xa | Từ thế hệ thứ 3 trở đi |

> Trong dòng họ Việt Nam, "anh họ" (con chú bác) thân thiết hơn nhiều so với "cousin" trong văn hóa phương Tây — thường sinh hoạt chung, có nghĩa vụ qua lại.

---

## Ý nghĩa với ứng dụng

Khi hiển thị quan hệ giữa hai người, ứng dụng cần:

1. **Biết góc nhìn** — A nhìn B hay B nhìn A cho ra tên gọi khác nhau.
2. **Biết bên nội/ngoại** — cùng là "uncle" nhưng là chú, bác, cậu hay dượng tùy bên.
3. **Biết vùng miền** — "Ba" hay "Bố", "Cụ" hay "Cố".
4. **Tính được khoảng cách thế hệ** — để suy ra đúng danh xưng khi cây lớn hơn 3 thế hệ.

---

## Plan — implement `computeKinship`

### Nguyên tắc cốt lõi — thứ bậc theo CHI, không phải năm sinh cá nhân

Đây là điểm quan trọng nhất, dễ implement sai:

> **"Bác vs Chú/Cô" không phụ thuộc vào năm sinh của cá nhân đó so với cha/mẹ bạn, mà phụ thuộc vào thứ bậc của CHI (nhánh) mà họ thuộc về.**

Ví dụ:
```
Ông nội (chi trưởng, anh cả)
    └── Cha bạn
            └── Bạn

Ông thứ 3 (chi thứ, em của ông nội)
    └── "Người X" — sinh năm 1950
                    (dù Cha bạn sinh 1955, tức X sinh trước)
```
Bạn vẫn gọi X là **Chú**, vì ông thứ 3 là **em** của ông nội. Năm sinh của X không quan trọng.

Quy tắc: **thứ bậc được xác định tại tổ tiên chung gần nhất (LCA), rồi truyền xuống toàn bộ nhánh.**

```
LCA = Ông nội + Ông thứ 3's cha
      → ông nội = childIds[0]  (chi trưởng)
      → ông thứ 3 = childIds[1] (chi thứ)
      → toàn bộ hậu duệ của ông thứ 3, dù sinh khi nào,
        đều thuộc "nhánh thứ" so với bạn
```

Năm sinh cá nhân **chỉ dùng** cho anh chị em **ruột** (cùng cha mẹ), không dùng cho họ hàng khác chi.

---

### Xưng hô theo tầng thế hệ trong dòng họ

Cùng một người ông thứ 3 (em ông nội), mỗi thế hệ con cháu của ông ấy bị shift một tầng:

| Hậu duệ của Ông thứ 3 | Thế hệ so với bạn | Bạn gọi là |
|------------------------|-------------------|------------|
| Ông thứ 3 (bản thân)   | +2 (ông)          | Ông (ông cụ, ông thứ) |
| Con ông thứ 3          | +1 (cha)          | Chú / Cô (vì nhánh thứ) |
| Cháu ông thứ 3         | ±0 (ngang)        | Anh/chị/em họ |
| Chắt ông thứ 3         | −1 (con)          | Em họ (hoặc cháu họ nếu khoảng cách lớn hơn) |

Thế hệ ±0 (ngang hàng) vẫn còn phân biệt bác/chú họ nếu nhánh khác bậc, nhưng trong thực tế người Việt thường gọi đơn giản là **"anh/chị/em họ"** ở tầng ngang.

---

### Nguồn dữ liệu thứ tự nhánh

Data model đã đủ. Thứ tự ưu tiên:

1. **Vị trí trong `childIds`** — `childIds[0]` = con cả (thứ bậc chi)
2. **`birthDate.year`** — chỉ dùng để phân biệt anh/em **ruột** khi biết năm sinh

```
grandparent.childIds = ['p_ong_noi', 'p_ong_thu3', 'p_co_quy']
                        index 0          index 1       index 2
                        chi trưởng       chi thứ       chi ba
```

Toàn bộ hậu duệ của `p_ong_thu3` → luôn thuộc "nhánh thứ" so với hậu duệ của `p_ong_noi`.

---

### API

```ts
// tree-lib/src/kinship.ts

type Region = 'north' | 'south'

interface KinshipResult {
  label:     string    // "Bác Hai", "Chú Ba", "Cô Út", "Anh họ", "Cháu nội", …
  selfLabel: string    // người xem tự xưng: "Cháu", "Con", "Em", "Anh/Chị", …
  ordinal?:  string    // "Hai", "Ba", "Cả", "Út", … (chỉ có khi genDelta = ±1 hoặc 0)
  side?:     'paternal' | 'maternal'   // nội / ngoại
  genDelta:  number    // khoảng cách thế hệ (0 = ngang, +1 = cha, −1 = con)
  path:      string[]  // personIds dọc đường nối, dùng để render "Đường nối" trong drawer
}

export function computeKinship(
  doc:      FtreeDocument,
  viewerId: string,   // góc nhìn
  targetId: string,   // người được hiển thị
  region:   Region,
): KinshipResult | null
```

---

### Thuật toán

**Bước 1 — Xây graph có hướng + thứ tự**

```ts
interface Node {
  parentId?:    string       // cha/mẹ ruột (theo personId trong FamilyUnit)
  spouseId?:    string
  childIds:     string[]     // ordered: con cả → con út
  isBlood:      boolean      // false nếu node này là spouseId (dâu/rể)
  generation:   number       // từ FamilyUnit.generation
}
```

**Bước 2 — Tìm tổ tiên chung gần nhất (LCA)**

```
ancestors(viewer)  = [viewer, cha, ông, cụ, …]
ancestors(target)  = [target, cha, ông, cụ, …]
LCA = giao điểm đầu tiên
```

**Bước 3 — Tính generation delta và branch rank**

```
genDelta = generation(target) - generation(viewer)
```

Tại LCA, tìm index của nhánh viewer (`branchViewer`) và nhánh target (`branchTarget`) trong `childIds`:

```
branchRank = branchViewer - branchTarget
  > 0  → nhánh viewer lớn hơn → target thuộc nhánh thứ → "chú/cô" phía
  < 0  → nhánh viewer nhỏ hơn → target thuộc nhánh lớn → "bác" phía
  = 0  → cùng nhánh (anh/em ruột)
```

**Bước 4 — Tra bảng danh xưng**

Quy ước `branchRank`:
```
branchRank = index(viewer's ancestor tại LCA) - index(target's ancestor tại LCA)

index thấp hơn = nhánh lớn hơn (sinh trước, con cả)
index cao hơn  = nhánh nhỏ hơn (sinh sau,  con thứ)

branchRank > 0  →  viewer từ nhánh nhỏ hơn  →  target từ nhánh LỚN hơn  →  target là "bác" phía
branchRank < 0  →  viewer từ nhánh lớn hơn  →  target từ nhánh NHỎ hơn  →  target là "chú/cô" phía
branchRank = 0  →  cùng nhánh (anh/em ruột, dùng năm sinh)
```

Bảng tra chính — kết hợp `(genDelta, branchRank, gender)`:

**Dòng thẳng (branchRank = 0, không qua họ hàng ngang):**

| genDelta | male (Bắc) | female (Bắc) | male (Nam) | female (Nam) |
|----------|-----------|-------------|-----------|-------------|
| +5 | Ông Sơ | Bà Sơ | Ông Sơ | Bà Sơ |
| +4 | Ông Kỵ | Bà Kỵ | Ông Kỵ | Bà Kỵ |
| +3 | Cụ (nội/ngoại) | Cụ | Cố (nội/ngoại) | Cố |
| +2 | Ông (nội/ngoại) | Bà | Ông | Bà |
| +1 | Bố / Cha | Mẹ | Ba / Cha | Má / Mẹ |
| −1 | Con trai | Con gái | Con trai | Con gái |
| −2 | Cháu trai | Cháu gái | Cháu trai | Cháu gái |
| −3 | Chắt trai | Chắt gái | Chắt trai | Chắt gái |
| −4 | Chút trai | Chút gái | Chít trai | Chít gái |
| −5 | Chít trai | Chít gái | Chút trai | Chút gái |

**Qua nhánh ngang — genDelta = +1 (thế hệ cha/mẹ):**

| branchRank | male (Bắc/Nam) | female (Bắc) | female (Nam) | selfLabel |
|------------|----------------|-------------|-------------|-----------|
| > 0 (target nhánh lớn, bên nội) | Bác trai | Bác gái | Bác gái | Cháu |
| < 0 (target nhánh nhỏ, bên nội) | Chú | Cô | Cô | Cháu |
| > 0 (bên ngoại, qua mẹ) | Bác | Bác | Bác | Cháu |
| < 0 (bên ngoại, qua mẹ) | Cậu | Dì | Dì | Cháu |
| = 0, anh ruột của cha (nội) | Bác trai | Bác gái | Bác gái | Cháu |
| = 0, em ruột của cha (nội) | Chú | Cô | Cô | Cháu |

**Qua nhánh ngang — genDelta = 0 (cùng thế hệ):**

| branchRank | male | female | selfLabel |
|------------|------|--------|-----------|
| > 0 (target nhánh lớn, lớn hơn) | Anh họ | Chị họ | Em họ |
| < 0 (target nhánh nhỏ, nhỏ hơn) | Em họ | Em họ | Anh họ / Chị họ |
| = 0, ruột | Anh / Em | Chị / Em | Em / Anh / Chị |

**Qua nhánh ngang — genDelta = −1 (thế hệ con):**

| target | label | selfLabel |
|--------|-------|-----------|
| bất kỳ | Cháu (họ) | Bác / Chú / Cô / Cậu / Dì |

**GenDelta ≥ +2 hoặc ≤ −2 qua nhánh ngang:**

Dùng danh xưng thế hệ + thêm "họ" nếu khác nhánh:

| genDelta | label |
|----------|-------|
| +5 nhánh khác | Ông Sơ họ |
| +4 nhánh khác | Ông Kỵ họ |
| +3 nhánh khác | Cụ họ |
| +2 nhánh khác | Ông họ / Bà họ |
| −2 nhánh khác | Cháu họ |
| −3 nhánh khác | Chắt họ |
| −4 nhánh khác | Chút / Chít họ |
| −5 nhánh khác | Chít / Chút họ |
| > ±5 | Họ hàng xa (n đời) |

> **Chú ý**: branchRank chỉ tạo ra sự khác biệt thực sự tại `genDelta = +1` (bác/chú/cô/cậu/dì) và `genDelta = 0` (anh/chị/em họ). Ở các tầng còn lại, danh xưng thế hệ được dùng, chỉ thêm "họ" nếu khác nhánh.

**Bước 5 — Phân biệt nội/ngoại**

Trong đường đi từ viewer lên LCA: đếm số lần đi qua cạnh `spouseId`:
- 0 lần → **nội** (hoàn toàn cùng dòng)
- ≥ 1 lần qua mẹ của viewer → **ngoại**

---

### Giới hạn v1

| Vấn đề | Xử lý |
|--------|-------|
| `genDelta` > 4 | Hiển thị "Họ hàng xa (Đời X)" |
| LCA không tìm được (hai cây chưa link) | `null` |
| Cây chỉ có 1 người | `null` |
| Kết hôn trong họ (hiếm) | Lấy đường có LCA gần nhất |
| Người xem chưa ở trong cây | Cho chọn "Xem từ góc nhìn của ai" thủ công |

---

### Use case — KinshipDrawer (So sánh quan hệ hai người)

#### Mô tả

Người dùng chọn **hai người bất kỳ** trong cây và xem:
- A gọi B là gì, A tự xưng gì
- B gọi A là gì, B tự xưng gì
- Đường nối qua các tổ tiên trung gian

#### Luồng tương tác

```
1. User mở PersonPanel của người A (click node trên cây)
2. User click nút "🔗 Xem quan hệ" trong PersonPanel
   → App vào chế độ "đang chọn người thứ 2"
   → PersonPanel A vẫn hiện, thêm banner "Đang chọn người thứ 2 — nhấn ESC để huỷ"
   → Cursor trên cây đổi sang crosshair
3. User click node người B trên cây
   → KinshipDrawer xuất hiện (drawer từ dưới hoặc dialog giữa màn hình)
4. User đóng drawer → quay lại trạng thái bình thường
```

#### Layout KinshipDrawer

```
┌──────────────────────────────────────────────────┐
│  Quan hệ giữa hai người                    [✕]  │
├────────────────────┬─────────────────────────────┤
│  A                 │  B                          │
│  Nguyễn Văn An     │  Nguyễn Đức Anh             │
│  1930 – 2005       │  sinh 1972                  │
│  ♂                 │  ♂                          │
├────────────────────┴─────────────────────────────┤
│                                                  │
│   A  →  gọi B là:    Cháu nội                   │
│   A  →  tự xưng:     Ông                        │
│                                                  │
│   B  →  gọi A là:    Ông nội                    │
│   B  →  tự xưng:     Cháu                       │
│                                                  │
├──────────────────────────────────────────────────┤
│  Khoảng cách:  3 đời  ·  Bên nội                │
│                                                  │
│  Đường nối:                                      │
│  Nguyễn Văn An                                  │
│    └─ con: Nguyễn Minh Đức (1912)               │
│         └─ con: Nguyễn Đức Hùng (1945)          │
│              └─ con: Nguyễn Đức Anh (1972)      │
└──────────────────────────────────────────────────┘
```

#### Các trường hợp đặc biệt

| Tình huống | Hiển thị |
|------------|---------|
| A === B | "Đây là cùng một người" |
| A và B là vợ/chồng | "Vợ chồng · A gọi B: Vợ/Em · B gọi A: Chồng/Anh" |
| Không tìm được đường nối | "Không tìm thấy quan hệ trong cây này" |
| Khoảng cách > 5 đời | "Họ hàng xa — cách n đời, qua [LCA name]" |
| Một người là dâu/rể (isBlood = false) | Tính theo người chồng/vợ, thêm ghi chú "(dâu/rể)" |

#### State trong App

```ts
type CompareMode =
  | { active: false }
  | { active: true; firstPersonId: string }   // đang chờ chọn B

const [compareMode, setCompareMode] = useState<CompareMode>({ active: false })
const [kinshipPair, setKinshipPair] = useState<
  { a: string; b: string } | null
>(null)
```

Entry point trong `PersonPanel`:
```tsx
<button onClick={() => setCompareMode({ active: true, firstPersonId: personId })}>
  🔗 Xem quan hệ với...
</button>
```

Khi click node trên cây trong compare mode:
```ts
function handlePersonClick(personId: string) {
  if (compareMode.active) {
    setKinshipPair({ a: compareMode.firstPersonId, b: personId })
    setCompareMode({ active: false })
  } else {
    setSelected(personId)
  }
}
```

---

### Giới hạn v1

| Vấn đề | Xử lý |
|--------|-------|
| `genDelta` > ±5 | Hiển thị "Họ hàng xa (n đời)" |
| LCA không tìm được | "Không tìm thấy quan hệ" |
| Kết hôn trong họ (nhiều đường) | Lấy đường LCA gần nhất (BFS) |
| Người chưa ở trong cây | Không áp dụng, cần ở trong cây |
| Thiếu `birthDate` cho branchRank = 0 | Fallback dùng `childIds` index |

---

### Thứ tự implement

1. `tree-lib/src/kinship.ts` — `buildKinshipGraph()` + `computeKinship()`
2. Thêm `region: 'north' | 'south'` vào `Clan` interface
3. `tree-lib/src/components/KinshipDrawer.tsx` — component hiển thị kết quả
4. Thêm `compareMode` state vào cả hai `App.tsx`
5. Thêm nút "🔗 Xem quan hệ với..." vào `PersonPanel`
6. Settings/Setup: chọn vùng miền khi tạo gia phả mới
