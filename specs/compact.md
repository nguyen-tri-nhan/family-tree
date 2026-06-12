# Compact serialization cho URL share

## Mục tiêu

Giảm kích thước URL share bằng cách minify JSON trước khi deflate:
- Rút gọn key thành 1–2 ký tự
- Chuyển struct cố định thành array positional

**Lưu ý quan trọng:** deflate đã xử lý repeated keys rất tốt qua LZ77 back-reference. Gain thực tế sau deflate chỉ khoảng **15–25%** so với JSON gốc — nhưng đủ để đẩy giới hạn QR từ ~30 người lên ~38–40 người.

---

## Ước tính gain

| Bước | JSON gốc | Compact JSON | Ghi chú |
|------|----------|--------------|---------|
| Raw JSON | 9,000 B | 4,500 B | ~50% nhỏ hơn |
| Sau deflate | 2,200 B | 1,700 B | deflate đã tốt với repeated keys |
| Sau base64url | 2,950 ký tự | 2,270 ký tự | **~23% nhỏ hơn** |
| QR limit (2,953 ký tự) | ~30 người | ~38 người | +8 người |
| Messenger limit (4,000 ký tự) | ~45 người | ~55 người | +10 người |

*(Ước tính với người điền tên + ngày sinh + 1–2 quan hệ)*

---

## Format

### Version detection

Prefix 1 byte trong base64url output:
- Không có prefix (hoặc prefix `e`) → format hiện tại (JSON object)
- Prefix `z` → compact format v1

```
share=zABCDEFG...   ← compact
share=eBCDEFG...    ← current (e = encode, để dễ detect; optional)
```

Decoder check `encoded[0] === 'z'` → dùng compact decoder, còn lại dùng decoder cũ.

---

### Document

```
Current:
{
  version: 1,
  clan: {...},
  persons: [...],
  families: [...],
  branches: [...],
}

Compact (array positional):
[
  1,         // [0] version
  clan,      // [1] compact Clan
  persons,   // [2] compact Person[]
  families,  // [3] compact FamilyUnit[]
  branches   // [4] compact Branch[] (optional, omit if empty)
]
```

---

### Clan

```ts
// Key map
{
  n:  name
  r:  region     // "n" | "s"  (thay vì "north" | "south")
  o:  origin
  d:  description
  fy: foundedYear
}
```

---

### Person

Array positional cho các field bắt buộc/phổ biến, object với short key cho field optional ít dùng:

```
[id, displayName, gender, isAlive, birthDate?, deathDate?, birthPlace?, deathPlace?, extras?]
 [0]    [1]        [2]      [3]       [4]          [5]          [6]          [7]        [8]
```

- `gender`: `"m"` | `"f"` | `"u"` (thay vì `"male"` | `"female"` | `"unknown"`)
- `isAlive`: `1` | `0` (thay vì `true` | `false`)
- Field cuối cùng (`null` hoặc omit) nếu không có value

`extras` object (short key) — chỉ include khi có:
```ts
{
  ns: names        // PersonName object (compact, xem bên dưới)
  ti: titles[]
  ed: education[]
  oc: occupations[]
  ac: achievements[]
  bi: bio
  ro: roles[]
  ip: isPrivate    // 1 | 0
}
```

**Ví dụ:**
```json
// Current
{"id":"p1","displayName":"Nguyễn Văn An","gender":"male","isAlive":false,"birthDate":{"year":1950,"month":5,"displayCalendar":"solar"}}

// Compact
["p1","Nguyễn Văn An","m",0,{"y":1950,"m":5,"dc":"s"}]
```

---

### PartialDate

```ts
{
  y:  year
  m:  month        // optional
  d:  day          // optional
  l:  lunar        // LunarDate object, optional
  dc: displayCalendar   // "s" | "l"  (thay vì "solar" | "lunar")
}
```

---

### FamilyUnit

```
[id, personId, spouseId?, childIds[], marriageRole?, marriageStatus?]
 [0]    [1]       [2]        [3]           [4]             [5]
```

- `spouseId`: `null` nếu không có
- `childIds`: `[]` nếu không có con
- `marriageRole`: omit nếu không set
- `marriageStatus`: omit nếu không set

```json
// Current
{"id":"f1","personId":"p1","spouseId":"p2","childIds":["p3","p4"]}

// Compact
["f1","p1","p2",["p3","p4"]]
```

---

### Branch

```
[id, name, ancestorPersonId?]
 [0]  [1]        [2]
```

---

## Implementation

### `src/utils/zipping.ts` (NEW)

```ts
export function compactEncode(doc: FtreeDocument): string
// → compact JSON string (trước khi deflate)

export function compactDecode(compact: string): FtreeDocument
// → FtreeDocument đầy đủ (sau khi inflate)
```

### `src/utils/shareUrl.ts` (EDIT)

```ts
const COMPACT_PREFIX = 'z'

export async function encodeTree(doc: FtreeDocument): Promise<{ encoded: string; oversized: boolean }> {
  const compact  = compactEncode(doc)          // minify trước
  const encoded  = COMPACT_PREFIX + await compress(compact)
  return { encoded, oversized: encoded.length > OVERSIZED_THRESHOLD }
}

export async function decodeTree(encoded: string): Promise<FtreeDocument> {
  const isCompact = encoded[0] === COMPACT_PREFIX
  const data      = isCompact ? encoded.slice(1) : encoded
  const json      = await decompress(data)
  if (isCompact) return compactDecode(json)
  // Legacy path
  const raw = JSON.parse(json)
  if (!isValidDocument(raw)) throw new Error('Dữ liệu chia sẻ không hợp lệ')
  return raw as FtreeDocument
}
```

---

## Backward compatibility

- Link cũ (không có prefix `z`) → decoder cũ vẫn hoạt động
- Link mới (prefix `z`) → compact decoder
- File `.ftree` **không thay đổi** — compact format chỉ dùng cho URL share, không cho lưu file

---

## Test strategy

1. Round-trip: `compactDecode(compactEncode(doc))` === `doc`
2. All fields preserved: dates, optional fields, empty arrays
3. Backward compat: legacy encoded string vẫn decode được
4. Size benchmark: so sánh `encoded.length` trước và sau compact

---

## Tradeoffs

| | Compact format | JSON gốc |
|--|---------------|----------|
| Gain sau deflate | ~15–25% | baseline |
| Code complexity | Thêm encoder/decoder ~150 dòng | Đơn giản |
| Fragility | Array positional — thêm field mới phải cẩn thận | Flexible |
| Debug | Khó đọc khi inspect URL | Dễ đọc |
| Backward compat | Cần giữ legacy decoder | N/A |

**Khuyến nghị:** Làm sau khi có ShareDialog + QR feature đã xong — compact là optimization, không phải prerequisite.
