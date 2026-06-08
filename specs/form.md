# Person Form — Plan chi tiết (M5)

## Tổng quan

M5 gồm 4 phần:
1. **Document mutations** — các pure function sửa `FtreeDocument`
2. **PersonPanel** — sidebar xem thông tin (read-only)
3. **PersonForm** — modal thêm / sửa thành viên
4. **DateInput** — input ngày âm/dương lịch
5. **Nút tương tác trên cây** — "Thêm con", "Thêm vợ/chồng"

Tất cả đặt trong `packages/tree-lib/src/` (shared), export qua `index.ts`.

---

## 1. Document Mutations — `mutations.ts`

Pure functions, không mutate, trả về `FtreeDocument` mới.

```typescript
// packages/tree-lib/src/mutations.ts

// Thêm thành viên mới vào dòng họ
// parentFamilyId: nếu có → thêm vào childIds của family đó
export function addPerson(
  doc: FtreeDocument,
  person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>,
  parentFamilyId?: string,
): FtreeDocument

// Tạo FamilyUnit cho một person (không có spouse)
// Dùng khi thêm con: tạo person + tạo family của họ
export function addFamilyUnit(
  doc: FtreeDocument,
  personId: string,
  generation: number,
  branchId?: string,
): FtreeDocument

// Gán vợ/chồng cho một FamilyUnit (personId đã có family)
export function setSpouse(
  doc: FtreeDocument,
  familyId: string,
  spouse: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>,
): FtreeDocument

// Cập nhật thông tin một người
export function updatePerson(
  doc: FtreeDocument,
  personId: string,
  updates: Partial<Omit<Person, 'id' | 'createdAt'>>,
): FtreeDocument

// Xoá một người:
//   - Xoá khỏi persons[]
//   - Xoá FamilyUnit của họ (nếu có childIds → throw, phải xoá con trước)
//   - Xoá personId khỏi childIds của parent
//   - Nếu là spouseId → set spouseId = undefined trên family đó
export function deletePerson(
  doc: FtreeDocument,
  personId: string,
): FtreeDocument
```

---

## 2. File structure

```
packages/tree-lib/src/
  mutations.ts              ← document mutation helpers
  components/
    PersonPanel.tsx         ← sidebar read-only
    PersonForm.tsx          ← modal add/edit
    DateInput.tsx           ← input ngày âm/dương
```

`index.ts` export thêm:
```typescript
export { PersonPanel }    from './components/PersonPanel'
export { PersonForm }     from './components/PersonForm'
export type { PersonFormData } from './components/PersonForm'
export * from './mutations'
```

---

## 3. PersonPanel

### Props
```typescript
interface PersonPanelProps {
  personId: string | null          // null → panel đóng
  doc: FtreeDocument
  onClose:      () => void
  onEdit:       (personId: string) => void
  onDelete:     (personId: string) => void
  onAddChild:   (parentFamilyId: string) => void
  onAddSpouse:  (familyId: string) => void
}
```

### Layout

```
┌──────────────────────────────┐
│  ✕                           │  ← nút đóng
│                              │
│  ● Nguyễn Văn An             │  ← icon + tên
│    GS.TS  •  Trưởng họ       │  ← title + clan role
│                              │
│  Sinh:  15/2/Canh Tý         │  ← nếu displayCalendar=lunar
│         (15/3/1900)          │     hiện cả solar trong ngoặc
│  Mất:   20/4/1975            │
│  Nơi sinh: Đông Ngạc, HN     │
│  Nơi mất:  Hà Nội            │
│                              │
│  ──── Học vấn ────           │
│  Cử nhân Luật — ĐH Đông Dương│
│  Tiến sĩ 1960                │
│                              │
│  ──── Công việc ────         │
│  Hiệu trưởng, Chu Văn An     │
│  1945 – 1970                 │
│                              │
│  ──── Thành tích ────        │
│  Huân chương Lao động hạng Nhì│
│  (1965)                      │
│                              │
│  [+ Thêm con]  [⊕ Thêm vợ/chồng] │  ← chỉ hiện nếu có family
│  [✏ Sửa]       [🗑 Xoá]     │
└──────────────────────────────┘
```

### Hiển thị ngày
```typescript
function formatDate(d: PartialDate): string {
  // Nếu displayCalendar = 'solar': "15/3/1900" hoặc "3/1900" hoặc "1900"
  // Nếu displayCalendar = 'lunar': "15/2/Canh Tý (âm)" + dòng phụ solar
  // Tháng nhuận: "15/2*/Canh Tý"
}
```

---

## 4. PersonForm

