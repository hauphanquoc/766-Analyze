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

### 7. Cập nhật nhận diện Cải cách hành chính & Nội dung khuyến cáo (05/10/2026)
* **Logo & Favicon:** Thay đổi logo chính trên banner và favicon trình duyệt sang biểu trưng Cải cách hành chính (`Logo CCHC.png`).
* **Menu điều hướng:** Cập nhật mục "Công thức tính 766" thành *"Công thức tính 766 (Đang hoàn thiện)"*.
* **Khuyến cáo nguồn dữ liệu:**
  - Chỉnh sửa câu mô tả: *"Hệ thống cung cấp công cụ tổng hợp và các tiện ích nhằm phục vụ công tác theo dõi, kiểm soát thủ tục hành chính."*
  - Câu đối chiếu số liệu: *"Số liệu trên hệ thống mang tính chất theo dõi và tham khảo nội bộ. Cán bộ, cơ quan cần chủ động đối chiếu lại với số liệu thực tế trên Cổng DVCQG và các Hệ thống thông tin giải quyết TTHC."*
  - Tách câu: *"Vui lòng không sử dụng làm nguồn báo cáo chính thống."* xuống hàng riêng nổi bật với biểu tượng cảnh báo màu vàng cam.
* **Định dạng bảng:** Cố định nhãn xếp loại "Trung bình" và "Yếu kém" luôn nằm trên 1 dòng đơn (`white-space: nowrap`), không bị rớt dòng.

### 8. Xây dựng Tab "Xếp hạng 766 các tỉnh" & Lịch quét tự động 06h00 (05/10/2026)
* **Tính năng mới:** Bổ sung menu thứ 2 *"Xếp hạng 766 các tỉnh"* trên thanh điều hướng.
* **Nguồn dữ liệu:** Tích hợp API lấy số liệu điểm tổng hợp và 6 chỉ số thành phần của toàn bộ các tỉnh thành từ Cổng DVCQG (theo file `766 Tong Hop - Tat ca tinh.txt`).
* **Module xử lý:**
  - `src/provinceCollector.js`: Tự động gửi request, chuẩn hóa dữ liệu và tính toán thứ hạng toàn quốc cho 34 tỉnh/thành phố trên cả nước.
  - `api/provinces.js`: Cung cấp API phục vụ Web xem và tải số liệu.
* **Giao diện bảng xếp hạng:**
  - Highlight nổi bật hàng **UBND tỉnh Đắk Lắk** (màu xanh cyan `#38bdf8`) để dễ theo dõi vị trí cạnh tranh.
  - Hiển thị đầy đủ: Điểm số, xếp hạng và tỷ lệ/tử số của 6 nhóm chỉ số và tổng điểm.
  - Có ô tìm kiếm nhanh tỉnh/thành phố, nút Cập nhật dữ liệu và nút Xuất file Excel báo cáo xếp hạng.
  - Badge đầu bảng: *"Xếp hạng cấp tỉnh"*.
  - Đã bỏ 2 dòng comment ghi chú phía chân bảng theo yêu cầu.
* **Lịch tự động:** Đã cấu hình thu thập tự động **hàng ngày vào lúc 06:00:00 sáng** (trong `dev-server.js`, `sync-to-cloud.js`, `api/cron.js`), thay vì chỉ quét vào thứ 6.

### 9. Triển khai Hệ thống Đăng nhập & Phân quyền bảo vệ (05/10/2026)
* **Mô hình bảo mật:** Ứng dụng chuẩn JWT (HMAC-SHA256) và mã hóa mật khẩu PBKDF2 (SHA-512) bằng thư viện `crypto` native của Node.js:
  - Hoạt động siêu nhẹ (phản hồi ~30ms), tương thích hoàn hảo trên cả Vercel Serverless lẫn Local Server.
  - Không tốn thêm chi phí hay phụ thuộc dịch vụ ngoài.
* **Tài khoản khởi tạo sẵn:**
  - **Quản trị viên (Admin):** Tài khoản `admin` / Mật khẩu `Admin@766` (Quyền: `admin`).
  - **Cán bộ nghiệp vụ:** Tài khoản `canbo` / Mật khẩu `Canbo@766` (Quyền: `officer`).
  - Dữ liệu tài khoản lưu đồng bộ trên Upstash Redis (`dvc:users`) và file `data/users.json`.
* **Cơ chế phân quyền hiển thị (Clean View-Only khi chưa đăng nhập):**
  - **Khi CHƯA đăng nhập:**
    - Hệ thống ẩn hoàn toàn tính năng xem chi tiết như thể không tồn tại.
    - 6 thẻ chỉ số tỉnh: Nút *"Chi tiết tiêu chí"* bị ẩn hoàn toàn (`display: none !important`).
    - Bảng điểm 119 đơn vị: Toàn bộ con số hiển thị dạng **văn bản tĩnh (chỉ xem)**: không có con trỏ bàn tay pointer, không có hover sáng xanh, không có icon mũi tên, không có tooltip và không có sự kiện click (bấm vào không có phản ứng gì).
    - Góc phải Header hiển thị nút **"Đăng nhập"**.
  - **Khi ĐÃ đăng nhập:**
    - Header hiển thị: Avatar + Tên người dùng + Badge chức danh (`Quản trị viên` / `Cán bộ`) và nút **"Thoát"** (Đăng xuất).
    - 6 nút *"Chi tiết tiêu chí"* ở thẻ tỉnh tự động xuất hiện.
    - Toàn bộ điểm số ở bảng đơn vị chuyển sang chế độ tương tác (clickable): rê chuột có hover, click vào mở popup xem chi tiết từng tiêu chí con (Công khai minh bạch, Tiến độ giải quyết hồ sơ, Thanh toán trực tuyến 3 chỉ tiêu con...).
* **Hộp thoại đăng nhập (Modal Login):**
  - Tinh chỉnh giao diện hiện đại, bảo mật, có nút bật/tắt hiển thị mật khẩu.
  - Sửa lỗi lồng thẻ HTML, đưa modal ra ngoài container với `position: fixed; z-index: 99999; backdrop-filter: blur(6px)` để luôn hiển thị nổi bật giữa màn hình.

### 10. Phân tách Bảng Xếp hạng & Báo cáo Excel thành 2 nhóm Cấp Tỉnh và Cấp Xã (07/10/2026)
* **Vấn đề trước đây:** Bảng xếp hạng và báo cáo Excel đang gộp chung toàn bộ 116 đơn vị trực thuộc (cả Sở/Ban/Ngành cấp tỉnh lẫn UBND cấp xã/phường), khiến việc so sánh bị lẫn lộn giữa hai cấp hành chính có đặc thù quy mô và thẩm quyền khác nhau.
* **Xử lý trên Giao diện Web (Menu Bộ chỉ số 766):**
  - **Segmented Control Tabs phân nhóm:** Thiết kế bộ chuyển đổi tab trực quan ngay trên đầu bảng với huy hiệu đếm số lượng:
    - **🏛️ Cấp Tỉnh (14 đơn vị):** Hiển thị khối các Sở, Ban, Ngành trực thuộc UBND tỉnh Đắk Lắk.
    - **🏡 Cấp Xã (102 đơn vị):** Hiển thị khối UBND các xã, phường, thị trấn trên địa bàn tỉnh.
  - **Xếp hạng độc lập theo nhóm:**
    - Khối Cấp Tỉnh được đánh số thứ hạng độc lập từ **Hạng 1 đến Hạng 14** (Hạng 1: Sở Văn hóa, TT&DL; Hạng 2: Sở Xây dựng; Hạng 3: Sở Công Thương...).
    - Khối Cấp Xã được đánh số thứ hạng độc lập từ **Hạng 1 đến Hạng 102** (Hạng 1: UBND xã Ea Súp; Hạng 2: UBND xã Xuân Lãnh; Hạng 3: UBND xã Xuân Cảnh...).
  - **Tìm kiếm & Phân trang tối ưu:** Ô tìm kiếm tự động lọc theo nhóm đang chọn; khối Cấp Tỉnh hiển thị gọn gàng trên 1 trang; khối Cấp Xã phân trang 15 đơn vị/trang kèm điều hướng mượt mà.
  - **Banner thống kê:** Thẻ tổng hợp đầu trang hiển thị rõ ràng: `Đơn vị trực thuộc: 116 (14 Cấp Tỉnh • 102 Cấp Xã)`.
