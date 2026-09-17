# Hệ thống Theo dõi & Phân tích Bộ Chỉ số 766 DVCQG (Deploy Vercel Miễn phí)

Hệ thống tự động thu thập, phân tích và báo cáo 6 nhóm chỉ số đánh giá chất lượng phục vụ người dân, doanh nghiệp trong thực hiện thủ tục hành chính, dịch vụ công theo **Quyết định số 766/QĐ-TTg ngày 23/06/2022 của Thủ tướng Chính phủ** từ Cổng Dịch vụ công Quốc gia (`dichvucong.gov.vn`).

---

## 🎯 Tính năng Nổi bật

1. **Thu thập tự động 6h sáng mỗi ngày (Cronjob)**:
   - Tự động gọi đồng thời 6 API theo đúng cấu hình Postman:
     - 1. **Công khai, minh bạch** (`transparency`): Tối đa 18 điểm
     - 2. **Tiến độ giải quyết** (`dvc-progress-tree`): Tối đa 20 điểm
     - 3. **Dịch vụ công trực tuyến** (`provide-online-tree`): Tối đa 12 điểm
     - 4. **Số hóa hồ sơ** (`dossier-digitized`): Tối đa 22 điểm
     - 5. **Thanh toán trực tuyến** (`formality-online-payment-tree`): Tối đa 10 điểm
     - 6. **Mức độ hài lòng** (`handling-satisfaction`): Tối đa 18 điểm
   - **Tổng điểm chuẩn: 100 điểm**.
2. **Lưu trữ dữ liệu theo ngày**:
   - Lưu trữ bản chụp (snapshot) JSON riêng biệt theo từng ngày (`data/snapshots/YYYY-MM-DD.json`).
   - Hỗ trợ lưu trữ bền vững trên đám mây với **Upstash Redis Free** khi deploy lên Vercel.
3. **Giao diện Web Dashboard Trực quan**:
   - Tổng điểm toàn tỉnh, tỷ lệ hoàn thành, xếp loại (*Xuất sắc, Tốt, Khá, Trung bình, Yếu*).
   - Biểu đồ Radar 6 chỉ số so sánh thực tế vs tối đa.
   - Biểu đồ xu hướng điểm số theo thời gian (Trend).
   - Bảng xếp hạng và tra cứu **119 đơn vị trực thuộc** (Sở, Ban, Ngành, UBND cấp huyện, xã) có tìm kiếm, phân loại và phân trang.
   - Modal xem chi tiết từng tiêu chí thành phần (tử số, mẫu số, tỷ lệ, điểm số).
4. **Tự động xuất Báo cáo Excel 3 Trang tính (`.xlsx`)**:
   - **Sheet 1**: Tổng quan Bộ Chỉ số 766 toàn tỉnh.
   - **Sheet 2**: Bảng kê chi tiết từng tiêu chí thành phần.
   - **Sheet 3**: Bảng xếp hạng chi tiết 119 đơn vị trực thuộc.
   - Tạo trực tiếp và tải về ngay lập tức qua nút "Tải Báo cáo Excel".
5. **Nút "Thu thập dữ liệu ngay"**:
   - Cho phép quản trị viên bấm cập nhật dữ liệu mới nhất bất kỳ lúc nào mà không cần chờ đến 6h sáng.

---

## 🚀 Hướng dẫn Cài đặt & Chạy Cục bộ (Local)