### Props
```typescript
interface PersonFormProps {
  mode:     'add-child' | 'add-spouse' | 'edit'
  doc:      FtreeDocument
  personId?: string          // có khi mode = 'edit'
  onSubmit: (doc: FtreeDocument) => void
  onClose:  () => void

  // Context khi add
  parentFamilyId?: string    // có khi mode = 'add-child'
  familyId?:       string    // có khi mode = 'add-spouse'
}
```

### Layout — modal chia tab

```
┌────────────────────────────────────────┐
│  Thêm thành viên               [✕]     │
├──────────────────────────────────────┤
│ [Cơ bản] [Tên] [Ngày tháng] [Khác]   │  ← tabs
├──────────────────────────────────────┤
│                                        │
│  Tab: Cơ bản                          │
│  ─────────────────                    │
│  Tên hiển thị *   [________________]  │
│  Giới tính        (●Nam  ○Nữ  ○Khác) │
│  Trạng thái       (●Còn sống  ○Đã mất)│
│                                        │
│  Tab: Tên (tuỳ chọn)                  │
│  ─────────────────                    │
│  Tên khai sinh    [________________]  │
│  Tên thường gọi   [________________]  │
│  Tên tự (字)      [________________]  │
│  Tên húy (諱)     [________________]  │
│  Chữ Hán          [________________]  │
│                                        │
│  Tab: Ngày tháng                      │
│  ─────────────────                    │
│  Ngày sinh        <DateInput />       │
│  Nơi sinh         [________________]  │
│  Ngày mất         <DateInput />       │  ← ẩn nếu còn sống
│  Nơi mất          [________________]  │  ← ẩn nếu còn sống
│                                        │
│  Tab: Khác (có thể bỏ v1)             │
│  ─────────────────                    │
│  Tiểu sử          [__________ ↕]     │
│  Ghi chú          [__________ ↕]     │
│                                        │
├──────────────────────────────────────┤
│               [Huỷ]  [Lưu]           │
└────────────────────────────────────────┘
```

### Form state (internal)
```typescript
interface PersonFormData {
  displayName:  string
  gender:       'male' | 'female' | 'unknown'
  isAlive:      boolean

  // Tab Tên
  nameBirth?:   string
  nameNickname?: string
  nameCourtesy?: string
  nameTaboo?:   string
  nameSino?:    string

  // Tab Ngày tháng
  birthDate?:   PartialDate
  birthPlace?:  string
  deathDate?:   PartialDate
  deathPlace?:  string

  // Tab Khác
  bio?:         string
  notes?:       string
}
```

### Validation
- `displayName` không được rỗng
- Nếu `isAlive = false`, không bắt buộc `deathDate`
- Năm không được âm hoặc > năm hiện tại + 1
- Nếu có `deathDate.year` và `birthDate.year`: `death >= birth`

### Submit logic
```typescript
function handleSubmit(formData: PersonFormData, props: PersonFormProps) {
  let updatedDoc = props.doc

  if (props.mode === 'edit') {
    updatedDoc = updatePerson(updatedDoc, props.personId!, mapFormToPerson(formData))
  } else if (props.mode === 'add-child') {
    const person = mapFormToNewPerson(formData)
    // 1. addPerson → thêm vào persons[], thêm vào parentFamily.childIds
    updatedDoc = addPerson(updatedDoc, person, props.parentFamilyId)
    // 2. addFamilyUnit → tạo family entry cho người mới
    const parentGen = doc.families.find(f => f.id === props.parentFamilyId)?.generation ?? 1
    updatedDoc = addFamilyUnit(updatedDoc, person.id, parentGen + 1)
  } else if (props.mode === 'add-spouse') {
    updatedDoc = setSpouse(updatedDoc, props.familyId!, mapFormToNewPerson(formData))
  }

  props.onSubmit(touchUpdatedAt(updatedDoc))
}
```

---

## 5. DateInput

### Props
```typescript
interface DateInputProps {
  value?:    PartialDate
  onChange:  (v: PartialDate | undefined) => void
  disabled?: boolean
}
```

### Layout

```
Solar ●  Lunar ○
Năm [____]  Tháng [__]  Ngày [__]

--- Khi chọn Lunar: ---
Solar ○  Lunar ●
Năm [____]  Tháng [__]  Ngày [__]  [☐ Tháng nhuận]

  → Năm: Canh Tý (1900)
  → Dương lịch tương đương: 15/3/1900
```

