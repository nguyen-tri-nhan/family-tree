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
