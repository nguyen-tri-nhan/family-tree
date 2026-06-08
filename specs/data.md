# Data Model — Cây Gia Phả

## Triết lý thiết kế

Dữ liệu được tổ chức theo **3 tầng lồng nhau**:

```
Dòng Họ (Clan)
  └── Chi / Phái (Branch)
        └── Gia Đình / Family Unit (husband + wife + children)
              └── Person
```

---

## Tầng 1 — Person (Cá nhân)

Đơn vị nhỏ nhất. Mọi người trong cây đều là một `Person`.

```typescript
interface Person {
  id: string                  // uuid

  // Tên — xem bảng loại tên bên dưới
  displayName: string         // tên hiển thị trên cây (thường = tên khai sinh)
  names?: PersonName          // các loại tên bổ sung

  gender: 'male' | 'female' | 'unknown'
  birthDate?: PartialDate     // { year, month?, day? }
  deathDate?: PartialDate
  birthPlace?: string
  deathPlace?: string
  isAlive: boolean

  // Ảnh & mô tả
  // avatarUrl: KHÔNG lưu base64 trong file — xem ghi chú ảnh bên dưới
  bio?: string                // tiểu sử ngắn

  // Học vấn & chức danh
  education?: Education[]
  titles?: Title[]            // học hàm, học vị, danh hiệu

  // Nghề nghiệp & công trạng
  occupations?: Occupation[]
  achievements?: Achievement[]

  // Vai trò trong dòng họ
  clanRoles?: ClanRole[]

  // Metadata
  createdAt: string
  updatedAt: string
  notes?: string
}

// Các loại tên — văn hóa Việt / Hán Việt
interface PersonName {
  // Tên khai sinh (tên trên giấy tờ)
  // Nếu khác displayName, ghi vào đây — phổ biến với người cao tuổi đặt tên tục
  birth?: string

  // Tên thường gọi / tên tục (không phải tên giấy tờ)
  // Ví dụ: "Hai", "Ba Hùng", "Chú Tám"
  nickname?: string

  // Tên tự (字, courtesy name) — đặt khi trưởng thành
  // Dùng trong thư từ, văn chương, giữa người ngang hàng
  // Phổ biến với tổ tiên thời Nho học
  courtesy?: string

  // Tên húy (諱, taboo name) — tên kiêng, không gọi thẳng khi còn sống
  // Sau khi mất mới dùng trong tế lễ, gia phả
  // Thường là tên thật, trong khi tên tự mới là tên dùng hàng ngày
  taboo?: string

  // Tên chữ Hán — cách viết tên bằng chữ Hán (nếu có)
  // Ví dụ: "阮文安"
  sinograph?: string
}

// Ngày có thể thiếu tháng hoặc ngày (phổ biến với người cao tuổi)
interface PartialDate {
  // Dương lịch — canonical, dùng để sort/compare
  year: number
  month?: number    // 1–12
  day?: number      // 1–31

  // Âm lịch gốc — giữ lại nếu người dùng nhập âm lịch
  // Dùng thư viện lunar-date-vn để convert sang dương khi lưu
  lunar?: {
    year: number
    month: number   // 1–12
    day?: number
    leapMonth?: boolean  // tháng nhuận: tháng 4 nhuận ≠ tháng 4 thường
  }

  // Hiển thị theo lịch nào (mặc định solar)
  displayCalendar: 'solar' | 'lunar'
}
```

---

## Học vấn & Công trạng

Đây là phần quan trọng để ghi nhận **đóng góp của từng cá nhân** cho gia tộc và xã hội.

```typescript
interface Education {
  level: 'primary' | 'secondary' | 'highschool' | 'college' | 'university' | 'postgrad'
  institution?: string        // trường
  major?: string              // ngành
  graduationYear?: number
}

// Học hàm, học vị, chức danh chuyên môn
interface Title {
  type:
    | 'giao_su'               // Giáo sư (GS)
    | 'pho_giao_su'           // Phó Giáo sư (PGS)
    | 'tien_si'               // Tiến sĩ (TS)
    | 'thac_si'               // Thạc sĩ (ThS)
    | 'bac_si'                // Bác sĩ
    | 'luat_su'               // Luật sư
    | 'nghe_nhan'             // Nghệ nhân / Nghệ sĩ nhân dân / ưu tú
    | 'anh_hung'              // Anh hùng lực lượng vũ trang / lao động
    | 'other'
  label: string               // nhãn hiển thị: "GS.TS", "NSND", v.v.
  awardedYear?: number
  awardedBy?: string          // tổ chức trao tặng
}

// Công việc theo giai đoạn
interface Occupation {
  title: string               // chức vụ: "Bí thư tỉnh ủy", "Giám đốc", v.v.
  organization?: string
  startYear?: number
  endYear?: number            // null = hiện tại
  sector?: 'government' | 'military' | 'education' | 'business' | 'agriculture' | 'other'
}

// Thành tích / công trạng nổi bật
interface Achievement {
  title: string               // "Huân chương Lao động hạng Nhất"
  description?: string
  year?: number
  type: 'award' | 'honor' | 'contribution' | 'milestone' | 'other'
}
```

