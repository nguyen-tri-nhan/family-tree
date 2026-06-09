# Enhancement v1

## 1. Sửa lỗi giật khi bấm vào node

**Triệu chứng**: Bấm vào một node thì màn hình bị zoom/pan đột ngột về vị trí khác.

**Nguyên nhân**: Đây là vấn đề React lifecycle, không phải highlight/pan.

1. Click node → `setSelected(personId)` → React re-render `App`
2. Re-render tạo lại các callback `onPersonClick`, `onAddChild`, `onAddSpouse` (inline functions, không có `useCallback`)
3. `FamilyTree` nhận props mới với references mới → `useEffect` chính (dependency array chứa các callback đó) chạy lại
4. Effect xóa và vẽ lại toàn bộ SVG → **zoom/pan transform bị reset về mặc định**

**Hướng xử lý**: Wrap `onPersonClick`, `onAddChild`, `onAddSpouse` bằng `useCallback` trong `App.tsx` để giữ stable references — effect D3 sẽ không re-run khi chỉ có UI state thay đổi.

File ảnh hưởng: `App.tsx`

---

## 2. Cây hai chiều (thêm cha/mẹ, tổ tiên)

**Triệu chứng**: Người đầu tiên được thêm vào chỉ có thể thêm con phía dưới, không có cách nào thêm cha/mẹ hoặc tổ tiên phía trên.

**Mục tiêu**: Cho phép chọn bất kỳ người nào làm điểm xuất phát. Từ người đó có thể thêm cả con cháu (xuống) lẫn cha mẹ, ông bà (lên trên).

**Nguyên nhân**: `FormMode` chỉ có `add-root | add-child | add-spouse`, không có `add-parent`. Giao diện không hiển thị nút "Thêm cha/mẹ".

**Hướng xử lý**:

| Thay đổi | File |
|---|---|
| Thêm `add-parent: { childPersonId: string }` vào union `FormMode` | `types.ts` |
| Thêm mutation `addParent(doc, childPersonId, parentInput)` — dịch chuyển tất cả generation hiện tại lên 1, tạo `FamilyUnit` mới ở generation 1 | `mutations.ts` |
| Hiện nút "Thêm cha / mẹ" trong `PersonPanel` khi người được chọn không có family cha mẹ (tra `childToParentFamily` trả về undefined) | `PersonPanel.tsx` |
| Xử lý `add-parent` trong submit handler của `PersonForm` | `PersonForm.tsx` |

`generation` là số nguyên nên không cần thay đổi schema — dịch chuyển tất cả lên 1 là thao tác an toàn.

---

## 3. Link tải desktop app trên web

**Mục tiêu**: Người dùng vào web app có thể thấy link tải phiên bản desktop (Windows / macOS).

**Hướng xử lý**: Thêm phần "Tải về máy tính" trong web app, trỏ tới trang GitHub Releases. Hiện 2 nút theo nền tảng:
- **Windows** — file `.exe`
- **macOS** — file `.dmg`

Không cần gọi GitHub API — link thẳng tới `https://github.com/nguyen-tri-nhan/family-tree/releases/latest`.

Vị trí đặt: màn hình chào (chưa mở file) hoặc banner cố định trên header.

File ảnh hưởng: `App.tsx` hoặc tạo component nhỏ `DownloadBanner.tsx`.

---

## 4. Dark mode

**Triệu chứng**: Toàn bộ màu sắc trong app được hard-code theo theme sáng (`#fff`, `#fef08a`, `#1e1b4b`...). Khi OS/browser đang ở dark mode, trình duyệt render nền tối nhưng app vẫn hiển thị nền trắng cục bộ — giao diện trông vá víu, không nhất quán.

**Mục tiêu**: App tự động theo dark/light mode của hệ thống (hoặc có toggle thủ công).

**Nguyên nhân**: Không sử dụng CSS custom properties; toàn bộ màu là inline style hard-code rải rác trong các component. Không có `prefers-color-scheme` media query.

**Hướng xử lý**:

### Bước 1 — CSS variables

Khai báo design tokens trong `index.css` (web-app) / global style:

```css
:root {
  --bg:           #ffffff;
  --bg-secondary: #f9fafb;
  --bg-card:      #ffffff;
  --border:       #e5e7eb;
  --text:         #1e1b4b;
  --text-muted:   #6b7280;
  --accent:       #fef08a;          /* header background */
  --accent-border:#fde047;
  --btn-primary:  #1e1b4b;
  --btn-primary-text: #ffffff;
  --btn-secondary:#e5e7eb;
  --btn-secondary-text: #374151;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:           #0f172a;
    --bg-secondary: #1e293b;
    --bg-card:      #1e293b;
    --border:       #334155;
    --text:         #f1f5f9;
    --text-muted:   #94a3b8;
    --accent:       #1e1b4b;
    --accent-border:#312e81;
    --btn-primary:  #6366f1;
    --btn-primary-text: #ffffff;
    --btn-secondary:#334155;
    --btn-secondary-text: #e2e8f0;
  }
}
```

### Bước 2 — Thay thế inline styles bằng CSS variables

Thay toàn bộ hard-code màu trong:
- `App.tsx` — header, welcome screen, buttons, overlay
- `PersonPanel.tsx`, `PersonForm.tsx`, `SearchBar.tsx`, `KinshipDrawer.tsx`, `ClanForm.tsx`
- `FamilyTree.tsx` — SVG node fill: nam dùng `var(--btn-primary)`, nữ giữ `#be185d` (hoặc token riêng)

### Bước 3 — (Tùy chọn) Toggle thủ công

Thêm nút 🌙 / ☀ trong header để override OS preference, lưu vào `localStorage`.

```ts
const [theme, setTheme] = useState<'auto' | 'dark' | 'light'>('auto')
// apply class 'dark' / 'light' lên document.documentElement
```

### Phạm vi ảnh hưởng

| File | Thay đổi |
|---|---|
| `web-app/src/index.css` | Khai báo CSS variables + dark media query |
| `electron-app/src/renderer/src/assets/index.css` | Tương tự |
| `tree-lib/src/App.tsx` | Dùng CSS variables thay inline style |
| `tree-lib/src/FamilyTree.tsx` | SVG node/link colors |
| `tree-lib/src/components/*.tsx` | Tất cả modal, panel, sidebar |

**Lưu ý**: Inline `style={{ color: '...' }}` không kế thừa CSS variables — cần chuyển sang `className` + CSS class, hoặc đọc variable qua `getComputedStyle` khi dùng trong D3/canvas.
