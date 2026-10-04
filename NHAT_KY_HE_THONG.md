# NHẬT KÝ HỆ THỐNG & HƯỚNG DẪN VẬN HÀNH BỘ CHỈ SỐ 766

> **Tài liệu lưu trữ nội bộ:** Ghi lại toàn bộ lịch sử thiết kế, các xử lý kỹ thuật, cơ chế vận hành và cách tra cứu của Hệ thống Theo dõi & Đánh giá Bộ Chỉ số 766 Cổng Dịch vụ công Quốc gia (Địa bàn tỉnh Đắk Lắk - Mã cơ quan: H15).

---

## I. MÔ HÌNH HOẠT ĐỘNG HIỆN TẠI (TỪ 25/09/2026)

Hệ thống hoạt động theo mô hình **Tách biệt An toàn (Local Only)**:

1. **Thu thập dữ liệu tự động (Cục bộ):**
   - Chạy định kỳ vào **06:00:00 sáng hàng ngày** và tự động chạy bù **khi mở máy/đăng nhập Windows** thông qua Windows Task Scheduler (`DVC766_DailySync`).
   - Dữ liệu thu thập từ Cổng DVCQG qua mạng VNPT trong nước, phân tích và lưu vào thư mục `data/snapshots/` trên máy tính.
   - **Tuyệt đối KHÔNG đẩy dữ liệu lên Vercel / Cloud Redis nữa.**

2. **Web xem dữ liệu nội bộ (Local Web):**
   - Chạy tại địa chỉ: **`http://localhost:3000`**
   - Hiển thị đầy đủ giao diện Dashboard, tổng điểm, 6 chỉ số, biểu đồ Radar, biểu đồ Xu hướng thời gian và danh sách 119 đơn vị trực thuộc.
   - Có nhãn nhận diện: `🟢 BẢN NỘI BỘ (LOCAL ONLY)`.

3. **Web công khai trên Vercel (`https://766-analyze.vercel.app`):**
   - Đã bật chế độ **Tạm dừng hoạt động (Lockdown)**.
   - Mọi người dùng khi truy cập vào link web sẽ thấy thông báo:
     > **"Hệ thống ngừng hoạt động cho tới khi có thông báo mới."**
   - Khóa chặt hoàn toàn, không có nút đăng nhập/xem tiếp, không hiển thị bất kỳ bảng điểm hay dữ liệu nào.
   - Mọi API trên Vercel (`/api/data`, `/api/crawl`, `/api/export`) đều trả về mã `503 Service Unavailable`.

---

## II. NHẬT KÝ CHI TIẾT CÁC THAY ĐỔI & SỬA LỖI (CHANGELOG)

### 1. Sửa lỗi lệch ngày múi giờ UTC+7 (19/09/2026)
* **Hiện tượng:** Task Scheduler chạy thành công lúc 6h sáng ngày 19/09 nhưng dữ liệu bị ghi đè vào ngày 18/09, không xuất hiện ngày 19/09.
* **Nguyên nhân:** Hàm `toISOString()` chuẩn trả về giờ UTC (0h). Vào lúc 6:00:02 AM giờ Việt Nam (UTC+7), giờ UTC mới là 23:00:02 ngày hôm trước (18/09), khiến hàm cắt chuỗi lấy nhầm ngày cũ.
* **Xử lý:** Cập nhật hàm tính ngày trong `src/analyzer.js` sử dụng chuẩn múi giờ Việt Nam:
  ```javascript
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
  ```

### 2. Sửa lỗi lỡ lịch Task Scheduler khi máy tính tắt/ngủ (21/09/2026)
* **Hiện tượng:** Lúc 6h00 sáng máy tính chưa bật, khi người dùng mở máy lúc 8h00 thì Task Scheduler không tự chạy bù.
* **Nguyên nhân:** Cấu hình Task Scheduler mặc định là `Interactive only` (chỉ chạy khi đang đăng nhập), có tùy chọn `Stop on battery` (ngừng khi dùng pin) và chưa kích hoạt trigger đăng nhập.
* **Xử lý:**
  - Thêm trigger phụ: **`At log on of any user`** (cứ mở máy là tự kích hoạt kiểm tra).
  - Tích chọn: **`Run task as soon as possible after a scheduled start is missed`** (chạy bù ngay nếu bị lỡ giờ).
  - Bỏ chọn: `Start the task only if the computer is on AC power` (laptop dùng pin vẫn chạy được).

### 3. Xóa dữ liệu lỗi ngày 18/09/2026 (21/09/2026)
* **Xử lý:**
  - Bổ sung hàm `storage.deleteSnapshot(date)` để xóa sạch snapshot `2026-09-18.json` trên máy và xóa khóa `dvc:snapshot:2026-09-18` trên Upstash Redis.
  - Cập nhật danh sách ngày, biểu đồ xu hướng nối liền mạch từ ngày 17 -> 19 -> 21.

### 4. Chuyển đổi sang Chế độ Local Only & Khóa Vercel (25/09/2026)
* **Yêu cầu:** Mỗi ngày vẫn chạy job lấy dữ liệu chạy web local, không đẩy lên Vercel nữa; Web công khai hiển thị thông báo ngừng hoạt động.
* **Xử lý:**
  - Cấu hình `SYNC_LOCAL_ONLY=true` trong `sync-to-cloud.js`, `src/storage.js` và `.env` để ngắt hoàn toàn kết nối với Upstash Redis.
  - Xóa sạch dữ liệu đã lưu trước đó trên Upstash Redis để tránh lộ lọt thông tin.
  - Thêm `data/snapshots/` và `data/history.json` vào `.gitignore` để không bao giờ bị đẩy lên GitHub/Vercel.
  - Xóa bỏ lịch cron trong `vercel.json`.
  - Khóa toàn bộ các API endpoint trên Vercel (`api/data.js`, `api/crawl.js`, `api/cron.js`, `api/export.js`).
  - Thiết kế màn hình khóa trên Web Vercel:
    - Bỏ tên cơ quan, bỏ mô tả dài dòng theo yêu cầu ngày 25/09.
    - Chỉ giữ: Biểu tượng huy hiệu, nhãn `THÔNG BÁO TẠM DỪNG HOẠT ĐỘNG`, khung chính: **"Hệ thống ngừng hoạt động cho tới khi có thông báo mới."** và chân trang `Trân trọng thông báo!`.