---

## Tầng 2 — Family Unit (Gia đình hạt nhân)

Một cặp vợ chồng (hoặc đơn thân) cùng con cái. Đây là **node trong cây gia phả**.

```typescript
interface FamilyUnit {
  id: string

  personId: string            // người "chủ" của node này (con ruột của cha mẹ)
  spouseId?: string           // vợ hoặc chồng (dâu/rể)
  marriageDate?: PartialDate
  divorceDate?: PartialDate
  marriageStatus: 'married' | 'divorced' | 'widowed' | 'single'

  childIds: string[]          // con — ordered (con cả → con út)

  // Vị trí trong chi / dòng họ
  branchId?: string           // thuộc chi nào
  generation: number          // thế hệ thứ N (đời 1 = cụ tổ)
}
```

> **Lưu ý đa hôn phối lịch sử**: Trường hợp tổ tiên có nhiều vợ (phổ biến trước 1945)
> → mỗi vợ là một `FamilyUnit` riêng với cùng `personId`, chia sẻ con theo từng bà.

---

## Tầng 3 — Branch / Chi (Nhánh dòng họ)

Một dòng họ lớn thường chia thành nhiều chi sau vài thế hệ.

```typescript
interface Branch {
  id: string
  name: string                // "Chi Trưởng", "Chi Thứ Hai", "Chi Út"
  shortName?: string          // "Chi I", "Chi II"

  type: 'main' | 'secondary' // dòng chính (con trưởng) vs dòng thứ (con thứ)
  order: number               // thứ tự: 1 = chi cả

  ancestorPersonId: string    // người đứng đầu chi (ông tổ chi)
  clanId: string

  description?: string        // nguồn gốc, đặc điểm của chi
  region?: string             // vùng định cư chủ yếu: "Hà Nội", "Huế", "TP.HCM"
}
```

### Phân loại dòng chính / dòng thứ

Trong văn hóa Việt Nam truyền thống:

| Loại | Mô tả | Quyền lợi & trách nhiệm |
|------|-------|------------------------|
| **Dòng chính** (tông/trực) | Con trai trưởng qua các đời | Giữ nhà thờ họ, gia phả gốc, lãnh đạo hội đồng họ |
| **Dòng thứ** | Con trai thứ và các đời sau | Đóng góp giỗ chạp, tham gia hội đồng họ |
| **Dòng ngoại** | Con gái đã lấy chồng ra ngoài | Ghi nhận trong gia phả nhưng thuộc họ chồng |

---

## Tầng 4 — Clan (Dòng họ)

Toàn bộ những người cùng huyết thống từ một tổ tiên chung.

```typescript
interface Clan {
  id: string
  name: string                // "Họ Nguyễn Văn — Làng Đông Ngạc"
  surname: string             // "Nguyễn"
  origin?: string             // quê gốc: "Làng Đông Ngạc, Từ Liêm, Hà Nội"
  foundingYear?: number       // năm khai tộc (ước tính)
  motto?: string              // gia huấn / châm ngôn

  // Tổ tiên
  ancestorPersonId?: string   // ông tổ đời 1

  // Tài sản cộng đồng
  ancestralHall?: {           // nhà thờ họ
    address: string
    builtYear?: number
  }

  // Quy định họ
  generationPoems?: string[]  // bài thơ đặt tên theo đời (thơ chữ Hán)

  // Lãnh đạo
  currentHeadId?: string      // trưởng họ hiện tại
  headHistory?: ClanHeadRecord[]

  description?: string
}
```

---

## Trưởng Họ & Hội Đồng Họ

```typescript
// Lịch sử trưởng họ
interface ClanHeadRecord {
  personId: string
  startYear: number
  endYear?: number
  reason?: string             // "kế thừa từ cha", "được hội đồng bầu", v.v.
}

// Vai trò trong dòng họ (một người có thể đảm nhiệm nhiều vai)
interface ClanRole {
  clanId: string
  role:
    | 'truong_ho'             // Trưởng họ — đại diện pháp lý của dòng họ
    | 'truong_chi'            // Trưởng chi — đại diện một nhánh
    | 'thu_ky_ho'             // Thư ký họ — lưu giữ gia phả, sổ sách
    | 'thu_quy_ho'            // Thủ quỹ họ — quản lý quỹ giỗ/xây dựng
    | 'nguoi_viet_gia_pha'    // Người chép gia phả
    | 'cu_cao_tuoi'           // Cụ cao tuổi — tư vấn, uy tín tinh thần
  startYear?: number
  endYear?: number
  notes?: string
}
```

### Quy định trưởng họ (truyền thống)