* **Xử lý trên Báo cáo Excel (`src/excelGenerator.js`):**
  - Tách Sheet 3 cũ thành **2 Sheet độc lập**:
    - **Sheet 3 (`3. Xếp hạng Cấp Tỉnh`):** Bảng xếp hạng và chi tiết điểm số của 14 Sở, Ban, Ngành cấp tỉnh với thứ hạng từ 1 đến 14.
    - **Sheet 4 (`4. Xếp hạng Cấp Xã`):** Bảng xếp hạng và chi tiết điểm số của 102 xã, phường, thị trấn với thứ hạng từ 1 đến 102.
  - Toàn bộ file Excel xuất ra đầy đủ 4 Sheet chuẩn mực, chuyên nghiệp, giữ nguyên định dạng thẩm mỹ và các công thức phân tích.

### 11. Bổ sung "Hệ thống mail công cụ" vào danh bạ các cổng Đắk Lắk (08/10/2026)
* **Yêu cầu:** Bổ sung thêm cổng **"Hệ thống mail công cụ"** (liên kết `https://mail.daklak.gov.vn/`) vào phần Tỉnh Đắk Lắk trong danh bạ các cổng.
* **Xử lý:**
  - Thêm thẻ `HỆ THỐNG MAIL CÔNG CỤ` vào danh sách `PORTAL_SECTIONS` nhóm Đắk Lắk trong `public/app.js`.
  - Thiết kế biểu tượng phong bì thư điện tử sắc nét, hiện đại chuẩn phong cách Gov-tech.
  - Tích hợp từ khóa tìm kiếm phong phú (`mail`, `cong cu`, `cong vu`, `thu dien tu`, `daklak`) trên ô tìm kiếm nhanh.
  - Cập nhật tự động bộ đếm số lượng lên 33 hệ thống trực tuyến.

### 12. Bổ sung Hệ thống Báo cáo tỉnh và Hệ thống Đất đai (VBDLIS) Đắk Lắk (08/10/2026)
* **Yêu cầu:** Bổ sung thêm 2 hệ thống vào phần Tỉnh Đắk Lắk trong danh bạ các cổng:
  1. **Hệ thống thông tin báo cáo tỉnh Đắk Lắk:** `https://baocao.daklak.gov.vn/`
  2. **Hệ thống thông tin đất đai (VBDLIS):** `https://dla.mplis.gov.vn/dc`
* **Xử lý:**
  - Thêm thẻ `HỆ THỐNG THÔNG TIN BÁO CÁO TỈNH ĐẮK LẮK` với biểu tượng tài liệu & biểu đồ thống kê chuyên nghiệp; từ khóa tìm kiếm (`bao cao`, `lrps`, `chi dao dieu hanh`).
  - Thêm thẻ `HỆ THỐNG THÔNG TIN ĐẤT ĐAI (VBDLIS)` với biểu tượng thửa đất quy hoạch địa chính và ghim tọa độ trắc địa; từ khóa tìm kiếm (`dat dai`, `vbdlis`, `mplis`, `dia chinh`).
  - Cập nhật tự động bộ đếm tổng số hệ thống lên **35 hệ thống trực tuyến**.

### 13. Chuẩn hóa công thức chấm điểm tiêu chí 3.1, 3.5 và 4.2 (08/10/2026)
* **Yêu cầu:** Trong menu *Công thức tính 766*, các chỉ tiêu 3.1, 3.5 và 4.2 không ghi điểm cố định (12đ, 10đ, 22đ) vì nhóm còn nhiều tiêu chí thành phần khác, chuẩn hóa thành "Đạt điểm tối đa".
* **Xử lý trong `public/index.html`:**
  - **Tiêu chí 3.1** (*Tỷ lệ TTHC cung cấp DVCTT*): Sửa badge ngưỡng thành `Ngưỡng: ≥ 80% đạt điểm tối đa`, cơ chế chấm điểm: `Đạt ≥ 80% → Điểm tối đa`, công thức: `Điểm đạt = (Tỷ lệ % × Điểm tối đa) / 80%`.
  - **Tiêu chí 3.5** (*Tỷ lệ TTHC tích hợp TT trực tuyến*): Sửa badge ngưỡng thành `Ngưỡng: ≥ 80% đạt điểm tối đa`, cơ chế chấm điểm: `Đạt ≥ 80% → Điểm tối đa`, công thức: `Điểm đạt = (Tỷ lệ % × Điểm tối đa) / 80%`.
  - **Tiêu chí 4.2** (*Tỷ lệ hồ sơ TTHC thực hiện số hóa hồ sơ*): Sửa badge ngưỡng thành `Ngưỡng: ≥ 80% đạt điểm tối đa`, cơ chế chấm điểm: `Đạt ≥ 80% → Điểm tối đa`, công thức: `Điểm đạt = (Tỷ lệ % × Điểm tối đa) / 80%`.

### 14. Điều chỉnh công thức và cơ chế chấm điểm tiêu chí 5.4 (08/10/2026)
* **Yêu cầu:** Trong menu *Công thức tính 766* thuộc Mục 5 (Chỉ tiêu đánh giá hài lòng), tiêu chí 5.4 (*Tỷ lệ hài lòng trong tiếp nhận, giải quyết TTHC*) tối đa là 6 điểm thay vì 18 điểm (do nhóm 5 tổng cộng 18đ phân bổ cho 5.1: 5đ, 5.2: 5đ, 5.3: 2đ, 5.4: 6đ). Sửa lại thông báo và cơ chế chấm điểm.
* **Xử lý trong `public/index.html`:**
  - Sửa badge ngưỡng thành: `Ngưỡng: ≥ 90% đạt 6đ` (thay vì 18đ).
  - Sửa cơ chế chấm điểm thành: `Đạt ≥ 90% → 6.00 điểm` (thay vì 18.00 điểm).
  - Sửa công thức tính điểm thành: `Điểm đạt = (Tỷ lệ % × 6) / 90%` (thay vì nhân 18).

### 15. Quy chuẩn cấu trúc và giải mã Số hồ sơ TTHC (09/10/2026)
* **Cấu trúc số hồ sơ:** `{Mã định danh đơn vị}-{yymmdd}-{Số thứ tự trong ngày}` (Ví dụ: `H15.50.05.13-261008-0975`).
* **Quy tắc phân loại Cổng tỉnh & Cổng bộ:**
  - **4 chữ số:** Hồ sơ phát sinh từ **Cổng tỉnh** (VD: `0975`).
  - **6 - 7 chữ số:** Hồ sơ liên thông từ **Cổng bộ** (VD: `09xxxx`, `18xxxx`, ...).
* **Bảng mã 2 số đầu của Cổng bộ:**
  - `09xxxx`: Bộ Nội vụ
  - `18xxxx`: Bộ Y Tế
  - `03xxxx`: Bộ Giáo dục và Đào tạo
  - `10xxxx`: Bộ Nông nghiệp và Môi trường
  - `17xxxx`: Bộ Xây dựng
  - `02xxxx`: Bộ Công Thương
  - `06xxxx`: Bộ Khoa học và Công nghệ
  - `15xxxx`: Bộ Tư Pháp
  - `16xxxx`: Bộ Văn hóa, Thể thao và Du lịch
* **Hiện thực:**
  - Lưu trữ quy tắc vĩnh viễn tại `.agents/rules/dossier-code-rules.md`.
  - Xây dựng module phân tích `src/dossierParser.js` (`parseDossierCode`) sẵn sàng phục vụ bóc tách tự động.

