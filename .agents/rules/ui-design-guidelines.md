# QUY CHUẨN THIẾT KẾ GIAO DIỆN HỆ THỐNG (UI/UX DESIGN GUIDELINES)
*Áp dụng thống nhất cho toàn bộ hệ thống DVC 766 Đắk Lắk*

---

## 1. Triết lý Thiết kế: "MỘT CARD DUY NHẤT" (Enterprise Unified Card)
Toàn bộ các tab chức năng trong hệ thống (như *Đường dẫn các cổng*, *Tiện ích văn phòng*, *Xếp hạng 766*, *Báo cáo nhanh*, *Quản lý người dùng*...) **bắt buộc tuân thủ cấu trúc Một Card Trắng Duy Nhất**, tuyệt đối **KHÔNG** sử dụng phong cách cũ.

### ❌ Những điều TUYỆT ĐỐI TRÁNH (Phong cách cũ lỗi thời):
- **Không dùng Dark Banner / Gradient tối màu**: Tuyệt đối không dùng các khối banner màu xanh đen, tím than (`linear-gradient(135deg, #1e293b, #0f172a)`), vòng tròn mờ trang trí kiểu dashboard cũ.
- **Không cắt vụn giao diện thành nhiều khối rời rạc**: Không tạo một dãy thẻ số trôi nổi riêng, một thanh tìm kiếm lơ lửng riêng, rồi một bảng dữ liệu riêng tách biệt.
- **Không dùng màu sắc chói hoặc khung viền quá đậm**: Giữ mọi chi tiết thanh mảnh, tối giản, sang trọng theo phong cách GovTech / shadcn/ui hiện đại.

---

## 2. Cấu trúc HTML Chuẩn cho một Tab Chức năng
Mỗi màn hình/tab cần được bố cục theo bộ khung chuẩn mực sau:

```html
<div id="tab-content-xxx" class="tab-pane" style="display: none;">
  <div class="xxx-container">
    <!-- MỘT CARD DUY NHẤT (UNIFIED CARD) -->
    <div class="xxx-unified-card">
      
      <!-- PHẦN 1: CARD HEADER -->
      <div class="xxx-card-header">
        <div class="xxx-header-top">
          <div class="xxx-header-left">
            <!-- Tiêu đề + Huy hiệu GovTech -->
            <div class="xxx-title-row">
              <h2 class="xxx-clean-title">Tên Chức Năng</h2>
              <div class="xxx-badge-gov">
                <svg>...</svg>
                <span>Tên nhóm phân loại</span>
              </div>
            </div>
            <!-- Mô tả ngắn gọn -->
            <p class="xxx-clean-desc">Mô tả mục đích và hướng dẫn sử dụng chức năng...</p>
            <!-- Dải chip thống kê gọn gàng -->
            <div class="xxx-stats-strip">
              <span class="xxx-stat-chip"><strong>10</strong> Chỉ số A</span>
              <span class="xxx-stat-chip"><strong>25</strong> Chỉ số B</span>
            </div>
          </div>
          
          <!-- Các nút hành động chính (nếu có) -->
          <div class="xxx-header-actions">
            <button class="btn btn-secondary">Làm mới</button>
            <button class="btn btn-primary">+ Thao tác chính</button>
          </div>
        </div>
      </div>

      <!-- PHẦN 2: CARD BODY -->
      <div class="xxx-card-body">
        <!-- Vùng tìm kiếm / bộ lọc / thanh công cụ -->
        <div class="xxx-toolbar-wrap">...</div>

        <!-- Vùng nội dung chính (Bảng dữ liệu, danh sách thẻ, hoặc công cụ tác nghiệp) -->
        <div class="xxx-main-content">...</div>
      </div>

    </div> <!-- end .xxx-unified-card -->
  </div> <!-- end .xxx-container -->
</div>
```

---

## 3. Quy chuẩn Style & Bảng màu (Color Palette)
- **Nền trang chính (Body / Main Wrapper)**: Giữ nền trong suốt (`transparent`) để lộ nhẹ họa tiết **Trống đồng Đông Sơn** chìm tinh tế phía sau.
- **Nền Card Unified**: Trắng tinh khôi `#ffffff`, viền mảnh `1px solid #e2e8f0`, bo góc `12px` hoặc `16px`, bóng đổ nhẹ `box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05)`.
- **Card Header**:
  - Nền `#ffffff` đồng nhất với card body.
  - Phân tách thân bằng viền đáy siêu mảnh: `border-bottom: 1px solid #f1f5f9`.
  - Tiêu đề: `font-size: 20px`, `font-weight: 600`, màu `#0f172a`.
  - Mô tả: `font-size: 13.5px`, màu xám dịu `#64748b`.
- **Stat Chip (Chip thống kê)**:
  - Nền `#f8fafc`, viền `1px solid #e2e8f0`, bo góc `6px` hoặc `14px`, chữ `#475569`, số liệu `strong` màu `#0f172a`.
- **Huy hiệu (Badges)**:
  - Nền pastel nhẹ: `#eff6ff` (xanh dương), `#fff7ed` (cam), `#f0fdf4` (xanh lá).
  - Viền tương ứng: `#bfdbfe`, `#fed7aa`, `#bbf7d0`.
- **Bộ lọc & Ô tìm kiếm**:
  - Phong cách `shadcn/ui`: Nền input `#f8fafc`, viền `1px solid #cbd5e1`, bo góc `8px - 10px`.
  - Khi focus: Viền cam `#ea580c` kèm shadow tỏa nhẹ `0 0 0 3px rgba(234, 88, 12, 0.15)`.
- **Bảng dữ liệu (Data Table)**:
  - `thead`: Nền `#f8fafc`, chữ in hoa nhỏ `12px`, `font-weight: 700`, màu `#475569`.
  - `tbody tr`: Viền dưới `1px solid #f1f5f9`, hover nền `#f8fafc`, chuyển động `transition: background-color 0.15s ease`.

---

## 4. Kiểm tra trước khi bàn giao
Mỗi khi xây dựng chức năng hoặc giao diện mới, luôn đối chiếu:
1. Giao diện đã nằm trong **Một Card Trắng Duy Nhất** chưa?
2. Đã loại bỏ hoàn toàn các banner màu đen/tối và các khối lơ lửng chưa?
3. Tiêu đề, badge và dải chip thống kê đã xếp đặt chuẩn chỉ, đồng bộ với các tab khác chưa?