1. **Kế thừa**: Con trai trưởng (dòng chính) → cháu trai trưởng → cứ thế
2. **Điều kiện**: Thường phải từ 30 tuổi trở lên, có gia đình, được tín nhiệm
3. **Ngoại lệ**: Nếu dòng trưởng tuyệt tự / di cư → hội đồng họ bầu từ dòng thứ
4. **Hiện đại**: Nhiều họ chuyển sang **bầu cử** trong hội họ hàng năm, không nhất thiết theo dòng trưởng

---

## Sơ đồ quan hệ toàn bộ

```
Clan ──────────────────────────────────────────────────┐
  │                                                     │
  ├── Branch (Chi I - dòng chính)                      │ currentHeadId
  │     ├── FamilyUnit (đời 1 - tổ chi)               ↓
  │     │     ├── Person (ông tổ) ←──────── ClanRole: trưởng_họ
  │     │     └── Person (bà tổ)
  │     ├── FamilyUnit (đời 2 - con trưởng)
  │     │     ├── Person ← Achievement, Title, Occupation
  │     │     └── Person (dâu)
  │     └── FamilyUnit (đời 3...)
  │
  └── Branch (Chi II - dòng thứ)
        └── FamilyUnit (đời 2 - con thứ hai)
              └── ...
```

---

## Cấu trúc file .ftree (lưu trữ)

```typescript
interface FtreeDocument {
  version: '1.0'
  createdAt: string     // ISO 8601, lúc tạo file
  updatedAt: string     // ISO 8601, lần save gần nhất
  clan: Clan
  branches: Branch[]
  families: FamilyUnit[]
  persons: Person[]
  // Index để tra nhanh — tính toán khi load, KHÔNG lưu vào file
  // _personMap: Map<string, Person>
  // _familyMap: Map<string, FamilyUnit>
}
```

---

## ID — UUID v4

Mọi entity (`Person`, `FamilyUnit`, `Branch`, `Clan`) dùng **UUID v4** làm primary key.

```typescript
// Generate — built-in, không cần thư viện
const id = crypto.randomUUID()
// → "3f6a8b2c-1d4e-5f7a-9b0c-2e3d4f5a6b7c"
```

**Tại sao không dùng sequential (`p001`, `f001`):**
- Sequential collision-free khi chỉ có một người tạo file
- Khi merge 2 file offline (v2 cloud sync): `p001` của file A đụng `p001` của file B
- UUID v4: xác suất collision gần như bằng 0, không cần coordination

User không bao giờ thấy UUID — tìm kiếm theo tên, UUID chỉ là internal key.
Lookup trong code dùng `Map<id, entity>` → O(1) dù 5.000 người.

---

## Giới hạn số người

| Tier | Giới hạn | Lý do |
|------|----------|-------|
| Free (v1) | 200 người | SVG render thoải mái, không cần tối ưu |
| Paid (v2+) | 5.000 người | Canvas + viewport culling (xem render.md) |

Giới hạn kiểm tra khi save: nếu `persons.length > 200` thì báo lỗi và từ chối ghi file.

---

## Ảnh đại diện

**V1: không lưu ảnh** — dùng placeholder SVG theo giới tính (đã có trong FamilyTree.jsx).

**Tại sao không nhét base64 vào .ftree:**
- Ảnh JPEG trung bình ~2MB → base64 tăng thêm 33% → ~2.7MB/người
- 200 người = ~400MB — file .ftree nặng không khác gì video
- Dù dùng thumbnail 50KB thì 200 người vẫn = 10MB, vượt giới hạn localStorage (5–10MB)

**Kế hoạch khi có cloud (v2):**
- Ảnh upload lên object storage (S3 / Cloudflare R2)
- `.ftree` chỉ lưu URL: `avatarUrl: "https://cdn.../abc.jpg"`
- Desktop: lưu ảnh trong thư mục `assets/` cạnh file `.ftree`, JSON lưu path tương đối

---

## Quyền chỉnh sửa

- **V1**: Ai giữ file `.ftree` thì toàn quyền sửa — không có phân quyền
- **V2 (cloud)**: Nhiều người cùng sửa, conflict tự resolve bằng cách merge tay giữa hai phiên bản

---

## Ghi chú thiết kế

- **Không có vòng lặp**: Gia phả là DAG (directed acyclic graph). Con không thể là tổ tiên của chính mình.
- **Dâu/Rể**: Là `Person` nhưng `spouseId` trong `FamilyUnit` — họ không có `FamilyUnit` riêng trong cây nhà chồng/vợ.
- **Con nuôi**: Thêm field `adoptionType: 'biological' | 'adopted'` vào `FamilyUnit.childIds` nếu cần.
- **Người chưa rõ thông tin**: Vẫn tạo `Person` với tên "Không rõ" và `gender: 'unknown'` để giữ cấu trúc cây.
- **Thư ký họ**: `ClanRole = 'thu_ky_ho'` — thường là con cháu trẻ hơn, không theo dòng kế thừa trưởng họ.