### 1. Yêu cầu hệ thống
- Node.js version 18 trở lên (Khuyến nghị Node.js v20 hoặc v22).

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Khởi động Web Server
```bash
npm run dev
# hoặc
npm start
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

- Server cục bộ tự động tích hợp cronjob chạy lúc **06:00:00 sáng mỗi ngày**.
- Dữ liệu snapshot JSON sẽ lưu tại: `data/snapshots/`.
- File Excel báo cáo lưu tại: `data/reports/`.

---

## ☁️ Hướng dẫn Deploy Lên Vercel Hoàn Toàn Miễn Phí

Dự án đã được đóng gói chuẩn **Vercel Serverless & Vercel Cron**:

### Bước 1: Đẩy mã nguồn lên GitHub
1. Khởi tạo Git repository và commit mã nguồn:
   ```bash
   git init
   git add .
   git commit -m "Initial commit DVCQG 766 Analyzer"
   ```
2. Đẩy lên GitHub (Repository Public hoặc Private đều được Vercel hỗ trợ miễn phí).

### Bước 2: Import dự án vào Vercel
1. Đăng nhập [vercel.com](https://vercel.com).
2. Bấm **Add New** -> **Project** -> Chọn repository vừa tạo.
3. Vercel sẽ tự động nhận diện cấu hình trong file `vercel.json`. Bấm **Deploy**.

### Bước 3: Kích hoạt Lưu trữ Miễn phí (Upstash Redis)
Để Vercel lưu trữ dữ liệu bền vững qua các ngày (vì Vercel Serverless không giữ file cục bộ):
1. Trên Vercel Dashboard của dự án, vào mục **Storage**.
2. Chọn **Upstash** (gói Free Hobby: 10.000 requests/ngày, 256MB lưu trữ miễn phí trọn đời).
3. Bấm **Connect to Project**. Vercel sẽ tự động điền các biến môi trường:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
4. Hệ thống trong `src/storage.js` sẽ tự động nhận diện và chuyển sang lưu trữ đám mây!

### Bước 4: Kiểm tra Vercel Cron (6h sáng VN)
Trong file `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 23 * * *"
    }
  ]
}
```
*Lưu ý: `0 23 * * *` theo giờ UTC chính là **06:00:00 sáng giờ Việt Nam (UTC+7)**.*
Vercel sẽ tự động kích hoạt API `/api/cron` vào đúng 6h sáng mỗi ngày!

---

## 📂 Cấu trúc Dự án

```text
766-Analyze/
├── api/                     # Vercel Serverless Functions
│   ├── cron.js              # Endpoint được Vercel Cron gọi lúc 6h sáng
│   ├── crawl.js             # API kích hoạt thu thập thủ công (nút Chạy ngay)
│   ├── data.js              # API lấy dữ liệu mới nhất hoặc theo ngày
│   └── export.js            # API xuất Excel động (.xlsx) tải về máy
├── public/                  # Website Dashboard tĩnh
│   ├── index.html           # Giao diện Dashboard chuẩn công vụ
│   ├── styles.css           # Vanilla CSS hiện đại, responsive
│   └── app.js               # Logic giao diện, Chart.js, bảng xếp hạng
├── src/                     # Core Business Logic
│   ├── config.js            # Cấu hình 6 API & Department ID Đắk Lắk
│   ├── collector.js         # Thu thập 6 API từ Cổng DVCQG
│   ├── analyzer.js          # Tính tổng điểm (/100) & xếp hạng 119 đơn vị
│   ├── storage.js           # Adapter lưu trữ: File (Local) hoặc Redis (Vercel)
│   └── excelGenerator.js    # Tạo file Excel chuyên nghiệp 3 Sheets
├── data/                    # Thư mục lưu trữ cục bộ
│   ├── snapshots/           # File JSON theo ngày (YYYY-MM-DD.json)
│   └── reports/             # File Excel theo ngày
├── dev-server.js            # Server chạy thử nghiệm tại máy cục bộ (node-cron)
├── vercel.json              # Cấu hình Vercel Cron và routing
└── package.json             # Danh sách thư viện phụ thuộc
```

---

## 📜 Căn cứ Pháp lý
- **Quyết định số 766/QĐ-TTg ngày 23/06/2022 của Thủ tướng Chính phủ** phê duyệt Bộ chỉ số chỉ đạo, điều hành và đánh giá chất lượng phục vụ người dân, doanh nghiệp trong thực hiện thủ tục hành chính, dịch vụ công theo thời gian thực trên môi trường điện tử.
- Dữ liệu được trích xuất trực tiếp từ Cổng Dịch vụ công Quốc gia: `https://dichvucong.gov.vn`.
