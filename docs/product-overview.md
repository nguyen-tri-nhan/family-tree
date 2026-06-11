# Cây Gia Phả — Product Overview

## Vấn đề

Người Việt có truyền thống ghi chép gia phả hàng trăm năm, nhưng hầu hết gia đình hiện nay đang lưu thông tin bằng:

- Sổ tay viết tay — dễ thất lạc, hư hỏng, khó chia sẻ
- File Word / Excel — không có cấu trúc, không thể hình dung mối quan hệ
- Ứng dụng nước ngoài (Ancestry, MyHeritage) — giao diện tiếng Anh, không hiểu văn hoá Việt (thứ bậc, cách xưng hô, âm lịch, tên húy, tước hiệu)

Kết quả: ký ức gia đình bị mất dần theo thế hệ.

---

## Giải pháp

**Cây Gia Phả** là ứng dụng desktop dành riêng cho người Việt — xây dựng, lưu trữ và khám phá gia phả dòng họ với đầy đủ văn hoá và ngôn ngữ Việt.

---

## Đối tượng khách hàng

| Phân khúc | Đặc điểm | Nhu cầu cốt lõi |
|---|---|---|
| **Cá nhân** | 25–55 tuổi, muốn ghi lại nguồn gốc gia đình | Dễ dùng, không cần kỹ thuật |
| **Trưởng tộc / Ban gia phả** | Người được giao quản lý gia phả dòng họ | Nhiều nhánh, nhiều đời, xuất bản được |
| **Nhà nghiên cứu** | Sử học, dân tộc học | Dữ liệu chính xác, xuất được định dạng chuẩn |

---

## Tính năng nổi bật

### Sơ đồ cây tương tác
Visualisation D3.js với layout tự động — cuộn, zoom, click để xem chi tiết từng người.

### Dữ liệu thuần Việt
- Ngày sinh/mất theo **âm lịch** lẫn dương lịch
- Tên khai sinh, tên thường gọi, **tên húy**, tên tự, chữ Hán
- Học hàm, chức tước, thành tích
- Hỗ trợ **đa thê** (ghi nhận đầy đủ các đời vợ/chồng)

### Tính quan hệ tự động
Nhập 2 người, hệ thống tự tính và hiển thị cách xưng hô chính xác theo vùng miền:
- **Miền Nam**: Ba/Má, Cô/Chú/Bác, Cậu/Dì…
- **Miền Bắc**: Bố/Mẹ, Bác/Cô/Chú, Cậu/Dì…

### Bảo mật dữ liệu
File `.ftree` mã hoá **AES-256-GCM** — dữ liệu gia đình không lên cloud, không qua server bên thứ ba.

### Xuất & chia sẻ
Xuất PDF, SVG hoặc ảnh PNG để in ấn hoặc chia sẻ trong dịp giỗ, họp dòng tộc.

---

## Lợi thế cạnh tranh

| | Cây Gia Phả | Ancestry / MyHeritage | Word / Excel |
|---|---|---|---|
| Giao diện tiếng Việt | ✅ | ❌ | ✅ |
| Hiểu văn hoá Việt | ✅ | ❌ | ❌ |
| Tính quan hệ tự động | ✅ | Hạn chế | ❌ |
| Âm lịch | ✅ | ❌ | Thủ công |
| Lưu trữ cloud cho nhiều dòng họ | ✅ *(roadmap)* | ✅ | ❌ |
| Dùng offline, không phụ thuộc cloud | ✅ | ❌ | ✅ |
| Sơ đồ cây trực quan | ✅ | ✅ | ❌ |

---

## Mô hình phân phối

Hai hình thức song song:

- **Desktop** (Windows + macOS) — file `.ftree` mã hoá cục bộ, không cần internet, không tài khoản
- **Cloud** *(roadmap)* — nhiều dòng họ cùng lưu trữ, thành viên đăng nhập từ bất kỳ thiết bị nào mà không phụ thuộc vào file

**Bản beta hiện tại**: mã nguồn mở để cộng đồng dùng thử và đóng góp phản hồi.
**Bản chính thức**: mã nguồn đóng.

---

## Trạng thái hiện tại

- ✅ Core engine hoàn chỉnh (D3 layout, kinship engine, multi-marriage)
- ✅ Mã hoá file AES-256-GCM
- ✅ Xuất PDF / SVG / PNG
- ✅ Hỗ trợ âm lịch, tên húy, chức tước
- 🔄 Đang hoàn thiện UX và kiểm thử thực tế với dữ liệu gia đình thật