### Logic chuyển đổi
```typescript
// Khi người dùng nhập lunar đủ (year + month + day) → tính solar
function lunarToSolar(year: number, month: number, day: number, leapMonth: boolean): {year,month,day} | null {
  try {
    const ld = new LunarDate({ day, month, year, leap: leapMonth })
    ld.init()
    const solar = ld.toSolarDate()
    return { year: solar.year, month: solar.month, day: solar.day }
  } catch {
    return null  // ngày không hợp lệ (vd tháng nhuận không tồn tại năm đó)
  }
}

// Can-Chi từ năm âm lịch
function getCanChi(lunarYear: number): string {
  const ld = new LunarDate({ day: 1, month: 1, year: lunarYear })
  ld.init()
  return ld.getYearName()  // "Canh Tý", "Nhâm Thìn"...
}
```

### Xử lý partial date
- Chỉ có năm → hợp lệ (`month` và `day` = undefined)
- Có tháng nhưng không có ngày → hợp lệ
- Xoá hết năm → `onChange(undefined)`

---

## 6. Nút tương tác trên cây (FamilyTree.tsx)

Thêm hai nút nhỏ render bên cạnh mỗi node:

```
    [+]           ← "Thêm con" — dưới cặp vợ chồng (hoặc dưới badge collapse)
    [⊕]           ← "Thêm vợ/chồng" — chỉ hiện khi personId chưa có spouse
```

### Vị trí
```typescript
// Nút "Thêm con" — bên dưới badge collapse (hoặc dưới node nếu không có badge)
// Nút "Thêm vợ/chồng" — bên phải person nếu chưa có spouse
```

### Callback từ FamilyTree lên App
```typescript
interface FamilyTreeProps {
  document?:       FtreeDocument
  onPersonClick?:  (personId: string) => void
  onAddChild?:     (parentFamilyId: string) => void   // MỚI
  onAddSpouse?:    (familyId: string) => void          // MỚI
}
```

---

## 7. Tích hợp vào App.tsx

```typescript
// App.tsx (web-app và electron-app giống nhau)

const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
const [formMode, setFormMode] = useState<
  | { type: 'add-child';  parentFamilyId: string }
  | { type: 'add-spouse'; familyId: string }
  | { type: 'edit';       personId: string }
  | null
>(null)

function handleFormSubmit(updatedDoc: FtreeDocument) {
  setDoc(updatedDoc)
  setFormMode(null)
}

return (
  <>
    <FamilyTree
      document={doc}
      onPersonClick={setSelectedPersonId}
      onAddChild={parentFamilyId => setFormMode({ type: 'add-child', parentFamilyId })}
      onAddSpouse={familyId      => setFormMode({ type: 'add-spouse', familyId })}
    />

    {selectedPersonId && (
      <PersonPanel
        personId={selectedPersonId}
        doc={doc}
        onClose={() => setSelectedPersonId(null)}
        onEdit={id => setFormMode({ type: 'edit', personId: id })}
        onDelete={id => setDoc(deletePerson(doc, id))}
        onAddChild={parentFamilyId => setFormMode({ type: 'add-child', parentFamilyId })}
        onAddSpouse={familyId      => setFormMode({ type: 'add-spouse', familyId })}
      />
    )}

    {formMode && (
      <PersonForm
        mode={formMode.type}
        doc={doc}
        personId={formMode.type === 'edit' ? formMode.personId : undefined}
        parentFamilyId={formMode.type === 'add-child'  ? formMode.parentFamilyId : undefined}
        familyId={formMode.type === 'add-spouse' ? formMode.familyId : undefined}
        onSubmit={handleFormSubmit}
        onClose={() => setFormMode(null)}
      />
    )}
  </>
)
```

---

## 8. Thứ tự implement

| Bước | File | Mô tả |
|------|------|-------|
| 1 | `mutations.ts` | Pure functions — không phụ thuộc UI |
| 2 | `DateInput.tsx` | Component đơn giản nhất, test được độc lập |
| 3 | `PersonForm.tsx` | Modal — dùng DateInput |
| 4 | `PersonPanel.tsx` | Sidebar — đơn giản vì read-only |
| 5 | `FamilyTree.tsx` | Thêm nút `+` và `⊕` |
| 6 | `App.tsx` | Kết nối state + tất cả components |

Bước 1-3 không phụ thuộc FamilyTree, có thể làm song song.

---

## 9. Styling

Không dùng CSS framework — inline styles để nhất quán với code hiện tại.

Palette chung:
- Primary (nút xác nhận, header): `#1e1b4b`
- Danger (xoá): `#dc2626`
- Background overlay: `rgba(0,0,0,0.4)`
- Panel/Modal bg: `#fff`
- Border: `#e5e7eb`
- Placeholder text: `#9ca3af`