### 16. Xây dựng Menu "Bóc tách hồ sơ" chuyên dụng cho Admin (09/10/2026)
* **Yêu cầu:** Thêm menu "Bóc tách hồ sơ" chỉ hiển thị với tài khoản Admin. Cho phép Admin tải lên 1 file Excel danh sách hồ sơ; hệ thống tự động bóc tách thành các Sheet độc lập: 1 Sheet Cổng Tỉnh và mỗi Bộ 1 Sheet riêng (Bộ Nội vụ, Bộ Y Tế, Bộ GD&ĐT, Bộ NN&MT, Bộ Xây dựng, Bộ Công Thương, Bộ KH&CN, Bộ Tư Pháp, Bộ VHTTDL...), cùng 1 Sheet tổng hợp thống kê số lượng và tỷ lệ, rồi cho phép tải về lại file Excel hoàn chỉnh (.xlsx).
* **Xử lý:**
  - **Phân quyền truy cập:** Tab menu `Bóc tách hồ sơ (Admin)` ẩn mặc định đối với khách và cán bộ; chỉ tự động mở ra khi đăng nhập bằng tài khoản Quản trị viên (`admin`).
  - **Thư viện xử lý Excel offline:** Tích hợp `libs/exceljs.min.js` cục bộ trong hệ thống, xử lý bóc tách 100% trên trình duyệt client siêu tốc, không giới hạn dung lượng file tải lên và bảo mật tuyệt đối dữ liệu hồ sơ.
  - **Cơ chế bóc tách thông minh:**
    - Tự động quét và phát hiện dòng tiêu đề (Header row) và cột chứa mã/số hồ sơ (hỗ trợ cả chọn thủ công nếu file có cấu trúc đặc biệt).
    - Phân loại Cổng Tỉnh (dãy số thứ tự 4 số) và Cổng Bộ (6-7 số với 2 số đầu định danh Bộ chủ quản: 09 Nội vụ, 18 Y tế, 03 GD&ĐT, 10 NN&MT, 17 Xây dựng, 02 Công Thương, 06 KH&CN, 15 Tư pháp, 16 VHTTDL).
  - **Giao diện & Xuất file:**
    - Thẻ thống kê tổng quan (Tổng số hồ sơ, số hồ sơ Cổng Tỉnh, Cổng các Bộ, tổng số Sheet sẽ xuất).
    - Lưới chi tiết số lượng và tỷ lệ % của từng Bộ.
    - Xem trước 20 dòng đầu dữ liệu của từng Sheet theo các tab con trực quan.
    - Nút tải về xuất file `.xlsx` đầy đủ: Sheet `Tổng hợp thống kê` định dạng chuẩn báo cáo kèm các Sheet dữ liệu riêng biệt cho Cổng Tỉnh và từng Bộ.

### 17. Bổ sung Menu "Mã QR TTHC (soon)" (09/10/2026)
* **Yêu cầu:** Thêm menu `Mã QR TTHC (soon)` nằm ngay trước menu *Tiện ích* trên thanh điều hướng.
* **Xử lý:**
  - Thêm mục menu `Mã QR TTHC` với biểu tượng mã QR chuẩn SVG và huy hiệu trạng thái `(soon)`.
  - Tích hợp khung placeholder thông báo tính năng đang trong lộ trình phát triển để sẵn sàng cho các phiên bản tiếp theo.

### 18. Quy chuẩn liên kết và tạo Mã QR tra cứu TTHC có Logo Đắk Lắk (10/10/2026)
* **Cấu trúc Mã thủ tục:** Dạng `{Phân loại}.{Mã số}` (ví dụ: `2.000206`).
* **Đường link tra cứu chuẩn:**
  `https://dichvucong.gov.vn/tra-cuu-thu-tuc/danh-sach?keyword={MA_THU_TUC}&showAdvanced=false&formalityType=STANDARD&limit=10&activeKey=STANDARD`
* **Quy chuẩn mã QR:**
  - Áp dụng Error Correction Level `H` (30% chịu lỗi).
  - Nhúng biểu trưng tỉnh Đắk Lắk (`icon-qr.png`) ở chính giữa với viền tròn nền trắng bảo vệ.
  - Xây dựng module sinh mã tự động `src/qrGenerator.js` (`generateProcedureQRCode`, `buildProcedureLookupUrl`).
  - Đã khởi tạo thành công mã QR mẫu cho thủ tục `2.000206` tại `public/qr-2.000206.png`.

### 19. Hoàn thiện tính năng Tạo mã QR TTHC và đính kèm trực tiếp vào file Excel (10/10/2026)
* **Yêu cầu:** Xây dựng tính năng hoàn chỉnh cho menu "Mã QR TTHC" (gỡ bỏ nhãn `(soon)`). Người dùng tải lên file Excel chứa danh sách TTHC (mã TTHC thường ở Cột B). Hệ thống tự động tạo mã QR có gắn logo tỉnh Đắk Lắk ở giữa cho từng thủ tục và đính hình ảnh trực tiếp vào cột cuối cùng của bảng danh sách Excel, sau đó cho phép tải file về.
* **Xử lý toàn diện:**
  - **Gỡ nhãn `(soon)`:** Chuyển đổi tab điều hướng thành `Mã QR TTHC` chính thức.
  - **Giao diện người dùng Enterprise:** Xây dựng card chức năng chuẩn Gov-tech hiện đại trong `#tab-content-qr`:
    - Khu vực kéo thả file Excel (.xlsx, .xls) kèm nút nạp file mẫu thử nghiệm 5 TTHC tức thì.
    - Hộp cấu hình thông minh: Chọn Sheet, chọn Dòng tiêu đề (Header), tự động phát hiện Cột B (Mã TTHC) hoặc cột chứa mã số dạng `\d+\.\d+`.
    - Tự động nhận diện cột cuối cùng của bảng tính để tạo mới cột `MÃ QR TRA CỨU` với nền xanh Sky-600, chữ trắng đậm.
  - **Xử lý Offline Client-side 100%:**
    - Tích hợp thư viện `libs/qrcode.min.js` (Canvas API) và `libs/exceljs.min.js`.
    - Sinh mã QR tra cứu Cổng DVC Quốc gia với cấp độ sửa lỗi `H` (30%) đảm bảo máy quét đọc chính xác 100%.
    - Tự động vẽ nền bo tròn màu trắng có viền bóng và nhúng biểu trưng tỉnh Đắk Lắk (`icon-qr.png`) ở tâm mã QR.
    - Đính hình ảnh vào từng ô tương ứng trong ExcelJS (`ws.addImage` với `editAs: 'oneCell'`), tự động căn chỉnh chiều cao dòng (`75pt`) và độ rộng cột (`18`) giúp hiển thị vuông vắn, sắc nét khi in ấn hoặc mở trên Microsoft Excel / WPS Office.
  - **Xem trước & Tải về:**
    - Thanh tiến trình thời gian thực hiển thị % và số lượng thủ tục đang xử lý.
    - Bảng xem trước kết quả trực quan (STT, Mã TTHC, Tên TTHC, Liên kết tra cứu Cổng DVC, Thumbnail QR phóng to khi hover/click).
    - Nút tải riêng lẻ từng ảnh mã QR dạng `.png`.
    - Nút tải tệp tin Excel hoàn chỉnh đã đính kèm tất cả mã QR (`[Tên_file]_kem_ma_QR.xlsx`).
  - **Tối ưu hóa kích thước & Độ sắc nét khi quét mã:**
    - Khắc phục triệt để hiện tượng mã QR bị thu nhỏ dạng thumbnail (~16px) do neo tọa độ co giãn: Chuyển đổi sang chuẩn neo kích thước điểm ảnh thực `ext: { width: qrSizePx, height: qrSizePx }` (mặc định **130px** x **130px** chuẩn khuyến nghị, có tùy chọn 150px hoặc 110px).
    - Tăng độ phân giải Canvas nguồn lên **500x500 px** siêu sắc nét, nâng độ cao dòng lên **105 pt** và độ rộng cột lên **22** giúp mã QR hiển thị vuông vắn, to rõ và điện thoại có thể quét tức thì 100% cả trên màn hình lẫn khi in ra giấy A4.
  - **Đồng bộ hóa phong cách giao diện (Gov-tech) & Bỏ file thử nghiệm:**
    - Thiết kế lại toàn bộ giao diện menu `Mã QR TTHC` theo đúng quy chuẩn chung của hệ thống (đồng bộ với tab *Tiện ích* và *Đường dẫn các cổng*): sử dụng card viền `tools-unified-card`, thanh tiêu đề `tools-card-header`, huy hiệu `Xử lý Offline 100% (An toàn bảo mật)`, dải thẻ thông tin `portals-stats-strip` và khung tải file kéo thả `dropzone-dashed-box`.
    - Bỏ hoàn toàn nút và tính năng "Dùng file mẫu thử nghiệm" khỏi giao diện lẫn mã nguồn, tạo không gian làm việc sạch sẽ, trang nhã và tập trung vào nghiệp vụ thực tế của cán bộ.
  - **Kiểm thử tự động:** Đã kiểm thử trọn vẹn cả tầng Node.js và giao diện trình duyệt thực tế, giải mã QR qua bộ quét tự động `jsQR` đạt tỷ lệ quét thành công 100% cả 5 mã.

