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
| `api/auth.js` | API Serverless phục vụ đăng nhập (`/login`), kiểm tra phiên (`/me`), đăng xuất (`/logout`). |
| `api/provinces.js` | API Serverless cung cấp dữ liệu bảng xếp hạng 766 các tỉnh. |
| `api/data.js` | API Serverless cung cấp dữ liệu snapshot điểm 766 của tỉnh Đắk Lắk. |
| `public/` | Mã nguồn giao diện Web Frontend (HTML, CSS, JS). |
| `data/snapshots/` | Thư mục lưu snapshot dữ liệu lịch sử từng ngày của tỉnh Đắk Lắk. |
| `data/provinces/` | Thư mục lưu lịch sử xếp hạng 766 các tỉnh theo ngày. |
| `data/users.json` | File lưu danh sách tài khoản đã mã hóa mật khẩu. |
| `.env` | File cấu hình biến môi trường kết nối Upstash Redis và mật khẩu. |
| `vercel.json` | Cấu hình định tuyến và triển khai Serverless Functions trên Vercel. |