### 5. Khắc phục lỗi mạng chập chờn khi vừa bật máy (29/09/2026)
* **Hiện tượng:** Cột chỉ số *Công khai, minh bạch* bị 0.00 điểm ở tất cả các đơn vị.
* **Nguyên nhân:** Lúc 7:54 sáng khi người dùng vừa mở máy, Windows kích hoạt job ngay khi Wi-Fi/Internet chưa kịp cấp IP, khiến chỉ số đầu tiên bị lỗi mạng (`fetch failed`), sau đó các chỉ số sau mới có mạng. Snapshot thiếu (5/6 chỉ số) đã ghi đè lên snapshot đầy đủ 6/6 của lúc 6h sáng.
* **Xử lý trong `sync-to-cloud.js`:**
  - Bổ sung hàm `waitForNetwork()`: Tự động thăm dò kết nối Internet tối đa 30 giây khi máy vừa khởi động trước khi bắt đầu cào số liệu.
  - Bổ sung cơ chế **Bảo vệ dữ liệu**: Nếu một lần chạy nào bị thiếu chỉ số (< 6/6), hệ thống sẽ tự động giữ nguyên dữ liệu hoàn chỉnh đã có trong ngày, tuyệt đối không ghi đè.

### 6. Tối ưu khởi chạy Web Local (30/09/2026)
* **Vấn đề:** Khi tắt cửa sổ dòng lệnh cmd đen thì Web server ở port 3000 bị tắt theo.
* **Xử lý:**
  - Tạo file **`run-local-web-silent.vbs`**: Chạy Web Server ngầm hoàn toàn dưới nền Windows (không hiện bất kỳ cửa sổ cmd nào) và tự động mở trình duyệt `http://localhost:3000`.

---

## III. HƯỚNG DẪN VẬN HÀNH DÀNH CHO CÁN BỘ / QUẢN TRỊ VIÊN

### 1. Xem dữ liệu trên máy tính (Local Web)
* **Cách nhanh nhất (Khuyên dùng):**
  - Nhấp đúp chuột vào file: **`run-local-web-silent.vbs`**
  - Hệ thống sẽ tự động khởi động server ngầm và mở ngay trang web tại: **`http://localhost:3000`**.
* **Cách qua cửa sổ lệnh:**
  - Nhấp đúp vào file: **`run-local-web.bat`** (thu nhỏ cửa sổ xuống Taskbar, không tắt).

### 2. Thu thập dữ liệu thủ công (Cập nhật điểm ngay lập tức)
* Mặc định hệ thống đã tự chạy lúc 6h00 sáng mỗi ngày. Nếu trong ngày anh/chị muốn cập nhật số liệu mới nhất ngay:
  - Nhấp đúp chuột vào file: **`run-sync.bat`**
  - Hoặc mở PowerShell/CMD gõ: `npm run sync`
  - Quá trình thu thập sẽ hoàn tất sau khoảng 5 - 7 giây.

### 3. Tra cứu vị trí lưu trữ dữ liệu
* **File số liệu từng ngày:** Nằm trong thư mục `data/snapshots/` (dạng `YYYY-MM-DD.json`).
* **Nhật ký các lần chạy:** Nằm trong file `data/sync.log`.

---

## IV. BẢNG MÔ TẢ CÁC TẬP TIN CỐT LÕI

| Tập tin | Chức năng chính |
| :--- | :--- |
| `dev-server.js` | Web Server nội bộ (Express) chạy ở port 3000 phục vụ xem dashboard cục bộ. |
| `sync-to-cloud.js` | Script điều phối thu thập 6 chỉ số, phân tích điểm và lưu snapshot vào máy. |
| `run-sync.bat` | File thực thi tiến trình thu thập dữ liệu (được Task Scheduler gọi hàng ngày). |
| `run-sync-silent.vbs` | File VBScript giúp Task Scheduler chạy `run-sync.bat` ngầm không giật màn hình. |
| `run-local-web.bat` | File bật server web local và tự mở trình duyệt. |
| `run-local-web-silent.vbs` | File bật server web local chạy ngầm hoàn toàn (không hiện cửa sổ cmd). |
| `src/collector.js` | Module kết nối Cổng DVCQG, vượt tường lửa Anti-WAF và thu thập 6 nhóm chỉ số. |
| `src/analyzer.js` | Module tính toán điểm số tỉnh và xếp hạng 119 đơn vị trực thuộc. |
| `src/storage.js` | Module quản lý đọc/ghi snapshot cục bộ (chế độ Local Only). |
| `src/excelGenerator.js` | Module xuất báo cáo Excel 3 Sheet theo mẫu chuẩn. |
| `public/` | Mã nguồn giao diện Web Frontend (HTML, CSS, JS). |
| `data/snapshots/` | Thư mục lưu snapshot dữ liệu lịch sử từng ngày (không đẩy lên mạng). |
| `.env` | File cấu hình môi trường hệ thống. |
| `vercel.json` | Cấu hình triển khai Vercel (đã khóa mọi truy cập công khai). |
