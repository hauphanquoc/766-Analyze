# QUY TẮC CẤU TRÚC MÃ THỦ TỤC VÀ TẠO MÃ QR TRA CỨU TTHC

## 1. Cấu trúc Mã thủ tục hành chính
Mã thủ tục hành chính trên Cổng DVC Quốc gia có dạng:
`{Phân loại}.{Mã số}`

*Ví dụ:* `2.000206` (hoặc `1.000123`, `2.001456`, ...)

---

## 2. Đường link tra cứu chuẩn trên Cổng DVC Quốc gia
Đường dẫn tra cứu công khai trực tiếp cho người dân/doanh nghiệp:
```
https://dichvucong.gov.vn/tra-cuu-thu-tuc/danh-sach?keyword={MA_THU_TUC}&showAdvanced=false&formalityType=STANDARD&limit=10&activeKey=STANDARD
```

*Ví dụ với mã thủ tục `2.000206`:*
```
https://dichvucong.gov.vn/tra-cuu-thu-tuc/danh-sach?keyword=2.000206&showAdvanced=false&formalityType=STANDARD&limit=10&activeKey=STANDARD
```

---

## 3. Quy chuẩn tạo mã QR Thủ tục hành chính (có logo Đắk Lắk)
1. **Dữ liệu mã hóa:** Đường link tra cứu đầy đủ ở Mục 2.
2. **Cấp độ phục hồi lỗi (Error Correction Level):** Phải đặt mức **`H` (High ~ 30%)** để đảm bảo khả năng quét tức thì trên mọi camera điện thoại (Zalo, iOS, Android, Google Lens) khi có logo ở giữa.
3. **Logo ở giữa (Center Logo):**
   - Biểu trưng tỉnh Đắk Lắk: `icon-qr.png`.
   - Tỷ lệ kích thước logo: chiếm khoảng **20% - 22%** chiều rộng của mã QR.
   - Vòng đệm an toàn: Vẽ vòng tròn nền trắng (padding 6-8px) xung quanh logo để ngăn các module QR màu đen dính sát vào chi tiết đồ họa của biểu trưng.