### 20. Cập nhật lại số liệu Bộ chỉ số 766 sau 6h sáng (15/10/2026)
* **Bối cảnh:** Cổng DVCQG điều chỉnh và cập nhật lại điểm sau khung giờ 6h sáng ngày 15/10/2026.
* **Xử lý:**
  - Kích hoạt tiến trình thu thập và phân tích lại toàn bộ 6 nhóm chỉ số cho tỉnh Đắk Lắk: Tổng điểm cập nhật mới đạt **65.93 / 100 điểm** (tăng từ mức 65.78 - 65.87 điểm trước 6h sáng).
  - Thu thập lại bảng xếp hạng 766 của toàn bộ **34 tỉnh/thành phố** trên cả nước: Đắk Lắk xếp hạng **#7 toàn quốc** với 65.93 điểm (cả nước đạt 63.16 điểm).
  - Đồng bộ tự động lên Upstash Redis Cloud, cập nhật các tệp snapshot cục bộ (`data/snapshots/2026-10-15.json`, `data/provinces/2026-10-15.json`, `data/provinces-latest.json`), đồng thời làm mới bộ nhớ đệm (cache) máy chủ.

### 11. Xây dựng Menu "Báo Cáo Nhanh" Biến Động 766 Cho 102 Cấp Xã (15/10/2026)
* **Yêu cầu:** 
  - Tạo 1 menu mới mang tên "Báo cáo nhanh" nằm trước menu "Tiện ích".
  - **Phân quyền bảo mật:** Chức năng chỉ hiển thị và áp dụng cho Cán bộ nghiệp vụ hoặc Quản trị viên (Admin) đăng nhập hệ thống.
  - Cho phép người dùng chọn đơn vị là 1 trong 102 xã/phường/thị trấn tỉnh Đắk Lắk.
  - Tự động so sánh số liệu giữa ngày hôm nay với ngày hôm trước (hôm gần nhất có dữ liệu).
  - Báo cáo phân tích sâu: Ngoài biến động tử số, bổ sung đầy đủ biến động **mẫu số**, **tỷ lệ %**, **điểm số** và **nhận định tăng trưởng chuyên sâu** ở tất cả các tiêu chí con.
  - Cung cấp nút sao chép văn bản báo cáo hoàn chỉnh (để gửi Zalo / Báo cáo lãnh đạo) và nút in ấn / PDF.
  - Giao diện tinh gọn: Bỏ phần chọn nhanh và bỏ dòng mô tả phụ bên dưới tiêu đề để tăng tính chuyên nghiệp.
