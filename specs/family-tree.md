# Cây Gia Phả — Product Spec

## Ứng dụng là gì

**Cây Gia Phả** là ứng dụng web giúp một cá nhân hoặc gia đình xây dựng, lưu trữ và khám phá cây phả hệ của dòng họ mình.

Người dùng có thể thêm các thành viên, ghi lại thông tin cá nhân của từng người, và xem mạng lưới quan hệ huyết thống dưới dạng đồ thị trực quan — thay vì giữ trong trí nhớ, sổ tay hay file Excel rời rạc.

---

## Tại sao cần xây dựng

Thông tin phả hệ của hầu hết gia đình Việt Nam đang bị phân tán và mất dần:

- Người lớn tuổi nắm giữ ký ức nhưng chưa được ghi chép lại có hệ thống.
- Thế hệ trẻ không có công cụ dễ dùng để tra cứu hay bổ sung thông tin.
- Các công cụ hiện có (Ancestry, MyHeritage) được thiết kế cho người phương Tây, không phù hợp với cấu trúc phả hệ và văn hóa đặt tên của người Việt.

Ứng dụng này giải quyết bài toán đó cho một gia đình cụ thể: lưu trữ tập trung, dễ tra cứu, dễ bổ sung.

---

## Người dùng mục tiêu

Một cá nhân trong gia đình — thường là người có trách nhiệm hoặc quan tâm đến việc lưu giữ gia sử — tự quản lý toàn bộ dữ liệu. Các thành viên khác có thể được chia sẻ quyền xem.

---

## Tính năng cốt lõi

### 1. Hiển thị cây trực quan
- Vẽ cây phả hệ dạng đồ thị, phân cấp theo thế hệ.
- Hỗ trợ zoom in/out và điều hướng trên cây lớn.
- Làm nổi bật một nhánh hoặc một cá nhân khi chọn.

### 2. Hồ sơ thành viên
Mỗi thành viên có một hồ sơ gồm:
- Họ tên, tên thường gọi (bí danh trong gia đình)
- Ngày sinh, ngày mất (nếu có), nơi sinh
- Ảnh đại diện
- Nghề nghiệp, tiểu sử ngắn
- Quan hệ: cha/mẹ, vợ/chồng, con cái

### 3. Tìm kiếm & khám phá quan hệ
- Tìm thành viên theo tên.
- Chọn hai người bất kỳ và xem đường quan hệ nối giữa họ (ví dụ: "A là anh họ con của B").
- Lọc theo thế hệ, nhánh gia đình.

---

## Cấu trúc dữ liệu

Dùng mô hình **Family Unit**: tách `Person` và `Family` thành hai entity riêng.
Mỗi `Family` đại diện cho một cuộc hôn nhân và giữ danh sách con cái.

```ts
interface Person {
  id: string
  name: string
  nickname?: string          // tên gọi trong gia đình
  gender: 'male' | 'female'
  birth?: PartialDate
  death?: PartialDate
  birthPlace?: string
  occupation?: string
  bio?: string
  photoUrl?: string
}

interface PartialDate {
  year?: number              // chỉ cần biết năm là đủ
  month?: number
  day?: number
}

interface Family {
  id: string
  husbandId?: string         // nullable — có thể chỉ biết một bên
  wifeId?: string
  marriageYear?: number
  childIds: string[]
}
```

**Tại sao không dùng parent pointer (`fatherId`, `motherId` trên Person)?**
Nếu một người lấy vợ/chồng nhiều lần, parent pointer không phân biệt được con thuộc cuộc hôn nhân nào.
Family Unit giải quyết điều đó: mỗi hôn nhân = một `Family` riêng.

**Các truy vấn thường dùng:**

```ts
// Cha mẹ của một người
families.find(f => f.childIds.includes(personId))

// Anh chị em ruột
family.childIds.filter(id => id !== personId)

// Tất cả con cái của một người
families
  .filter(f => f.husbandId === personId || f.wifeId === personId)
  .flatMap(f => f.childIds)
```

Cấu trúc này tương thích với chuẩn **GEDCOM** — nếu sau này cần import/export dữ liệu phả hệ từ các công cụ khác sẽ không phải đổi mô hình.

---

## Ngoài phạm vi (v1)

- Cộng tác nhiều người cùng chỉnh sửa đồng thời.
- Import/export GEDCOM (định dạng chuẩn phả hệ).
- Tích hợp AI tự động nhận diện quan hệ.
- Mobile app native.

---

## Chỉ số thành công

- Người dùng nhập đủ 3 thế hệ trong một phiên làm việc đầu tiên mà không cần hướng dẫn.
- Tìm được quan hệ giữa hai thành viên bất kỳ trong vòng 30 giây.
