# Use Cases — Cây Gia Phả (Version 1)

Mục đích: liệt kê các use case cụ thể để ưu tiên cho v1. Đánh dấu **[v1]** là làm ngay, **[v2]** là để sau.

---

## 1. Xem cây gia phả

### UC-01 Xem cây toàn bộ dòng họ **[v1]**
- Hiển thị T-connection tree từ ông tổ xuống các đời
- Zoom in/out, kéo để pan
- Phân biệt rõ con ruột vs dâu/rể bằng vị trí trái/phải

### UC-02 Lọc theo chi / nhánh **[v2]**
- Chọn xem "chỉ Chi I" hoặc "chỉ Chi Thứ Hai"
- Các chi khác mờ hoặc ẩn

### UC-03 Highlight đường huyết thống **[v2]**
- Click vào một người → tô màu toàn bộ đường từ người đó lên đến tổ tiên
- Hữu ích khi cây lớn để tìm mình thuộc dòng nào

### UC-04 Xem theo thế hệ **[v2]**
- Chế độ xem "Đời thứ N": hiển thị tất cả người cùng thế hệ ngang hàng
- Có thể lọc: "Đời 3" → chỉ hiện thế hệ thứ 3

---

## 2. Xem hồ sơ cá nhân

### UC-05 Xem thông tin cơ bản **[v1]**
- Click vào circle → panel/modal hiện ra
- Họ tên, năm sinh/mất, quê quán, ảnh

### UC-06 Xem công trạng & danh hiệu **[v1]**
- Hiển thị học vị (GS, TS...), chức vụ, huân chương
- Hiển thị dạng badge nổi bật trong card

### UC-07 Xem tiểu sử **[v2]**
- Mô tả cuộc đời dạng văn xuôi
- Timeline công việc theo năm

### UC-08 Xem ảnh **[v2]**
- Gallery ảnh đính kèm theo người
- Ảnh gia đình, ảnh cưới, ảnh lịch sử

---

## 3. Chỉnh sửa dữ liệu

### UC-09 Thêm người mới **[v1]**
- Form thêm người: tên, giới tính, năm sinh, năm mất
- Chọn vị trí trong cây: là con của ai, vợ/chồng của ai

### UC-10 Sửa thông tin người **[v1]**
- Sửa mọi field của Person
- Sửa học vị, công trạng (thêm/xóa/sửa từng item)

### UC-11 Thêm quan hệ hôn nhân **[v1]**
- Chọn 2 người → đánh dấu là vợ chồng
- Nhập ngày cưới (tùy chọn)

### UC-12 Thêm con cho một cặp **[v1]**
- Từ một FamilyUnit → thêm con mới hoặc link người đã có

### UC-13 Xóa người **[v2]**
- Xóa node: cần xử lý cẩn thận nếu người đó có con
- Cần confirmation + preview impact

### UC-14 Di chuyển người sang chi khác **[v2]**
- Trường hợp nhập sai chi, cần chuyển sang đúng vị trí

---

## 4. Quản lý dòng họ

### UC-15 Xem thông tin dòng họ **[v1]**
- Tên họ, quê gốc, năm khai tộc, nhà thờ họ
- Tổng số thành viên, số đời, số chi

### UC-16 Xem danh sách trưởng họ qua các thời kỳ **[v1]**
- Timeline: Ông A (1950–1975) → Ông B (1975–2003) → Ông C (2003–nay)

### UC-17 Xem danh sách nhân tài dòng họ **[v1]**
- Trang "Bảng vàng": liệt kê tất cả người có Title đặc biệt
- Lọc theo loại: Giáo sư, Tiến sĩ, Anh hùng, quan chức cao cấp...
- Sắp xếp theo đời / theo tên / theo năm được phong

### UC-18 Xem cơ cấu các chi **[v2]**
- Danh sách chi: tên, số thành viên, trưởng chi hiện tại, vùng định cư
- Cây nhỏ thể hiện mối quan hệ giữa các chi

### UC-19 Cập nhật trưởng họ / trưởng chi **[v2]**
- Ghi nhận ai đang là trưởng họ, từ năm nào
- Lưu lịch sử khi có thay đổi

---

## 5. Lưu trữ & chia sẻ