* **Xử lý:**
  - Bổ sung tab button `#tab-btn-quick-report` (nhãn *Nội bộ*) và tab content pane `#tab-content-quick-report` trong [index.html](file:///f:/DVC%20QG%20C12/766-Analyze/public/index.html).
  - Cấu hình phân quyền trong `updateAuthUI` ([app.js](file:///f:/DVC%20QG%20C12/766-Analyze/public/app.js)): Chỉ hiển thị menu khi người dùng đăng nhập tài khoản có quyền `officer` (Cán bộ) hoặc `admin` (Quản trị viên). Người dùng chưa đăng nhập sẽ không thấy tab, hoặc nếu cố tình truy cập sẽ thấy màn hình khóa yêu cầu đăng nhập.
  - Thiết kế Control Card trực quan, tinh gọn: thanh tìm kiếm nhanh tên xã/phường, dropdown chọn 102 đơn vị, 2 dropdown mốc ngày so sánh (mặc định hôm nay vs hôm trước).
  - Triển khai động cơ phân tích `diffMetric` và `renderQuickReportHtml` trong [app.js](file:///f:/DVC%20QG%20C12/766-Analyze/public/app.js) tính toán ma trận 4 thông số:
    * Tử số: Số cũ ➔ Số mới (Biến động: +X / -X hồ sơ hoặc TTHC)
    * Mẫu số: Số cũ ➔ Số mới (Biến động: +Y / -Y hồ sơ hoặc TTHC)
    * Tỷ lệ %: Cũ% ➔ Mới% (Biến động: +/- Z%)
    * Điểm số: Cũđ ➔ Mớiđ (Biến động: +/- Wđ)
    * Nhận định tăng trưởng chuyên sâu cho từng chỉ tiêu: Phân tích tử số tăng hay mẫu số tăng nhanh hơn, cảnh báo hồ sơ quá hạn, phản ánh kiến nghị (PAKN), thanh toán trực tuyến, số hóa hồ sơ.
### 21. Tinh chỉnh Tên Menu, Bỏ Huy Hiệu và Tối ưu Giao diện Điều hướng Di động (17/10/2026)
* **Yêu cầu:**
  - Ở menu `Công thức tính 766`: bỏ chữ `(Đang hoàn thiện)`.
  - Ở menu `Báo cáo nhanh`: bỏ chữ `Nội bộ`.
  - Đổi tên menu `Bóc tách hồ sơ` thành `Phân loại hồ sơ` và bỏ chữ `Admin`.
  - Khắc phục triệt để hiện tượng vỡ giao diện trên điện thoại di động do toàn bộ 8 menu bị xếp thành 1 hàng dài cứng nhắc gây co nhỏ / vỡ layout trang.
* **Xử lý toàn diện:**
  - **Làm sạch & Đồng bộ tên Menu:**
    * Cập nhật nhãn thanh điều hướng: `Công thức tính 766`, `Báo cáo nhanh`, `Phân loại hồ sơ` (gỡ bỏ các thẻ badge phụ `(Đang hoàn thiện)`, `Nội bộ`, `Admin`).
    * Đồng bộ tiêu đề và nội dung mô tả trong tab [Phân loại hồ sơ](file:///f:/DVC%20QG%20C12/766-Analyze/public/index.html) thành *Phân loại hồ sơ TTHC theo Cổng Tỉnh và các Bộ*.
  - **Tối ưu hóa Giao diện Điều hướng Di động (Responsive Gov-tech):**
    * **Thanh cuộn ngang Chip Pill mượt mà (`.nav-tabs-scroll-container`):** Trên màn hình di động ($\le 768px$), các tab được chuyển đổi thành phong cách Chip Pill bo tròn hiện đại, hỗ trợ vuốt chạm cảm ứng (touch swipe) với thanh cuộn ẩn tinh tế và hiệu ứng làm mờ biên (mask-image gradient) báo hiệu trực quan nội dung có thể cuộn.
    * **Tự động căn giữa:** Khi người dùng chọn tab bất kỳ hoặc khi mở trang, tab đang kích hoạt tự động trượt mượt mà vào chính giữa màn hình (`scrollIntoView({ behavior: 'smooth', inline: 'center' })`).
    * **Nút & Menu Drawer Lưới 2 Cột (`#mobile-nav-toggle-btn` & `#mobile-menu-drawer`):** Bổ sung nút `Menu` gọn gàng ở góc thanh điều hướng di động. Khi bấm vào, một Drawer dạng Bottom Sheet trượt lên hiển thị toàn bộ các chức năng hệ thống dưới dạng lưới thẻ 2 cột trực quan, cho phép người dùng chuyển đổi tab tức thì mà không cần cuộn ngang tìm kiếm.
    * **Kế thừa phân quyền tự động:** Các mục phân quyền (`Báo cáo nhanh` cho Cán bộ/Admin, `Phân loại hồ sơ` cho Admin) tự động ẩn/hiện đồng bộ trên cả thanh Chip Pill lẫn trong Drawer di động.
### 22. Tái thiết kế giao diện "Phân loại hồ sơ" đồng bộ với phong cách chung (17/10/2026)
* **Yêu cầu:** Giao diện của menu Phân loại hồ sơ (trước đây là Bóc tách hồ sơ) đang khác biệt so với các menu khác. Điều chỉnh lại cho đồng bộ phong cách chung của hệ thống.
* **Xử lý toàn diện:**
  - **Khung thẻ Card Enterprise thống nhất (`tools-container` & `tools-unified-card`):**
    * Thay thế toàn bộ khung riêng biệt cũ bằng cấu trúc thẻ chuẩn chung đồng bộ với menu *Tiện ích*, *Mã QR TTHC* và *Đường dẫn các cổng*.
    * Thanh tiêu đề chuẩn Gov-tech: Tiêu đề rõ ràng `Phân loại hồ sơ Thủ tục Hành chính`, huy hiệu bảo mật xanh ngọc lục bảo `Xử lý Offline 100% (An toàn bảo mật)`, kèm dải chip thông số (`Cổng Tỉnh - Dãy số 4 ký tự`, `Cổng Bộ - Định danh 6-7 ký tự`, `Đa Sheet - 1 Sheet/Bộ + Sheet Tổng hợp`).
  - **Khu vực kéo thả file đồng bộ (`dropzone-dashed-box`):**
    * Áp dụng khung viền nét đứt màu xanh dịu mắt, biểu tượng tải lên bo tròn trung tâm, nhãn hướng dẫn và nút bấm `Chọn file Excel tải lên` chuẩn `.btn-dz-primary`.
    * Khối thông báo an ninh dữ liệu viền xám mềm mại khẳng định xử lý hoàn toàn Offline Client-side.
  - **Hộp cấu hình thông số gọn gàng (`qr-config-card-box`):**
    * Khi nạp file Excel, hộp cấu hình xuất hiện theo dạng lưới 3 cột tinh tế (Sheet cần xử lý, Dòng tiêu đề Header, Cột chứa Mã/Số hồ sơ).
    * Nút hành động nổi bật `Bắt đầu phân loại` có bóng đổ màu xanh chuyên nghiệp.
  - **Màn hình khóa xác thực Admin trang nhã (`tools-auth-lock-box`):**
    * Khi người dùng chưa đăng nhập quyền Admin, giao diện hiển thị hộp thông báo khóa với biểu tượng ổ khóa màu xanh dương dịu mắt, nút kêu gọi đăng nhập màu xanh Royal Blue thay cho viền đỏ gắt cũ.
  - **Trải nghiệm cuộn mượt:** Khắc phục triệt để hiện tượng giật trang khi chuyển tab sang Phân loại hồ sơ trên cả desktop lẫn điện thoại.

### 23. Bổ sung Quy tắc Phân loại "Hộ kinh doanh" cho Module Phân loại hồ sơ (19/10/2026)
* **Yêu cầu:** Ở chức năng *Phân loại hồ sơ*, bổ sung thêm trường hợp đặc biệt: Các hồ sơ có phần đuôi 4 số nhưng thuộc các thủ tục hành chính có mã: `1.001266`, `1.001570`, `1.001612`, `2.000720` thì được phân vào nhóm **Hộ kinh doanh** (Cột mã TTHC nằm ở Cột C trong file Excel). Cập nhật tri thức vào rule hệ thống và điều chỉnh chức năng phân loại.
* **Xử lý toàn diện:**
  - **Lưu trữ tri thức nghiệp vụ:**
    * Cập nhật quy tắc nhận diện tại [`.agents/rules/dossier-code-rules.md`](file:///f:/DVC%20QG%20C12/766-Analyze/.agents/rules/dossier-code-rules.md): Hồ sơ đuôi 4 số nếu khớp 1 trong 4 mã TTHC (`1.001266`, `1.001570`, `1.001612`, `2.000720`) ở Cột C sẽ được chuyển vào nhóm `Hộ kinh doanh` (không tính vào `Cổng Tỉnh`).
    * Nâng cấp module phân tích [`src/dossierParser.js`](file:///f:/DVC%20QG%20C12/766-Analyze/src/dossierParser.js): Bổ sung hằng số `BUSINESS_HOUSEHOLD_PROCEDURE_CODES` và tham số `procedureCode` vào hàm `parseDossierCode(dossierCode, procedureCode)` trả về `portalType: 'BUSINESS_HOUSEHOLD'`, `isBusinessHousehold: true`.
  - **Nâng cấp Giao diện & Động cơ Phân loại (`public/app.js` & `public/index.html`):**
    * **Thêm Cột cấu hình TTHC (`split-tthc-col-select`):** Hệ thống tự động quét và mặc định nhận diện **Cột C (Cột 3)** hoặc cột có tiêu đề liên quan đến mã TTHC; cho phép người dùng tùy chọn nếu file có cấu trúc khác.
    * **Động cơ phân loại (`classifyCode(codeStr, tthcCodeStr)`):** Tự động đối chiếu mã số hồ sơ và mã TTHC tương ứng. Hồ sơ đuôi 4 số có mã TTHC thuộc 4 mã chỉ định sẽ được đưa vào nhóm `Hộ kinh doanh` (màu sắc nhận diện `#ea580c` cam nổi bật, tag `HỘ KINH DOANH`).
    * **Dải thẻ thống kê tổng quan:** Bổ sung thẻ đếm riêng **"Hộ kinh doanh"** (`split-stat-business`) bên cạnh *Tổng số hồ sơ*, *Cổng Tỉnh*, *Cổng các Bộ* và *Tổng số Sheet*.
    * **Xem trước đa tab & Tab kết quả:** Nhóm `Hộ kinh doanh` được xếp ưu tiên ngay sau `Cổng Tỉnh`, hỗ trợ xem trước 20 dòng đầu dữ liệu và hiển thị đầy đủ tổng số lượng hồ sơ.
    * **Xuất file Excel chuyên nghiệp (`generateAndDownloadSplitExcel`):** 
      - Xuất Sheet riêng biệt: **`Hộ kinh doanh`** với tiêu đề bảng màu cam `#d97706` nổi bật, chứa đầy đủ các cột dữ liệu gốc.
      - Sheet **`Tổng hợp thống kê`** ghi nhận rõ ràng dòng nhóm `Hộ kinh doanh` với cơ quan là *Lĩnh vực Hộ kinh doanh*, quy cách nhận diện: *Đuôi 4 số & Mã TTHC (1.001266, 1.001570, 1.001612, 2.000720)*.

### 24. Mở rộng Phân quyền Sử dụng Module "Phân loại hồ sơ" (20/10/2026)
* **Yêu cầu:** Cho phép cả tài khoản Cán bộ (`officer`/`canbo`) và Quản trị viên (`admin`) đều sử dụng được chức năng Phân loại hồ sơ (trước đây chỉ dành riêng cho Admin).
* **Xử lý toàn diện:**
  - **Logic Client (`public/app.js`):** 
    - Cập nhật hàm `updateAuthUI()`: Chuyển điều kiện kiểm tra hiển thị từ `isAdmin` sang `isStaffOrAdmin` (`Boolean(user && (user.role === 'admin' || user.role === 'officer' || user.role === 'canbo'))`).
    - Cả thanh điều hướng Desktop (`#nav-item-dossier-split`), menu ngăn kéo Di động (`#mobile-grid-item-dossier-split`) và khối làm việc (`#split-workspace-wrap`) đều mở cho cả Cán bộ và Admin.
    - Điều hướng bảo vệ: Nếu chưa đăng nhập một trong hai quyền trên mà cố tình vào tab sẽ được chuyển an toàn về tab mặc định.
  - **Giao diện & Cảnh báo (`public/index.html`):**
    - Điều chỉnh tiêu đề tab và ghi chú thành *Phân loại hồ sơ (Cán bộ & Quản trị viên)*.
### 25. Mở công khai chức năng "Phân loại hồ sơ" cho toàn bộ người dùng (27/10/2026)
* **Yêu cầu:** Mở công khai chức năng Phân loại hồ sơ để tất cả mọi người (khách truy cập, cán bộ, quản trị viên) đều sử dụng được trực tiếp mà không cần đăng nhập.
* **Xử lý toàn diện:**
  - **Giao diện điều hướng (`public/index.html`):**
    - Loại bỏ thuộc tính ẩn `style="display: none;"` và gỡ bỏ biểu tượng ổ khóa `🔒` trên mục menu sidebar Desktop `#nav-item-dossier-split`.
    - Cập nhật tiêu đề và comment tab thành *TAB 6: PHÂN LOẠI HỒ SƠ (CÔNG KHAI)*.
    - Loại bỏ hoàn toàn khối cảnh báo khóa `#split-auth-lock-card`, trực tiếp hiển thị khối làm việc `#split-workspace-wrap` ngay khi truy cập.
  - **Logic kiểm soát hiển thị (`public/app.js`):**
    - Cập nhật hàm `updateAuthUI()`: Menu phân loại hồ sơ trên desktop (`navSplitItem`), trên drawer di động (`mobileGridSplit`) và khối làm việc (`splitWorkspace`) luôn ở trạng thái hiển thị (`display: inline-block` / `flex` / `block`).
    - Gỡ bỏ logic chuyển hướng cưỡng bức (force redirect) người dùng chưa đăng nhập khi đang ở tab phân loại hồ sơ.
### 26. Khắc phục lỗi đăng nhập tài khoản mới tạo trên Vercel Serverless (27/10/2026)
* **Hiện tượng:** Tài khoản mới tạo qua chức năng Quản lý người dùng (`congthuong`, mật khẩu `Congthuong@357`) khi đăng nhập trên `https://tienich-dvc.vercel.app` bị báo lỗi 401 "Tên đăng nhập hoặc mật khẩu không chính xác".
* **Nguyên nhân:**
  - Trong kiến trúc Serverless của Vercel, hàm `/api/users` (tạo/sửa tài khoản) và `/api/auth` (đăng nhập) chạy trên các Lambda container độc lập.
  - Hàm `getUsers()` trong `src/storage.js` trước đó ưu tiên đọc bộ nhớ tạm RAM `memoryCache.users` trước Redis/đĩa. Khi một container đăng nhập đã "ấm" (warm instance) từ trước với danh sách user cũ, nó không tải lại dữ liệu mới từ Upstash Redis, dẫn đến không tìm thấy tài khoản mới tạo.
* **Xử lý toàn diện:**
  - Cập nhật `src/storage.js`: Đảo thứ tự ưu tiên, luôn đọc dữ liệu người dùng trực tiếp từ Upstash Redis trước (nguồn chân lý chung giữa Cloud và Local) hoặc tệp đĩa có kiểm tra `mtime`.
  - Đồng bộ tệp `data/users.json` trên ổ đĩa nội bộ với dữ liệu đám mây.
  - Xác thực trực tiếp qua API: Tài khoản `congthuong` đăng nhập thành công 100% trên cả Vercel (`tienich-dvc.vercel.app`) lẫn Localhost (`localhost:3000`).

### 27. Khắc phục lỗi Bảng Xếp hạng 766 các tỉnh bị đứng ngày 26/10/2026 trên Vercel (29/10/2026)
* **Hiện tượng:** Trên web công khai Vercel (`https://tienich-dvc.vercel.app`), tab "Xếp hạng 766 các tỉnh" hiển thị dừng ở mốc thời gian *"Cập nhật: 06:00 26/10/2026 (giờ Việt Nam)"* và Đắk Lắk đạt 66.62 điểm (#8), trong khi trên máy tính nội bộ và Upstash Redis đã thu thập đầy đủ số liệu tới ngày 29/10/2026 (Đắk Lắk đạt **67.00 điểm, Hạng 7 toàn quốc**).
* **Nguyên nhân:**
  - Trong `src/storage.js`, hàm `getProvinceRankings()` trước đây ưu tiên kiểm tra tệp tĩnh `PROVINCES_FILE` (`data/provinces-latest.json`) trên đĩa trước Redis. Do Vercel đóng gói tệp git commit từ ngày 26/10, hàm luôn đọc tệp tĩnh này mà không đọc dữ liệu mới nhất được máy nội bộ đẩy lên Upstash Redis (`dvc:provinces:latest`).
  - Nút "Làm mới" trên Vercel khi gọi `/api/provinces?refresh=true` cố gắng gọi trực tiếp API Cổng DVCQG từ Cloud Serverless, nhưng do Cổng DVCQG có tường lửa chặn IP nước ngoài (Geo-blocking) nên báo lỗi `fetch failed` (HTTP 500) mà không có cơ chế fallback.
* **Xử lý toàn diện:**
  - **Tự động đồng bộ nguồn chân lý mới nhất (`src/storage.js`):** Nâng cấp hàm `getProvinceRankings()` so sánh thông minh giữa Upstash Redis và Đĩa cục bộ. Luôn tự động chọn nguồn có ngày dữ liệu (`date` / `updatedAt`) mới hơn. Khi job 6h sáng chạy ở máy nội bộ đẩy điểm tỉnh lên Redis, Vercel Serverless sẽ lập tức nhận số liệu mới mà không cần phải commit git hay deploy lại mã nguồn.
  - **Cơ chế Fallback an toàn cho API (`api/provinces.js` & `api/data.js`):** Khi người dùng bấm nút "Làm mới", nếu Cloud Serverless không thể kết nối trực tiếp Cổng DVCQG (do chặn IP), API sẽ tự động fallback về dữ liệu mới nhất trong Redis/Storage thay vì trả về lỗi 500.
  - **Đồng bộ hóa dữ liệu lịch sử:** Đưa đầy đủ các tệp snapshot và xếp hạng tỉnh từ ngày 27/10 đến 29/10/2026 (`data/provinces/2026-10-27.json`, `2026-10-28.json`, `2026-10-29.json`, `data/snapshots/2026-10-27.json`, `2026-10-28.json`, `2026-10-29.json` và `data/provinces-latest.json`) vào kho mã nguồn Git và đẩy lên Vercel.

### 28. Cập nhật thêm Rule phân loại hồ sơ cho Bộ Tài chính, Bộ Dân tộc và Tôn giáo, Cổng DVCQG (29/10/2026)
* **Yêu cầu:** Bổ sung các quy tắc phân loại mã tiền tố dãy số thứ tự 6-7 chữ số cho module Phân loại hồ sơ:
  - Mã tiền tố `12xxxx` (6-7 số): **Bộ Tài chính**
  - Mã tiền tố `21xxxx` (6-7 số): **Bộ Dân tộc và Tôn giáo**
  - Mã tiền tố `99xxxx` (6-7 số): **Cổng DVCQG**
* **Xử lý toàn diện:**
  - **Lưu trữ tri thức nghiệp vụ:** Cập nhật bảng tra cứu mã Bộ chủ quản tại [`.agents/rules/dossier-code-rules.md`](file:///f:/DVC%20QG%20C12/766-Analyze/.agents/rules/dossier-code-rules.md).
  - **Module phân tích Backend (`src/dossierParser.js`):**
    - Cập nhật hằng số `MINISTRY_PREFIX_MAP` bổ sung mã `'12'`, `'21'`, `'99'`.
    - Chuẩn hóa nhãn `portalTypeLabel` trả về: với mã `'99'` hiển thị rõ `Cổng DVCQG` (thay vì nhãn chung Cổng Bộ).
  - **Module phân loại Frontend & Xuất Excel (`public/app.js`):**
    - Cập nhật bảng `MINISTRY_RULES`:
      * `'12'`: Tên `Bộ Tài chính`, Sheet `Bộ Tài chính`, màu nhận diện `#0284c7` (Sky Blue), Tag `BỘ TÀI CHÍNH`.
      * `'21'`: Tên `Bộ Dân tộc và Tôn giáo`, Sheet `Bộ Dân tộc và Tôn giáo`, màu nhận diện `#7c3aed` (Purple), Tag `BỘ DÂN TỘC & TÔN GIÁO`.
      * `'99'`: Tên `Cổng DVCQG`, Sheet `Cổng DVCQG`, màu nhận diện `#b91c1c` (Crimson), Tag `CỔNG DVCQG`.
    - Tại Sheet 1 *Tổng hợp thống kê* của file Excel xuất ra: Hồ sơ mã `99xxxx` tự động ghi nhận cơ quan là `Cổng Dịch vụ công Quốc gia` (các bộ ghi `Cổng Bộ - Ngành liên thông`).

### 29. Bổ sung Cổng "Phản ánh hiện trường" vào danh bạ các cổng Đắk Lắk (30/10/2026)
* **Yêu cầu:** Bổ sung thêm cổng **"Phản ánh hiện trường"** (liên kết `https://dieuhanhioc.daklak.gov.vn`) vào phần Tỉnh Đắk Lắk trong danh bạ các cổng.
* **Xử lý toàn diện:**
  - Thêm thẻ `PHẢN ÁNH HIỆN TRƯỜNG` vào danh mục `PORTAL_SECTIONS` nhóm Tỉnh Đắk Lắk (`daklak`) trong [`public/app.js`](file:///f:/DVC%20QG%20C12/766-Analyze/public/app.js).
  - Thiết kế biểu tượng SVG sắc nét phong cách Gov-tech: màn hình trung tâm giám sát điều hành IOC, pin phát tín hiệu phản ánh hiện trường và huy hiệu xác thực.
  - Tích hợp từ khóa tìm kiếm (`phan anh hien truong`, `dieuhanhioc`, `ioc daklak`, `ioc`, `phan anh kien nghi`, `tuong tac nguoi dan`, `do thi thong minh`, `pakn`, `dak lak`) giúp tìm kiếm nhanh chóng trên thanh tìm kiếm.
  - Tự động nâng tổng số cổng kết nối lên **36 hệ thống trực tuyến** (riêng khối Tỉnh Đắk Lắk đạt 8 hệ thống).

### 30. Xây dựng Menu "Hướng dẫn" trong Khối Công cụ Tiện ích (30/10/2026)
* **Yêu cầu:** Thiết kế menu "Hướng dẫn" trong nhóm Công cụ tiện ích. Tích hợp trực tiếp các bài hướng dẫn kỹ thuật trên web dạng HTML phong phú: Hướng dẫn xóa cache, Hướng dẫn mở trình duyệt ẩn danh, Cấu hình ký số VGCA...
* **Xử lý toàn diện:**
  - **Điều hướng Sidebar (`public/index.html`):** Bổ sung mục menu `Hướng dẫn` (`#tab-btn-guides`) với biểu tượng cuốn sách cẩm nang trong nhóm `CÔNG CỤ TIỆN ÍCH`.
  - **Kiến trúc giao diện Master-Detail (`#tab-content-guides` & `public/styles.css`):**
    * Thẻ chính đồng bộ phong cách `tools-unified-card` với huy hiệu *Tài liệu HTML Trực quan • Thao tác từng bước*.
    * Thanh điều khiển: Bộ lọc 4 nhóm chuyên mục (*Tất cả*, *Trình duyệt & Cache*, *Chữ ký số & VGCA*, *Thủ thuật DVC & In ấn*) kết hợp thanh tìm kiếm Live Search nhanh theo từ khóa.
    * Cột danh mục bên trái: Hiển thị các bài hướng dẫn với thẻ phân loại màu, thời lượng đọc ước tính, tóm tắt ngắn gọn.
    * Khung hiển thị chi tiết bên phải: Định dạng HTML phong phú với phím tắt phím nổi `<kbd>`, các bước hướng dẫn đánh số thứ tự trực quan, hộp thông báo mẹo hay (Tip xanh), cảnh báo lỗi (Warning vàng), nút sao chép đường dẫn và nút in bài viết ra giấy/PDF.
  - **Tích hợp 6 bài hướng dẫn nghiệp vụ chuyên sâu:**
    1. *Hướng dẫn xóa bộ nhớ đệm (Cache) & Cookies trình duyệt:* Phím tắt nhanh `Ctrl + F5`, bảng điều khiển `Ctrl + Shift + Delete`, giải quyết dứt điểm lỗi kẹt giao diện cũ.
    2. *Hướng dẫn mở Cửa sổ duyệt web ẩn danh (Incognito / InPrivate):* Phím tắt `Ctrl + Shift + N`, cách đăng nhập song song 2 tài khoản và cấp quyền tiện ích ký số trong ẩn danh.
    3. *Hướng dẫn Cài đặt & Cấu hình phần mềm Ký số VGCA (Ban Cơ yếu Chính phủ):* 4 bước thông suốt dịch vụ ký số, mở cờ `chrome://flags/#allow-insecure-localhost`, kiểm tra kết nối cổng `https://127.0.0.1:8080`.
    4. *Hướng dẫn Xử lý lỗi Máy tính không nhận USB Token / Chứng thư số:* Kiểm tra nguồn điện cổng USB, kiểm tra hạn chứng thư và khởi động lại dịch vụ `Smart Card` trong Windows `services.msc`.
    5. *Hướng dẫn Bật cho phép Cửa sổ bật lên (Pop-up) khi In phiếu & Ký số:* Mở khóa biểu tượng pop-up bị chặn, thêm ngoại lệ vĩnh viễn cho `[*.]daklak.gov.vn` và `[*.]dichvucong.gov.vn`.
    6. *Hướng dẫn Chụp ảnh màn hình & Gửi báo lỗi kỹ thuật chuẩn:* Phím tắt `Win + Shift + S`, 3 thông tin vàng (mã lỗi, mã hồ sơ, thanh URL) giúp kỹ thuật viên xử lý ngay trong 5 phút.
  - **Logic điều khiển tương tác (`public/app.js`):** Khởi tạo module `initGuidesModule()` xử lý chuyển bài mượt mà, tự động chuyển mục theo kết quả tìm kiếm, hỗ trợ in ấn và sao chép đường dẫn.

### 31. Chuyển đổi Menu Hướng dẫn thành "Hướng dẫn (Đang phát triển)" & Yêu cầu đăng nhập (30/10/2026)
* **Yêu cầu:**
  - Sửa tên menu thành: *"Hướng dẫn (Đang phát triển)"*.
  - Bật chế độ bảo vệ: Yêu cầu người dùng phải đăng nhập tài khoản hệ thống mới xem được nội dung hướng dẫn.
* **Xử lý toàn diện:**
  - **Điều hướng & Nhận diện (`public/index.html`):**
    * Cập nhật nhãn hiển thị: `Hướng dẫn (Đang phát triển)`.
    * Bổ sung huy hiệu ổ khóa bảo vệ `🔒` (`#guides-lock-badge`) trên sidebar menu.
    * Điều chỉnh tiêu đề và badge trong tab thành: *Cẩm nang & Hướng dẫn Kỹ thuật Nghiệp vụ (Đang phát triển)* và *Đang phát triển • Yêu cầu đăng nhập*.
  - **Màn hình khóa xác thực chuẩn Gov-tech (`#guides-auth-lock-card`):**
    * Áp dụng khung thẻ `split-lock-box` với biểu tượng ổ khóa xanh thanh lịch.
    * Thông báo rõ ràng: *"Chức năng Hướng dẫn (Đang phát triển) yêu cầu đăng nhập tài khoản hệ thống (Cán bộ nghiệp vụ hoặc Quản trị viên) để xem tài liệu và cẩm nang hướng dẫn kỹ thuật."*
    * Tích hợp nút hành động nổi bật: **"Đăng nhập ngay"** gọi hộp thoại đăng nhập tức thì.
  - **Logic kiểm soát phân quyền (`public/app.js`):**
    * Cập nhật hàm `updateAuthUI()`: Tự động phát hiện trạng thái phiên đăng nhập của người dùng (`isGuidesAuthorized = Boolean(user)`).
    * Khi chưa đăng nhập: Khóa chặt nội dung, ẩn khối làm việc `#guides-workspace-wrap`, hiển thị màn hình khóa `#guides-auth-lock-card` và icon khóa `🔒`.
    * Khi đã đăng nhập thành công: Mở khóa mượt mà toàn bộ 6 bài hướng dẫn và các tiện ích in ấn/tìm kiếm.

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
  - Quá trình thu thập (cả điểm Đắk Lắk và điểm 34 tỉnh) sẽ hoàn tất sau khoảng 5 - 7 giây.

### 3. Đăng nhập và tra cứu chi tiết tiêu chí
* Nhấn nút **"Đăng nhập"** ở góc trên bên phải màn hình.
* Nhập tài khoản:
  - `admin` / `Admin@766` (Quản trị viên)
  - `canbo` / `Canbo@766` (Cán bộ nghiệp vụ)
* Sau khi đăng nhập, nhấp vào bất kỳ con số điểm nào trên bảng để xem chi tiết hồ sơ/tiêu chí con.

### 4. Tra cứu vị trí lưu trữ dữ liệu
* **File số liệu từng ngày của tỉnh:** Nằm trong thư mục `data/snapshots/` (dạng `YYYY-MM-DD.json`).
* **File số liệu xếp hạng 34 tỉnh:** Nằm trong file `data/provinces-latest.json` và `data/provinces/YYYY-MM-DD.json`.
* **File tài khoản người dùng:** Nằm trong file `data/users.json`.
* **Nhật ký các lần chạy:** Nằm trong file `data/sync.log`.

---

## IV. BẢNG MÔ TẢ CÁC TẬP TIN CỐT LÕI

| Tập tin | Chức năng chính |
| :--- | :--- |
| `dev-server.js` | Web Server nội bộ (Express) chạy ở port 3000 phục vụ xem dashboard và API cục bộ. |
| `sync-to-cloud.js` | Script điều phối thu thập 6 chỉ số tỉnh + xếp hạng các tỉnh, phân tích điểm và lưu snapshot vào máy. |
| `run-sync.bat` | File thực thi tiến trình thu thập dữ liệu (được Task Scheduler gọi hàng ngày). |
| `run-sync-silent.vbs` | File VBScript giúp Task Scheduler chạy `run-sync.bat` ngầm không giật màn hình. |
| `run-local-web.bat` | File bật server web local và tự mở trình duyệt. |
| `run-local-web-silent.vbs` | File bật server web local chạy ngầm hoàn toàn (không hiện cửa sổ cmd). |
| `src/collector.js` | Module kết nối Cổng DVCQG, vượt tường lửa Anti-WAF và thu thập 6 nhóm chỉ số tỉnh. |
| `src/provinceCollector.js` | Module thu thập và tính toán xếp hạng 766 của 34 tỉnh/thành phố trên cả nước. |
| `src/analyzer.js` | Module tính toán điểm số tỉnh và xếp hạng 119 đơn vị trực thuộc. |
| `src/auth.js` | Module xác thực tài khoản, băm mật khẩu PBKDF2 và tạo/kiểm tra token JWT. |
| `src/storage.js` | Module quản lý đọc/ghi snapshot, xếp hạng tỉnh và tài khoản (chế độ Local + Cloud Redis). |
| `src/excelGenerator.js` | Module xuất báo cáo Excel 3 Sheet theo mẫu chuẩn. |
| `src/dossierParser.js` | Module phân tích và giải mã cấu trúc Số hồ sơ TTHC (phân biệt Cổng tỉnh / Cổng bộ và các Bộ). |
| `src/qrGenerator.js` | Module sinh Mã QR tra cứu Thủ tục hành chính chuẩn Cổng DVCQG có nhúng Logo Đắk Lắk ở giữa. |
| `api/auth.js` | API Serverless phục vụ đăng nhập (`/login`), kiểm tra phiên (`/me`), đăng xuất (`/logout`). |
| `api/provinces.js` | API Serverless cung cấp dữ liệu bảng xếp hạng 766 các tỉnh. |
| `api/data.js` | API Serverless cung cấp dữ liệu snapshot điểm 766 của tỉnh Đắk Lắk. |
| `api/766donvi.js` | API tra cứu điểm 766 theo đơn vị phục vụ Bot Zalo/Chatbot (`/766donvi`, `/api/766donvi`). |
| `public/` | Mã nguồn giao diện Web Frontend (HTML, CSS, JS). |
| `data/snapshots/` | Thư mục lưu snapshot dữ liệu lịch sử từng ngày của tỉnh Đắk Lắk. |
| `data/provinces/` | Thư mục lưu lịch sử xếp hạng 766 các tỉnh theo ngày. |
| `data/users.json` | File lưu danh sách tài khoản đã mã hóa mật khẩu. |
| `.env` | File cấu hình biến môi trường kết nối Upstash Redis và mật khẩu. |
| `vercel.json` | Cấu hình định tuyến và triển khai Serverless Functions trên Vercel. |

---

## V. TÀI LIỆU API CHO BOT ZALO / CHATBOT

### 1. API Tra cứu điểm 766 theo đơn vị (`/766donvi`)

* **Endpoint:**
  - `GET /766donvi?ma=H15.100` hoặc `GET /api/766donvi?code=H15.100`
  - `GET /766donvi/:code` (ví dụ `/766donvi/H15.100`)
  - `POST /766donvi` với body JSON: `{"code": "H15.100"}` hoặc `{"ma": "H15.100"}`
* **Tham số đầu vào:**
  - `ma` / `code` / `madonvi`: Mã đơn vị (ví dụ `H15.100`, `H15.15`) hoặc `H15` (toàn tỉnh), hoặc tên đơn vị (`Buôn Ma Thuột`, `Sở Tư pháp`).
  - `format`: (tùy chọn) `json` (mặc định) hoặc `text` (trả về văn bản thuần).
  - `date`: (tùy chọn) Ngày cần xem dạng `YYYY-MM-DD`. Nếu không truyền sẽ lấy **ngày mới nhất** trong database.
* **Dữ liệu trả về:**
  - `success`: `true/false`
  - `data.date`: Ngày dữ liệu (ví dụ `2026-10-23`)
  - `data.unit`: Thông tin đơn vị, mã, tên, cấp bậc, thứ hạng toàn tỉnh, thứ hạng khối, tổng điểm, xếp loại
  - `data.summary`: Tóm tắt điểm 6 nhóm chỉ số
  - `data.indicators`: Chi tiết 6 nhóm chỉ số kèm đầy đủ **tất cả các tiêu chí con** (tên, mã, tử số/mẫu số, tỷ lệ %, điểm đạt được, điểm tối đa)
  - `data.chatMessage`: Chuỗi tin nhắn văn bản format sẵn với icon/emoji chuyên nghiệp dành riêng cho Bot Zalo gửi trực tiếp vào khung chat.


