# Điều khoản sử dụng — Plan

## Tổng quan

- **Model**: Freemium (miễn phí có giới hạn, dự kiến có bản trả phí)
- **Hiển thị**: Modal lần đầu mở app (yêu cầu đồng ý) + trang `/#/terms` để xem lại
- **Ưu tiên pháp lý**: Sở hữu trí tuệ + Giới hạn trách nhiệm

---

## Kỹ thuật

### Các file mới

```
packages/tree-lib/src/
  pages/
    TermsPage.tsx       ← trang /#/terms (full text, static)
  components/
    TermsModal.tsx      ← modal lần đầu dùng app
```

### Router.tsx — thêm route

```tsx
{ path: '/terms', element: <TermsPage /> },
```

### TermsModal — logic hiển thị

Dùng `localStorage` key `ft-terms-v1` để track trạng thái:

```tsx
// Trong AppRoute (Router.tsx) — không phải trong App.tsx:
const [showTerms, setShowTerms] = useState(
  () => !localStorage.getItem('ft-terms-v1')
)

function handleAccept() {
  localStorage.setItem('ft-terms-v1', '1')
  setShowTerms(false)
}
```

- Key có version suffix (`ft-terms-v1`) → khi nội dung thay đổi, đổi key thành `ft-terms-v2` để force re-accept
- Modal render ON TOP mọi content — **không thể dismiss** bằng ESC hay click outside
- Hai nút: **"Đồng ý & Tiếp tục"** (lưu localStorage + đóng) và **"Xem đầy đủ ↗"** (navigate `/#/terms`, modal vẫn còn đó khi quay lại)
- Render trong `AppRoute`, không trong `App.tsx` — để không hiển thị khi đang ở `/#/terms` hay `/#/about`

### AboutPage — thêm link

```tsx
<Link to="/terms">Điều khoản sử dụng</Link>
```

---

## Nội dung điều khoản (tiếng Việt)

### Cấu trúc TermsPage

```
1. Giới thiệu
2. Chấp nhận điều khoản
3. Mô tả dịch vụ & giới hạn freemium
4. Sở hữu trí tuệ          ← ưu tiên cao
5. Giới hạn trách nhiệm     ← ưu tiên cao
6. Dữ liệu người dùng
7. Thay đổi điều khoản
8. Liên hệ
```

### §4 — Sở hữu trí tuệ

> Ứng dụng Cây Gia Phả, bao gồm toàn bộ mã nguồn, giao diện, thiết kế và tài liệu đi kèm, là tài sản trí tuệ độc quyền của **Nguyễn Trí Nhân**. Người dùng không được sao chép, phân phối, chỉnh sửa, dịch ngược (reverse engineer), hoặc tạo ra sản phẩm phái sinh từ ứng dụng này dưới bất kỳ hình thức nào khi chưa có sự cho phép bằng văn bản.

### §5 — Giới hạn trách nhiệm

> Ứng dụng được cung cấp "nguyên trạng" (as-is). Tác giả không chịu trách nhiệm đối với bất kỳ tổn thất nào phát sinh từ việc sử dụng ứng dụng, bao gồm nhưng không giới hạn: mất dữ liệu gia phả, lỗi phần mềm, hoặc thiệt hại gián tiếp. Người dùng có trách nhiệm sao lưu dữ liệu của mình.

### §3 — Freemium

> Phiên bản miễn phí giới hạn tối đa **200 thành viên** mỗi file gia phả. Các tính năng nâng cao có thể yêu cầu đăng ký bản trả phí trong tương lai. Tác giả có quyền thay đổi giới hạn này với thông báo trước.

### §6 — Dữ liệu người dùng

> Toàn bộ dữ liệu gia phả được lưu trữ cục bộ trên thiết bị của người dùng dưới dạng file `.ftree`. Ứng dụng không thu thập, truyền tải hay lưu trữ dữ liệu cá nhân lên bất kỳ server nào.

---

## TermsModal — UI tóm tắt

Modal hiển thị bản tóm tắt ngắn, không cần full text:

```
┌─────────────────────────────────────┐
│  Điều khoản sử dụng                 │
├─────────────────────────────────────┤
│  Trước khi sử dụng Cây Gia Phả,    │
│  vui lòng đọc và đồng ý với các    │
│  điều khoản sau:                    │
│                                     │
│  • Ứng dụng là tài sản trí tuệ     │
│    của tác giả, không được sao      │
│    chép hoặc phân phối lại.         │
│                                     │
│  • Tác giả không chịu trách nhiệm  │
│    về mất dữ liệu. Hãy tự sao lưu. │
│                                     │
│  • Bản miễn phí giới hạn 200 người │
│    mỗi file.                        │
│                                     │
│  • Dữ liệu lưu local, không lên    │
│    server.                          │
│                                     │
│  [Xem đầy đủ ↗]   [Đồng ý & Tiếp tục] │
└─────────────────────────────────────┘
```

---

## Lưu ý khi implement

- Version key `ft-terms-v1` → bump lên `ft-terms-v2` khi cập nhật nội dung đáng kể
- Ngôn ngữ: tiếng Việt là chính; có thể thêm bản tiếng Anh sau
- `TermsPage` là static, không cần access tree state
- Ngày hiệu lực ghi vào TermsPage: thêm constant `TERMS_EFFECTIVE_DATE`