### UC-20 Lưu file .ftree (Electron) **[v1]**
- Lưu toàn bộ dữ liệu vào file mã hóa AES-256-GCM
- Chọn đường dẫn, nhập mật khẩu

### UC-21 Mở file .ftree **[v1]**
- Chọn file, nhập mật khẩu → giải mã → render cây

### UC-22 Lưu vào localStorage (Web) **[v1]**
- Base64 JSON → localStorage
- Cảnh báo nếu dữ liệu > 4MB (gần giới hạn)

### UC-23 Xuất ảnh cây gia phả **[v2]**
- Export SVG hoặc PNG độ phân giải cao
- Có thể in ra giấy A3/A4

### UC-24 Xuất PDF báo cáo dòng họ **[v2]**
- PDF có: trang bìa, danh sách thành viên, bảng vàng công trạng
- Dùng để in phát trong các buổi giỗ họ

### UC-25 Import từ file Excel **[v2]**
- Nhiều gia đình đang lưu thông tin trong Excel/Google Sheet
- Cần mapping cột → Person fields

### UC-26 Chia sẻ read-only link (Web) **[v3]**
- Upload lên cloud → ai có link có thể xem (không chỉnh sửa)
- Cần backend, để v3

---

## 6. Tìm kiếm & tra cứu

### UC-27 Tìm kiếm theo tên **[v1]**
- Search box → highlight node trên cây hoặc liệt kê kết quả
- Tìm kiếm không dấu: "nguyen van an" tìm được "Nguyễn Văn An"

### UC-28 Tìm đường quan hệ giữa 2 người **[v2]**
- Chọn người A và người B → hiện "B là chắt của A" hoặc "B là cháu gọi A bằng bác"
- Tính toán xưng hô theo vai vế

### UC-29 Lọc người đang sống / đã mất **[v2]**
- Toggle: hiện tất cả / chỉ người đang sống / chỉ người đã mất

---

## 7. Thống kê & insight

### UC-30 Dashboard tổng quan **[v2]**
- Tổng số thành viên
- Phân bố theo giới tính
- Phân bố theo độ tuổi / thế hệ
- Số người có học vị cao

### UC-31 Tuổi thọ trung bình **[v2]**
- Tính tuổi thọ TB của dòng họ
- So sánh giữa các chi, giữa các thế hệ

### UC-32 Bản đồ phân bố địa lý **[v3]**
- Chấm bản đồ nơi sinh/nơi ở của các thành viên
- Thấy rõ dòng họ di cư như thế nào qua các đời

---

## Ưu tiên v1 — Tóm tắt

| Nhóm | Use Cases |
|------|-----------|
| Xem cây | UC-01 (xem toàn bộ, zoom, pan) |
| Hồ sơ | UC-05 (thông tin cơ bản), UC-06 (công trạng/danh hiệu) |
| Chỉnh sửa | UC-09 (thêm người), UC-10 (sửa thông tin), UC-11 (thêm hôn nhân), UC-12 (thêm con) |
| Dòng họ | UC-15 (thông tin họ), UC-16 (lịch sử trưởng họ), UC-17 (bảng vàng nhân tài) |
| Lưu trữ | UC-20 (lưu .ftree), UC-21 (mở .ftree), UC-22 (localStorage web) |
| Tìm kiếm | UC-27 (tìm theo tên) |

**Tổng: 10 use cases cho v1** — đủ để ra một bản có giá trị thực tế cho một buổi họ họ.

---

## Câu hỏi cần làm rõ trước khi code

1. **Ai là người dùng chính?** Người cao tuổi (trưởng họ, thư ký họ) hay con cháu trẻ hơn?
   → Ảnh hưởng đến kích thước chữ, độ phức tạp UI

2. **Cây bao nhiêu người thì là "lớn"?** 50 người? 500 người? 5000 người?
   → Ảnh hưởng đến chiến lược render (SVG vs Canvas), phân trang cây

3. **Có cần đa ngôn ngữ không?** Việt/Hán (tên chữ Hán trong gia phả cổ)?

4. **Ai được phép sửa?** Một người duy nhất (trưởng họ) hay nhiều người cùng đóng góp?
   → Nếu nhiều người → cần conflict resolution khi merge, để v2

5. **Ảnh lưu ở đâu?** Trong file .ftree (base64, file to) hay link ngoài?
