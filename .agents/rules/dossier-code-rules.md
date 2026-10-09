# QUY TẮC ĐỊNH DẠNG VÀ PHÂN TÍCH SỐ HỒ SƠ TTHC

## 1. Cấu trúc tổng quát
Mã số hồ sơ thủ tục hành chính (TTHC) có dạng:
`{Mã định danh đơn vị}-{yymmdd}-{Số thứ tự trong ngày}`

*Ví dụ:* `H15.50.05.13-261008-0975`

### 3 thành phần cấu thành:
1. **Mã định danh của đơn vị:**
   - Ví dụ: `H15.50.05.13` (Trong đó `H15` là mã tỉnh Đắk Lắk, các số tiếp theo phân cấp đơn vị, sở ban ngành, UBND xã/phường).
2. **Thời gian tiếp nhận (yymmdd):**
   - Gồm 6 chữ số: 2 số năm (`yy`) - 2 số tháng (`mm`) - 2 số ngày (`dd`).
   - Ví dụ: `261008` biểu thị ngày 08 tháng 10 năm 2026.
3. **Số thứ tự trong ngày:**
   - **Cổng tỉnh:** Có **4 chữ số** (ví dụ: `0975`).
   - **Cổng bộ:** Có **6 hoặc 7 chữ số** (ví dụ: `090123`, `1800123`).

---

## 2. Quy tắc nhận diện hồ sơ Cổng Bộ (6 - 7 chữ số)
Đối với các hồ sơ từ Cổng Bộ, **2 chữ số đầu tiên** của phần số thứ tự quy định mã Bộ chủ quản:

| 2 chữ số đầu | Cơ quan Bộ chủ quản |
| :---: | :--- |
| `09` | **Bộ Nội vụ** (`09xxxx`) |
| `18` | **Bộ Y tế** (`18xxxx`) |
| `03` | **Bộ Giáo dục và Đào tạo** (`03xxxx`) |
| `10` | **Bộ Nông nghiệp và Môi trường** (`10xxxx`) |
| `17` hoặc `02` | **Bộ Xây dựng** (`17xxxx`, `02xxxx`) |
| `06` | **Bộ Khoa học và Công nghệ** (`06xxxx`) |
| `15` | **Bộ Tư pháp** (`15xxxx`) |
| `16` | **Bộ Văn hóa, Thể thao và Du lịch** (`16xxxx`) |
