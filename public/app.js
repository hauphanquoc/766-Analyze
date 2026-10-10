/**
 * Web Application Logic - Bộ Chỉ số 766 DVCQG
 */

// Application State
let appState = {
  currentUser: null,
  currentData: null,
  availableDates: [],
  selectedDate: null,
  radarChart: null,
  trendChart: null,
  table: {
    group: 'PROVINCE', // 'PROVINCE' hoặc 'COMMUNE'
    searchTerm: '',
    sortBy: 'score_desc',
    currentPage: 1,
    pageSize: 15
  }
};

// Indicator metadata
const INDICATOR_META = {
  transparency: { code: 'CHỈ SỐ 1', name: 'Công khai, minh bạch', max: 18, color: '#2563eb' },
  progress: { code: 'CHỈ SỐ 2', name: 'Tiến độ giải quyết', max: 20, color: '#059669' },
  onlineService: { code: 'CHỈ SỐ 3', name: 'Dịch vụ công trực tuyến', max: 12, color: '#4f46e5' },
  digitized: { code: 'CHỈ SỐ 4', name: 'Số hóa hồ sơ', max: 22, color: '#7c3aed' },
  payment: { code: 'CHỈ SỐ 5', name: 'Thanh toán trực tuyến', max: 10, color: '#d97706' },
  satisfaction: { code: 'CHỈ SỐ 6', name: 'Mức độ hài lòng', max: 18, color: '#e11d48' }
};

// DOM Elements
const dom = {
  loader: document.getElementById('main-loader'),
  dashboard: document.getElementById('dashboard-content'),
  dateSelect: document.getElementById('date-select'),
  btnExportExcel: document.getElementById('btn-export-excel'),
  totalScoreVal: document.getElementById('total-score-val'),
  classificationBadge: document.getElementById('classification-badge'),
  scoreDelta: document.getElementById('score-delta'),
  totalProgressBar: document.getElementById('total-progress-bar'),
  totalRatioVal: document.getElementById('total-ratio-val'),
  dataUpdatedTime: document.getElementById('data-updated-time'),
  unitsCountVal: document.getElementById('units-count-val'),
  unitsBreakdownSub: document.getElementById('units-breakdown-sub'),
  unitsTableTitle: document.getElementById('units-table-title'),
  unitsTableDesc: document.getElementById('units-table-desc'),
  badgeCountProvince: document.getElementById('badge-count-province'),
  badgeCountCommune: document.getElementById('badge-count-commune'),
  btnGroupProvince: document.getElementById('btn-group-province'),
  btnGroupCommune: document.getElementById('btn-group-commune'),
  unitSearchInput: document.getElementById('unit-search-input'),
  sortSelect: document.getElementById('sort-select'),
  unitsTableBody: document.getElementById('units-table-body'),
  showingCount: document.getElementById('showing-count'),
  totalFilteredCount: document.getElementById('total-filtered-count'),
  paginationWrap: document.getElementById('pagination-wrap'),
  metricModal: document.getElementById('metric-modal'),
  modalIndCode: document.getElementById('modal-ind-code'),
  modalIndTitle: document.getElementById('modal-ind-title'),
  modalBodyContent: document.getElementById('modal-body-content'),
  paymentModal: document.getElementById('payment-modal'),
  paymodalIndCode: document.getElementById('paymodal-ind-code'),
  paymodalIndTitle: document.getElementById('paymodal-ind-title'),
  paymodalUnitName: document.getElementById('paymodal-unit-name'),
  paymodalScoreVal: document.getElementById('paymodal-score-val'),
  paymodalCardsContainer: document.getElementById('paymodal-cards-container'),
  progressModal: document.getElementById('progress-modal'),
  progmodalIndCode: document.getElementById('progmodal-ind-code'),
  progmodalIndTitle: document.getElementById('progmodal-ind-title'),
  progmodalUnitName: document.getElementById('progmodal-unit-name'),
  progmodalTotalReceived: document.getElementById('progmodal-total-received'),
  progmodalAvgDays: document.getElementById('progmodal-avg-days'),
  progmodalScoreVal: document.getElementById('progmodal-score-val'),
  progmodalOntimeScore: document.getElementById('progmodal-ontime-score'),
  progmodalOntimeNum: document.getElementById('progmodal-ontime-num'),
  progmodalOntimeDen: document.getElementById('progmodal-ontime-den'),
  progmodalOntimeRatio: document.getElementById('progmodal-ontime-ratio'),
  progmodalOntimeBar: document.getElementById('progmodal-ontime-bar'),
  progmodalOverdueNum: document.getElementById('progmodal-overdue-num'),
  progmodalOverdueDen: document.getElementById('progmodal-overdue-den'),
  progmodalOverdueRatio: document.getElementById('progmodal-overdue-ratio'),
  progmodalOverdueBar: document.getElementById('progmodal-overdue-bar'),
  welcomeModal: document.getElementById('welcome-modal'),
  toastContainer: document.getElementById('toast-container'),
  btnLoginHeader: document.getElementById('btn-open-login'),
  userProfileHeader: document.getElementById('user-profile-header'),
  userAvatarInitial: document.getElementById('user-avatar-initial'),
  userDisplayName: document.getElementById('user-display-name'),
  userRoleBadge: document.getElementById('user-role-badge'),
  loginModal: document.getElementById('login-modal'),
  loginForm: document.getElementById('login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  loginErrorAlert: document.getElementById('login-error-alert'),
  loginContextNotice: document.getElementById('login-context-notice'),
  loginContextText: document.getElementById('login-context-text'),
  loginSubmitBtn: document.getElementById('btn-login-submit'),
  loginSubmitText: document.getElementById('login-submit-text'),
  loginSubmitSpinner: document.getElementById('login-submit-spinner')
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initNavigationTabs();
  initPortalsDirectory();
  initProvincesTab();
  initFormulaDirectory();
  initToolsSubnavigation();
  initSignatureRemoverTool();
  initImageMergerTool();
  initPdfCompressorTool();
  initImageToPdfTool();
  initEventListeners();
  initWelcomeNotice();
  initAuth();
  initDossierSplitModule();
  initProcedureQrModule();
  loadInitialData();
});

/**
 * Navigation tabs (Đường dẫn các cổng / Xếp hạng các tỉnh / Bộ chỉ số 766)
 */
function initNavigationTabs() {
  const tabButtons = document.querySelectorAll('.nav-tab-btn[data-tab]');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function switchTab(targetTabId) {
    tabButtons.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetTabId);
    });

    tabPanes.forEach(pane => {
      if (pane.id === targetTabId) {
        pane.style.display = 'block';
        pane.classList.add('active');
      } else {
        pane.style.display = 'none';
        pane.classList.remove('active');
      }
    });

    // Tự động tải dữ liệu các tỉnh khi mở tab Xếp hạng các tỉnh
    if (targetTabId === 'tab-content-provinces') {
      if (!provincesState.loaded) {
        loadProvincesData();
      }
    }

    // Resize Chart.js when entering 766 tab so canvas dimensions are sharp
    if (targetTabId === 'tab-content-766') {
      setTimeout(() => {
        if (appState.radarChart) appState.radarChart.resize();
        if (appState.trendChart) appState.trendChart.resize();
      }, 60);
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      switchTab(targetTabId);
    });
  });
}

/**
 * DANH BẠ CÁC HỆ THỐNG CỔNG DỊCH VỤ CÔNG & TÁC NGHIỆP NỘI BỘ (PHÂN LOẠI TRÊN 1 TRANG)
 * Nguồn dữ liệu bóc tách từ https://dieuphoi.netlify.app/#tac-nghiep
 */
const PORTAL_SECTIONS = [
  {
    "id": "daklak",
    "title": "TỈNH ĐẮK LẮK",
    "items": [
      {
        "name": "MỘT CỬA ĐẮK LẮK (IGATE)",
        "url": "https://motcua.daklak.gov.vn",
        "icon": "https://cdn.thuvienphapluat.vn/uploads/tintuc/2026/03/18/logo-dak-lak.jpg"
      },
      {
        "name": "VĂN PHÒNG ĐIỆN TỬ (IOFFICE)",
        "url": "https://vpdt.daklak.gov.vn",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"6\" y=\"8\" width=\"36\" height=\"32\" rx=\"6\" fill=\"#EFF6FF\" stroke=\"#3B82F6\" stroke-width=\"2\"/>\n    <rect x=\"12\" y=\"14\" width=\"16\" height=\"4\" rx=\"2\" fill=\"#2563EB\"/>\n    <rect x=\"12\" y=\"21\" width=\"24\" height=\"3\" rx=\"1.5\" fill=\"#94A3B8\"/>\n    <rect x=\"12\" y=\"27\" width=\"18\" height=\"3\" rx=\"1.5\" fill=\"#CBD5E1\"/>\n    <!-- E-sign badge -->\n    <circle cx=\"33\" cy=\"28\" r=\"8\" fill=\"#10B981\"/>\n    <path d=\"M29.5 28L32 30.5L36.5 25.5\" stroke=\"#FFFFFF\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n  </svg>"
      },
      {
        "name": "HỆ THỐNG KPI",
        "url": "https://kpiccvc.vnptdaklak.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"6\" y=\"6\" width=\"36\" height=\"36\" rx=\"8\" fill=\"#FAF5FF\" stroke=\"#A855F7\" stroke-width=\"2\"/>\n    <!-- KPI Gauge Speedometer -->\n    <path d=\"M14 30A12 12 0 0 1 34 30\" stroke=\"#E9D5FF\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n    <path d=\"M14 30A12 12 0 0 1 29 19\" stroke=\"#9333EA\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n    <!-- Needle -->\n    <circle cx=\"24\" cy=\"30\" r=\"3\" fill=\"#6B21A8\"/>\n    <line x1=\"24\" y1=\"30\" x2=\"30\" y2=\"20\" stroke=\"#7E22CE\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>\n    <!-- Target Star -->\n    <polygon points=\"34,13 35,15.5 37.5,16 35.5,18 36,20.5 34,19 32,20.5 32.5,18 30.5,16 33,15.5\" fill=\"#EAB308\"/>\n  </svg>"
      },
      {
        "name": "QUẢN LÝ CÁN BỘ CCVC",
        "url": "https://daklak.vnerp.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <!-- Thẻ cán bộ công chức -->\n    <rect x=\"10\" y=\"8\" width=\"28\" height=\"34\" rx=\"5\" fill=\"#FFFFFF\" stroke=\"#0284C7\" stroke-width=\"2\"/>\n    <rect x=\"10\" y=\"8\" width=\"28\" height=\"10\" rx=\"4\" fill=\"#0284C7\"/>\n    <circle cx=\"24\" cy=\"6\" r=\"2\" fill=\"#64748B\"/>\n    <!-- Avatar cán bộ -->\n    <circle cx=\"24\" cy=\"24\" r=\"5\" fill=\"#38BDF8\"/>\n    <path d=\"M17 35C17 31 20 29.5 24 29.5C28 29.5 31 31 31 35\" fill=\"#0284C7\"/>\n    <rect x=\"15\" y=\"38\" width=\"18\" height=\"2\" rx=\"1\" fill=\"#BAE6FD\"/>\n  </svg>"
      },
      {
        "name": "HỆ THỐNG MAIL CÔNG CỤ",
        "url": "https://mail.daklak.gov.vn/",
        "keywords": "mail cong cu, mail cong vu, thu dien tu, mail daklak, daklak mail",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"6\" y=\"8\" width=\"36\" height=\"32\" rx=\"8\" fill=\"#F0F9FF\" stroke=\"#0284C7\" stroke-width=\"2\"/>\n    <!-- Phong bì thư công vụ -->\n    <rect x=\"10\" y=\"14\" width=\"28\" height=\"20\" rx=\"3.5\" fill=\"#0284C7\"/>\n    <!-- Nắp và nếp gấp phong bì -->\n    <path d=\"M10 16L24 26L38 16\" stroke=\"#FFFFFF\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n    <path d=\"M10 32L19 23M38 32L29 23\" stroke=\"#38BDF8\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>\n    <!-- Huy hiệu xác thực an toàn -->\n    <circle cx=\"34\" cy=\"13\" r=\"5\" fill=\"#10B981\" stroke=\"#FFFFFF\" stroke-width=\"1.5\"/>\n    <path d=\"M32 13L33.5 14.5L36 12\" stroke=\"#FFFFFF\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n  </svg>"
      },
      {
        "name": "HỆ THỐNG THÔNG TIN BÁO CÁO TỈNH ĐẮK LẮK",
        "url": "https://baocao.daklak.gov.vn/",
        "keywords": "bao cao daklak, he thong thong tin bao cao, lrps, chi dao dieu hanh, tinh dak lak, bao cao",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"6\" y=\"8\" width=\"36\" height=\"32\" rx=\"8\" fill=\"#F0FDF4\" stroke=\"#16A34A\" stroke-width=\"2\"/>\n    <!-- Thẻ báo cáo -->\n    <rect x=\"12\" y=\"12\" width=\"24\" height=\"24\" rx=\"3\" fill=\"#FFFFFF\" stroke=\"#15803D\" stroke-width=\"1.8\"/>\n    <!-- Kẹp tài liệu trên -->\n    <rect x=\"20\" y=\"10\" width=\"8\" height=\"4\" rx=\"1.5\" fill=\"#16A34A\"/>\n    <!-- Cột biểu đồ thống kê -->\n    <rect x=\"16\" y=\"24\" width=\"3.5\" height=\"8\" rx=\"1\" fill=\"#3B82F6\"/>\n    <rect x=\"22\" y=\"19\" width=\"3.5\" height=\"13\" rx=\"1\" fill=\"#10B981\"/>\n    <rect x=\"28\" y=\"22\" width=\"3.5\" height=\"10\" rx=\"1\" fill=\"#F59E0B\"/>\n    <!-- Đường xu hướng -->\n    <path d=\"M17 22L23 17L29 20\" stroke=\"#EF4444\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n  </svg>"
      },
      {
        "name": "HỆ THỐNG THÔNG TIN ĐẤT ĐAI (VBDLIS)",
        "url": "https://dla.mplis.gov.vn/dc",
        "keywords": "dat dai, vbdlis, mplis, dia chinh, quy hoach, so tai nguyen moi truong, thua dat, dak lak",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"6\" y=\"8\" width=\"36\" height=\"32\" rx=\"8\" fill=\"#FEFCE8\" stroke=\"#CA8A04\" stroke-width=\"2\"/>\n    <!-- Bản đồ thửa đất địa chính -->\n    <polygon points=\"12,27 21,18 31,20 36,29 25,34\" fill=\"#84CC16\" fill-opacity=\"0.25\" stroke=\"#65A30D\" stroke-width=\"1.8\"/>\n    <!-- Đường phân ranh thửa -->\n    <line x1=\"21\" y1=\"18\" x2=\"25\" y2=\"34\" stroke=\"#65A30D\" stroke-width=\"1.5\" stroke-dasharray=\"2 2\"/>\n    <line x1=\"12\" y1=\"27\" x2=\"31\" y2=\"20\" stroke=\"#65A30D\" stroke-width=\"1.5\"/>\n    <polygon points=\"21,18 27,14 34,16 31,20\" fill=\"#EAB308\" fill-opacity=\"0.3\" stroke=\"#CA8A04\" stroke-width=\"1.5\"/>\n    <!-- Ghim định vị tọa độ -->\n    <path d=\"M25 10C22.8 10 21 11.8 21 14C21 17.5 25 22 25 22C25 22 29 17.5 29 14C29 11.8 27.2 10 25 10Z\" fill=\"#DC2626\"/>\n    <circle cx=\"25\" cy=\"14\" r=\"1.8\" fill=\"#FFFFFF\"/>\n    <!-- La bàn định hướng trắc địa -->\n    <circle cx=\"14\" cy=\"14\" r=\"4\" fill=\"#EFF6FF\" stroke=\"#0284C7\" stroke-width=\"1.5\"/>\n    <polygon points=\"14,11 15.5,14 14,13.5 12.5,14\" fill=\"#DC2626\"/>\n    <polygon points=\"14,17 15.5,14 14,14.5 12.5,14\" fill=\"#0284C7\"/>\n  </svg>"
      }
    ]
  },
  {
    "id": "national",
    "title": "CỔNG DỊCH VỤ CÔNG QUỐC GIA",
    "items": [
      {
        "name": "CỔNG DVC QUỐC GIA",
        "url": "https://dichvucong.gov.vn",
        "icon": "https://cdn.statically.io/gh/ChippedTopaz/dieu-phoi/main/Logo%20CCHC.png"
      },
      {
        "name": "ĐIỀU PHỐI GIẢI QUYẾT TTHC",
        "url": "https://quantricong.dichvucong.gov.vn",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#F0FDF4\" stroke=\"#16A34A\" stroke-width=\"2\"/>\n    <!-- Điều phối luồng xử lý -->\n    <circle cx=\"24\" cy=\"15\" r=\"4.5\" fill=\"#2563EB\"/>\n    <circle cx=\"15\" cy=\"31\" r=\"4.5\" fill=\"#16A34A\"/>\n    <circle cx=\"33\" cy=\"31\" r=\"4.5\" fill=\"#EA580C\"/>\n    <!-- Connected Arrows -->\n    <path d=\"M21 18L17 27\" stroke=\"#64748B\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n    <path d=\"M27 18L31 27\" stroke=\"#64748B\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n    <path d=\"M19.5 31H28.5\" stroke=\"#64748B\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n    <circle cx=\"24\" cy=\"24\" r=\"2.5\" fill=\"#EAB308\"/>\n  </svg>"
      },
      {
        "name": "PHẢN ÁNH KIẾN NGHỊ",
        "url": "http://phananhkiennghi.dichvucong.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"6\" y=\"8\" width=\"36\" height=\"32\" rx=\"8\" fill=\"#FFFBEB\" stroke=\"#F59E0B\" stroke-width=\"2\"/>\n    <!-- Chat Bubbles -->\n    <path d=\"M14 16H28C30.2 16 32 17.8 32 20V24C32 26.2 30.2 28 28 28H20L15 32V28H14C11.8 28 10 26.2 10 24V20C10 17.8 11.8 16 14 16Z\" fill=\"#FBBF24\"/>\n    <!-- Thumbs up icon -->\n    <path d=\"M18 24V20M21 24V18.5C21 17.7 21.7 17 22.5 17C23.3 17 24 17.7 24 18.5V21H26C26.8 21 27.5 21.7 27.4 22.5L27 25C26.9 25.6 26.4 26 25.8 26H21\" stroke=\"#78350F\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>\n  </svg>"
      },
      {
        "name": "QUẢN TRỊ THANH TOÁN TRỰC TUYẾN",
        "url": "https://quantrithanhtoan.ndc.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"6\" y=\"10\" width=\"36\" height=\"28\" rx=\"6\" fill=\"#F0FDFA\" stroke=\"#0D9488\" stroke-width=\"2\"/>\n    <rect x=\"6\" y=\"16\" width=\"36\" height=\"6\" fill=\"#0D9488\"/>\n    <!-- Chip -->\n    <rect x=\"12\" y=\"26\" width=\"7\" height=\"6\" rx=\"1.5\" fill=\"#F59E0B\"/>\n    <!-- Secure check -->\n    <circle cx=\"34\" cy=\"28\" r=\"5\" fill=\"#10B981\"/>\n    <path d=\"M32 28L33.5 29.5L36.5 26.5\" stroke=\"#FFFFFF\" stroke-width=\"1.5\" stroke-linecap=\"round\"/>\n  </svg>"
      },
      {
        "name": "CSDL QUỐC GIA VỀ TTHC",
        "url": "https://csdltthc.dichvucong.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"8\" y=\"6\" width=\"32\" height=\"36\" rx=\"6\" fill=\"#F8FAFC\" stroke=\"#6366F1\" stroke-width=\"2\"/>\n    <!-- Database servers -->\n    <ellipse cx=\"24\" cy=\"14\" rx=\"10\" ry=\"3.5\" fill=\"#818CF8\"/>\n    <path d=\"M14 14V19C14 21 18.5 22.5 24 22.5C29.5 22.5 34 21 34 19V14\" stroke=\"#4F46E5\" stroke-width=\"2\"/>\n    <path d=\"M14 21V26C14 28 18.5 29.5 24 29.5C29.5 29.5 34 28 34 26V21\" stroke=\"#4F46E5\" stroke-width=\"2\"/>\n    <path d=\"M14 28V33C14 35 18.5 36.5 24 36.5C29.5 36.5 34 35 34 33V28\" stroke=\"#4F46E5\" stroke-width=\"2\"/>\n    <circle cx=\"30\" cy=\"18\" r=\"1.5\" fill=\"#4ADE80\"/>\n    <circle cx=\"30\" cy=\"25\" r=\"1.5\" fill=\"#4ADE80\"/>\n    <circle cx=\"30\" cy=\"32\" r=\"1.5\" fill=\"#4ADE80\"/>\n  </svg>"
      },
      {
        "name": "BÁO CÁO KIỂM SOÁT TTHC",
        "url": "https://kiemsoattthc.moj.gov.vn/operational-monitoring",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"8\" y=\"6\" width=\"32\" height=\"36\" rx=\"6\" fill=\"#FFF7ED\" stroke=\"#EA580C\" stroke-width=\"2\"/>\n    <!-- Checklist -->\n    <rect x=\"16\" y=\"4\" width=\"16\" height=\"5\" rx=\"2\" fill=\"#EA580C\"/>\n    <path d=\"M14 18L17 21L23 15\" stroke=\"#16A34A\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n    <rect x=\"26\" y=\"17\" width=\"9\" height=\"2.5\" rx=\"1\" fill=\"#94A3B8\"/>\n    <path d=\"M14 26L17 29L23 23\" stroke=\"#16A34A\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n    <rect x=\"26\" y=\"25\" width=\"9\" height=\"2.5\" rx=\"1\" fill=\"#94A3B8\"/>\n    <!-- Seal badge -->\n    <circle cx=\"32\" cy=\"33\" r=\"5\" fill=\"#DC2626\"/>\n    <polygon points=\"32,30.5 32.8,32 34.5,32.3 33.2,33.5 33.6,35.2 32,34.3 30.4,35.2 30.8,33.5 29.5,32.3 31.2,32\" fill=\"#FFFFFF\"/>\n  </svg>"
      }
    ]
  },
  {
    "id": "ministry",
    "title": "HỆ THỐNG THÔNG TIN GIẢI QUYẾT TTHC TẬP TRUNG",
    "items": [
      {
        "name": "BỘ KHOA HỌC VÀ CÔNG NGHỆ",
        "url": "https://motcua.mst.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#F0FDF4\" stroke=\"#059669\" stroke-width=\"2\"/>\n    <!-- Quỹ đạo nguyên tử KH&CN -->\n    <ellipse cx=\"24\" cy=\"24\" rx=\"16\" ry=\"6\" stroke=\"#0D9488\" stroke-width=\"2\" transform=\"rotate(30 24 24)\"/>\n    <ellipse cx=\"24\" cy=\"24\" rx=\"16\" ry=\"6\" stroke=\"#0284C7\" stroke-width=\"2\" transform=\"rotate(-30 24 24)\"/>\n    <ellipse cx=\"24\" cy=\"24\" rx=\"16\" ry=\"6\" stroke=\"#7C3AED\" stroke-width=\"2\" transform=\"rotate(90 24 24)\"/>\n    <circle cx=\"24\" cy=\"24\" r=\"4.5\" fill=\"#F59E0B\"/>\n    <circle cx=\"36\" cy=\"18\" r=\"2.5\" fill=\"#0284C7\"/>\n    <circle cx=\"12\" cy=\"18\" r=\"2.5\" fill=\"#0D9488\"/>\n  </svg>"
      },
      {
        "name": "BỘ CÔNG THƯƠNG",
        "url": "https://motcua-tthc.moit.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#FFFBEB\" stroke=\"#D97706\" stroke-width=\"2\"/>\n    <!-- Bánh răng công nghiệp & Tia chớp năng lượng -->\n    <path d=\"M21 7H27V11H21V7ZM21 37H27V41H21V37ZM7 21H11V27H7V21ZM37 21H41V27H37V21Z\" fill=\"#D97706\"/>\n    <circle cx=\"24\" cy=\"24\" r=\"12\" fill=\"#F59E0B\"/>\n    <polygon points=\"26,16 19,25 24,25 22,32 29,23 24,23\" fill=\"#FFFFFF\"/>\n  </svg>"
      },
      {
        "name": "BỘ XÂY DỰNG",
        "url": "https://motcuabxd.moc.gov.vn",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#F0F9FF\" stroke=\"#0284C7\" stroke-width=\"2\"/>\n    <!-- Tòa nhà & Cần cẩu xây dựng -->\n    <rect x=\"10\" y=\"20\" width=\"10\" height=\"20\" rx=\"1\" fill=\"#0284C7\"/>\n    <rect x=\"22\" y=\"14\" width=\"14\" height=\"26\" rx=\"1\" fill=\"#0369A1\"/>\n    <!-- Cửa sổ kính -->\n    <rect x=\"12\" y=\"23\" width=\"2\" height=\"3\" fill=\"#BAE6FD\"/>\n    <rect x=\"16\" y=\"23\" width=\"2\" height=\"3\" fill=\"#BAE6FD\"/>\n    <rect x=\"12\" y=\"28\" width=\"2\" height=\"3\" fill=\"#BAE6FD\"/>\n    <rect x=\"16\" y=\"28\" width=\"2\" height=\"3\" fill=\"#BAE6FD\"/>\n    <rect x=\"25\" y=\"18\" width=\"3\" height=\"3\" fill=\"#BAE6FD\"/>\n    <rect x=\"30\" y=\"18\" width=\"3\" height=\"3\" fill=\"#BAE6FD\"/>\n    <rect x=\"25\" y=\"24\" width=\"3\" height=\"3\" fill=\"#BAE6FD\"/>\n    <rect x=\"30\" y=\"24\" width=\"3\" height=\"3\" fill=\"#BAE6FD\"/>\n    <!-- Cần cẩu -->\n    <line x1=\"8\" y1=\"12\" x2=\"26\" y2=\"12\" stroke=\"#F59E0B\" stroke-width=\"2\"/>\n    <line x1=\"16\" y1=\"12\" x2=\"16\" y2=\"20\" stroke=\"#F59E0B\" stroke-width=\"2\"/>\n  </svg>"
      },
      {
        "name": "BỘ NỘI VỤ",
        "url": "https://motcua.moha.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#FAF5FF\" stroke=\"#7C3AED\" stroke-width=\"2\"/>\n    <!-- Cây tổ chức cán bộ & biểu tượng quản lý nhà nước -->\n    <rect x=\"20\" y=\"10\" width=\"8\" height=\"6\" rx=\"2\" fill=\"#7C3AED\"/>\n    <path d=\"M24 16V22M15 22H33M15 22V26M33 22V26\" stroke=\"#6D28D9\" stroke-width=\"2\"/>\n    <rect x=\"11\" y=\"26\" width=\"8\" height=\"6\" rx=\"2\" fill=\"#9333EA\"/>\n    <rect x=\"29\" y=\"26\" width=\"8\" height=\"6\" rx=\"2\" fill=\"#9333EA\"/>\n    <circle cx=\"24\" cy=\"34\" r=\"4\" fill=\"#EAB308\"/>\n  </svg>"
      },
      {
        "name": "BỘ NÔNG NGHIỆP VÀ MÔI TRƯỜNG",
        "url": "https://motcuannmt.mae.gov.vn",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#F0FDF4\" stroke=\"#16A34A\" stroke-width=\"2\"/>\n    <!-- Bông lúa vàng & Lá mầm xanh môi trường -->\n    <path d=\"M16 34C18 26 24 18 32 14\" stroke=\"#16A34A\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n    <!-- Hạt lúa vàng -->\n    <ellipse cx=\"26\" cy=\"18\" rx=\"3.5\" ry=\"2\" fill=\"#EAB308\" transform=\"rotate(-30 26 18)\"/>\n    <ellipse cx=\"22\" cy=\"22\" rx=\"3.5\" ry=\"2\" fill=\"#EAB308\" transform=\"rotate(-30 22 22)\"/>\n    <ellipse cx=\"18\" cy=\"27\" rx=\"3.5\" ry=\"2\" fill=\"#EAB308\" transform=\"rotate(-30 18 27)\"/>\n    <!-- Lá xanh -->\n    <path d=\"M26 26C34 26 36 34 36 34C36 34 28 36 24 30\" fill=\"#22C55E\"/>\n    <!-- Giọt nước -->\n    <path d=\"M30 10C30 10 34 14 34 16C34 18 32 20 30 20C28 20 26 18 26 16C26 14 30 10 30 10Z\" fill=\"#38BDF8\"/>\n  </svg>"
      },
      {
        "name": "BỘ GIÁO DỤC VÀ ĐÀO TẠO",
        "url": "https://motcua.moet.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#EFF6FF\" stroke=\"#2563EB\" stroke-width=\"2\"/>\n    <!-- Mũ cử nhân & Trang sách -->\n    <polygon points=\"24,12 38,18 24,24 10,18\" fill=\"#1E40AF\"/>\n    <path d=\"M16 21V28C16 31 24 33 24 33C24 33 32 31 32 28V21\" fill=\"#3B82F6\"/>\n    <path d=\"M38 18V28\" stroke=\"#F59E0B\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>\n    <circle cx=\"38\" cy=\"29\" r=\"2\" fill=\"#F59E0B\"/>\n    <!-- Sách mở -->\n    <path d=\"M13 36C18 34 24 35 24 38C24 35 30 34 35 36\" stroke=\"#1E40AF\" stroke-width=\"2.5\" fill=\"none\"/>\n  </svg>"
      },
      {
        "name": "BỘ Y TẾ",
        "url": "https://motcua.moh.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#FEF2F2\" stroke=\"#EF4444\" stroke-width=\"2\"/>\n    <!-- Chữ thập đỏ Y tế & Ống nghe / Trái tim -->\n    <rect x=\"19\" y=\"10\" width=\"10\" height=\"28\" rx=\"2\" fill=\"#DC2626\"/>\n    <rect x=\"10\" y=\"19\" width=\"28\" height=\"10\" rx=\"2\" fill=\"#DC2626\"/>\n    <circle cx=\"24\" cy=\"24\" r=\"6\" fill=\"#FFFFFF\"/>\n    <path d=\"M24 21C22.5 19 20 20 20 22.5C20 25 24 27.5 24 27.5C24 27.5 28 25 28 22.5C28 20 25.5 19 24 21Z\" fill=\"#DC2626\"/>\n  </svg>"
      },
      {
        "name": "BỘ VĂN HOÁ THỂ THAO VÀ DU LỊCH",
        "url": "https://dichvucong.bvhttdl.gov.vn/tiepnhan/dang-nhap",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#FFF7ED\" stroke=\"#EA580C\" stroke-width=\"2\"/>\n    <!-- Trống đồng & Ngọn đuốc thể thao -->\n    <circle cx=\"24\" cy=\"24\" r=\"16\" fill=\"#FDBA74\" stroke=\"#C2410C\" stroke-width=\"1.8\"/>\n    <!-- Ngôi sao mặt trời trống đồng -->\n    <polygon points=\"24,14 26,20 32,20 27,24 29,30 24,26 19,30 21,24 16,20 22,20\" fill=\"#EA580C\"/>\n    <circle cx=\"24\" cy=\"24\" r=\"3\" fill=\"#FFFFFF\"/>\n    <path d=\"M12 24A12 12 0 0 1 36 24\" stroke=\"#9A3412\" stroke-width=\"1.5\" stroke-dasharray=\"2 2\"/>\n  </svg>"
      },
      {
        "name": "BỘ TƯ PHÁP",
        "url": "https://motcua.moj.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#FEF2F2\" stroke=\"#B91C1C\" stroke-width=\"2\"/>\n    <!-- Cán cân công lý Tư pháp -->\n    <line x1=\"24\" y1=\"10\" x2=\"24\" y2=\"38\" stroke=\"#78350F\" stroke-width=\"2.5\"/>\n    <line x1=\"14\" y1=\"15\" x2=\"34\" y2=\"15\" stroke=\"#B45309\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>\n    <!-- Đĩa cân trái -->\n    <line x1=\"14\" y1=\"15\" x2=\"10\" y2=\"24\" stroke=\"#D97706\" stroke-width=\"1.5\"/>\n    <line x1=\"14\" y1=\"15\" x2=\"18\" y2=\"24\" stroke=\"#D97706\" stroke-width=\"1.5\"/>\n    <path d=\"M9 24C9 27 19 27 19 24Z\" fill=\"#F59E0B\"/>\n    <!-- Đĩa cân phải -->\n    <line x1=\"34\" y1=\"15\" x2=\"30\" y2=\"24\" stroke=\"#D97706\" stroke-width=\"1.5\"/>\n    <line x1=\"34\" y1=\"15\" x2=\"38\" y2=\"24\" stroke=\"#D97706\" stroke-width=\"1.5\"/>\n    <path d=\"M29 24C29 27 39 27 39 24Z\" fill=\"#F59E0B\"/>\n    <rect x=\"18\" y=\"36\" width=\"12\" height=\"3\" rx=\"1.5\" fill=\"#78350F\"/>\n  </svg>"
      },
      {
        "name": "BỘ DÂN TỘC VÀ TÔN GIÁO",
        "url": "https://gqtthc.bdttg.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#FEF3C7\" stroke=\"#F59E0B\" stroke-width=\"2\"/>\n    <!-- Hoa sen đoàn kết các dân tộc & mặt trời -->\n    <circle cx=\"24\" cy=\"24\" r=\"8\" fill=\"#F59E0B\"/>\n    <path d=\"M24 10C24 16 16 20 24 28C32 20 24 16 24 10Z\" fill=\"#EA580C\"/>\n    <path d=\"M12 24C18 24 22 16 30 24C22 32 18 24 12 24Z\" fill=\"#10B981\" opacity=\"0.8\"/>\n    <path d=\"M14 32C20 30 28 30 34 32\" stroke=\"#B45309\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>\n  </svg>"
      },
      {
        "name": "BỘ NGOẠI GIAO",
        "url": "https://bpmc.mofa.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#F0F9FF\" stroke=\"#0284C7\" stroke-width=\"2\"/>\n    <!-- Quả địa cầu Ngoại giao & Cành cọ hòa bình -->\n    <circle cx=\"24\" cy=\"24\" r=\"14\" stroke=\"#0284C7\" stroke-width=\"2\" fill=\"#E0F2FE\"/>\n    <ellipse cx=\"24\" cy=\"24\" rx=\"6\" ry=\"14\" stroke=\"#0284C7\" stroke-width=\"1.8\"/>\n    <line x1=\"10\" y1=\"24\" x2=\"38\" y2=\"24\" stroke=\"#0284C7\" stroke-width=\"1.8\"/>\n    <line x1=\"13\" y1=\"17\" x2=\"35\" y2=\"17\" stroke=\"#0284C7\" stroke-width=\"1.4\"/>\n    <line x1=\"13\" y1=\"31\" x2=\"35\" y2=\"31\" stroke=\"#0284C7\" stroke-width=\"1.4\"/>\n    <!-- Nhánh lá vàng -->\n    <path d=\"M12 36C18 36 28 32 34 26\" stroke=\"#EAB308\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>\n  </svg>"
      },
      {
        "name": "BỘ QUỐC PHÒNG",
        "url": "https://motcua.mod.gov.vn/web/bo-quoc-phong/register#/login-dichvucong",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#FEF2F2\" stroke=\"#DC2626\" stroke-width=\"2\"/>\n    <!-- Khiên quốc phòng & Ngôi sao vàng quân đội -->\n    <path d=\"M24 8L36 13V24C36 31 24 38 24 38C24 38 12 31 12 24V13L24 8Z\" fill=\"#DC2626\" stroke=\"#991B1B\" stroke-width=\"2\"/>\n    <path d=\"M24 11L33 15V23C33 28 24 34 24 34C24 34 15 28 15 23V15L24 11Z\" fill=\"#B91C1C\"/>\n    <polygon points=\"24,16 26,20.5 31,21 27.5,24 28.5,29 24,26.5 19.5,29 20.5,24 17,21 22,20.5\" fill=\"#FACC15\"/>\n  </svg>"
      },
      {
        "name": "BỘ TÀI CHÍNH",
        "url": "https://tthc.mof.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#ECFDF5\" stroke=\"#059669\" stroke-width=\"2\"/>\n    <!-- Két sắt & Biểu đồ tăng trưởng tài chính -->\n    <rect x=\"10\" y=\"14\" width=\"28\" height=\"24\" rx=\"4\" fill=\"#047857\"/>\n    <circle cx=\"24\" cy=\"26\" r=\"6\" fill=\"#F59E0B\"/>\n    <circle cx=\"24\" cy=\"26\" r=\"2.5\" fill=\"#047857\"/>\n    <!-- Xu hướng tăng trưởng -->\n    <path d=\"M12 10L22 10M22 10L17 15\" stroke=\"#10B981\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>\n    <path d=\"M12 32L18 26L24 29L34 16\" stroke=\"#FEF08A\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n  </svg>"
      }
    ]
  },
  {
    "id": "party",
    "title": "DỊCH VỤ CÔNG ĐẢNG",
    "items": [
      {
        "name": "DVC ĐẢNG CỘNG SẢN",
        "url": "https://dichvucong.dcs.vn/",
        "icon": "https://cdn-icons-png.flaticon.com/128/323/323319.png"
      },
      {
        "name": "HỆ THỐNG GQ TTHC ĐẢNG",
        "url": "https://gqtthc.dcs.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <!-- Hồ sơ TTHC Đảng với huy hiệu Búa Liềm -->\n    <rect x=\"8\" y=\"8\" width=\"32\" height=\"34\" rx=\"5\" fill=\"#FFF1F2\" stroke=\"#E11D48\" stroke-width=\"2\"/>\n    <rect x=\"8\" y=\"8\" width=\"32\" height=\"10\" rx=\"4\" fill=\"#BE123C\"/>\n    <!-- Dấu đỏ TTHC -->\n    <circle cx=\"24\" cy=\"27\" r=\"9\" fill=\"#DC2626\"/>\n    <!-- Búa Liềm thu nhỏ -->\n    <polygon points=\"24,21 25.5,25 29.5,25.5 26.5,28 27.5,32 24,29.8 20.5,32 21.5,28 18.5,25.5 22.5,25\" fill=\"#FDE047\"/>\n  </svg>"
      },
      {
        "name": "SỔ TAY ĐẢNG VIÊN",
        "url": "https://sotaydangvien.dcs.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <!-- Cuốn sổ tay Đảng bìa đỏ có huy hiệu vàng và dải ruy băng -->\n    <rect x=\"10\" y=\"6\" width=\"28\" height=\"36\" rx=\"4\" fill=\"#991B1B\" stroke=\"#7F1D1D\" stroke-width=\"2\"/>\n    <!-- Gáy sổ -->\n    <rect x=\"10\" y=\"6\" width=\"6\" height=\"36\" fill=\"#7F1D1D\"/>\n    <!-- Ruy băng đánh dấu trang -->\n    <path d=\"M22 6V18L24.5 15L27 18V6H22Z\" fill=\"#FACC15\"/>\n    <!-- Búa liềm vàng dập nổi chính giữa sổ -->\n    <circle cx=\"26\" cy=\"26\" r=\"6\" fill=\"#B91C1C\" stroke=\"#F59E0B\" stroke-width=\"1\"/>\n    <polygon points=\"26,22 27,24.5 29.5,25 27.5,26.8 28.2,29.5 26,28 23.8,29.5 24.5,26.8 22.5,25 25,24.5\" fill=\"#FDE047\"/>\n  </svg>"
      },
      {
        "name": "HỆ THỐNG ĐIỀU HÀNH TÁC NGHIỆP ĐẢNG",
        "url": "https://xacthuctaptrung.dcs.vn/sso/login?appCode=dhtn&service=https://dhtn.dcs.vn/auth/sso/callback",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <!-- Hệ thống Điều hành tác nghiệp Đảng -->\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#FEF2F2\" stroke=\"#DC2626\" stroke-width=\"2\"/>\n    <!-- Bức thư điều hành / Công văn -->\n    <rect x=\"10\" y=\"14\" width=\"28\" height=\"20\" rx=\"3\" fill=\"#DC2626\"/>\n    <path d=\"M10 16L24 26L38 16\" stroke=\"#FEF08A\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n    <!-- Ngôi sao đỏ điều hành -->\n    <circle cx=\"34\" cy=\"30\" r=\"6\" fill=\"#F59E0B\"/>\n    <polygon points=\"34,26.5 35,28.8 37.5,29.2 35.5,31 36.2,33.5 34,32.2 31.8,33.5 32.5,31 30.5,29.2 33,28.8\" fill=\"#FFFFFF\"/>\n  </svg>"
      }
    ]
  },
  {
    "id": "specialized",
    "title": "PHẦN MỀM CHUYÊN NGÀNH",
    "items": [
      {
        "name": "LIÊN THÔNG KHAI SINH - KHAI TỬ",
        "url": "https://lienthong.dichvucong.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#FDF2F8\" stroke=\"#DB2777\" stroke-width=\"2\"/>\n    <!-- Liên thông Khai sinh - Khai tử: Mầm sống & Vòng tròn thời gian -->\n    <circle cx=\"18\" cy=\"24\" r=\"8\" fill=\"#F472B6\"/>\n    <!-- Nôi em bé -->\n    <path d=\"M13 24C13 28 17 30 20 30\" stroke=\"#FFFFFF\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n    <circle cx=\"20\" cy=\"21\" r=\"2\" fill=\"#FFFFFF\"/>\n    <!-- Cây đời & Cánh hạc hòa bình -->\n    <circle cx=\"30\" cy=\"24\" r=\"8\" fill=\"#3B82F6\"/>\n    <path d=\"M30 18V28M27 21L30 18L33 21\" stroke=\"#FFFFFF\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>\n    <path d=\"M22 14C26 12 32 14 36 18\" stroke=\"#EC4899\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n    <path d=\"M26 34C22 36 16 34 12 30\" stroke=\"#3B82F6\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n  </svg>"
      },
      {
        "name": "ĐĂNG KÝ HỘ KINH DOANH",
        "url": "https://hokinhdoanh.dkkd.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"6\" y=\"8\" width=\"36\" height=\"32\" rx=\"6\" fill=\"#FEFCE8\" stroke=\"#CA8A04\" stroke-width=\"2\"/>\n    <!-- Cửa hàng hộ kinh doanh & Mái che sọc -->\n    <path d=\"M10 18L13 10H35L38 18H10Z\" fill=\"#EAB308\"/>\n    <path d=\"M14 18V10M20 18V10M26 18V10M32 18V10\" stroke=\"#713F12\" stroke-width=\"1.5\"/>\n    <rect x=\"12\" y=\"18\" width=\"24\" height=\"18\" fill=\"#FEF08A\"/>\n    <!-- Cửa ra vào -->\n    <rect x=\"21\" y=\"24\" width=\"6\" height=\"12\" fill=\"#A16207\"/>\n    <rect x=\"14\" y=\"22\" width=\"4\" height=\"6\" rx=\"1\" fill=\"#38BDF8\"/>\n    <rect x=\"30\" y=\"22\" width=\"4\" height=\"6\" rx=\"1\" fill=\"#38BDF8\"/>\n  </svg>"
      },
      {
        "name": "ĐĂNG KÝ DOANH NGHIỆP",
        "url": "https://dangkykinhdoanh.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#F0F9FF\" stroke=\"#0284C7\" stroke-width=\"2\"/>\n    <!-- Tòa nhà doanh nghiệp & Bắt tay đối tác -->\n    <rect x=\"12\" y=\"12\" width=\"14\" height=\"24\" rx=\"2\" fill=\"#0284C7\"/>\n    <rect x=\"26\" y=\"18\" width=\"10\" height=\"18\" rx=\"2\" fill=\"#38BDF8\"/>\n    <rect x=\"15\" y=\"16\" width=\"3\" height=\"3\" fill=\"#E0F2FE\"/>\n    <rect x=\"20\" y=\"16\" width=\"3\" height=\"3\" fill=\"#E0F2FE\"/>\n    <rect x=\"15\" y=\"22\" width=\"3\" height=\"3\" fill=\"#E0F2FE\"/>\n    <rect x=\"20\" y=\"22\" width=\"3\" height=\"3\" fill=\"#E0F2FE\"/>\n    <!-- Con dấu đăng ký doanh nghiệp -->\n    <circle cx=\"34\" cy=\"14\" r=\"6\" fill=\"#16A34A\"/>\n    <path d=\"M31.5 14L33.5 16L36.5 12\" stroke=\"#FFFFFF\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>\n  </svg>"
      },
      {
        "name": "QUẢN LÝ HỘ TỊCH",
        "url": "https://hotichdientu.moj.gov.vn",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <!-- Cuốn sổ bộ Tư pháp & Bút lông ngỗng hộ tịch -->\n    <rect x=\"10\" y=\"6\" width=\"26\" height=\"36\" rx=\"4\" fill=\"#FEF3C7\" stroke=\"#D97706\" stroke-width=\"2\"/>\n    <rect x=\"10\" y=\"6\" width=\"6\" height=\"36\" fill=\"#D97706\"/>\n    <!-- Dấu đỏ hộ tịch -->\n    <circle cx=\"23\" cy=\"28\" r=\"6\" fill=\"#DC2626\"/>\n    <circle cx=\"23\" cy=\"28\" r=\"4.5\" stroke=\"#FFFFFF\" stroke-width=\"0.8\"/>\n    <!-- Bút lông ký -->\n    <path d=\"M26 12L38 24L35 27L23 15L26 12Z\" fill=\"#3B82F6\"/>\n    <polygon points=\"21,17 23,15 25,19\" fill=\"#F59E0B\"/>\n  </svg>"
      },
      {
        "name": "NGƯỜI KHUYẾT TẬT",
        "url": "https://nguoikhuyettat.moh.gov.vn/",
        "icon": "<svg viewBox=\"0 0 48 48\" width=\"44\" height=\"44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"#F0FDF4\" stroke=\"#16A34A\" stroke-width=\"2\"/>\n    <!-- Biểu tượng tiếp cận Người khuyết tật & Trái tim sẻ chia -->\n    <circle cx=\"24\" cy=\"13\" r=\"3.5\" fill=\"#16A34A\"/>\n    <path d=\"M22 18H26V26H31L33 32\" stroke=\"#16A34A\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n    <path d=\"M19 23A7 7 0 1 0 26 30\" stroke=\"#16A34A\" stroke-width=\"2.8\" stroke-linecap=\"round\"/>\n    <!-- Trái tim yêu thương -->\n    <path d=\"M33 13C33 11 35 11 36 12C37 11 39 11 39 13C39 15 36 17 36 17C36 17 33 15 33 13Z\" fill=\"#EF4444\"/>\n  </svg>"
      }
    ]
  }
];

window.handlePortalImgError = function(img) {
  img.onerror = null;
  img.src = 'https://cdn-icons-png.flaticon.com/128/7825/7825786.png';
};

/**
 * Quản lý Danh bạ Đường dẫn các Cổng Dịch vụ công & Tác nghiệp (Hiển thị phân loại trên 1 trang)
 */
function initPortalsDirectory() {
  const container = document.getElementById('portals-sections-container');
  const searchInput = document.getElementById('portal-search-input');
  const searchSubmitBtn = document.getElementById('btn-portal-search-submit');
  const clearBtn = document.getElementById('portal-search-clear');
  const emptyState = document.getElementById('portal-empty-state');

  if (!container) return;

  const totalCountEl = document.getElementById('portal-total-count');
  const groupCountEl = document.getElementById('portal-group-count');
  if (totalCountEl) {
    const totalCount = PORTAL_SECTIONS.reduce((sum, s) => sum + (s.items ? s.items.length : 0), 0);
    totalCountEl.textContent = totalCount;
  }
  if (groupCountEl) {
    groupCountEl.textContent = PORTAL_SECTIONS.length;
  }

  let searchTerm = '';

  function renderAllSections() {
    const term = searchTerm.toLowerCase();
    let totalVisibleTiles = 0;

    const sectionsHtml = PORTAL_SECTIONS.map(section => {
      const filteredItems = section.items.filter(item => {
        if (!term) return true;
        return (
          item.name.toLowerCase().includes(term) ||
          item.url.toLowerCase().includes(term) ||
          (item.keywords && item.keywords.toLowerCase().includes(term))
        );
      });

      if (filteredItems.length === 0) {
        return '';
      }

      totalVisibleTiles += filteredItems.length;

      const tilesHtml = filteredItems.map(item => `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="portal-app-tile" title="${escapeHtml(item.name)} - Nhấn để mở cổng">
          <div class="tile-icon-box">
            ${item.icon.trim().startsWith('<svg') ? item.icon : `<img src="${item.icon}" alt="${escapeHtml(item.name)}" onerror="handlePortalImgError(this)" />`}
          </div>
          <span class="tile-title">${escapeHtml(item.name)}</span>
        </a>
      `).join('');

      return `
        <div class="portal-category-section" id="section-${section.id}">
          <div class="portal-section-header">
            <div class="portal-header-icon-bar"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="portal-header-stack-icon">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <h3 class="portal-section-title">${escapeHtml(section.title)}</h3>
            <span class="portal-section-count">${filteredItems.length} hệ thống</span>
          </div>
          <div class="portal-tiles-grid">
            ${tilesHtml}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = sectionsHtml;

    if (totalVisibleTiles === 0 && term) {
      if (emptyState) emptyState.style.display = 'block';
    } else {
      if (emptyState) emptyState.style.display = 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      if (clearBtn) {
        clearBtn.style.display = searchTerm ? 'flex' : 'none';
      }
      renderAllSections();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        renderAllSections();
      }
    });
  }

  if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', () => {
      if (searchInput) {
        searchTerm = searchInput.value.trim();
        renderAllSections();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchTerm = '';
      clearBtn.style.display = 'none';
      renderAllSections();
      searchInput.focus();
    });
  }

  window.resetPortalSearch = function() {
    if (searchInput) searchInput.value = '';
    searchTerm = '';
    if (clearBtn) clearBtn.style.display = 'none';
    renderAllSections();
  };

  renderAllSections();
}

function initEventListeners() {
  dom.dateSelect.addEventListener('change', (e) => {
    loadDateData(e.target.value);
  });

  dom.btnExportExcel.addEventListener('click', handleExportExcel);

  // Unit Group Tabs (Cấp Tỉnh & Cấp Xã)
  const groupBtns = document.querySelectorAll('.unit-group-tab-btn');
  groupBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.getAttribute('data-group');
      if (group === appState.table.group) return;
      appState.table.group = group;
      appState.table.currentPage = 1;
      groupBtns.forEach(b => b.classList.toggle('active', b === btn));
      renderUnitsTable();
    });
  });

  dom.unitSearchInput.addEventListener('input', (e) => {
    appState.table.searchTerm = e.target.value.trim().toLowerCase();
    appState.table.currentPage = 1;
    renderUnitsTable();
  });

  dom.sortSelect.addEventListener('change', (e) => {
    appState.table.sortBy = e.target.value;
    appState.table.currentPage = 1;
    renderUnitsTable();
  });

  // Modal backdrop click to close
  dom.metricModal?.addEventListener('click', (e) => {
    if (e.target === dom.metricModal) closeMetricModal();
  });
  dom.paymentModal?.addEventListener('click', (e) => {
    if (e.target === dom.paymentModal) closePaymentModal();
  });
  dom.progressModal?.addEventListener('click', (e) => {
    if (e.target === dom.progressModal) closeProgressModal();
  });
}

/**
 * Load initial data on startup
 */
async function loadInitialData() {
  showLoader(true);
  try {
    const res = await fetch('/api/data');
    const json = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.error || 'Không lấy được dữ liệu từ hệ thống');
    }

    appState.currentData = json.data;
    appState.availableDates = json.availableDates || [json.data.date];
    appState.selectedDate = json.data.date;

    renderDateOptions();
    renderAll(json.data);
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('Lỗi khi tải dữ liệu: ' + err.message, 'error');
  } finally {
    showLoader(false);
  }
}

/**
 * Load data for a specific date
 */
async function loadDateData(date) {
  showLoader(true);
  try {
    const res = await fetch(`/api/data?date=${encodeURIComponent(date)}`);
    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || `Không tìm thấy dữ liệu ngày ${date}`);
    }
    appState.currentData = json.data;
    appState.selectedDate = date;
    renderAll(json.data);
    showToast(`Đã tải dữ liệu ngày ${date}`, 'info');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showLoader(false);
  }
}

/**
 * Handle Export Excel button click
 */
function handleExportExcel() {
  const date = appState.selectedDate || (appState.currentData ? appState.currentData.date : '');
  showToast('Đang tạo và tải file Excel Báo cáo...', 'info');
  window.location.href = `/api/export?date=${encodeURIComponent(date)}`;
}

/**
 * Populate Date selector dropdown
 */
function renderDateOptions() {
  dom.dateSelect.innerHTML = '';
  appState.availableDates.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = `${formatDateVN(d)}${d === appState.availableDates[0] ? ' (Mới nhất)' : ''}`;
    if (d === appState.selectedDate) opt.selected = true;
    dom.dateSelect.appendChild(opt);
  });
}

/**
 * Render all dashboard components
 */
function renderAll(data) {
  renderOverview(data);
  renderIndicators(data);
  renderRadarChart(data);
  renderTrendChart(data);
  renderUnitsTable();
}

/**
 * Render Total Score & Header Summary
 */
function renderOverview(data) {
  const overview = data.overview;
  dom.totalScoreVal.textContent = overview.totalScore.toFixed(2);
  dom.totalRatioVal.textContent = `${overview.ratio}%`;
  dom.totalProgressBar.style.width = `${Math.min(overview.ratio, 100)}%`;

  const badge = overview.classification || { label: 'Chưa xác định', color: '#64748b' };
  dom.classificationBadge.textContent = badge.label;
  dom.classificationBadge.style.backgroundColor = badge.color;

  // Delta score
  if (overview.deltaScore !== null && overview.deltaScore !== undefined) {
    const sign = overview.deltaScore > 0 ? '+' : '';
    const dirClass = overview.deltaScore > 0 ? 'delta-up' : overview.deltaScore < 0 ? 'delta-down' : 'delta-same';
    dom.scoreDelta.className = `score-delta ${dirClass}`;
    dom.scoreDelta.textContent = `${sign}${overview.deltaScore} so với hôm trước`;
    dom.scoreDelta.style.display = 'inline-block';
  } else {
    dom.scoreDelta.className = 'score-delta delta-same';
    dom.scoreDelta.textContent = 'Dữ liệu mới nhất';
    dom.scoreDelta.style.display = 'inline-block';
  }

  // Meta
  const timeStr = data.timestamp ? new Date(data.timestamp).toLocaleString('vi-VN') : data.date;
  dom.dataUpdatedTime.textContent = timeStr;
  const totalUnits = data.unitsSummary?.totalUnits || (data.units ? data.units.length : 116);
  dom.unitsCountVal.textContent = totalUnits;

  // Breakdown Cấp Tỉnh và Cấp Xã
  const isProvCheck = u => {
    const lvl = (u.departmentLevel || '').toUpperCase();
    const type = (u.departmentType || '').toUpperCase();
    return lvl === 'PROVINCE' || type.includes('PROVINCIAL') || type.includes('MINISTRY') || type === 'DEPARTMENT';
  };
  const provCount = data.unitsSummary?.provinceUnitsCount || (data.units ? data.units.filter(isProvCheck).length : 14);
  const commCount = data.unitsSummary?.communeUnitsCount || (data.units ? data.units.filter(u => !isProvCheck(u)).length : 102);

  if (dom.unitsBreakdownSub) {
    dom.unitsBreakdownSub.textContent = `(${provCount} Cấp Tỉnh • ${commCount} Cấp Xã)`;
  }
  if (dom.badgeCountProvince) dom.badgeCountProvince.textContent = provCount;
  if (dom.badgeCountCommune) dom.badgeCountCommune.textContent = commCount;
}

/**
 * Render 6 Indicator Cards
 */
function renderIndicators(data) {
  for (const [key, meta] of Object.entries(INDICATOR_META)) {
    const ind = data.indicators ? data.indicators[key] : null;
    const scoreElem = document.getElementById(`score-${key}`);
    const ratioElem = document.getElementById(`ratio-${key}`);
    const barElem = document.getElementById(`bar-${key}`);

    if (ind && ind.status === 'OK') {
      if (scoreElem) scoreElem.textContent = ind.score.toFixed(2);
      if (ratioElem) ratioElem.textContent = `${ind.ratio}%`;
      if (barElem) barElem.style.width = `${Math.min(ind.ratio, 100)}%`;
    } else {
      if (scoreElem) scoreElem.textContent = '0.00';
      if (ratioElem) ratioElem.textContent = '0%';
      if (barElem) barElem.style.width = '0%';
    }
  }
}

/**
 * Render Chart.js Radar Chart
 */
function renderRadarChart(data) {
  const ctx = document.getElementById('radarChart').getContext('2d');
  const labels = Object.values(INDICATOR_META).map((m) => m.name);
  const maxScores = Object.values(INDICATOR_META).map((m) => m.max);
  const actualScores = Object.keys(INDICATOR_META).map((k) => {
    return data.indicators?.[k]?.score || 0;
  });

  if (appState.radarChart) {
    appState.radarChart.destroy();
  }

  appState.radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: 'Điểm Đạt được',
          data: actualScores,
          backgroundColor: 'rgba(37, 99, 235, 0.25)',
          borderColor: '#2563eb',
          borderWidth: 2.5,
          pointBackgroundColor: '#2563eb',
          pointHoverRadius: 6
        },
        {
          label: 'Điểm Tối đa Chuẩn',
          data: maxScores,
          backgroundColor: 'rgba(203, 213, 225, 0.15)',
          borderColor: '#94a3b8',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointBackgroundColor: '#94a3b8'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 22,
          ticks: { stepSize: 5, font: { size: 10 } },
          pointLabels: {
            font: { family: 'Inter', size: 11, weight: '600' },
            color: '#334155'
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Inter', size: 12, weight: '500' } }
        }
      }
    }
  });
}

/**
 * Render Chart.js Trend Chart
 */
function renderTrendChart(data) {
  const ctx = document.getElementById('trendChart').getContext('2d');

  // If only 1 date available, create mock past 5 days trend leading up to today's score
  const dates = appState.availableDates.length > 1
    ? [...appState.availableDates].reverse()
    : ['T-4', 'T-3', 'T-2', 'T-1', data.date];

  const currentScore = data.overview?.totalScore || 64.08;
  const trendScores = appState.availableDates.length > 1
    ? dates.map(() => currentScore) // If we store historical snapshots, we can map their actual scores
    : [
        Number((currentScore - 1.2).toFixed(2)),
        Number((currentScore - 0.8).toFixed(2)),
        Number((currentScore - 0.5).toFixed(2)),
        Number((currentScore - 0.2).toFixed(2)),
        currentScore
      ];

  if (appState.trendChart) {
    appState.trendChart.destroy();
  }

  appState.trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map((d) => d.length === 10 ? formatDateVN(d) : d),
      datasets: [
        {
          label: 'Tổng điểm 766 (/100đ)',
          data: trendScores,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#10b981'
        },
        {
          label: 'Ngưỡng Tốt (80 điểm)',
          data: dates.map(() => 80),
          borderColor: '#f59e0b',
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 40,
          max: 100,
          ticks: { stepSize: 10 }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Inter', size: 12, weight: '500' } }
        }
      }
    }
  });
}

/**
 * Helper to determine if unit belongs to Province level
 */
function isProvinceLevel(u) {
  const lvl = (u.departmentLevel || '').toUpperCase();
  const type = (u.departmentType || '').toUpperCase();
  return lvl === 'PROVINCE' || type.includes('PROVINCIAL') || type.includes('MINISTRY') || type === 'DEPARTMENT';
}

/**
 * Enrich units with group and group-specific ranking
 */
function enrichUnitsWithGroups(units) {
  const provs = [];
  const comms = [];

  units.forEach(u => {
    if (isProvinceLevel(u)) {
      u.group = 'PROVINCE';
      u.groupLabel = 'Cấp Tỉnh';
      provs.push(u);
    } else {
      u.group = 'COMMUNE';
      u.groupLabel = 'Cấp Xã';
      comms.push(u);
    }
  });

  // Calculate separate ranks within each group
  provs.sort((a, b) => b.totalScore - a.totalScore);
  provs.forEach((u, idx) => {
    u.rankInGroup = idx + 1;
  });

  comms.sort((a, b) => b.totalScore - a.totalScore);
  comms.forEach((u, idx) => {
    u.rankInGroup = idx + 1;
  });

  return { provs, comms };
}

/**
 * Filter, sort, and render Subordinate Units Table by Group (Cấp Tỉnh & Cấp Xã)
 */
function renderUnitsTable() {
  const allUnits = appState.currentData?.units || [];
  const { provs, comms } = enrichUnitsWithGroups(allUnits);

  // Update badge counts
  if (dom.badgeCountProvince) dom.badgeCountProvince.textContent = provs.length;
  if (dom.badgeCountCommune) dom.badgeCountCommune.textContent = comms.length;

  const currentGroup = appState.table.group || 'PROVINCE';

  // Update table title, description and search placeholder
  if (dom.unitsTableTitle && dom.unitsTableDesc) {
    if (currentGroup === 'PROVINCE') {
      dom.unitsTableTitle.textContent = 'Bảng Xếp hạng Đơn vị Cấp Tỉnh';
      dom.unitsTableDesc.textContent = `Khối ${provs.length} Sở, Ban, Ngành trực thuộc UBND tỉnh Đắk Lắk`;
    } else {
      dom.unitsTableTitle.textContent = 'Bảng Xếp hạng Đơn vị Cấp Xã';
      dom.unitsTableDesc.textContent = `Khối ${comms.length} UBND xã, phường, thị trấn trên địa bàn tỉnh Đắk Lắk`;
    }
  }

  if (dom.unitSearchInput) {
    dom.unitSearchInput.placeholder = currentGroup === 'PROVINCE'
      ? 'Tìm tên hoặc mã Sở, Ban, Ngành...'
      : 'Tìm tên hoặc mã xã, phường, thị trấn...';
  }

  // 1. Select group units
  let targetUnits = currentGroup === 'PROVINCE' ? provs : comms;

  const { searchTerm, sortBy, currentPage, pageSize } = appState.table;

  // 2. Filter by search
  let filtered = targetUnits.filter((u) => {
    if (searchTerm) {
      const name = (u.departmentName || '').toLowerCase();
      const code = (u.departmentCode || '').toLowerCase();
      return name.includes(searchTerm) || code.includes(searchTerm);
    }
    return true;
  });

  // 3. Sort
  filtered.sort((a, b) => {
    if (sortBy === 'score_desc') return b.totalScore - a.totalScore;
    if (sortBy === 'score_asc') return a.totalScore - b.totalScore;
    if (sortBy === 'name_asc') return (a.departmentName || '').localeCompare(b.departmentName || '', 'vi');
    return 0;
  });

  // 4. Paginate
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  appState.table.currentPage = validPage;

  const startIndex = (validPage - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  // 5. Render Rows
  dom.unitsTableBody.innerHTML = '';
  if (pageItems.length === 0) {
    dom.unitsTableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 30px; color: #64748b;">Không tìm thấy đơn vị nào phù hợp với từ khóa tìm kiếm.</td></tr>`;
  } else {
    pageItems.forEach((u) => {
      const tr = document.createElement('tr');

      // Rank Badge: Use rankInGroup (thứ hạng riêng của nhóm)
      const rankNum = u.rankInGroup || u.rank;
      let rankClass = 'rank-badge rank-other';
      if (rankNum === 1) rankClass = 'rank-badge rank-1';
      else if (rankNum === 2) rankClass = 'rank-badge rank-2';
      else if (rankNum === 3) rankClass = 'rank-badge rank-3';

      const rankHtml = `<span class="${rankClass}">${rankNum}</span>`;
      const grade = u.classification || { label: '-', color: '#64748b' };

      const loggedIn = Boolean(appState.currentUser);
      const scoreCell = (val, indKey, title) => {
        const formatted = (val ?? 0).toFixed(2);
        if (loggedIn) {
          return `
            <td style="text-align: right;" class="score-clickable" onclick="openUnitMetricModal('${escapeHtml(u.departmentId)}', '${indKey}')" title="${title}">
              <span class="score-clickable-inner">
                <span>${formatted}</span>
                <svg class="score-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </td>`;
        } else {
          return `<td style="text-align: right;">${formatted}</td>`;
        }
      };

      tr.innerHTML = `
        <td style="text-align: center;">${rankHtml}</td>
        <td>
          <span class="unit-name-cell">${escapeHtml(u.departmentName)}</span>
          ${u.departmentCode ? `<span class="unit-code-badge">(${escapeHtml(u.departmentCode)})</span>` : ''}
        </td>
        <td><span class="level-tag">${escapeHtml(u.levelLabel || (isProvinceLevel(u) ? 'Cấp Tỉnh' : 'Cấp Xã'))}</span></td>
        ${scoreCell(u.scores?.transparency, 'transparency', 'Nhấn xem chi tiết 4 tiêu chí Công khai minh bạch')}
        ${scoreCell(u.scores?.progress, 'progress', 'Nhấn xem chi tiết hồ sơ Tiến độ giải quyết')}
        ${scoreCell(u.scores?.onlineService, 'onlineService', 'Nhấn xem chi tiết Dịch vụ công trực tuyến')}
        ${scoreCell(u.scores?.digitized, 'digitized', 'Nhấn xem chi tiết 7 tiêu chí Số hóa hồ sơ')}
        ${scoreCell(u.scores?.payment, 'payment', 'Nhấn xem chi tiết giao dịch Thanh toán trực tuyến')}
        ${scoreCell(u.scores?.satisfaction, 'satisfaction', 'Nhấn xem chi tiết Mức độ hài lòng của người dân')}
        <td style="text-align: right;" class="score-cell-bold">${u.totalScore.toFixed(2)}</td>
        <td style="text-align: center; white-space: nowrap;">
          <span class="badge-grade" style="background-color: ${grade.color}; font-size: 11px; padding: 3px 10px; white-space: nowrap; display: inline-block;">
            ${escapeHtml(grade.label)}
          </span>
        </td>
      `;
      dom.unitsTableBody.appendChild(tr);
    });
  }

  // 6. Update counts & pagination
  dom.showingCount.textContent = pageItems.length;
  dom.totalFilteredCount.textContent = totalItems;
  renderPagination(totalPages, validPage);
}

/**
 * Render pagination buttons
 */
function renderPagination(totalPages, activePage) {
  dom.paginationWrap.innerHTML = '';
  if (totalPages <= 1) return;

  const createBtn = (text, page, isActive = false) => {
    const btn = document.createElement('button');
    btn.className = `page-btn ${isActive ? 'active' : ''}`;
    btn.textContent = text;
    btn.addEventListener('click', () => {
      appState.table.currentPage = page;
      renderUnitsTable();
    });
    return btn;
  };

  if (activePage > 1) {
    dom.paginationWrap.appendChild(createBtn('«', activePage - 1));
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= activePage - 2 && i <= activePage + 2)) {
      dom.paginationWrap.appendChild(createBtn(i, i, i === activePage));
    } else if (i === activePage - 3 || i === activePage + 3) {
      const span = document.createElement('span');
      span.textContent = '...';
      span.style.padding = '4px 6px';
      dom.paginationWrap.appendChild(span);
    }
  }

  if (activePage < totalPages) {
    dom.paginationWrap.appendChild(createBtn('»', activePage + 1));
  }
}

/**
 * Open Modal to show detailed sub-criteria for PROVINCE
 */
window.openMetricModal = function (indKey) {
  if (!isLoggedIn()) return;

  // If progress indicator, route to dedicated progress form
  if (indKey === 'progress') {
    openDedicatedProgressModal(null, true);
    return;
  }

  // If payment indicator, route to dedicated payment form
  if (indKey === 'payment') {
    openDedicatedPaymentModal(null, true);
    return;
  }

  const meta = INDICATOR_META[indKey];
  const ind = appState.currentData?.indicators?.[indKey];

  dom.modalIndCode.textContent = `TOÀN TỈNH • ${meta.code}`;
  dom.modalIndTitle.textContent = `${meta.name} (Tối đa ${meta.max} điểm)`;

  dom.modalBodyContent.innerHTML = '';

  if (!ind || !ind.metrics || ind.metrics.length === 0) {
    dom.modalBodyContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #64748b;">
        <p style="font-weight: 600;">Tổng điểm chỉ số: ${ind ? ind.score : 0} / ${meta.max} điểm</p>
        <p style="font-size: 13px; margin-top: 8px;">Dữ liệu chi tiết đang được tổng hợp từ hệ thống Cổng DVCQG.</p>
      </div>
    `;
  } else {
    ind.metrics.forEach((m, idx) => {
      renderMetricItemCard(m, idx, meta);
    });
  }

  dom.metricModal.style.display = 'flex';
};

/**
 * Open Modal to show detailed sub-criteria for a SUBORDINATE UNIT
 */
window.openUnitMetricModal = function (unitId, indKey) {
  if (!isLoggedIn()) return;

  // If progress indicator, route to dedicated progress form
  if (indKey === 'progress') {
    openDedicatedProgressModal(unitId, false);
    return;
  }

  // If payment indicator, route to dedicated payment form
  if (indKey === 'payment') {
    openDedicatedPaymentModal(unitId, false);
    return;
  }

  const unit = appState.currentData?.units?.find((u) => u.departmentId === unitId);
  if (!unit) return;

  const meta = INDICATOR_META[indKey];
  const detail = unit.indicatorDetails?.[indKey];
  const scoreVal = detail ? detail.score : (unit.scores?.[indKey] ?? 0);
  const ratioVal = detail?.ratio != null ? `${detail.ratio}%` : '';

  dom.modalIndCode.textContent = `${unit.departmentName}${unit.departmentCode ? ' (' + unit.departmentCode + ')' : ''} • ${meta.code}`;
  dom.modalIndTitle.textContent = `${meta.name} (Đạt ${scoreVal.toFixed(2)} / ${meta.max} điểm${ratioVal ? ' - ' + ratioVal : ''})`;

  dom.modalBodyContent.innerHTML = '';

  if (!detail || !detail.metrics || detail.metrics.length === 0) {
    dom.modalBodyContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #64748b;">
        <p style="font-weight: 700; font-size: 16px; color: #1e3a8a;">Điểm chỉ số: ${scoreVal.toFixed(2)} / ${meta.max} điểm</p>
        <p style="font-size: 13px; margin-top: 8px;">Đơn vị: ${escapeHtml(unit.departmentName)}</p>
      </div>
    `;
  } else {
    detail.metrics.forEach((m, idx) => {
      renderMetricItemCard(m, idx, meta);
    });
  }

  dom.metricModal.style.display = 'flex';
};

/**
 * [FORM RIÊNG] Open Dedicated Form for Thanh toán trực tuyến (3 chỉ tiêu con)
 */
window.openDedicatedPaymentModal = function (unitId, isProvince = false) {
  if (!isLoggedIn()) return;
  let unitName = '';
  let scoreVal = 0;
  let metrics = [];

  if (isProvince) {
    const ind = appState.currentData?.indicators?.payment;
    unitName = `${appState.currentData?.department?.name || 'Ủy ban Nhân dân tỉnh Đắk Lắk'} (Toàn tỉnh)`;
    scoreVal = ind ? ind.score : 0;
    metrics = ind ? ind.metrics : [];
    dom.paymodalIndCode.textContent = 'TOÀN TỈNH • CHỈ SỐ 5';
  } else {
    const unit = appState.currentData?.units?.find((u) => u.departmentId === unitId);
    if (!unit) return;
    unitName = `${unit.departmentName}${unit.departmentCode ? ' (' + unit.departmentCode + ')' : ''}`;
    const detail = unit.indicatorDetails?.payment;
    scoreVal = detail ? detail.score : (unit.scores?.payment ?? 0);
    metrics = detail ? detail.metrics : [];
    dom.paymodalIndCode.textContent = `${unit.departmentCode ? unit.departmentCode + ' • ' : ''}CHỈ SỐ 5`;
  }

  dom.paymodalIndTitle.textContent = 'Thanh toán trực tuyến';
  dom.paymodalUnitName.textContent = unitName;
  dom.paymodalScoreVal.textContent = `${scoreVal.toFixed(2)} / 10 điểm`;

  dom.paymodalCardsContainer.innerHTML = '';

  if (!metrics || metrics.length === 0) {
    dom.paymodalCardsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #64748b;">
        <p style="font-weight: 700; font-size: 16px; color: #b45309;">Chưa có dữ liệu giao dịch thanh toán</p>
        <p style="font-size: 13px; margin-top: 8px;">Đơn vị: ${escapeHtml(unitName)}</p>
      </div>
    `;
  } else {
    metrics.forEach((m, idx) => {
      const card = document.createElement('div');
      card.className = 'pay-criterion-card';

      const ratioDisplay = m.ratio != null ? `${m.ratio}%` : '-';
      const fillWidth = Math.min(Math.max(m.ratio ?? 0, 0), 100);

      card.innerHTML = `
        <div class="pay-crit-header">
          <span class="pay-crit-badge">Chỉ tiêu con ${idx + 1}</span>
          <h4 class="pay-crit-title">${escapeHtml(m.name)}</h4>
        </div>
        ${m.desc ? `<p class="pay-crit-desc">${escapeHtml(m.desc)}</p>` : ''}
        <div class="pay-crit-stats-grid">
          <div class="pay-stat-box">
            <span class="pay-stat-label">Tử số (Đạt được)</span>
            <span class="pay-stat-val">${formatNumber(m.numerator ?? '-')}</span>
          </div>
          <div class="pay-stat-box">
            <span class="pay-stat-label">Mẫu số (Tổng số)</span>
            <span class="pay-stat-val">${formatNumber(m.denominator ?? '-')}</span>
          </div>
          <div class="pay-ratio-box">
            <div class="pay-ratio-header">
              <span class="pay-ratio-label">TỶ LỆ ĐẠT</span>
              <span class="pay-ratio-val">${ratioDisplay}</span>
            </div>
            <div class="pay-mini-track">
              <div class="pay-mini-fill" style="width: ${fillWidth}%;"></div>
            </div>
          </div>
        </div>
      `;
      dom.paymodalCardsContainer.appendChild(card);
    });
  }

  dom.paymentModal.style.display = 'flex';
};

window.closePaymentModal = function () {
  dom.paymentModal.style.display = 'none';
};

/**
 * [FORM RIÊNG] Open Dedicated Form for Tiến độ giải quyết (Chỉ số 2)
 */
window.openDedicatedProgressModal = function (unitId, isProvince = false) {
  if (!isLoggedIn()) return;
  let unitName = '';
  let indCode = '';
  let totalReceived = 0;
  let avgProcessingDays = 0;
  let scoreVal = 0;
  let onTime = null;
  let overdue = null;

  if (isProvince) {
    const ind = appState.currentData?.indicators?.progress;
    unitName = `${appState.currentData?.department?.name || 'Ủy ban Nhân dân tỉnh Đắk Lắk'} (Toàn tỉnh)`;
    indCode = 'TOÀN TỈNH • CHỈ SỐ 2';
    scoreVal = ind ? ind.score : 0;
    const m = ind?.metrics || {};
    totalReceived = m.totalReceived ?? 0;
    avgProcessingDays = m.avgProcessingDays ?? 0;
    onTime = m.onTime;
    overdue = m.overdue;
  } else {
    const unit = appState.currentData?.units?.find((u) => u.departmentId === unitId);
    if (!unit) return;
    unitName = `${unit.departmentName}${unit.departmentCode ? ' (' + unit.departmentCode + ')' : ''}`;
    indCode = `${unit.departmentCode ? unit.departmentCode + ' • ' : ''}CHỈ SỐ 2`;
    const detail = unit.indicatorDetails?.progress;
    scoreVal = detail ? detail.score : (unit.scores?.progress ?? 0);
    totalReceived = detail?.totalReceived ?? 0;
    avgProcessingDays = detail?.avgProcessingDays ?? 0;
    onTime = detail?.onTime;
    overdue = detail?.overdue;
  }

  dom.progmodalIndCode.textContent = indCode;
  dom.progmodalIndTitle.textContent = 'Tiến độ giải quyết';
  dom.progmodalUnitName.textContent = unitName;

  // Phía trên: Hiển thị dạng thông tin
  dom.progmodalTotalReceived.textContent = formatNumber(totalReceived);
  const avgText = typeof avgProcessingDays === 'number' 
    ? avgProcessingDays.toFixed(2).replace(/\.00$/, '') 
    : avgProcessingDays;
  dom.progmodalAvgDays.textContent = `${avgText} ngày`;
  dom.progmodalScoreVal.textContent = `${scoreVal.toFixed(2)} / 20 điểm`;

  // 1. Hồ sơ giải quyết đúng hạn (áp dụng tính điểm)
  const onTimeNum = onTime?.numerator ?? 0;
  const onTimeDen = onTime?.denominator ?? totalReceived;
  const onTimeRatio = onTime?.ratio != null 
    ? onTime.ratio 
    : (onTimeDen > 0 ? Number(((onTimeNum / onTimeDen) * 100).toFixed(2)) : 0);
  const onTimeScore = onTime?.score != null ? onTime.score : scoreVal;

  dom.progmodalOntimeScore.textContent = `${onTimeScore.toFixed(2)} / 20 điểm`;
  dom.progmodalOntimeNum.textContent = formatNumber(onTimeNum);
  dom.progmodalOntimeDen.textContent = formatNumber(onTimeDen);
  dom.progmodalOntimeRatio.textContent = `${onTimeRatio}%`;
  dom.progmodalOntimeBar.style.width = `${Math.min(Math.max(onTimeRatio, 0), 100)}%`;

  // 2. Hồ sơ giải quyết quá hạn (chỉ hiển thị tử số, mẫu số, tỷ lệ)
  const overdueNum = overdue?.numerator ?? 0;
  const overdueDen = overdue?.denominator ?? totalReceived;
  const overdueRatio = overdue?.ratio != null 
    ? overdue.ratio 
    : (overdueDen > 0 ? Number(((overdueNum / overdueDen) * 100).toFixed(2)) : 0);

  dom.progmodalOverdueNum.textContent = formatNumber(overdueNum);
  dom.progmodalOverdueDen.textContent = formatNumber(overdueDen);
  dom.progmodalOverdueRatio.textContent = `${overdueRatio}%`;
  dom.progmodalOverdueBar.style.width = `${Math.min(Math.max(overdueRatio, 0), 100)}%`;

  dom.progressModal.style.display = 'flex';
};

window.closeProgressModal = function () {
  dom.progressModal.style.display = 'none';
};

/**
 * Helper to render a single metric item card inside modal
 */
function renderMetricItemCard(m, idx, meta) {
  const card = document.createElement('div');
  card.className = 'metric-item-card';

  const scoreDisplay = m.score != null 
    ? (m.maxScore != null ? `${m.score} / ${m.maxScore}` : `${m.score}`)
    : (m.maxScore != null ? `- / ${m.maxScore}` : '-');

  card.innerHTML = `
    <div class="metric-item-title">${idx + 1}. ${escapeHtml(m.name)}</div>
    <div class="metric-item-stats">
      <div class="stat-box">
        <span class="stat-label">Tử số</span>
        <span class="stat-value">${formatNumber(m.numerator ?? m.value ?? '-')}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Mẫu số</span>
        <span class="stat-value">${formatNumber(m.denominator ?? '-')}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Tỷ lệ</span>
        <span class="stat-value">${m.ratio != null ? `${m.ratio}%` : '-'}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Điểm số</span>
        <span class="stat-value" style="color: #2563eb;">${scoreDisplay}</span>
      </div>
    </div>
    ${m.note ? `<p style="font-size: 11px; color: #d97706; margin-top: 8px;">* ${escapeHtml(m.note)}</p>` : ''}
  `;
  dom.modalBodyContent.appendChild(card);
}

window.closeMetricModal = function () {
  dom.metricModal.style.display = 'none';
};

/**
 * [POPUP LƯU Ý] Handle Agree & Dismiss Welcome Notice
 */
window.agreeWelcomeNotice = function () {
  if (dom.welcomeModal) {
    dom.welcomeModal.style.opacity = '0';
    dom.welcomeModal.style.transition = 'opacity 0.25s ease';
    setTimeout(() => {
      dom.welcomeModal.style.display = 'none';
      dom.welcomeModal.style.opacity = '1';
    }, 250);
  }
  try {
    sessionStorage.setItem('dvc766_welcome_agreed', '1');
  } catch (e) {}
};

function initWelcomeNotice() {
  const agreed = sessionStorage.getItem('dvc766_welcome_agreed');
  if (!agreed && dom.welcomeModal) {
    dom.welcomeModal.style.display = 'flex';
  }
}

/**
 * Toast notification
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function showLoader(show) {
  dom.loader.style.display = show ? 'flex' : 'none';
  dom.dashboard.style.display = show ? 'none' : 'block';
}

function formatDateVN(dateStr) {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const parts = dateStr.slice(0, 10).split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatNumber(num) {
  if (typeof num === 'number') return num.toLocaleString('vi-VN');
  return num;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

/**
 * ==========================================================================
 * TIỆN ÍCH: TÁCH NỀN CHỮ KÝ TRONG SUỐT & TỰ ĐỘNG CẮT KHOẢNG TRẮNG (AUTO-CROP)
 * ==========================================================================
 */
function initSignatureRemoverTool() {
  const uploadZone = document.getElementById('sig-upload-zone');
  const fileInput = document.getElementById('sig-file-input');
  const btnBrowse = document.getElementById('btn-browse-sig');
  const btnSample = document.getElementById('btn-sample-sig');
  const workspace = document.getElementById('sig-workspace');

  const originalImg = document.getElementById('sig-original-img');
  const originalMeta = document.getElementById('sig-original-meta');
  const resultCanvas = document.getElementById('sig-result-canvas');
  const resultMeta = document.getElementById('sig-result-meta');
  const cropBadge = document.getElementById('sig-crop-badge');
  const resultContainer = document.getElementById('sig-result-container');
  const docMock = document.getElementById('sig-doc-mock');

  const thresholdSlider = document.getElementById('sig-threshold-slider');
  const thresholdVal = document.getElementById('sig-threshold-val');
  const autoCropCheckbox = document.getElementById('sig-autocrop-checkbox');
  const colorBtns = document.querySelectorAll('.sig-color-btn');
  const bgBtns = document.querySelectorAll('.sig-bg-btn');

  const btnReset = document.getElementById('btn-reset-sig-upload');
  const btnDownload = document.getElementById('btn-download-sig');
  const btnCopy = document.getElementById('btn-copy-sig');

  // Dedicated Action & Status elements
  const btnRun = document.getElementById('btn-run-process-sig');
  const statusBadge = document.getElementById('sig-status-badge');
  const statusDot = document.getElementById('sig-status-dot');
  const statusText = document.getElementById('sig-status-text');

  if (!uploadZone || !resultCanvas) return;

  let currentLoadedImg = null;
  let currentColorMode = 'original'; // 'original' | 'blue' | 'black' | 'red'

  function updateStatus(text, type = 'success') {
    if (!statusText || !statusBadge) return;
    statusText.textContent = text;
    statusBadge.className = `sig-live-status status-${type}`;
  }

  // Open file dialog
  if (btnBrowse && fileInput) {
    btnBrowse.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.sig-upload-actions')) return;
      fileInput.click();
    });

    // Drag & Drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  // Ctrl+V Paste from Clipboard
  window.addEventListener('paste', (e) => {
    const toolsPane = document.getElementById('tab-content-tools');
    if (!toolsPane || toolsPane.style.display === 'none') return;

    if (e.clipboardData && e.clipboardData.items) {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          handleFileSelect(blob);
          showToast('Đã nhận diện ảnh chữ ký từ Clipboard!', 'success');
          break;
        }
      }
    }
  });

  // Sample signature generator (realistic cursive ink signature)
  if (btnSample) {
    btnSample.addEventListener('click', (e) => {
      e.stopPropagation();
      generateSampleSignature();
    });
  }

  function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Vui lòng chọn một file ảnh hợp lệ (PNG, JPG, WEBP)!', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        currentLoadedImg = img;
        originalImg.src = img.src;
        originalMeta.textContent = `${img.naturalWidth || img.width} × ${img.naturalHeight || img.height} px`;

        uploadZone.style.display = 'none';
        workspace.style.display = 'flex';
        processSignature(true);
        showToast('Đã nhận diện ảnh chữ ký! Hệ thống đang tự động tách nền...', 'success');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function generateSampleSignature() {
    // Generate a realistic signature on white paper canvas
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 900;
    sampleCanvas.height = 450;
    const sCtx = sampleCanvas.getContext('2d');

    // Slight off-white paper texture background
    sCtx.fillStyle = '#faf9f6';
    sCtx.fillRect(0, 0, 900, 450);

    // Realistic pen strokes
    sCtx.strokeStyle = '#0f3a7a';
    sCtx.lineWidth = 3.5;
    sCtx.lineCap = 'round';
    sCtx.lineJoin = 'round';

    sCtx.beginPath();
    // Capital letter N
    sCtx.moveTo(220, 290);
    sCtx.bezierCurveTo(230, 200, 250, 160, 270, 160);
    sCtx.bezierCurveTo(280, 200, 310, 280, 320, 280);
    sCtx.bezierCurveTo(330, 240, 350, 150, 370, 170);

    // Flowing loop
    sCtx.bezierCurveTo(390, 190, 410, 250, 430, 230);
    sCtx.bezierCurveTo(450, 210, 480, 190, 510, 220);
    sCtx.bezierCurveTo(540, 250, 580, 210, 620, 200);

    // Under-tail flourish stroke
    sCtx.moveTo(260, 310);
    sCtx.bezierCurveTo(350, 285, 520, 280, 680, 260);
    sCtx.stroke();

    // Secondary flourish loop
    sCtx.beginPath();
    sCtx.lineWidth = 2.2;
    sCtx.moveTo(610, 190);
    sCtx.bezierCurveTo(650, 160, 690, 220, 650, 260);
    sCtx.bezierCurveTo(620, 280, 580, 260, 550, 250);
    sCtx.stroke();

    const img = new Image();
    img.onload = function () {
      currentLoadedImg = img;
      originalImg.src = img.src;
      originalMeta.textContent = `${img.width} × ${img.height} px`;
      uploadZone.style.display = 'none';
      workspace.style.display = 'flex';
      processSignature(true);
    };
    img.src = sampleCanvas.toDataURL('image/png');
  }

  // Core background removal & auto-crop algorithm
  function processSignature(userTriggered = false) {
    if (!currentLoadedImg) return;

    updateStatus('Đang phân tích nét ký và tách nền...', 'processing');

    const thresholdPercent = parseInt(thresholdSlider.value, 10);
    thresholdVal.textContent = `${thresholdPercent}%`;
    const doAutoCrop = autoCropCheckbox.checked;

    const w = currentLoadedImg.naturalWidth || currentLoadedImg.width;
    const h = currentLoadedImg.naturalHeight || currentLoadedImg.height;

    // Buffer canvas
    const bufCanvas = document.createElement('canvas');
    bufCanvas.width = w;
    bufCanvas.height = h;
    const bufCtx = bufCanvas.getContext('2d', { willReadFrequently: true });
    bufCtx.drawImage(currentLoadedImg, 0, 0);

    const imgData = bufCtx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const len = data.length;

    // 1. ROBUST BACKGROUND ESTIMATION
    // Sample across the entire image to find genuine paper background
    // (Immune to strokes touching corners, dark frames, or transparency)
    const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 1200)));
    const validLumas = [];
    const validSamples = [];
    let transparentCount = 0;
    let totalSampled = 0;

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        totalSampled++;
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        if (a < 50) {
          transparentCount++;
          continue;
        }
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        validLumas.push(luma);
        validSamples.push({ r, g, b, luma });
      }
    }

    const isAlreadyTransparent = (transparentCount / totalSampled) > 0.40;

    let bgR = 255, bgG = 255, bgB = 255, bgLuma = 255;
    if (validLumas.length > 0) {
      validLumas.sort((a, b) => a - b);
      // Paper background corresponds to the 90th percentile of brightness
      const pIndex = Math.min(validLumas.length - 1, Math.floor(validLumas.length * 0.90));
      bgLuma = validLumas[pIndex];

      // Average color among pixels that are close to paper luminance
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (const s of validSamples) {
        if (Math.abs(s.luma - bgLuma) <= 20) {
          rSum += s.r;
          gSum += s.g;
          bSum += s.b;
          count++;
        }
      }
      if (count > 0) {
        bgR = Math.round(rSum / count);
        bgG = Math.round(gSum / count);
        bgB = Math.round(bSum / count);
      }
    }

    // 2. INK EXTRACTION WITH DYNAMIC SENSITIVITY
    // Slider 15..85:
    // Default 50% => cutoff = 24
    // 85% => cutoff = 11 (more aggressive paper removal)
    // 15% => cutoff = 37 (gentler, preserves lighter strokes)
    let cutoff = (100 - thresholdPercent) * 0.38 + 5;

    function runExtraction(currentCutoff) {
      let minX = w, maxX = 0, minY = h, maxY = 0;
      let inkCount = 0;

      for (let i = 0; i < len; i += 4) {
        const a = data[i + 3];
        if (a < 20) {
          data[i + 3] = 0;
          continue;
        }

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (isAlreadyTransparent) {
          // If image was already transparent PNG, retain alpha and boost ink
          const px = (i / 4) % w;
          const py = Math.floor((i / 4) / w);
          if (a > 30) {
            inkCount++;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
          }
          applyColorMode(i, r, g, b, a);
          continue;
        }

        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        const lumaDiff = bgLuma - luma;
        const colorDist = Math.hypot(r - bgR, g - bgG, b - bgB);

        // A pixel is ink if it is darker than paper OR has distinct ink color (blue/red pen)
        const isInk = lumaDiff > currentCutoff || 
                      (chroma > 20 && lumaDiff > currentCutoff * 0.3) || 
                      (colorDist > currentCutoff * 1.3);

        if (!isInk) {
          data[i + 3] = 0; // Transparent paper
        } else {
          // Soft anti-aliased edge
          const strength = Math.max(
            lumaDiff / (currentCutoff * 2.2),
            chroma / 50,
            colorDist / (currentCutoff * 2.5)
          );
          let alpha = Math.min(255, Math.max(0, Math.round(strength * 255)));
          // Contrast curve so strokes are clear and solid
          alpha = Math.min(255, Math.round(Math.pow(alpha / 255, 0.55) * 255));
          data[i + 3] = alpha;

          if (alpha > 25) {
            const px = (i / 4) % w;
            const py = Math.floor((i / 4) / w);
            inkCount++;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
          }

          applyColorMode(i, r, g, b, alpha);
        }
      }

      return { inkCount, minX, maxX, minY, maxY };
    }

    function applyColorMode(i, r, g, b, alpha) {
      if (currentColorMode === 'blue') {
        // Deep signature pen blue (#002b7f)
        data[i] = Math.round(0 + 10 * (1 - alpha / 255));
        data[i + 1] = Math.round(40 + 20 * (1 - alpha / 255));
        data[i + 2] = Math.round(145 + 55 * (alpha / 255));
      } else if (currentColorMode === 'black') {
        // Deep document black
        data[i] = 20;
        data[i + 1] = 20;
        data[i + 2] = 20;
      } else if (currentColorMode === 'red') {
        // Official stamp red
        data[i] = 220;
        data[i + 1] = 25;
        data[i + 2] = 25;
      } else {
        // Original: clean up color cast
        data[i] = Math.max(0, Math.round(r * 0.90));
        data[i + 1] = Math.max(0, Math.round(g * 0.90));
        data[i + 2] = Math.max(0, Math.round(b * 0.90));
      }
    }

    let result = runExtraction(cutoff);

    // Fallback: If no ink detected (e.g. faint pencil or low contrast), retry with relaxed cutoff
    if (result.inkCount < 30 && !isAlreadyTransparent) {
      // Re-read original image data for retry
      bufCtx.drawImage(currentLoadedImg, 0, 0);
      const retryData = bufCtx.getImageData(0, 0, w, h);
      for (let k = 0; k < len; k++) data[k] = retryData.data[k];
      result = runExtraction(Math.max(5, cutoff * 0.45));
    }

    bufCtx.putImageData(imgData, 0, 0);

    const hasInk = result.inkCount > 0 && result.minX <= result.maxX && result.minY <= result.maxY;

    // Apply auto-crop if requested and ink was found
    if (doAutoCrop && hasInk) {
      const padding = 20; // 20px padding around signature
      const cropX = Math.max(0, result.minX - padding);
      const cropY = Math.max(0, result.minY - padding);
      const cropW = Math.min(w - cropX, (result.maxX - result.minX) + padding * 2);
      const cropH = Math.min(h - cropY, (result.maxY - result.minY) + padding * 2);

      resultCanvas.width = cropW;
      resultCanvas.height = cropH;
      const resCtx = resultCanvas.getContext('2d');
      resCtx.clearRect(0, 0, cropW, cropH);
      resCtx.drawImage(bufCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      resultMeta.textContent = `${cropW} × ${cropH} px`;
      if (cropBadge) {
        cropBadge.textContent = `Đã cắt gọn viền trắng (${w}×${h} ➔ ${cropW}×${cropH})`;
        cropBadge.style.display = 'inline-block';
      }
      updateStatus(`Đã tách nền thành công • Đã tự động cắt viền trắng gọn gàng (${cropW}×${cropH} px)`, 'success');
    } else {
      resultCanvas.width = w;
      resultCanvas.height = h;
      const resCtx = resultCanvas.getContext('2d');
      resCtx.clearRect(0, 0, w, h);
      resCtx.drawImage(bufCanvas, 0, 0);

      resultMeta.textContent = `${w} × ${h} px`;
      if (cropBadge) cropBadge.style.display = 'none';

      if (hasInk) {
        updateStatus(`Đã tách nền thành công • Kích thước gốc (${w}×${h} px)`, 'success');
      } else {
        updateStatus('Chưa nhận diện được nét ký rõ ràng, hãy thử giảm độ nhạy tách nền hoặc chọn lại ảnh!', 'warning');
      }
    }

    if (userTriggered) {
      showToast('Đã tách nền chữ ký thành công!', 'success');
    }
  }

  // Slider change
  if (thresholdSlider) {
    thresholdSlider.addEventListener('input', () => {
      processSignature();
    });
  }

  // Auto-crop checkbox toggle
  if (autoCropCheckbox) {
    autoCropCheckbox.addEventListener('change', () => {
      processSignature();
    });
  }

  // Color mode buttons
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColorMode = btn.getAttribute('data-color') || 'original';
      processSignature();
    });
  });

  // Background preview mode buttons
  bgBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bgBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const bg = btn.getAttribute('data-bg');

      resultContainer.className = 'sig-canvas-container';
      if (bg === 'white') {
        resultContainer.classList.add('bg-white');
        if (docMock) docMock.style.display = 'none';
      } else if (bg === 'document') {
        resultContainer.classList.add('bg-document');
        if (docMock) docMock.style.display = 'flex';
      } else {
        resultContainer.classList.add('sig-checkerboard-bg');
        if (docMock) docMock.style.display = 'none';
      }
    });
  });

  // Reset / Choose another image
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      currentLoadedImg = null;
      if (fileInput) fileInput.value = '';
      workspace.style.display = 'none';
      uploadZone.style.display = 'block';
    });
  }

  // Download Transparent PNG
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (!resultCanvas || resultCanvas.width === 0) return;
      const link = document.createElement('a');
      link.download = `chu-ky-tach-nen-${Date.now()}.png`;
      link.href = resultCanvas.toDataURL('image/png');
      link.click();
      showToast('Đã tải xuống ảnh chữ ký PNG trong suốt thành công!', 'success');
    });
  }

  // Copy to Clipboard
  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      if (!resultCanvas || resultCanvas.width === 0) return;
      try {
        resultCanvas.toBlob(async (blob) => {
          if (!blob) {
            showToast('Không thể tạo file ảnh để sao chép!', 'error');
            return;
          }
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('Đã sao chép ảnh chữ ký! Bạn có thể dán (Ctrl+V) vào Word/Excel ngay.', 'success');
          } else {
            showToast('Trình duyệt không hỗ trợ sao chép ảnh trực tiếp, vui lòng bấm Tải về!', 'warning');
          }
        }, 'image/png');
      } catch (err) {
        console.error('Clipboard copy error:', err);
        showToast('Vui lòng cấp quyền clipboard hoặc bấm nút Tải về ảnh!', 'warning');
      }
    });
  }
}

/**
 * ==========================================================================
 * SUBNAVIGATION: TIỆN ÍCH HÀNH CHÍNH (TÁCH NỀN / GHÉP ẢNH)
 * ==========================================================================
 */
function initToolsSubnavigation() {
  const subnavBtns = document.querySelectorAll('.tool-subnav-btn[data-tool]');
  const toolPanes = {
    'signature-remover': document.getElementById('tool-pane-signature-remover'),
    'image-merger': document.getElementById('tool-pane-image-merger'),
    'pdf-compressor': document.getElementById('tool-pane-pdf-compressor'),
    'img2pdf': document.getElementById('tool-pane-img2pdf')
  };

  subnavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      const tool = btn.getAttribute('data-tool');

      subnavBtns.forEach(b => b.classList.toggle('active', b === btn));

      Object.keys(toolPanes).forEach(k => {
        const pane = toolPanes[k];
        if (!pane) return;
        if (k === tool) {
          pane.style.display = 'block';
        } else {
          pane.style.display = 'none';
        }
      });

      // Redraw merger stage if switching to merger tool
      if (tool === 'image-merger' && window._redrawMergerStage) {
        setTimeout(window._redrawMergerStage, 50);
      }
    });
  });
}

/**
 * Helper: Bóc tách nền giấy trắng từ Image thành Canvas trong suốt
 */
function makeImageTransparent(img, thresholdPercent = 50) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const len = data.length;

  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 1200)));
  const validLumas = [];
  const validSamples = [];
  let transparentCount = 0;
  let totalSampled = 0;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      totalSampled++;
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a < 50) {
        transparentCount++;
        continue;
      }
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      validLumas.push(luma);
      validSamples.push({ r, g, b, luma });
    }
  }

  // Nếu ảnh đã là PNG trong suốt (> 35% pixel trong suốt) thì không can thiệp
  if (transparentCount / totalSampled > 0.35) {
    return canvas;
  }

  let bgR = 255, bgG = 255, bgB = 255, bgLuma = 255;
  if (validLumas.length > 0) {
    validLumas.sort((a, b) => a - b);
    const pIndex = Math.min(validLumas.length - 1, Math.floor(validLumas.length * 0.90));
    bgLuma = validLumas[pIndex];
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (const s of validSamples) {
      if (Math.abs(s.luma - bgLuma) <= 20) {
        rSum += s.r; gSum += s.g; bSum += s.b; count++;
      }
    }
    if (count > 0) {
      bgR = Math.round(rSum / count);
      bgG = Math.round(gSum / count);
      bgB = Math.round(bSum / count);
    }
  }

  const cutoff = (100 - thresholdPercent) * 0.38 + 5;

  for (let i = 0; i < len; i += 4) {
    const a = data[i + 3];
    if (a < 20) {
      data[i + 3] = 0;
      continue;
    }
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const lumaDiff = bgLuma - luma;
    const colorDist = Math.hypot(r - bgR, g - bgG, b - bgB);

    const isInk = lumaDiff > cutoff || (chroma > 20 && lumaDiff > cutoff * 0.3) || (colorDist > cutoff * 1.3);
    if (!isInk) {
      data[i + 3] = 0;
    } else {
      const strength = Math.max(lumaDiff / (cutoff * 2.2), chroma / 50, colorDist / (cutoff * 2.5));
      let alpha = Math.min(255, Math.max(0, Math.round(strength * 255)));
      alpha = Math.min(255, Math.round(Math.pow(alpha / 255, 0.55) * 255));
      data[i + 3] = alpha;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * ==========================================================================
 * TIỆN ÍCH 2: GHÉP ẢNH TRỰC QUAN (CHỮ KÝ, CON DẤU, HỌ TÊN CÁN BỘ)
 * ==========================================================================
 */
function initImageMergerTool() {
  const uploadZone = document.getElementById('merger-upload-zone');
  const fileInput = document.getElementById('merger-file-input');
  const addFileInput = document.getElementById('merger-add-file-input');
  const btnBrowse = document.getElementById('btn-browse-merger');
  const btnAddMore = document.getElementById('btn-add-more-layer');
  const btnSample = document.getElementById('btn-sample-merger');
  const btnReset = document.getElementById('btn-reset-merger');

  const workspace = document.getElementById('merger-workspace');
  const stageCanvas = document.getElementById('merger-stage-canvas');
  if (!stageCanvas) return;
  const stageCtx = stageCanvas.getContext('2d');

  const layersListContainer = document.getElementById('merger-layers-list');
  const layersCountBadge = document.getElementById('merger-layers-count');
  const metaInfoTag = document.getElementById('merger-meta-info');
  const cropBadge = document.getElementById('merger-crop-badge');

  // Controls
  const scaleSlider = document.getElementById('merger-scale-slider');
  const scaleVal = document.getElementById('merger-scale-val');
  const opacitySlider = document.getElementById('merger-opacity-slider');
  const opacityVal = document.getElementById('merger-opacity-val');
  const currentLayerName = document.getElementById('merger-current-layer-name');

  const btnLayerUp = document.getElementById('btn-layer-up');
  const btnLayerDown = document.getElementById('btn-layer-down');
  const btnLayerToggleTrans = document.getElementById('btn-layer-toggle-trans');
  const btnLayerDelete = document.getElementById('btn-layer-delete');

  const autoCropCheckbox = document.getElementById('merger-autocrop-checkbox');
  const autoRemoveBgCheckbox = document.getElementById('merger-auto-remove-bg-checkbox');

  const bgBtns = document.querySelectorAll('.merger-bg-btn');
  const canvasContainer = document.getElementById('merger-canvas-container');
  const docMock = document.getElementById('merger-doc-mock');

  const btnDownload = document.getElementById('btn-download-merger');
  const btnCopy = document.getElementById('btn-copy-merger');

  // State
  let layers = [];
  let activeLayerId = null;
  let isDragging = false;
  let isResizing = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let layerInitialX = 0;
  let layerInitialY = 0;
  let layerInitialScale = 1;
  let resizeCorner = ''; // 'tl', 'tr', 'bl', 'br'

  // Open file dialogs
  if (btnBrowse && fileInput) {
    btnBrowse.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }
  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.sig-upload-actions')) return;
      fileInput.click();
    });
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFilesSelected(Array.from(e.dataTransfer.files));
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        handleFilesSelected(Array.from(e.target.files));
      }
    });
  }

  if (btnAddMore && addFileInput) {
    btnAddMore.addEventListener('click', () => addFileInput.click());
    addFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        handleFilesSelected(Array.from(e.target.files));
      }
    });
  }

  // Handle files
  function handleFilesSelected(files) {
    const imgFiles = files.filter(f => f.type.startsWith('image/'));
    if (!imgFiles.length) {
      showToast('Vui lòng chọn các file định dạng ảnh (PNG, JPG, WEBP)!', 'warning');
      return;
    }

    let loadedCount = 0;
    imgFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          addLayerFromImage(img, file.name || `Ảnh ${layers.length + 1}`);
          loadedCount++;
          if (loadedCount === imgFiles.length) {
            uploadZone.style.display = 'none';
            workspace.style.display = 'flex';
            drawStage();
            updateLayersSidebar();
            showToast(`Đã thêm ${loadedCount} ảnh vào khung ghép!`, 'success');
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function addLayerFromImage(img, name = 'Lớp ảnh') {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    // Raw canvas
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = w;
    rawCanvas.height = h;
    const rCtx = rawCanvas.getContext('2d');
    rCtx.drawImage(img, 0, 0);

    // Transparent canvas
    const transCanvas = makeImageTransparent(img, 50);

    const autoRemove = autoRemoveBgCheckbox ? autoRemoveBgCheckbox.checked : true;
    const isTrans = autoRemove;

    // Initial scale calculation to fit nicely on stage
    let initialScale = 1.0;
    const maxDimension = Math.max(w, h);
    if (maxDimension > 300) {
      initialScale = Math.round((240 / maxDimension) * 100) / 100;
    }

    // Stagger positions
    const offset = (layers.length * 40) % 200;
    const x = 120 + offset;
    const y = 80 + offset;

    const layer = {
      id: 'layer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name.replace(/\.[^/.]+$/, ''),
      img: img,
      rawCanvas: rawCanvas,
      transCanvas: transCanvas,
      currentCanvas: isTrans ? transCanvas : rawCanvas,
      isTransparent: isTrans,
      x: x,
      y: y,
      width: w,
      height: h,
      scale: Math.max(0.2, Math.min(2.0, initialScale)),
      opacity: 1.0,
      visible: true
    };

    layers.push(layer);
    activeLayerId = layer.id;
  }

  // Generate Sample Administrative Combo (Con dấu tròn đỏ + Chữ ký xanh + Họ tên)
  if (btnSample) {
    btnSample.addEventListener('click', (e) => {
      e.stopPropagation();
      generateSampleAdministrativeCombo();
    });
  }

  function generateSampleAdministrativeCombo() {
    layers = [];

    // 1. Con dấu đỏ UBND tỉnh Đắk Lắk (Đường kính 170px)
    const sealCanvas = document.createElement('canvas');
    sealCanvas.width = 180;
    sealCanvas.height = 180;
    const sCtx = sealCanvas.getContext('2d');

    const cx = 90, cy = 90, rOuter = 82, rInner = 56;
    sCtx.strokeStyle = '#dc2626';
    sCtx.lineWidth = 3.5;
    sCtx.beginPath();
    sCtx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    sCtx.stroke();

    sCtx.lineWidth = 1.8;
    sCtx.beginPath();
    sCtx.arc(cx, cy, rInner, 0, Math.PI * 2);
    sCtx.stroke();

    // Text arc: Top
    sCtx.fillStyle = '#dc2626';
    sCtx.font = 'bold 11px Arial, sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';

    const textTop = 'ỦY BAN NHÂN DÂN TỈNH ĐẮK LẮK';
    const angleStep = Math.PI / (textTop.length + 1);
    for (let i = 0; i < textTop.length; i++) {
      const angle = -Math.PI * 0.8 + (i + 1) * angleStep * 0.95;
      sCtx.save();
      sCtx.translate(cx + Math.cos(angle) * (rOuter - 13), cy + Math.sin(angle) * (rOuter - 13));
      sCtx.rotate(angle + Math.PI / 2);
      sCtx.fillText(textTop[i], 0, 0);
      sCtx.restore();
    }

    // Text: Center & Sub
    sCtx.font = 'bold 12px Arial, sans-serif';
    sCtx.fillText('★ VĂN PHÒNG ★', cx, cy - 8);

    // Five-point star in center
    drawFivePointStar(sCtx, cx, cy + 18, 14, 6, '#dc2626');

    // 2. Chữ ký bút bi xanh
    const sigCanvas = document.createElement('canvas');
    sigCanvas.width = 300;
    sigCanvas.height = 140;
    const sgCtx = sigCanvas.getContext('2d');

    sgCtx.strokeStyle = '#002b7f';
    sgCtx.lineWidth = 3.2;
    sgCtx.lineCap = 'round';
    sgCtx.lineJoin = 'round';

    sgCtx.beginPath();
    sgCtx.moveTo(40, 95);
    sgCtx.bezierCurveTo(45, 30, 75, 20, 90, 40);
    sgCtx.bezierCurveTo(100, 60, 110, 110, 130, 90);
    sgCtx.bezierCurveTo(145, 65, 175, 45, 195, 60);
    sgCtx.bezierCurveTo(220, 80, 240, 65, 260, 50);
    sgCtx.stroke();

    sgCtx.beginPath();
    sgCtx.moveTo(60, 105);
    sgCtx.bezierCurveTo(110, 95, 210, 90, 280, 75);
    sgCtx.stroke();

    // 3. Họ và tên cán bộ
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 240;
    nameCanvas.height = 40;
    const nCtx = nameCanvas.getContext('2d');
    nCtx.fillStyle = '#1e293b';
    nCtx.font = 'bold 17px "Times New Roman", Times, serif';
    nCtx.textAlign = 'center';
    nCtx.textBaseline = 'middle';
    nCtx.fillText('Nguyễn Văn An', 120, 20);

    // Add 3 layers in administrative stamping layout:
    // Con dấu trùm 1/3 chữ ký về bên trái
    layers.push({
      id: 'layer_seal',
      name: 'Con dấu đỏ UBND',
      currentCanvas: sealCanvas,
      rawCanvas: sealCanvas,
      transCanvas: sealCanvas,
      isTransparent: true,
      x: 180,
      y: 110,
      width: 180,
      height: 180,
      scale: 1.0,
      opacity: 0.95,
      visible: true
    });

    layers.push({
      id: 'layer_sig',
      name: 'Chữ ký xanh',
      currentCanvas: sigCanvas,
      rawCanvas: sigCanvas,
      transCanvas: sigCanvas,
      isTransparent: true,
      x: 290,
      y: 130,
      width: 300,
      height: 140,
      scale: 0.95,
      opacity: 1.0,
      visible: true
    });

    layers.push({
      id: 'layer_name',
      name: 'Họ tên cán bộ',
      currentCanvas: nameCanvas,
      rawCanvas: nameCanvas,
      transCanvas: nameCanvas,
      isTransparent: true,
      x: 320,
      y: 280,
      width: 240,
      height: 40,
      scale: 1.0,
      opacity: 1.0,
      visible: true
    });

    activeLayerId = 'layer_sig';
    uploadZone.style.display = 'none';
    workspace.style.display = 'flex';
    drawStage();
    updateLayersSidebar();
    showToast('Đã tạo mẫu Con dấu + Chữ ký + Họ tên chuẩn công văn!', 'success');
  }

  function drawFivePointStar(ctx, cx, cy, outerRadius, innerRadius, color) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / 5;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < 5; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Draw Stage Canvas
  function drawStage() {
    stageCtx.clearRect(0, 0, stageCanvas.width, stageCanvas.height);

    // Draw layers from bottom to top
    layers.forEach(layer => {
      if (!layer.visible) return;
      const lw = layer.width * layer.scale;
      const lh = layer.height * layer.scale;

      stageCtx.save();
      stageCtx.globalAlpha = layer.opacity;
      stageCtx.drawImage(layer.currentCanvas, layer.x, layer.y, lw, lh);
      stageCtx.restore();

      // If active layer, draw bounding box & corner handles
      if (layer.id === activeLayerId) {
        drawBoundingBox(layer);
      }
    });

    updateMetaInfo();
  }

  window._redrawMergerStage = drawStage;

  function drawBoundingBox(layer) {
    const lw = layer.width * layer.scale;
    const lh = layer.height * layer.scale;

    stageCtx.save();
    stageCtx.strokeStyle = '#2563eb';
    stageCtx.lineWidth = 1.5;
    stageCtx.setLineDash([4, 3]);
    stageCtx.strokeRect(layer.x, layer.y, lw, lh);
    stageCtx.setLineDash([]);

    // 4 Corner handles
    const handleSize = 8;
    const corners = [
      { x: layer.x, y: layer.y },
      { x: layer.x + lw, y: layer.y },
      { x: layer.x, y: layer.y + lh },
      { x: layer.x + lw, y: layer.y + lh }
    ];

    corners.forEach(c => {
      stageCtx.fillStyle = '#ffffff';
      stageCtx.strokeStyle = '#2563eb';
      stageCtx.lineWidth = 2;
      stageCtx.beginPath();
      stageCtx.arc(c.x, c.y, handleSize / 2, 0, Math.PI * 2);
      stageCtx.fill();
      stageCtx.stroke();
    });

    // Label tag
    stageCtx.fillStyle = '#2563eb';
    stageCtx.font = 'bold 11px sans-serif';
    const tagText = `${layer.name} (${Math.round(layer.scale * 100)}%)`;
    const textWidth = stageCtx.measureText(tagText).width;
    stageCtx.fillRect(layer.x, layer.y - 18, textWidth + 10, 16);
    stageCtx.fillStyle = '#ffffff';
    stageCtx.fillText(tagText, layer.x + 5, layer.y - 6);

    stageCtx.restore();
  }

  function updateMetaInfo() {
    if (!metaInfoTag) return;
    const visibleCount = layers.filter(l => l.visible).length;
    if (visibleCount === 0) {
      metaInfoTag.textContent = '0 lớp ảnh';
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    layers.forEach(l => {
      if (!l.visible) return;
      const lw = l.width * l.scale;
      const lh = l.height * l.scale;
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + lw);
      maxY = Math.max(maxY, l.y + lh);
    });

    const cropW = Math.max(0, Math.round(maxX - minX + 40));
    const cropH = Math.max(0, Math.round(maxY - minY + 40));
    metaInfoTag.textContent = `${visibleCount} lớp • Vùng ghép: ${cropW} × ${cropH} px`;
  }

  // Interactive mouse/touch dragging
  function getCanvasCoords(e) {
    const rect = stageCanvas.getBoundingClientRect();
    const scaleX = stageCanvas.width / rect.width;
    const scaleY = stageCanvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function isOverHandle(cx, cy, hx, hy, radius = 10) {
    return Math.hypot(cx - hx, cy - hy) <= radius;
  }

  stageCanvas.addEventListener('mousedown', handlePointerDown);
  stageCanvas.addEventListener('touchstart', handlePointerDown, { passive: false });

  function handlePointerDown(e) {
    const pos = getCanvasCoords(e);
    const activeLayer = layers.find(l => l.id === activeLayerId);

    // Check if clicked corner resize handle of active layer
    if (activeLayer && activeLayer.visible) {
      const lw = activeLayer.width * activeLayer.scale;
      const lh = activeLayer.height * activeLayer.scale;

      if (isOverHandle(pos.x, pos.y, activeLayer.x + lw, activeLayer.y + lh)) {
        isResizing = true;
        resizeCorner = 'br';
        dragStartX = pos.x;
        dragStartY = pos.y;
        layerInitialScale = activeLayer.scale;
        if (e.preventDefault) e.preventDefault();
        return;
      }
    }

    // Hit test layers from topmost to bottommost
    let clickedLayer = null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (!l.visible) continue;
      const lw = l.width * l.scale;
      const lh = l.height * l.scale;
      if (pos.x >= l.x && pos.x <= l.x + lw && pos.y >= l.y && pos.y <= l.y + lh) {
        clickedLayer = l;
        break;
      }
    }

    if (clickedLayer) {
      activeLayerId = clickedLayer.id;
      isDragging = true;
      dragStartX = pos.x;
      dragStartY = pos.y;
      layerInitialX = clickedLayer.x;
      layerInitialY = clickedLayer.y;
      canvasContainer.classList.add('dragging');
      syncControlsWithActiveLayer();
      drawStage();
      updateLayersSidebar();
      if (e.preventDefault) e.preventDefault();
    } else {
      activeLayerId = null;
      syncControlsWithActiveLayer();
      drawStage();
      updateLayersSidebar();
    }
  }

  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('touchmove', handlePointerMove, { passive: false });

  function handlePointerMove(e) {
    if (!isDragging && !isResizing) return;
    const pos = getCanvasCoords(e);
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer) return;

    if (isDragging) {
      const dx = pos.x - dragStartX;
      const dy = pos.y - dragStartY;
      activeLayer.x = Math.round(layerInitialX + dx);
      activeLayer.y = Math.round(layerInitialY + dy);
      drawStage();
      if (e.preventDefault) e.preventDefault();
    } else if (isResizing) {
      const dx = pos.x - dragStartX;
      const scaleDelta = dx / activeLayer.width;
      const newScale = Math.max(0.2, Math.min(2.5, layerInitialScale + scaleDelta));
      activeLayer.scale = Math.round(newScale * 100) / 100;
      if (scaleSlider) scaleSlider.value = Math.round(activeLayer.scale * 100);
      if (scaleVal) scaleVal.textContent = `${Math.round(activeLayer.scale * 100)}%`;
      drawStage();
      if (e.preventDefault) e.preventDefault();
    }
  }

  window.addEventListener('mouseup', handlePointerUp);
  window.addEventListener('touchend', handlePointerUp);

  function handlePointerUp() {
    isDragging = false;
    isResizing = false;
    canvasContainer.classList.remove('dragging');
  }

  // Sync toolbar controls with active layer
  function syncControlsWithActiveLayer() {
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer) {
      if (currentLayerName) currentLayerName.textContent = '(Chưa chọn)';
      if (scaleSlider) scaleSlider.disabled = true;
      if (opacitySlider) opacitySlider.disabled = true;
      if (btnLayerUp) btnLayerUp.disabled = true;
      if (btnLayerDown) btnLayerDown.disabled = true;
      if (btnLayerToggleTrans) btnLayerToggleTrans.disabled = true;
      if (btnLayerDelete) btnLayerDelete.disabled = true;
      return;
    }

    if (currentLayerName) currentLayerName.textContent = activeLayer.name;
    if (scaleSlider) {
      scaleSlider.disabled = false;
      scaleSlider.value = Math.round(activeLayer.scale * 100);
    }
    if (scaleVal) scaleVal.textContent = `${Math.round(activeLayer.scale * 100)}%`;

    if (opacitySlider) {
      opacitySlider.disabled = false;
      opacitySlider.value = Math.round(activeLayer.opacity * 100);
    }
    if (opacityVal) opacityVal.textContent = `${Math.round(activeLayer.opacity * 100)}%`;

    if (btnLayerUp) btnLayerUp.disabled = false;
    if (btnLayerDown) btnLayerDown.disabled = false;
    if (btnLayerToggleTrans) btnLayerToggleTrans.disabled = false;
    if (btnLayerDelete) btnLayerDelete.disabled = false;
  }

  // Scale slider
  if (scaleSlider) {
    scaleSlider.addEventListener('input', (e) => {
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (!activeLayer) return;
      const s = parseInt(e.target.value, 10) / 100;
      activeLayer.scale = s;
      if (scaleVal) scaleVal.textContent = `${Math.round(s * 100)}%`;
      drawStage();
    });
  }

  // Opacity slider
  if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (!activeLayer) return;
      const o = parseInt(e.target.value, 10) / 100;
      activeLayer.opacity = o;
      if (opacityVal) opacityVal.textContent = `${Math.round(o * 100)}%`;
      drawStage();
    });
  }

  // Layer order up
  if (btnLayerUp) {
    btnLayerUp.addEventListener('click', () => {
      const idx = layers.findIndex(l => l.id === activeLayerId);
      if (idx < 0 || idx >= layers.length - 1) return;
      const temp = layers[idx];
      layers[idx] = layers[idx + 1];
      layers[idx + 1] = temp;
      drawStage();
      updateLayersSidebar();
    });
  }

  // Layer order down
  if (btnLayerDown) {
    btnLayerDown.addEventListener('click', () => {
      const idx = layers.findIndex(l => l.id === activeLayerId);
      if (idx <= 0) return;
      const temp = layers[idx];
      layers[idx] = layers[idx - 1];
      layers[idx - 1] = temp;
      drawStage();
      updateLayersSidebar();
    });
  }

  // Toggle transparent for layer
  if (btnLayerToggleTrans) {
    btnLayerToggleTrans.addEventListener('click', () => {
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (!activeLayer) return;
      activeLayer.isTransparent = !activeLayer.isTransparent;
      activeLayer.currentCanvas = activeLayer.isTransparent ? activeLayer.transCanvas : activeLayer.rawCanvas;
      drawStage();
      updateLayersSidebar();
      showToast(activeLayer.isTransparent ? 'Đã bật chế độ tách nền cho lớp này' : 'Đã giữ nguyên nền gốc cho lớp này', 'info');
    });
  }

  // Delete layer
  if (btnLayerDelete) {
    btnLayerDelete.addEventListener('click', () => {
      if (!activeLayerId) return;
      layers = layers.filter(l => l.id !== activeLayerId);
      activeLayerId = layers.length ? layers[layers.length - 1].id : null;
      if (layers.length === 0) {
        workspace.style.display = 'none';
        uploadZone.style.display = 'block';
      }
      syncControlsWithActiveLayer();
      drawStage();
      updateLayersSidebar();
    });
  }

  // Reset all
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      layers = [];
      activeLayerId = null;
      workspace.style.display = 'none';
      uploadZone.style.display = 'block';
      if (fileInput) fileInput.value = '';
      if (addFileInput) addFileInput.value = '';
    });
  }

  // Update Layers Sidebar list
  function updateLayersSidebar() {
    if (!layersListContainer) return;
    if (layersCountBadge) layersCountBadge.textContent = layers.length;

    layersListContainer.innerHTML = '';
    // Show top-to-bottom as reverse of array (top layer first)
    const reversed = [...layers].reverse();

    reversed.forEach(layer => {
      const item = document.createElement('div');
      item.className = `merger-layer-item ${layer.id === activeLayerId ? 'active' : ''}`;

      const left = document.createElement('div');
      left.className = 'merger-layer-item-left';

      // Thumbnail
      const thumb = document.createElement('canvas');
      thumb.className = 'merger-layer-thumb';
      thumb.width = 40;
      thumb.height = 40;
      const tCtx = thumb.getContext('2d');
      tCtx.drawImage(layer.currentCanvas, 0, 0, 40, 40);

      const info = document.createElement('div');
      info.className = 'merger-layer-info';
      const title = document.createElement('span');
      title.className = 'merger-layer-title';
      title.textContent = layer.name;
      const meta = document.createElement('span');
      meta.className = 'merger-layer-meta';
      meta.textContent = `${Math.round(layer.width * layer.scale)}×${Math.round(layer.height * layer.scale)} px • ${layer.isTransparent ? 'Không nền' : 'Nền gốc'}`;

      info.appendChild(title);
      info.appendChild(meta);
      left.appendChild(thumb);
      left.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'merger-layer-actions';

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'btn-icon-only btn-danger-icon';
      btnDel.title = 'Xóa lớp';
      btnDel.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>`;
      btnDel.addEventListener('click', (e) => {
        e.stopPropagation();
        layers = layers.filter(l => l.id !== layer.id);
        if (activeLayerId === layer.id) {
          activeLayerId = layers.length ? layers[layers.length - 1].id : null;
        }
        if (layers.length === 0) {
          workspace.style.display = 'none';
          uploadZone.style.display = 'block';
        }
        syncControlsWithActiveLayer();
        drawStage();
        updateLayersSidebar();
      });

      actions.appendChild(btnDel);

      item.appendChild(left);
      item.appendChild(actions);

      item.addEventListener('click', () => {
        activeLayerId = layer.id;
        syncControlsWithActiveLayer();
        drawStage();
        updateLayersSidebar();
      });

      layersListContainer.appendChild(item);
    });
  }

  // Background Preview switch buttons
  bgBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bgBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const bg = btn.getAttribute('data-bg');

      canvasContainer.className = 'merger-canvas-viewport';
      if (bg === 'white') {
        canvasContainer.classList.add('bg-white');
        if (docMock) docMock.style.display = 'none';
      } else if (bg === 'document') {
        canvasContainer.classList.add('bg-document');
        if (docMock) docMock.style.display = 'flex';
      } else {
        canvasContainer.classList.add('sig-checkerboard-bg');
        if (docMock) docMock.style.display = 'none';
      }
    });
  });

  // Render composite image for export
  function createMergedExportCanvas() {
    const visibleLayers = layers.filter(l => l.visible);
    if (!visibleLayers.length) return null;

    const doAutoCrop = autoCropCheckbox ? autoCropCheckbox.checked : true;

    if (!doAutoCrop) {
      const expCanvas = document.createElement('canvas');
      expCanvas.width = stageCanvas.width;
      expCanvas.height = stageCanvas.height;
      const expCtx = expCanvas.getContext('2d');
      visibleLayers.forEach(l => {
        const lw = l.width * l.scale;
        const lh = l.height * l.scale;
        expCtx.save();
        expCtx.globalAlpha = l.opacity;
        expCtx.drawImage(l.currentCanvas, l.x, l.y, lw, lh);
        expCtx.restore();
      });
      return expCanvas;
    }

    // Auto-crop bounding box around all layers
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    visibleLayers.forEach(l => {
      const lw = l.width * l.scale;
      const lh = l.height * l.scale;
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + lw);
      maxY = Math.max(maxY, l.y + lh);
    });

    const padding = 20;
    const cropX = Math.max(0, Math.floor(minX - padding));
    const cropY = Math.max(0, Math.floor(minY - padding));
    const cropW = Math.ceil(maxX - minX + padding * 2);
    const cropH = Math.ceil(maxY - minY + padding * 2);

    const expCanvas = document.createElement('canvas');
    expCanvas.width = cropW;
    expCanvas.height = cropH;
    const expCtx = expCanvas.getContext('2d');

    visibleLayers.forEach(l => {
      const lw = l.width * l.scale;
      const lh = l.height * l.scale;
      expCtx.save();
      expCtx.globalAlpha = l.opacity;
      expCtx.drawImage(l.currentCanvas, l.x - cropX, l.y - cropY, lw, lh);
      expCtx.restore();
    });

    return expCanvas;
  }

  // Download Merged Transparent PNG
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const expCanvas = createMergedExportCanvas();
      if (!expCanvas) {
        showToast('Chưa có ảnh nào để tải về!', 'warning');
        return;
      }
      const link = document.createElement('a');
      link.download = `anh-ghep-trong-suot-${Date.now()}.png`;
      link.href = expCanvas.toDataURL('image/png');
      link.click();
      showToast('Đã tải về ảnh ghép trong suốt thành công!', 'success');
    });
  }

  // Copy to Clipboard
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const expCanvas = createMergedExportCanvas();
      if (!expCanvas) {
        showToast('Chưa có ảnh nào để sao chép!', 'warning');
        return;
      }
      try {
        expCanvas.toBlob(async (blob) => {
          if (!blob) {
            showToast('Không thể tạo file ảnh để sao chép!', 'error');
            return;
          }
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('Đã sao chép ảnh ghép! Bạn có thể dán (Ctrl+V) vào Word/Excel/PDF ngay.', 'success');
          } else {
            showToast('Trình duyệt không hỗ trợ sao chép ảnh trực tiếp, vui lòng bấm Tải về!', 'warning');
          }
        }, 'image/png');
      } catch (err) {
        console.error('Clipboard copy error:', err);
        showToast('Vui lòng bấm nút Tải về ảnh!', 'warning');
      }
    });
  }
}

/**
 * ==========================================================================
 * TIỆN ÍCH 3: GIẢM DUNG LƯỢNG PDF (NÉN FILE SCAN HỒ SƠ DVC)
 * 100% Offline • Xử lý trực tiếp trên trình duyệt • Bảo mật tuyệt đối
 * ==========================================================================
 */
function initPdfCompressorTool() {
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
  }

  const uploadZone = document.getElementById('pdf-upload-zone');
  const fileInput = document.getElementById('pdf-file-input');
  const btnBrowse = document.getElementById('btn-browse-pdf');

  const workspace = document.getElementById('pdf-workspace');
  const fileNameLabel = document.getElementById('pdf-loaded-filename');
  const pagesLabel = document.getElementById('pdf-loaded-pages');
  const origSizeLabel = document.getElementById('pdf-loaded-orig-size');
  const btnReset = document.getElementById('btn-reset-pdf');

  const configCard = document.getElementById('pdf-config-card');
  const presetCards = document.querySelectorAll('.compress-preset-card');
  const grayscaleCheckbox = document.getElementById('pdf-grayscale-checkbox');
  const btnStart = document.getElementById('btn-start-compress');

  const progressCard = document.getElementById('pdf-progress-card');
  const progressBarFill = document.getElementById('pdf-progress-bar-fill');
  const progressPercent = document.getElementById('pdf-progress-percent');
  const progressStatusText = document.getElementById('pdf-progress-status-text');

  const resultCard = document.getElementById('pdf-result-card');
  const statOrigSize = document.getElementById('pdf-stat-orig-size');
  const statNewSize = document.getElementById('pdf-stat-new-size');
  const statPercentSaved = document.getElementById('pdf-stat-percent-saved');
  const resultTimeText = document.getElementById('pdf-result-time-text');

  const btnDownload = document.getElementById('btn-download-compressed-pdf');
  const btnPreview = document.getElementById('btn-preview-compressed-pdf');
  const btnRecompress = document.getElementById('btn-recompress-pdf');

  const thumbnailsGrid = document.getElementById('pdf-thumbnails-grid');
  const previewPagesCount = document.getElementById('pdf-preview-pages-count');

  if (!uploadZone || !fileInput) return;

  // State
  let currentFile = null;
  let currentFileName = 'tai-lieu.pdf';
  let currentFileSize = 0;
  let currentArrayBuffer = null;
  let currentPdfDoc = null;
  let currentNumPages = 0;
  let selectedPreset = 'standard';
  let compressedBlob = null;
  let compressedUrl = null;
  let isCompressing = false;

  const PRESET_CONFIG = {
    max: {
      scale: 1.05,       // ~75-80 DPI (compact for portals)
      quality: 0.50,
      name: 'Nén tối đa'
    },
    standard: {
      scale: 1.30,       // ~95-100 DPI (balanced text and reduction)
      quality: 0.68,
      name: 'Nén tiêu chuẩn'
    },
    light: {
      scale: 1.65,       // ~120-130 DPI (high sharpness)
      quality: 0.82,
      name: 'Nén nhẹ'
    }
  };

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // Open file picker
  if (btnBrowse && fileInput) {
    btnBrowse.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      fileInput.click();
    });

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handlePdfFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handlePdfFile(e.target.files[0]);
      }
    });
  }

  // Preset selection
  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      presetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedPreset = card.getAttribute('data-preset') || 'standard';
    });
  });

  // Handle PDF file load
  async function handlePdfFile(file) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Vui lòng chọn file có định dạng PDF!', 'warning');
      return;
    }

    try {
      currentFile = file;
      currentFileName = file.name;
      currentFileSize = file.size;

      fileNameLabel.textContent = currentFileName;
      origSizeLabel.textContent = formatBytes(currentFileSize);
      pagesLabel.textContent = 'Đang đọc số trang...';

      uploadZone.style.display = 'none';
      workspace.style.display = 'flex';
      configCard.style.display = 'flex';
      progressCard.style.display = 'none';
      resultCard.style.display = 'none';

      currentArrayBuffer = await file.arrayBuffer();
      if (!window.pdfjsLib) {
        throw new Error('Thư viện xử lý PDF chưa sẵn sàng!');
      }

      const loadingTask = window.pdfjsLib.getDocument({ data: currentArrayBuffer });
      currentPdfDoc = await loadingTask.promise;
      currentNumPages = currentPdfDoc.numPages;

      pagesLabel.textContent = `${currentNumPages} trang`;
      showToast(`Đã nhận file PDF (${currentNumPages} trang, ${formatBytes(currentFileSize)})`, 'success');
    } catch (err) {
      console.error('Lỗi khi nạp file PDF:', err);
      showToast('Không thể mở file PDF: ' + (err.message || 'File bị lỗi hoặc có mật khẩu'), 'error');
      resetPdfState();
    }
  }

  // Reset State
  function resetPdfState() {
    currentFile = null;
    currentArrayBuffer = null;
    currentPdfDoc = null;
    currentNumPages = 0;
    if (fileInput) fileInput.value = '';
    if (compressedUrl) {
      URL.revokeObjectURL(compressedUrl);
      compressedUrl = null;
    }
    compressedBlob = null;
    isCompressing = false;

    workspace.style.display = 'none';
    uploadZone.style.display = 'block';
  }

  if (btnReset) {
    btnReset.addEventListener('click', resetPdfState);
  }

  // Recompress with another preset
  if (btnRecompress) {
    btnRecompress.addEventListener('click', () => {
      resultCard.style.display = 'none';
      progressCard.style.display = 'none';
      configCard.style.display = 'flex';
      configCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // Start Compression Flow
  if (btnStart) {
    btnStart.addEventListener('click', startCompression);
  }

  function updateProgress(percent, statusText) {
    if (progressBarFill) progressBarFill.style.width = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressStatusText) progressStatusText.textContent = statusText;
  }

  async function startCompression() {
    if (!currentPdfDoc || isCompressing) return;
    isCompressing = true;

    configCard.style.display = 'none';
    resultCard.style.display = 'none';
    progressCard.style.display = 'flex';
    updateProgress(5, 'Bắt đầu quá trình nén tài liệu...');

    const startTime = performance.now();
    const config = PRESET_CONFIG[selectedPreset] || PRESET_CONFIG.standard;
    const isGrayscale = grayscaleCheckbox ? grayscaleCheckbox.checked : false;

    try {
      const { jsPDF } = window.jspdf;
      let outputPdf = null;
      const thumbnails = [];

      for (let i = 1; i <= currentNumPages; i++) {
        const stepPercent = Math.round(5 + ((i - 1) / currentNumPages) * 90);
        updateProgress(stepPercent, `Đang xử lý và nén trang ${i}/${currentNumPages}...`);
        await new Promise(r => setTimeout(r, 12));

        const page = await currentPdfDoc.getPage(i);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const renderViewport = page.getViewport({ scale: config.scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(renderViewport.width);
        canvas.height = Math.round(renderViewport.height);
        const ctx = canvas.getContext('2d');

        // Crisp white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

        // Grayscale conversion if requested
        if (isGrayscale) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          for (let j = 0; j < d.length; j += 4) {
            const gray = Math.round(0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]);
            d[j] = gray;
            d[j + 1] = gray;
            d[j + 2] = gray;
          }
          ctx.putImageData(imgData, 0, 0);
        }

        // Export page image
        const jpegDataUrl = canvas.toDataURL('image/jpeg', config.quality);

        const ptW = unscaledViewport.width;
        const ptH = unscaledViewport.height;
        const orient = ptW > ptH ? 'landscape' : 'portrait';

        if (i === 1) {
          outputPdf = new jsPDF({
            orientation: orient,
            unit: 'pt',
            format: [ptW, ptH],
            compress: true
          });
        } else {
          outputPdf.addPage([ptW, ptH], orient);
        }

        outputPdf.addImage(jpegDataUrl, 'JPEG', 0, 0, ptW, ptH, undefined, 'FAST');

        // Thumbnail for preview grid
        thumbnails.push({
          pageNumber: i,
          dataUrl: canvas.toDataURL('image/jpeg', 0.45)
        });
      }

      updateProgress(98, 'Đang tổng hợp và kết xuất file PDF...');
      await new Promise(r => setTimeout(r, 50));

      const newBlob = outputPdf.output('blob');
      const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(1);

      finishCompression(newBlob, elapsedSec, thumbnails);
    } catch (err) {
      console.error('Lỗi trong quá trình nén:', err);
      showToast('Đã xảy ra lỗi khi nén PDF: ' + err.message, 'error');
      progressCard.style.display = 'none';
      configCard.style.display = 'flex';
      isCompressing = false;
    }
  }

  function finishCompression(newBlob, elapsedSec, thumbnails) {
    isCompressing = false;
    compressedBlob = newBlob;
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    compressedUrl = URL.createObjectURL(newBlob);

    const origBytes = currentFileSize;
    const newBytes = newBlob.size;

    statOrigSize.textContent = formatBytes(origBytes);
    statNewSize.textContent = formatBytes(newBytes);

    let savedPct = 0;
    if (origBytes > 0) {
      savedPct = Math.round(((origBytes - newBytes) / origBytes) * 100);
    }

    if (savedPct > 0) {
      statPercentSaved.textContent = `-${savedPct}%`;
      statPercentSaved.className = 'saved-val text-success';
    } else {
      statPercentSaved.textContent = `0%`;
      statPercentSaved.className = 'saved-val text-muted';
    }

    resultTimeText.textContent = `Xử lý ${currentNumPages} trang trong ${elapsedSec}s`;

    // Render Thumbnails
    if (thumbnailsGrid && previewPagesCount) {
      previewPagesCount.textContent = thumbnails.length;
      thumbnailsGrid.innerHTML = '';
      thumbnails.forEach(t => {
        const card = document.createElement('div');
        card.className = 'pdf-page-thumb-card';
        card.innerHTML = `
          <img class="pdf-page-thumb-canvas" src="${t.dataUrl}" alt="Trang ${t.pageNumber}" />
          <div class="pdf-page-thumb-footer">
            <span>Trang ${t.pageNumber}</span>
            <span style="color: #059669;">✓ Nét</span>
          </div>
        `;
        thumbnailsGrid.appendChild(card);
      });
    }

    progressCard.style.display = 'none';
    resultCard.style.display = 'flex';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    showToast(`Nén thành công! Dung lượng giảm ${savedPct > 0 ? savedPct + '%' : 'tối ưu'} (còn ${formatBytes(newBytes)})`, 'success');
  }

  // Download Action
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (!compressedBlob) return;
      const baseName = currentFileName.replace(/\.[^/.]+$/, '');
      const downloadName = `${baseName}-da-nen.pdf`;

      const link = document.createElement('a');
      link.href = compressedUrl;
      link.download = downloadName;
      link.click();
      showToast(`Đã tải về file: ${downloadName}`, 'success');
    });
  }

  // Preview Action
  if (btnPreview) {
    btnPreview.addEventListener('click', () => {
      if (!compressedUrl) return;
      window.open(compressedUrl, '_blank');
    });
  }
}

/**
 * ==========================================================================
 * TIỆN ÍCH 4: CHUYỂN ĐỔI ẢNH SANG PDF (GỘP NHIỀU ẢNH THÀNH 1 FILE PDF)
 * 100% Offline • Trực tiếp trên trình duyệt • Bảo mật tuyệt đối hồ sơ
 * ==========================================================================
 */
function initImageToPdfTool() {
  const uploadZone = document.getElementById('img2pdf-upload-zone');
  const fileInput = document.getElementById('img2pdf-file-input');
  const addFileInput = document.getElementById('img2pdf-add-file-input');
  const btnBrowse = document.getElementById('btn-browse-img2pdf');
  const btnAddMore = document.getElementById('btn-img2pdf-add-more');
  const btnClearAll = document.getElementById('btn-img2pdf-clear-all');

  const workspace = document.getElementById('img2pdf-workspace');
  const countBadge = document.getElementById('img2pdf-count-badge');
  const cardsGrid = document.getElementById('img2pdf-cards-grid');

  const pageSizeSelect = document.getElementById('img2pdf-page-size-select');
  const orientationSelect = document.getElementById('img2pdf-orientation-select');
  const marginSelect = document.getElementById('img2pdf-margin-select');
  const qualitySelect = document.getElementById('img2pdf-quality-select');

  const btnConvert = document.getElementById('btn-convert-to-pdf');
  const progressCard = document.getElementById('img2pdf-progress-card');
  const progressTitle = document.getElementById('img2pdf-progress-title');
  const progressStatus = document.getElementById('img2pdf-progress-status');

  const resultCard = document.getElementById('img2pdf-result-card');
  const resPages = document.getElementById('img2pdf-res-pages');
  const resSize = document.getElementById('img2pdf-res-size');
  const btnDownload = document.getElementById('btn-download-img2pdf');
  const btnPreview = document.getElementById('btn-preview-img2pdf');

  if (!uploadZone || !fileInput) return;

  // State
  let imagesList = []; // Array of { id, name, size, width, height, dataUrl, rotation, img }
  let convertedPdfBlob = null;
  let convertedPdfUrl = null;
  let isConverting = false;

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // Open file dialogs
  if (btnBrowse && fileInput) {
    btnBrowse.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (btnAddMore && addFileInput) {
    btnAddMore.addEventListener('click', () => {
      addFileInput.click();
    });
  }

  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      fileInput.click();
    });

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFilesToList(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        addFilesToList(e.target.files);
        fileInput.value = '';
      }
    });
  }

  if (addFileInput) {
    addFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        addFilesToList(e.target.files);
        addFileInput.value = '';
      }
    });
  }

  // Process selected files
  function addFilesToList(fileList) {
    const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('Vui lòng chọn các file định dạng hình ảnh (JPG, PNG, WEBP...)!', 'warning');
      return;
    }

    let loadedCount = 0;
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const img = new Image();
        img.onload = () => {
          const item = {
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: file.name,
            size: file.size,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            dataUrl: dataUrl,
            rotation: 0,
            img: img
          };
          imagesList.push(item);
          loadedCount++;

          if (loadedCount === validFiles.length) {
            uploadZone.style.display = 'none';
            workspace.style.display = 'flex';
            renderPagesGrid();
            showToast(`Đã thêm ${loadedCount} ảnh vào danh sách chuyển đổi!`, 'success');
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  // Render Page Cards Grid
  function renderPagesGrid() {
    if (!cardsGrid) return;
    cardsGrid.innerHTML = '';
    countBadge.textContent = `${imagesList.length} ảnh đã chọn`;

    if (imagesList.length === 0) {
      workspace.style.display = 'none';
      uploadZone.style.display = 'block';
      if (convertedPdfUrl) {
        URL.revokeObjectURL(convertedPdfUrl);
        convertedPdfUrl = null;
      }
      convertedPdfBlob = null;
      resultCard.style.display = 'none';
      return;
    }

    imagesList.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'img2pdf-card';

      // Current effective dimensions based on rotation
      const isRotated90 = (item.rotation % 180 !== 0);
      const curW = isRotated90 ? item.height : item.width;
      const curH = isRotated90 ? item.width : item.height;
      const orientationLabel = curW > curH ? 'Ngang' : 'Dọc';

      card.innerHTML = `
        <div class="img2pdf-card-header">
          <span class="img2pdf-page-num">Trang ${index + 1}</span>
          <span style="font-size: 10.5px; color: #64748b;">${orientationLabel}</span>
        </div>
        <div class="img2pdf-card-preview">
          <img class="img2pdf-card-thumb" src="${item.dataUrl}" alt="${escapeHtml(item.name)}" style="transform: rotate(${item.rotation}deg);" />
        </div>
        <div class="img2pdf-card-info">
          <span class="img2pdf-card-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          <span class="img2pdf-card-meta">${curW} × ${curH} px • ${formatBytes(item.size)}</span>
        </div>
        <div class="img2pdf-card-actions">
          <div style="display: flex; gap: 2px;">
            <button type="button" class="img2pdf-act-btn" data-act="rot-left" title="Quay 90° sang trái">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            </button>
            <button type="button" class="img2pdf-act-btn" data-act="rot-right" title="Quay 90° sang phải">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </button>
          </div>

          <div style="display: flex; gap: 2px;">
            <button type="button" class="img2pdf-act-btn" data-act="move-up" title="Đưa trang lên trước" ${index === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button type="button" class="img2pdf-act-btn" data-act="move-down" title="Đưa trang xuống sau" ${index === imagesList.length - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

          <button type="button" class="img2pdf-act-btn img2pdf-act-del" data-act="delete" title="Xóa ảnh này">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
          </button>
        </div>
      `;

      // Event handlers on card buttons
      const btnRotLeft = card.querySelector('[data-act="rot-left"]');
      const btnRotRight = card.querySelector('[data-act="rot-right"]');
      const btnMoveUp = card.querySelector('[data-act="move-up"]');
      const btnMoveDown = card.querySelector('[data-act="move-down"]');
      const btnDelete = card.querySelector('[data-act="delete"]');

      if (btnRotLeft) {
        btnRotLeft.addEventListener('click', () => {
          item.rotation = (item.rotation - 90 + 360) % 360;
          renderPagesGrid();
        });
      }

      if (btnRotRight) {
        btnRotRight.addEventListener('click', () => {
          item.rotation = (item.rotation + 90) % 360;
          renderPagesGrid();
        });
      }

      if (btnMoveUp && index > 0) {
        btnMoveUp.addEventListener('click', () => {
          const temp = imagesList[index];
          imagesList[index] = imagesList[index - 1];
          imagesList[index - 1] = temp;
          renderPagesGrid();
        });
      }

      if (btnMoveDown && index < imagesList.length - 1) {
        btnMoveDown.addEventListener('click', () => {
          const temp = imagesList[index];
          imagesList[index] = imagesList[index + 1];
          imagesList[index + 1] = temp;
          renderPagesGrid();
        });
      }

      if (btnDelete) {
        btnDelete.addEventListener('click', () => {
          imagesList = imagesList.filter(img => img.id !== item.id);
          renderPagesGrid();
          showToast(`Đã xóa ảnh "${item.name}" khỏi danh sách!`, 'info');
        });
      }

      cardsGrid.appendChild(card);
    });
  }

  // Clear all images
  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
      if (imagesList.length === 0) return;
      if (confirm('Bạn có chắc chắn muốn xóa toàn bộ ảnh đã chọn?')) {
        imagesList = [];
        renderPagesGrid();
        showToast('Đã xóa tất cả ảnh!', 'info');
      }
    });
  }

  // Convert to PDF
  if (btnConvert) {
    btnConvert.addEventListener('click', executeImageToPdfConversion);
  }

  async function executeImageToPdfConversion() {
    if (imagesList.length === 0 || isConverting) {
      showToast('Vui lòng chọn ít nhất một hình ảnh!', 'warning');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast('Thư viện tạo PDF chưa sẵn sàng!', 'error');
      return;
    }

    isConverting = true;
    resultCard.style.display = 'none';
    progressCard.style.display = 'flex';
    btnConvert.disabled = true;

    const pageSizeMode = pageSizeSelect.value || 'a4';
    const orientationMode = orientationSelect.value || 'auto';
    const marginMode = marginSelect.value || 'none';
    const qualityMode = qualitySelect.value || 'standard';

    let jpegQuality = 0.80;
    if (qualityMode === 'high') jpegQuality = 0.95;
    else if (qualityMode === 'compact') jpegQuality = 0.65;

    let marginPt = 0;
    if (marginMode === 'small') marginPt = 14.17;  // 5mm in points
    else if (marginMode === 'normal') marginPt = 28.35; // 10mm in points

    try {
      const { jsPDF } = window.jspdf;
      let doc = null;

      for (let i = 0; i < imagesList.length; i++) {
        const item = imagesList[i];
        progressTitle.textContent = `Đang chuyển đổi trang ${i + 1}/${imagesList.length}...`;
        progressStatus.textContent = item.name;
        await new Promise(r => setTimeout(r, 15));

        // Create rotated canvas if rotation !== 0
        const isRotated90 = (item.rotation % 180 !== 0);
        const rotW = isRotated90 ? item.height : item.width;
        const rotH = isRotated90 ? item.width : item.height;

        let processedDataUrl = item.dataUrl;

        // Draw rotated image onto canvas to get properly oriented raster data
        const offCanvas = document.createElement('canvas');
        offCanvas.width = rotW;
        offCanvas.height = rotH;
        const offCtx = offCanvas.getContext('2d');

        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, rotW, rotH);

        offCtx.save();
        offCtx.translate(rotW / 2, rotH / 2);
        offCtx.rotate((item.rotation * Math.PI) / 180);
        offCtx.drawImage(item.img, -item.width / 2, -item.height / 2);
        offCtx.restore();

        processedDataUrl = offCanvas.toDataURL('image/jpeg', jpegQuality);

        // Determine Page Dimensions in points (pt)
        let pageW, pageH, orient;

        if (pageSizeMode === 'fit') {
          pageW = rotW;
          pageH = rotH;
          orient = pageW > pageH ? 'landscape' : 'portrait';
        } else {
          // Standard base dimensions (portrait)
          const baseW = pageSizeMode === 'letter' ? 612 : 595.28;
          const baseH = pageSizeMode === 'letter' ? 792 : 841.89;

          if (orientationMode === 'auto') {
            orient = rotW > rotH ? 'landscape' : 'portrait';
          } else {
            orient = orientationMode;
          }

          if (orient === 'landscape') {
            pageW = Math.max(baseW, baseH);
            pageH = Math.min(baseW, baseH);
          } else {
            pageW = Math.min(baseW, baseH);
            pageH = Math.max(baseW, baseH);
          }
        }

        // Available area inside margins
        const availW = Math.max(10, pageW - marginPt * 2);
        const availH = Math.max(10, pageH - marginPt * 2);

        // Compute aspect fit
        const imgAspect = rotW / rotH;
        const availAspect = availW / availH;
        let drawW, drawH;

        if (imgAspect > availAspect) {
          drawW = availW;
          drawH = availW / imgAspect;
        } else {
          drawH = availH;
          drawW = availH * imgAspect;
        }

        const drawX = marginPt + (availW - drawW) / 2;
        const drawY = marginPt + (availH - drawH) / 2;

        if (i === 0) {
          doc = new jsPDF({
            orientation: orient,
            unit: 'pt',
            format: [pageW, pageH],
            compress: true
          });
        } else {
          doc.addPage([pageW, pageH], orient);
        }

        doc.addImage(processedDataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');
      }

      progressTitle.textContent = 'Đang đóng gói file PDF...';
      await new Promise(r => setTimeout(r, 40));

      const pdfBlob = doc.output('blob');
      finishImageToPdf(pdfBlob);
    } catch (err) {
      console.error('Lỗi khi chuyển đổi ảnh sang PDF:', err);
      showToast('Đã xảy ra lỗi: ' + err.message, 'error');
    } finally {
      isConverting = false;
      btnConvert.disabled = false;
      progressCard.style.display = 'none';
    }
  }

  function finishImageToPdf(blob) {
    convertedPdfBlob = blob;
    if (convertedPdfUrl) URL.revokeObjectURL(convertedPdfUrl);
    convertedPdfUrl = URL.createObjectURL(blob);

    resPages.textContent = `${imagesList.length} trang`;
    resSize.textContent = formatBytes(blob.size);

    resultCard.style.display = 'flex';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast(`Đã chuyển đổi thành công file PDF gồm ${imagesList.length} trang (${formatBytes(blob.size)})!`, 'success');
  }

  // Download PDF
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (!convertedPdfBlob) return;
      const firstName = imagesList[0]?.name ? imagesList[0].name.replace(/\.[^/.]+$/, '') : 'ho-so-tai-lieu';
      const fileName = `${firstName}-gop-${imagesList.length}-trang.pdf`;

      const link = document.createElement('a');
      link.href = convertedPdfUrl;
      link.download = fileName;
      link.click();
      showToast(`Đã tải về file PDF: ${fileName}`, 'success');
    });
  }

  // Preview PDF
  if (btnPreview) {
    btnPreview.addEventListener('click', () => {
      if (!convertedPdfUrl) return;
      window.open(convertedPdfUrl, '_blank');
    });
  }
}

/**
 * =========================================================================
 * MODULE: CÔNG THỨC & PHƯƠNG PHÁP TÍNH BỘ CHỈ SỐ 766
 * (Quyết định số 766/QĐ-TTg ngày 23/06/2022 của Thủ tướng Chính phủ)
 * =========================================================================
 */
function initFormulaDirectory() {
  const tabBtns = document.querySelectorAll('.formula-tab-btn[data-group]');
  const groupSections = document.querySelectorAll('.formula-group-section');
  const searchInput = document.getElementById('formula-search-input');
  const clearSearchBtn = document.getElementById('formula-search-clear');
  const emptyState = document.getElementById('formula-empty-state');

  // Segmented group tab filtering & keyword search
  let currentGroup = 'all';

  function applyFilters() {
    const term = (searchInput ? searchInput.value : '').trim().toLowerCase();
    let totalCardsVisible = 0;

    groupSections.forEach(section => {
      const sectionGroup = section.getAttribute('data-group');
      const matchesGroup = (currentGroup === 'all' || currentGroup === sectionGroup);

      if (!matchesGroup) {
        section.style.display = 'none';
        return;
      }

      const cards = section.querySelectorAll('.formula-card');
      let visibleInSec = 0;

      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const matchesSearch = !term || text.includes(term);

        if (matchesSearch) {
          card.style.display = '';
          visibleInSec++;
          totalCardsVisible++;
        } else {
          card.style.display = 'none';
        }
      });

      if (visibleInSec > 0) {
        section.style.display = '';
      } else {
        section.style.display = 'none';
      }
    });

    if (emptyState) {
      emptyState.style.display = (totalCardsVisible === 0) ? 'block' : 'none';
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGroup = btn.getAttribute('data-group') || 'all';
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
      }
      applyFilters();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyFilters();
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      applyFilters();
      searchInput.focus();
    });
  }

  window.resetFormulaSearch = function() {
    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    currentGroup = 'all';
    tabBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-group') === 'all');
    });
    applyFilters();
  };
}

/* ==========================================================================
   MODULE: XẾP HẠNG 766 CÁC TỈNH (BÁO CÁO LÃNH ĐẠO • XẾP HẠNG CÙNG CẤP)
   ========================================================================== */
const provincesState = {
  loaded: false,
  loading: false,
  data: null,
  filteredProvinces: []
};

async function loadProvincesData(force = false) {
  if (provincesState.loading) return;
  provincesState.loading = true;

  const spinner = document.getElementById('prov-refresh-spinner');
  if (spinner) spinner.classList.add('rotating');

  try {
    const url = force ? '/api/provinces?refresh=true' : '/api/provinces';
    const res = await fetch(url);
    const json = await res.json();
    if (json.success && json.data) {
      provincesState.data = json.data;
      provincesState.loaded = true;
      renderProvincesView(json.data);
      if (force) {
        showToast('Đã làm mới dữ liệu xếp hạng các tỉnh từ Cổng DVCQG!', 'success');
      }
    } else {
      throw new Error(json.error || 'Không tải được dữ liệu xếp hạng các tỉnh');
    }
  } catch (err) {
    console.error('[Provinces] Load error:', err);
    showToast('Lỗi khi tải bảng xếp hạng các tỉnh: ' + err.message, 'error');
  } finally {
    provincesState.loading = false;
    if (spinner) spinner.classList.remove('rotating');
  }
}

function renderProvincesView(data) {
  // 1. Cập nhật số lượng và thời gian cập nhật
  const totalCountEl = document.getElementById('prov-total-count');
  if (totalCountEl) totalCountEl.textContent = data.totalCount || 34;
  
  const updatedTimeEl = document.getElementById('prov-updated-time');
  if (updatedTimeEl) updatedTimeEl.textContent = data.updatedAtVN || 'Đang cập nhật';

  // 2. Cập nhật Thẻ vinh danh vị trí Đắk Lắk
  const dl = data.dakLak;
  if (dl) {
    const rankEl = document.getElementById('daklak-rank-num');
    if (rankEl) rankEl.textContent = dl.rank;

    const totalProvEl = document.getElementById('daklak-total-prov');
    if (totalProvEl) totalProvEl.textContent = data.totalCount;

    const scoreTotalEl = document.getElementById('daklak-score-total');
    if (scoreTotalEl) scoreTotalEl.textContent = (dl.totalScore || 0).toFixed(2);

    const setKpi = (scoreId, rankId, score, rank) => {
      const sEl = document.getElementById(scoreId);
      if (sEl) sEl.innerHTML = `${(score || 0).toFixed(2)} <small class="rank-tag">#${rank || '-'}</small>`;
    };

    setKpi('daklak-score-ckmb', 'daklak-rank-ckmb', dl.scores?.CKMB, dl.rank_CKMB);
    setKpi('daklak-score-tdgq', 'daklak-rank-tdgq', dl.scores?.TDGQ, dl.rank_TDGQ);
    setKpi('daklak-score-clgq', 'daklak-rank-clgq', dl.scores?.CLGQ, dl.rank_CLGQ);
    setKpi('daklak-score-mdsh', 'daklak-rank-mdsh', dl.scores?.MDSH, dl.rank_MDSH);
    setKpi('daklak-score-mdhl', 'daklak-rank-mdhl', dl.scores?.MDHL, dl.rank_MDHL);
    setKpi('daklak-score-tttt', 'daklak-rank-tttt', dl.scores?.TTTT, dl.rank_TTTT);
  }

  // 3. Render bảng
  provincesState.filteredProvinces = data.provinces || [];
  renderProvincesTable(provincesState.filteredProvinces);
}

function renderProvincesTable(list) {
  const tbody = document.getElementById('provinces-table-body');
  const emptyState = document.getElementById('provinces-empty-state');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!list || list.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  list.forEach(p => {
    const tr = document.createElement('tr');
    if (p.isDakLak) {
      tr.className = 'prov-row-daklak';
    }

    let sttHtml = p.rank;
    if (p.rank === 1) sttHtml = '<span class="prov-stt-badge prov-stt-1">1</span>';
    else if (p.rank === 2) sttHtml = '<span class="prov-stt-badge prov-stt-2">2</span>';
    else if (p.rank === 3) sttHtml = '<span class="prov-stt-badge prov-stt-3">3</span>';

    tr.innerHTML = `
      <td class="td-stt">${sttHtml}</td>
      <td class="td-name">${escapeHtml(p.departmentName)}</td>
      <td class="td-score">${(p.scores?.CKMB ?? 0).toFixed(2)}</td>
      <td class="td-rank">${p.rank_CKMB || '-'}</td>
      <td class="td-score">${(p.scores?.TDGQ ?? 0).toFixed(2)}</td>
      <td class="td-rank">${p.rank_TDGQ || '-'}</td>
      <td class="td-score">${(p.scores?.CLGQ ?? 0).toFixed(2)}</td>
      <td class="td-rank">${p.rank_CLGQ || '-'}</td>
      <td class="td-score">${(p.scores?.MDSH ?? 0).toFixed(2)}</td>
      <td class="td-rank">${p.rank_MDSH || '-'}</td>
      <td class="td-score">${(p.scores?.MDHL ?? 0).toFixed(2)}</td>
      <td class="td-rank">${p.rank_MDHL || '-'}</td>
      <td class="td-score">${(p.scores?.TTTT ?? 0).toFixed(2)}</td>
      <td class="td-rank">${p.rank_TTTT || '-'}</td>
      <td class="td-total">${(p.totalScore ?? 0).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function initProvincesTab() {
  const searchInput = document.getElementById('prov-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!provincesState.data || !provincesState.data.provinces) return;

      if (!q) {
        provincesState.filteredProvinces = provincesState.data.provinces;
      } else {
        provincesState.filteredProvinces = provincesState.data.provinces.filter(p =>
          (p.departmentName || '').toLowerCase().includes(q) ||
          (p.departmentCode || '').toLowerCase().includes(q)
        );
      }
      renderProvincesTable(provincesState.filteredProvinces);
    });
  }

  window.refreshProvincesData = function() {
    loadProvincesData(true);
  };

  window.exportProvincesToExcel = function() {
    if (!provincesState.data || !provincesState.data.provinces) {
      showToast('Chưa có dữ liệu để xuất Excel', 'warning');
      return;
    }
    exportProvincesTableExcel(provincesState.data);
  };
}

function exportProvincesTableExcel(data) {
  const table = document.getElementById('provinces-table');
  if (!table) return;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #999; padding: 6px 10px; }
        th { background-color: #d9e1f2; font-weight: bold; text-align: center; }
        .daklak { background-color: #38bdf8; font-weight: bold; }
        .num { text-align: right; }
        .center { text-align: center; }
      </style>
    </head>
    <body>
      <h2 style="text-align: center; color: #1e3a8a;">BÁO CÁO XẾP HẠNG ĐÁNH GIÁ CHẤT LƯỢNG PHỤC VỤ NĂM 2026 (BỘ CHỈ SỐ 766)</h2>
      <p style="text-align: center; font-style: italic; color: #555;">Nguồn: Cổng Dịch vụ công Quốc gia (dichvucong.gov.vn) - ${data.updatedAtVN || ''}</p>
      ${table.outerHTML}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Xep_hang_766_Cac_Tinh_${data.date || '2026'}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Đã tải xuống file Excel bảng xếp hạng các tỉnh!', 'success');
}

/* ==========================================================================
   AUTHENTICATION LOGIC & MODAL HANDLING
   ========================================================================== */

/**
 * Initialize Authentication
 */
function initAuth() {
  checkAuthStatus();

  // Close login modal when clicking outside
  if (dom.loginModal) {
    dom.loginModal.addEventListener('click', (e) => {
      if (e.target === dom.loginModal) {
        closeLoginModal();
      }
    });
  }
}

/**
 * Check if user is currently logged in
 */
function isLoggedIn() {
  return Boolean(appState.currentUser);
}
window.isLoggedIn = isLoggedIn;

/**
 * Check existing authentication token from localStorage
 */
async function checkAuthStatus() {
  const token = localStorage.getItem('dvc766_token');
  if (!token) {
    appState.currentUser = null;
    updateAuthUI();
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (data.success && data.authenticated && data.user) {
      appState.currentUser = data.user;
    } else {
      localStorage.removeItem('dvc766_token');
      appState.currentUser = null;
    }
  } catch (err) {
    console.warn('[Auth] Check session error:', err);
  }

  updateAuthUI();
}

/**
 * Update UI according to login state
 */
function updateAuthUI() {
  const user = appState.currentUser;
  const isAdmin = Boolean(user && user.role === 'admin');

  if (user) {
    document.body.classList.add('is-logged-in');
    // Show user profile, hide login button
    if (dom.btnLoginHeader) dom.btnLoginHeader.style.display = 'none';
    if (dom.userProfileHeader) {
      dom.userProfileHeader.style.display = 'inline-flex';
      if (dom.userDisplayName) dom.userDisplayName.textContent = user.name || user.username;
      if (dom.userRoleBadge) dom.userRoleBadge.textContent = isAdmin ? 'Quản trị viên' : 'Cán bộ';
      if (dom.userAvatarInitial) dom.userAvatarInitial.textContent = (user.name || user.username || 'U').charAt(0).toUpperCase();
    }
  } else {
    document.body.classList.remove('is-logged-in');
    // Show login button, hide user profile
    if (dom.btnLoginHeader) dom.btnLoginHeader.style.display = 'inline-flex';
    if (dom.userProfileHeader) dom.userProfileHeader.style.display = 'none';
  }

  // Quản lý hiển thị Menu Bóc tách hồ sơ (CHỈ DÀNH RIÊNG QUẢN TRỊ VIÊN)
  const navSplitItem = document.getElementById('nav-item-dossier-split');
  const splitAuthLock = document.getElementById('split-auth-lock-card');
  const splitWorkspace = document.getElementById('split-workspace-wrap');

  if (navSplitItem) {
    navSplitItem.style.display = isAdmin ? 'inline-block' : 'none';
  }
  if (splitAuthLock) {
    splitAuthLock.style.display = isAdmin ? 'none' : 'block';
  }
  if (splitWorkspace) {
    splitWorkspace.style.display = isAdmin ? 'block' : 'none';
  }

  // Nếu người dùng không phải Admin nhưng đang ở trên tab Bóc tách hồ sơ thì chuyển về tab Cổng thông tin
  if (!isAdmin) {
    const splitTabPane = document.getElementById('tab-content-dossier-split');
    if (splitTabPane && splitTabPane.classList.contains('active')) {
      const defaultTabBtn = document.getElementById('tab-btn-portals') || document.getElementById('tab-btn-766');
      if (defaultTabBtn) defaultTabBtn.click();
    }
  }

  // Re-render table if units exist, to toggle clickability of score cells
  if (appState.currentData && dom.unitsTableBody) {
    renderUnitsTable();
  }
}

/**
 * Open Login Modal
 */
window.openLoginModal = function (contextNotice = '') {
  const modal = dom.loginModal || document.getElementById('login-modal');
  if (!modal) {
    console.error('[Auth] #login-modal element not found!');
    return;
  }
  dom.loginModal = modal;

  const notice = dom.loginContextNotice || document.getElementById('login-context-notice');
  const noticeText = dom.loginContextText || document.getElementById('login-context-text');
  if (notice) {
    if (contextNotice) {
      if (noticeText) noticeText.textContent = contextNotice;
      notice.style.display = 'flex';
    } else {
      notice.style.display = 'none';
    }
  }

  const errAlert = dom.loginErrorAlert || document.getElementById('login-error-alert');
  if (errAlert) errAlert.style.display = 'none';
  modal.style.display = 'flex';

  setTimeout(() => {
    const userInp = dom.loginUsername || document.getElementById('login-username');
    if (userInp && !userInp.value) {
      userInp.focus();
    }
  }, 100);
};

/**
 * Close Login Modal
 */
window.closeLoginModal = function () {
  const modal = dom.loginModal || document.getElementById('login-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  const errAlert = dom.loginErrorAlert || document.getElementById('login-error-alert');
  if (errAlert) errAlert.style.display = 'none';
};

/**
 * Toggle password visibility
 */
window.togglePasswordVisibility = function () {
  const passInput = dom.loginPassword;
  const eyeShow = document.getElementById('eye-icon-show');
  const eyeHide = document.getElementById('eye-icon-hide');
  if (!passInput) return;

  if (passInput.type === 'password') {
    passInput.type = 'text';
    if (eyeShow) eyeShow.style.display = 'none';
    if (eyeHide) eyeHide.style.display = 'block';
  } else {
    passInput.type = 'password';
    if (eyeShow) eyeShow.style.display = 'block';
    if (eyeHide) eyeHide.style.display = 'none';
  }
};

/**
 * Quick fill credentials from hint chip
 */
window.fillQuickLogin = function (username, password) {
  if (dom.loginUsername) dom.loginUsername.value = username;
  if (dom.loginPassword) dom.loginPassword.value = password;
  if (dom.loginErrorAlert) dom.loginErrorAlert.style.display = 'none';
  if (dom.loginSubmitBtn) dom.loginSubmitBtn.focus();
};

/**
 * Handle Login Form Submit
 */
window.handleLoginFormSubmit = async function (e) {
  e.preventDefault();

  const username = dom.loginUsername?.value?.trim();
  const password = dom.loginPassword?.value;

  if (!username || !password) {
    showLoginError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
    return;
  }

  // Set loading state
  setLoginLoading(true);
  if (dom.loginErrorAlert) dom.loginErrorAlert.style.display = 'none';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showLoginError(data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      setLoginLoading(false);
      return;
    }

    // Success
    localStorage.setItem('dvc766_token', data.token);
    appState.currentUser = data.user;
    closeLoginModal();
    updateAuthUI();
    showToast(`Xin chào ${data.user.name || data.user.username}! Đăng nhập thành công.`, 'success');

    // Reset password field
    if (dom.loginPassword) dom.loginPassword.value = '';
  } catch (err) {
    console.error('[Auth] Login error:', err);
    showLoginError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  } finally {
    setLoginLoading(false);
  }
};

function showLoginError(msg) {
  if (dom.loginErrorAlert) {
    dom.loginErrorAlert.textContent = msg;
    dom.loginErrorAlert.style.display = 'block';
  }
}

function setLoginLoading(isLoading) {
  if (dom.loginSubmitBtn) dom.loginSubmitBtn.disabled = isLoading;
  if (dom.loginSubmitText) dom.loginSubmitText.style.display = isLoading ? 'none' : 'inline';
  if (dom.loginSubmitSpinner) dom.loginSubmitSpinner.style.display = isLoading ? 'inline-block' : 'none';
}

/**
 * Logout User
 */
window.logoutUser = async function () {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {}

  localStorage.removeItem('dvc766_token');
  appState.currentUser = null;
  updateAuthUI();
  showToast('Đã đăng xuất khỏi hệ thống.', 'info');
};

/**
 * Handle click on locked score cell
 */
window.handleLockedScoreClick = function (unitName) {
  openLoginModal(`Vui lòng đăng nhập để xem chi tiết các chỉ tiêu của đơn vị: ${unitName}.`);
};

/* ==========================================================================
   MODULE BÓC TÁCH HỒ SƠ TTHC THEO CỔNG TỈNH VÀ CÁC BỘ (CHỈ DÀNH CHO ADMIN)
   ========================================================================== */

function initDossierSplitModule() {
  const fileInput = document.getElementById('split-file-input');
  const dropzone = document.getElementById('split-dropzone');
  const dropzoneInner = document.getElementById('split-dropzone-inner');
  const fileSelectedBox = document.getElementById('split-file-selected-box');
  const btnBrowse = document.getElementById('btn-browse-split-file');
  const btnReselect = document.getElementById('btn-reselect-split-file');
  const configRow = document.getElementById('split-config-row');
  const sheetSelect = document.getElementById('split-sheet-select');
  const headerRowSelect = document.getElementById('split-header-row-select');
  const codeColSelect = document.getElementById('split-code-col-select');
  const btnProcess = document.getElementById('btn-process-split');
  const loadingBox = document.getElementById('split-loading-box');
  const loadingStatus = document.getElementById('split-loading-status');
  const resultSection = document.getElementById('split-result-section');
  const btnDownload = document.getElementById('btn-download-split-excel');

  if (!fileInput || !dropzone) return;

  // State nội bộ của module bóc tách
  let splitModuleState = {
    file: null,
    fileName: '',
    workbook: null,
    selectedWorksheet: null,
    detectedHeaderRow: 1,
    detectedCodeColIndex: 1,
    headers: [],
    headerValues: [],
    totalDossiers: 0,
    provinceCount: 0,
    ministryCount: 0,
    groups: {}
  };

  // Bảng tra cứu quy chuẩn Cổng Bộ theo 2 số đầu của dãy số thứ tự 6-7 số
  const MINISTRY_RULES = {
    '09': { name: 'Bộ Nội vụ', sheet: 'Bộ Nội vụ', color: '#1d4ed8', tag: 'BỘ NỘI VỤ' },
    '18': { name: 'Bộ Y Tế', sheet: 'Bộ Y Tế', color: '#059669', tag: 'BỘ Y TẾ' },
    '03': { name: 'Bộ Giáo dục và Đào tạo', sheet: 'Bộ GD&ĐT', color: '#d97706', tag: 'BỘ GD&ĐT' },
    '10': { name: 'Bộ Nông nghiệp và Môi trường', sheet: 'Bộ NN&MT', color: '#16a34a', tag: 'BỘ NN&MT' },
    '17': { name: 'Bộ Xây dựng', sheet: 'Bộ Xây dựng', color: '#ea580c', tag: 'BỘ XÂY DỰNG' },
    '02': { name: 'Bộ Công Thương', sheet: 'Bộ Công Thương', color: '#dc2626', tag: 'BỘ CÔNG THƯƠNG' },
    '06': { name: 'Bộ Khoa học và Công nghệ', sheet: 'Bộ KH&CN', color: '#0891b2', tag: 'BỘ KH&CN' },
    '15': { name: 'Bộ Tư Pháp', sheet: 'Bộ Tư Pháp', color: '#9333ea', tag: 'BỘ TƯ PHÁP' },
    '16': { name: 'Bộ Văn hóa, thể thao và du lịch', sheet: 'Bộ VHTTDL', color: '#db2777', tag: 'BỘ VHTTDL' }
  };

  function cellToString(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'number') return String(val);
    if (val instanceof Date) {
      const d = String(val.getDate()).padStart(2, '0');
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const y = val.getFullYear();
      return `${d}/${m}/${y}`;
    }
    if (typeof val === 'object') {
      if (val.result !== undefined && val.result !== null) return String(val.result).trim();
      if (val.text !== undefined && val.text !== null) return String(val.text).trim();
      if (Array.isArray(val.richText)) {
        return val.richText.map(t => t.text || '').join('').trim();
      }
    }
    return String(val).trim();
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Click mở chọn file
  if (btnBrowse) {
    btnBrowse.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }
  if (dropzone) {
    dropzone.addEventListener('click', () => {
      if (!splitModuleState.file) fileInput.click();
    });
  }
  if (btnReselect) {
    btnReselect.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      fileInput.click();
    });
  }

  // Kéo & thả file Excel
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  async function handleFileSelected(file) {
    const validExts = ['.xlsx', '.xls'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExts.some(ext => lowerName.endsWith(ext));
    if (!isValid) {
      showToast('Vui lòng chọn file Excel có định dạng .xlsx hoặc .xls', 'error');
      return;
    }

    if (!window.ExcelJS) {
      showToast('Thư viện xử lý Excel chưa sẵn sàng. Vui lòng tải lại trang.', 'error');
      return;
    }

    splitModuleState.file = file;
    splitModuleState.fileName = file.name;

    if (resultSection) resultSection.style.display = 'none';
    if (loadingBox) {
      loadingBox.style.display = 'block';
      if (loadingStatus) loadingStatus.textContent = `Đang phân tích cấu trúc file: ${file.name}...`;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new window.ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      splitModuleState.workbook = workbook;

      if (sheetSelect) {
        sheetSelect.innerHTML = '';
        workbook.worksheets.forEach((ws, idx) => {
          const opt = document.createElement('option');
          opt.value = String(idx);
          opt.textContent = `${ws.name} (${ws.rowCount} dòng)`;
          sheetSelect.appendChild(opt);
        });
      }

      const firstSheet = workbook.worksheets[0];
      splitModuleState.selectedWorksheet = firstSheet;

      analyzeSheetStructure(firstSheet);

      document.getElementById('split-file-name').textContent = file.name;
      document.getElementById('split-file-size').textContent = formatBytes(file.size);
      document.getElementById('split-file-sheets').textContent = `${workbook.worksheets.length} Sheet`;
      document.getElementById('split-file-rows').textContent = `${firstSheet.rowCount} dòng`;

      if (dropzoneInner) dropzoneInner.style.display = 'none';
      if (fileSelectedBox) fileSelectedBox.style.display = 'flex';
      if (configRow) configRow.style.display = 'flex';
      if (loadingBox) loadingBox.style.display = 'none';

      showToast(`Đã nạp file "${file.name}" thành công!`, 'success');
    } catch (err) {
      console.error('[DossierSplit] Lỗi đọc file:', err);
      if (loadingBox) loadingBox.style.display = 'none';
      showToast(`Không thể đọc file: ${err.message || 'Lỗi định dạng'}`, 'error');
    }
  }

  if (sheetSelect) {
    sheetSelect.addEventListener('change', () => {
      const sheetIdx = parseInt(sheetSelect.value, 10) || 0;
      const ws = splitModuleState.workbook.worksheets[sheetIdx];
      if (ws) {
        splitModuleState.selectedWorksheet = ws;
        document.getElementById('split-file-rows').textContent = `${ws.rowCount} dòng`;
        analyzeSheetStructure(ws);
      }
    });
  }

  function analyzeSheetStructure(worksheet) {
    if (!worksheet) return;

    let bestHeaderRow = 1;
    let bestCodeCol = 1;
    let highestHeaderScore = -1;

    const keywords = ['mã hồ sơ', 'số hồ sơ', 'mã số hồ sơ', 'mã đb', 'mã đồng bộ', 'số biên nhận', 'mã tiếp nhận', 'ma ho so', 'so ho so', 'sohoso', 'dossier'];

    const maxScanRow = Math.min(worksheet.rowCount, 15);
    for (let r = 1; r <= maxScanRow; r++) {
      const row = worksheet.getRow(r);
      let rowScore = 0;
      let nonBlankCols = 0;

      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        nonBlankCols++;
        const str = cellToString(cell.value).toLowerCase();
        for (const kw of keywords) {
          if (str.includes(kw)) {
            rowScore += 10;
            bestCodeCol = colNumber;
            break;
          }
        }
      });

      if (rowScore > highestHeaderScore && nonBlankCols >= 2) {
        highestHeaderScore = rowScore;
        bestHeaderRow = r;
      }
    }

    if (highestHeaderScore <= 0) {
      for (let r = 2; r <= Math.min(worksheet.rowCount, 30); r++) {
        const row = worksheet.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const val = cellToString(cell.value);
          if (/-\d{6}-\d+/.test(val)) {
            bestCodeCol = colNumber;
            bestHeaderRow = 1;
          }
        });
      }
    }

    splitModuleState.detectedHeaderRow = bestHeaderRow;
    splitModuleState.detectedCodeColIndex = bestCodeCol;

    if (headerRowSelect) {
      headerRowSelect.innerHTML = '';
      for (let r = 1; r <= Math.min(worksheet.rowCount, 10); r++) {
        const opt = document.createElement('option');
        opt.value = String(r);
        opt.textContent = `Dòng ${r} ${r === bestHeaderRow ? '(Khuyên dùng)' : ''}`;
        if (r === bestHeaderRow) opt.selected = true;
        headerRowSelect.appendChild(opt);
      }
    }

    populateCodeColSelect(worksheet, bestHeaderRow, bestCodeCol);
  }

  function populateCodeColSelect(worksheet, headerRowIndex, selectedColIndex) {
    if (!codeColSelect || !worksheet) return;
    codeColSelect.innerHTML = '';

    const headerRow = worksheet.getRow(headerRowIndex);
    const colCount = Math.max(headerRow.cellCount, worksheet.columnCount || 10);
    const headers = [];

    for (let c = 1; c <= colCount; c++) {
      const cell = headerRow.getCell(c);
      let colName = cellToString(cell.value);
      if (!colName) colName = `Cột ${c}`;
      headers[c] = colName;

      const opt = document.createElement('option');
      opt.value = String(c);
      opt.textContent = `Cột ${c}: ${colName} ${c === selectedColIndex ? '★ (Khớp mã)' : ''}`;
      if (c === selectedColIndex) opt.selected = true;
      codeColSelect.appendChild(opt);
    }

    splitModuleState.headers = headers;
  }

  if (headerRowSelect) {
    headerRowSelect.addEventListener('change', () => {
      const r = parseInt(headerRowSelect.value, 10) || 1;
      splitModuleState.detectedHeaderRow = r;
      populateCodeColSelect(splitModuleState.selectedWorksheet, r, splitModuleState.detectedCodeColIndex);
    });
  }

  if (btnProcess) {
    btnProcess.addEventListener('click', () => {
      startDossierSplitting();
    });
  }

  function classifyCode(codeStr) {
    if (!codeStr || typeof codeStr !== 'string') {
      return {
        key: 'UNKNOWN',
        name: 'Chưa xác định',
        sheet: 'Chưa xác định',
        tag: 'CHƯA XÁC ĐỊNH',
        color: '#64748b',
        seq: '',
        isProvince: false
      };
    }

    const clean = codeStr.trim();
    const parts = clean.split('-');

    if (parts.length >= 3) {
      const seq = parts[parts.length - 1].trim();
      // 4 chữ số: Cổng Tỉnh
      if (/^\d{4}$/.test(seq)) {
        return {
          key: 'PROVINCE',
          name: 'Cổng Tỉnh',
          sheet: 'Cổng Tỉnh',
          tag: 'CỔNG TỈNH',
          color: '#059669',
          seq,
          isProvince: true
        };
      }
      // 6 hoặc 7 chữ số: Cổng Bộ
      if (/^\d{6,7}$/.test(seq)) {
        const prefix = seq.slice(0, 2);
        const ministry = MINISTRY_RULES[prefix];
        if (ministry) {
          return {
            key: `MINISTRY_${prefix}`,
            name: ministry.name,
            sheet: ministry.sheet,
            tag: ministry.tag,
            color: ministry.color,
            prefix,
            seq,
            isProvince: false
          };
        }
        return {
          key: `MINISTRY_${prefix}`,
          name: `Bộ khác (Mã ${prefix})`,
          sheet: `Bộ khác ${prefix}`,
          tag: `BỘ KHÁC (${prefix})`,
          color: '#475569',
          prefix,
          seq,
          isProvince: false
        };
      }
    }

    // Fallback: Tìm pattern -yymmdd-xxxx
    const match = clean.match(/-\d{6}-(\d{4,7})/);
    if (match) {
      const seq = match[1];
      if (seq.length === 4) {
        return {
          key: 'PROVINCE',
          name: 'Cổng Tỉnh',
          sheet: 'Cổng Tỉnh',
          tag: 'CỔNG TỈNH',
          color: '#059669',
          seq,
          isProvince: true
        };
      } else {
        const prefix = seq.slice(0, 2);
        const ministry = MINISTRY_RULES[prefix];
        if (ministry) {
          return {
            key: `MINISTRY_${prefix}`,
            name: ministry.name,
            sheet: ministry.sheet,
            tag: ministry.tag,
            color: ministry.color,
            prefix,
            seq,
            isProvince: false
          };
        }
        return {
          key: `MINISTRY_${prefix}`,
          name: `Bộ khác (Mã ${prefix})`,
          sheet: `Bộ khác ${prefix}`,
          tag: `BỘ KHÁC (${prefix})`,
          color: '#475569',
          prefix,
          seq,
          isProvince: false
        };
      }
    }

    return {
      key: 'UNKNOWN',
      name: 'Chưa xác định',
      sheet: 'Chưa xác định',
      tag: 'CHƯA XÁC ĐỊNH',
      color: '#64748b',
      seq: '',
      isProvince: false
    };
  }

  function startDossierSplitting() {
    const ws = splitModuleState.selectedWorksheet;
    if (!ws) {
      showToast('Chưa có dữ liệu sheet để bóc tách!', 'error');
      return;
    }

    const headerRowIdx = parseInt(headerRowSelect?.value, 10) || splitModuleState.detectedHeaderRow || 1;
    const codeColIdx = parseInt(codeColSelect?.value, 10) || splitModuleState.detectedCodeColIndex || 1;

    if (loadingBox) {
      loadingBox.style.display = 'block';
      if (loadingStatus) loadingStatus.textContent = 'Đang bóc tách từng dòng hồ sơ theo Cổng Tỉnh và các Bộ...';
    }
    if (resultSection) resultSection.style.display = 'none';

    setTimeout(() => {
      try {
        const headerRow = ws.getRow(headerRowIdx);
        const maxCol = Math.max(headerRow.cellCount, ws.columnCount || 1);

        const headerValues = [];
        for (let c = 1; c <= maxCol; c++) {
          headerValues.push(cellToString(headerRow.getCell(c).value) || `Cột ${c}`);
        }

        const groups = {};
        let totalDossiers = 0;
        let provinceCount = 0;
        let ministryCount = 0;

        for (let r = headerRowIdx + 1; r <= ws.rowCount; r++) {
          const row = ws.getRow(r);
          let hasContent = false;
          const rowValues = [];
          for (let c = 1; c <= maxCol; c++) {
            const cellVal = row.getCell(c).value;
            const strVal = cellToString(cellVal);
            if (strVal) hasContent = true;
            rowValues.push(strVal);
          }

          if (!hasContent) continue;

          totalDossiers++;
          const codeVal = cellToString(row.getCell(codeColIdx).value);
          const classification = classifyCode(codeVal);

          if (classification.isProvince) {
            provinceCount++;
          } else if (classification.key.startsWith('MINISTRY_')) {
            ministryCount++;
          }

          if (!groups[classification.key]) {
            groups[classification.key] = {
              key: classification.key,
              name: classification.name,
              sheetName: classification.sheet,
              tag: classification.tag,
              color: classification.color,
              isProvince: classification.isProvince,
              prefix: classification.prefix || '',
              rows: []
            };
          }

          groups[classification.key].rows.push({
            rowNumber: r,
            code: codeVal,
            values: rowValues
          });
        }

        splitModuleState.groups = groups;
        splitModuleState.headerValues = headerValues;
        splitModuleState.totalDossiers = totalDossiers;
        splitModuleState.provinceCount = provinceCount;
        splitModuleState.ministryCount = ministryCount;

        renderSplitResults(groups, totalDossiers, provinceCount, ministryCount, headerValues);

        if (loadingBox) loadingBox.style.display = 'none';
        if (resultSection) {
          resultSection.style.display = 'block';
          resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        showToast(`Đã bóc tách thành công ${totalDossiers.toLocaleString()} hồ sơ vào ${Object.keys(groups).length} nhóm!`, 'success');
      } catch (err) {
        console.error('[DossierSplit] Lỗi bóc tách hồ sơ:', err);
        if (loadingBox) loadingBox.style.display = 'none';
        showToast(`Lỗi khi bóc tách hồ sơ: ${err.message}`, 'error');
      }
    }, 60);
  }

  function renderSplitResults(groups, total, provinceCount, ministryCount, headers) {
    document.getElementById('split-summary-title').textContent = `Đã phân loại thành công ${total.toLocaleString()} hồ sơ`;
    document.getElementById('split-stat-total').textContent = total.toLocaleString();
    document.getElementById('split-stat-province').textContent = provinceCount.toLocaleString();
    document.getElementById('split-stat-ministry').textContent = ministryCount.toLocaleString();

    const groupKeys = Object.keys(groups);
    const totalSheets = 1 + groupKeys.length;
    document.getElementById('split-stat-sheets').textContent = `${totalSheets} Sheet`;

    const gridEl = document.getElementById('split-groups-grid');
    if (gridEl) {
      gridEl.innerHTML = '';
      const sortedKeys = [...groupKeys].sort((a, b) => {
        if (a === 'PROVINCE') return -1;
        if (b === 'PROVINCE') return 1;
        return groups[b].rows.length - groups[a].rows.length;
      });

      sortedKeys.forEach(k => {
        const g = groups[k];
        const count = g.rows.length;
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

        const card = document.createElement('div');
        card.className = 'split-group-card';
        card.innerHTML = `
          <div class="split-group-info">
            <span class="split-group-tag" style="background: ${g.color}15; color: ${g.color}; border: 1px solid ${g.color}35;">
              ${g.tag || g.sheetName}
            </span>
            <h5 class="split-group-name" title="${g.name}">${g.name}</h5>
            <small style="color: #64748b; font-size: 11px;">Sheet: <strong>${g.sheetName}</strong></small>
          </div>
          <div class="split-group-stats">
            <div class="split-group-count" style="color: ${g.color};">${count.toLocaleString()}</div>
            <div class="split-group-pct">${pct}% tổng số</div>
          </div>
        `;
        gridEl.appendChild(card);
      });
    }

    const tabsEl = document.getElementById('split-preview-tabs');
    if (tabsEl) {
      tabsEl.innerHTML = '';
      const sortedKeys = [...groupKeys].sort((a, b) => {
        if (a === 'PROVINCE') return -1;
        if (b === 'PROVINCE') return 1;
        return groups[b].rows.length - groups[a].rows.length;
      });

      sortedKeys.forEach((k, idx) => {
        const g = groups[k];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `split-preview-tab-btn ${idx === 0 ? 'active' : ''}`;
        btn.textContent = `${g.sheetName} (${g.rows.length})`;
        btn.addEventListener('click', () => {
          tabsEl.querySelectorAll('.split-preview-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderPreviewTable(g, headers);
        });
        tabsEl.appendChild(btn);
      });

      if (sortedKeys.length > 0) {
        renderPreviewTable(groups[sortedKeys[0]], headers);
      }
    }
  }

  function renderPreviewTable(group, headers) {
    const thead = document.getElementById('split-preview-thead');
    const tbody = document.getElementById('split-preview-tbody');
    if (!thead || !tbody) return;

    thead.innerHTML = '';
    tbody.innerHTML = '';

    const trHead = document.createElement('tr');
    const thStt = document.createElement('th');
    thStt.textContent = 'STT';
    thStt.style.width = '50px';
    thStt.style.textAlign = 'center';
    trHead.appendChild(thStt);

    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    const previewRows = group.rows.slice(0, 20);
    previewRows.forEach((r, idx) => {
      const tr = document.createElement('tr');
      const tdStt = document.createElement('td');
      tdStt.textContent = String(idx + 1);
      tdStt.style.textAlign = 'center';
      tdStt.style.color = '#64748b';
      tr.appendChild(tdStt);

      r.values.forEach(val => {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    if (group.rows.length > 20) {
      const trMore = document.createElement('tr');
      const tdMore = document.createElement('td');
      tdMore.colSpan = headers.length + 1;
      tdMore.style.textAlign = 'center';
      tdMore.style.padding = '12px';
      tdMore.style.color = '#64748b';
      tdMore.style.fontStyle = 'italic';
      tdMore.textContent = `... và còn ${(group.rows.length - 20).toLocaleString()} hồ sơ nữa trong Sheet "${group.sheetName}" khi tải về.`;
      trMore.appendChild(tdMore);
      tbody.appendChild(trMore);
    }
  }

  if (btnDownload) {
    btnDownload.addEventListener('click', async () => {
      await generateAndDownloadSplitExcel();
    });
  }

  async function generateAndDownloadSplitExcel() {
    const groups = splitModuleState.groups;
    const headers = splitModuleState.headerValues;
    const total = splitModuleState.totalDossiers;

    if (!groups || Object.keys(groups).length === 0) {
      showToast('Chưa có dữ liệu đã bóc tách để xuất file!', 'error');
      return;
    }

    btnDownload.disabled = true;
    const originalBtnText = btnDownload.innerHTML;
    btnDownload.innerHTML = `
      <div class="split-spinner" style="width: 18px; height: 18px; border-width: 2px; margin: 0 8px 0 0; display: inline-block; vertical-align: middle;"></div>
      <span>Đang tạo file Excel đa sheet...</span>
    `;

    try {
      const outWb = new window.ExcelJS.Workbook();
      outWb.creator = 'Hệ thống Hỗ trợ DVC Tỉnh Đắk Lắk (Mã H15)';
      outWb.created = new Date();

      // ==========================================
      // SHEET 1: TỔNG HỢP THỐNG KÊ
      // ==========================================
      const wsSummary = outWb.addWorksheet('Tổng hợp thống kê', {
        views: [{ showGridLines: true }]
      });

      wsSummary.mergeCells('A1:G1');
      const titleCell = wsSummary.getCell('A1');
      titleCell.value = 'BÁO CÁO PHÂN LOẠI HỒ SƠ TTHC THEO CỔNG TỈNH VÀ CÁC BỘ';
      titleCell.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' }
      };
      wsSummary.getRow(1).height = 36;

      const nowStr = new Date().toLocaleString('vi-VN');
      wsSummary.mergeCells('A2:G2');
      const subCell = wsSummary.getCell('A2');
      subCell.value = `File gốc: ${splitModuleState.fileName} | Thời điểm trích xuất: ${nowStr} | Tổng số: ${total.toLocaleString()} hồ sơ`;
      subCell.font = { name: 'Times New Roman', size: 10, italic: true };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      wsSummary.getRow(2).height = 22;

      wsSummary.addRow([]);

      const sumHeaderRow = wsSummary.addRow([
        'STT',
        'Tên nhóm phân loại',
        'Cổng tiếp nhận / Cơ quan',
        'Quy cách nhận diện',
        'Số lượng hồ sơ',
        'Tỷ lệ (%)',
        'Tên Sheet dữ liệu'
      ]);
      sumHeaderRow.height = 26;
      sumHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a === 'PROVINCE') return -1;
        if (b === 'PROVINCE') return 1;
        return groups[b].rows.length - groups[a].rows.length;
      });

      let stt = 1;
      sortedKeys.forEach(k => {
        const g = groups[k];
        const count = g.rows.length;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const ruleText = g.isProvince ? 'Số thứ tự 4 chữ số' : (g.prefix ? `Mã tiền tố ${g.prefix}xxxx (6-7 số)` : 'Khác');

        const row = wsSummary.addRow([
          stt++,
          g.name,
          g.isProvince ? 'Cổng DVC Tỉnh Đắk Lắk' : 'Cổng Bộ - Ngành liên thông',
          ruleText,
          count,
          Number(pct.toFixed(2)),
          g.sheetName
        ]);
        row.height = 22;

        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(5).numFmt = '#,##0';
        row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(6).numFmt = '0.00"%"';
        row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };

        row.eachCell(cell => {
          cell.font = { name: 'Times New Roman', size: 11 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        });
      });

      const totalRow = wsSummary.addRow([
        '',
        'TỔNG CỘNG',
        '',
        '',
        total,
        100.0,
        `${sortedKeys.length} sheet`
      ]);
      totalRow.height = 24;
      totalRow.eachCell(cell => {
        cell.font = { name: 'Times New Roman', size: 11, bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' }
        };
        cell.border = {
          top: { style: 'medium' },
          bottom: { style: 'double' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      totalRow.getCell(5).numFmt = '#,##0';
      totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      totalRow.getCell(6).numFmt = '0.00"%"';
      totalRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };

      wsSummary.columns = [
        { width: 8 },
        { width: 32 },
        { width: 28 },
        { width: 26 },
        { width: 16 },
        { width: 14 },
        { width: 22 }
      ];

      // ==========================================
      // CÁC SHEET DỮ LIỆU RIÊNG TỪNG BỘ VÀ CỔNG TỈNH
      // ==========================================
      sortedKeys.forEach(k => {
        const g = groups[k];
        let safeSheetName = g.sheetName.replace(/[\\/*?[\]:]/g, '_').slice(0, 31);
        let finalSheetName = safeSheetName;
        let counter = 1;
        while (outWb.getWorksheet(finalSheetName)) {
          finalSheetName = `${safeSheetName.slice(0, 28)}_${counter++}`;
        }

        const ws = outWb.addWorksheet(finalSheetName, {
          views: [{ showGridLines: true }]
        });

        // Banner đầu sheet
        ws.mergeCells(1, 1, 1, headers.length + 1);
        const wsTitleCell = ws.getCell(1, 1);
        wsTitleCell.value = `DANH SÁCH HỒ SƠ: ${g.name.toUpperCase()} (TỔNG SỐ: ${g.rows.length.toLocaleString()} HỒ SƠ)`;
        wsTitleCell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        wsTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        wsTitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: g.isProvince ? 'FF059669' : 'FF1E3A8A' }
        };
        ws.getRow(1).height = 30;

        const headerRowArr = ['STT', ...headers];
        const hRow = ws.addRow(headerRowArr);
        hRow.height = 24;
        hRow.eachCell((cell, colNum) => {
          cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { horizontal: colNum === 1 ? 'center' : 'left', vertical: 'middle' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: g.isProvince ? 'FF10B981' : 'FF2563EB' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        g.rows.forEach((r, rowIdx) => {
          const dataRowArr = [rowIdx + 1, ...r.values];
          const dRow = ws.addRow(dataRowArr);
          dRow.height = 20;

          dRow.eachCell((cell, colNum) => {
            cell.font = { name: 'Times New Roman', size: 11 };
            cell.alignment = { horizontal: colNum === 1 ? 'center' : 'left', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
          });
        });

        ws.columns.forEach((col, idx) => {
          if (idx === 0) {
            col.width = 8;
          } else {
            let maxLen = 12;
            const headerStr = headers[idx - 1] || '';
            if (headerStr.length > maxLen) maxLen = headerStr.length;
            col.width = Math.min(Math.max(maxLen + 4, 14), 45);
          }
        });
      });

      const buffer = await outWb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const baseName = splitModuleState.fileName.replace(/\.[^/.]+$/, '');
      const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const downloadName = `${baseName}_DaBocTach_${dateTag}.xlsx`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Đã xuất và tải file "${downloadName}" thành công!`, 'success');
    } catch (err) {
      console.error('[DossierSplit] Lỗi xuất file Excel:', err);
      showToast(`Lỗi khi tạo file Excel: ${err.message}`, 'error');
    } finally {
      btnDownload.disabled = false;
      btnDownload.innerHTML = originalBtnText;
    }
  }
}

/* ==========================================================================
   MODULE: TẠO MÃ QR THỦ TỤC HÀNH CHÍNH (TTHC)
   ========================================================================== */

function initProcedureQrModule() {
  const fileInput = document.getElementById('qr-file-input');
  const dropzone = document.getElementById('qr-dropzone');
  const dropzoneInner = document.getElementById('qr-dropzone-inner');
  const fileSelectedBox = document.getElementById('qr-file-selected-box');
  const fileNameDisplay = document.getElementById('qr-file-name-display');
  const fileSizeDisplay = document.getElementById('qr-file-size-display');
  const fileSheetCountDisplay = document.getElementById('qr-file-sheet-count-display');
  const btnBrowse = document.getElementById('btn-browse-qr-file');
  const btnLoadSample = document.getElementById('btn-load-sample-qr-file');
  const btnReselect = document.getElementById('btn-reselect-qr-file');
  const configCard = document.getElementById('qr-config-card');
  const sheetSelect = document.getElementById('qr-sheet-select');
  const headerRowSelect = document.getElementById('qr-header-row-select');
  const codeColSelect = document.getElementById('qr-code-col-select');
  const targetColDisplay = document.getElementById('qr-target-col-display');
  const btnProcess = document.getElementById('btn-process-qr');
  const progressCard = document.getElementById('qr-progress-card');
  const progressTitle = document.getElementById('qr-progress-title');
  const progressDesc = document.getElementById('qr-progress-desc');
  const progressBarFill = document.getElementById('qr-progress-bar-fill');
  const progressCount = document.getElementById('qr-progress-count');
  const progressPercent = document.getElementById('qr-progress-percent');
  const resultSection = document.getElementById('qr-result-section');
  const btnDownload = document.getElementById('btn-download-qr-excel');
  const summaryText = document.getElementById('qr-result-summary-text');
  const statTotalRows = document.getElementById('qr-stat-total-rows');
  const statSuccessQrs = document.getElementById('qr-stat-success-qrs');
  const statColName = document.getElementById('qr-stat-col-name');
  const previewTbody = document.getElementById('qr-preview-tbody');
  const previewCountBadge = document.getElementById('qr-preview-count-badge');

  if (!fileInput || !dropzone) return;

  // State nội bộ của module tạo mã QR
  let qrModuleState = {
    file: null,
    fileName: '',
    arrayBuffer: null,
    workbook: null,
    sheetNames: [],
    selectedSheetName: '',
    headerRow: 1,
    codeColIndex: 2, // Mặc định Cột B
    maxColIndex: 1,
    generatedItems: [],
    processedWorkbookBuffer: null,
    downloadFileName: ''
  };

  let cachedDakLakLogo = null;

  function getDakLakLogo() {
    return new Promise((resolve) => {
      if (cachedDakLakLogo && cachedDakLakLogo.complete) {
        return resolve(cachedDakLakLogo);
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        cachedDakLakLogo = img;
        resolve(img);
      };
      img.onerror = (e) => {
        console.warn('[QR] Không thể tải icon-qr.png, tạo QR không có logo:', e);
        resolve(null);
      };
      img.src = 'icon-qr.png';
    });
  }

  function cellToString(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'number') return String(val);
    if (val instanceof Date) {
      const d = String(val.getDate()).padStart(2, '0');
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const y = val.getFullYear();
      return `${d}/${m}/${y}`;
    }
    if (typeof val === 'object') {
      if (val.result !== undefined && val.result !== null) return String(val.result).trim();
      if (val.text !== undefined && val.text !== null) return String(val.text).trim();
      if (Array.isArray(val.richText)) {
        return val.richText.map(t => t.text || '').join('').trim();
      }
    }
    return String(val).trim();
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function colNumberToName(num) {
    let s = '';
    while (num > 0) {
      let m = (num - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      num = Math.floor((num - m) / 26);
    }
    return s || 'A';
  }

  function buildProcedureUrl(code) {
    return `https://dichvucong.gov.vn/tra-cuu-thu-tuc/danh-sach?keyword=${encodeURIComponent(code)}&showAdvanced=false&formalityType=STANDARD&limit=10&activeKey=STANDARD`;
  }

  // Tạo mã QR bằng QRCode.toCanvas + vẽ logo Đắk Lắk ở giữa
  async function generateQrWithLogo(code, logoImg) {
    const targetUrl = buildProcedureUrl(code);
    const canvas = document.createElement('canvas');
    
    // Sử dụng Error Correction Level H (30%) để đảm bảo quét tốt ngay cả khi có logo
    await QRCode.toCanvas(canvas, targetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 360,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    if (logoImg) {
      const ctx = canvas.getContext('2d');
      const qrSize = canvas.width;
      // Logo chiếm ~22% kích thước QR
      const logoSize = Math.round(qrSize * 0.22);
      const x = (qrSize - logoSize) / 2;
      const y = (qrSize - logoSize) / 2;
      const padding = 5;
      const bgSize = logoSize + padding * 2;
      const bgX = (qrSize - bgSize) / 2;
      const bgY = (qrSize - bgSize) / 2;

      ctx.save();
      // Khối nền bo tròn màu trắng bảo vệ logo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(bgX, bgY, bgSize, bgSize, 10);
      } else {
        ctx.rect(bgX, bgY, bgSize, bgSize);
      }
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Vẽ logo Đắk Lắk
      ctx.drawImage(logoImg, x, y, logoSize, logoSize);
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL('image/png');
    const base64Pure = dataUrl.split(',')[1];
    return { targetUrl, dataUrl, base64Pure };
  }

  // Thiết lập sự kiện kéo thả (Drag & Drop)
  if (dropzoneInner) {
    dropzoneInner.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(evt => {
      dropzoneInner.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneInner.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzoneInner.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneInner.classList.remove('dragover');
      });
    });

    dropzoneInner.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0]);
      }
    });
  }

  if (btnBrowse) {
    btnBrowse.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (btnLoadSample) {
    btnLoadSample.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        showToast('Đang tải dữ liệu mẫu thử nghiệm (5 TTHC)...', 'info');
        const resp = await fetch('test-tthc-sample.xlsx');
        if (!resp.ok) throw new Error('Không thể tải file mẫu');
        const blob = await resp.blob();
        const sampleFile = new File([blob], 'danh-sach-tthc-mau.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        await handleFileSelection(sampleFile);
      } catch (err) {
        console.error('[QR] Lỗi tải file mẫu:', err);
        showToast('Lỗi khi tải file mẫu thử nghiệm: ' + err.message, 'error');
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  if (btnReselect) {
    btnReselect.addEventListener('click', () => {
      resetQrModuleState();
    });
  }

  function resetQrModuleState() {
    fileInput.value = '';
    qrModuleState.file = null;
    qrModuleState.fileName = '';
    qrModuleState.arrayBuffer = null;
    qrModuleState.workbook = null;
    qrModuleState.generatedItems = [];
    qrModuleState.processedWorkbookBuffer = null;

    if (fileSelectedBox) fileSelectedBox.style.display = 'none';
    if (dropzoneInner) dropzoneInner.style.display = 'block';
    if (configCard) configCard.style.display = 'none';
    if (progressCard) progressCard.style.display = 'none';
    if (resultSection) resultSection.style.display = 'none';
  }

  async function handleFileSelection(file) {
    const validExtensions = ['.xlsx', '.xls'];
    const isExcel = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isExcel) {
      showToast('Vui lòng chọn file định dạng Excel (.xlsx hoặc .xls)', 'error');
      return;
    }

    try {
      showToast('Đang phân tích cấu trúc file Excel...', 'info');
      qrModuleState.file = file;
      qrModuleState.fileName = file.name;
      
      const buffer = await file.arrayBuffer();
      qrModuleState.arrayBuffer = buffer;

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      qrModuleState.workbook = wb;

      qrModuleState.sheetNames = wb.worksheets.map(ws => ws.name);
      if (qrModuleState.sheetNames.length === 0) {
        showToast('File Excel không chứa bất kỳ Sheet dữ liệu nào!', 'error');
        return;
      }

      // Cập nhật UI thông tin file đã chọn
      if (fileNameDisplay) fileNameDisplay.textContent = file.name;
      if (fileSizeDisplay) fileSizeDisplay.textContent = formatBytes(file.size);
      if (fileSheetCountDisplay) fileSheetCountDisplay.textContent = `${qrModuleState.sheetNames.length} Sheet`;

      if (dropzoneInner) dropzoneInner.style.display = 'none';
      if (fileSelectedBox) fileSelectedBox.style.display = 'flex';

      // Nạp danh sách Sheet vào select
      sheetSelect.innerHTML = '';
      qrModuleState.sheetNames.forEach((name, idx) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = `${idx + 1}. ${name}`;
        sheetSelect.appendChild(opt);
      });
      qrModuleState.selectedSheetName = qrModuleState.sheetNames[0];

      // Phân tích và nạp cấu hình cột
      updateSheetAnalysis();

      if (configCard) configCard.style.display = 'block';
      if (resultSection) resultSection.style.display = 'none';
      if (progressCard) progressCard.style.display = 'none';

      showToast(`Đã nhận diện file: ${file.name}`, 'success');
    } catch (err) {
      console.error('[QR Module] Lỗi đọc file Excel:', err);
      showToast(`Không thể đọc file Excel: ${err.message}`, 'error');
      resetQrModuleState();
    }
  }

  // Khi người dùng đổi Sheet hoặc Dòng tiêu đề
  if (sheetSelect) {
    sheetSelect.addEventListener('change', () => {
      qrModuleState.selectedSheetName = sheetSelect.value;
      updateSheetAnalysis();
    });
  }

  if (headerRowSelect) {
    headerRowSelect.addEventListener('change', () => {
      qrModuleState.headerRow = parseInt(headerRowSelect.value, 10) || 1;
      updateSheetAnalysis();
    });
  }

  function updateSheetAnalysis() {
    if (!qrModuleState.workbook) return;
    const ws = qrModuleState.workbook.getWorksheet(qrModuleState.selectedSheetName);
    if (!ws) return;

    const headerRowNum = parseInt(headerRowSelect.value, 10) || 1;
    qrModuleState.headerRow = headerRowNum;

    // Tìm cột lớn nhất có dữ liệu
    let maxCol = ws.actualColumnCount || ws.columnCount || 1;
    const headerRow = ws.getRow(headerRowNum);
    headerRow.eachCell((cell, colNumber) => {
      if (colNumber > maxCol) maxCol = colNumber;
    });
    if (maxCol < 2) maxCol = 2;
    qrModuleState.maxColIndex = maxCol;

    // Quét các cột để tìm cột Mã TTHC và Tên TTHC
    codeColSelect.innerHTML = '';
    let autoDetectedCodeCol = 2; // Mặc định Cột B

    // Thu thập tên cột và kiểm tra mẫu mã thủ tục (ví dụ: "2.000206", "1.000123")
    const sampleRows = [headerRowNum + 1, headerRowNum + 2, headerRowNum + 3, headerRowNum + 4];
    
    for (let c = 1; c <= maxCol; c++) {
      const colLetter = colNumberToName(c);
      const headerVal = cellToString(headerRow.getCell(c).value);
      const opt = document.createElement('option');
      opt.value = c;

      let isCandidate = false;
      // Kiểm tra tên tiêu đề
      if (/mã|ma\s*tthc|thủ\s*tục|thu\s*tuc/i.test(headerVal)) {
        isCandidate = true;
      }
      // Kiểm tra mẫu mã trong các dòng dữ liệu mẫu
      for (const rNum of sampleRows) {
        if (rNum <= ws.rowCount) {
          const sampleVal = cellToString(ws.getRow(rNum).getCell(c).value);
          if (/^\d+\.\d+$/.test(sampleVal)) {
            isCandidate = true;
            autoDetectedCodeCol = c;
            break;
          }
        }
      }

      let label = `Cột ${colLetter}`;
      if (headerVal) {
        label += `: ${headerVal.substring(0, 35)}`;
      } else {
        label += ' (Không có tiêu đề)';
      }
      if (c === 2) {
        label += ' - [Khuyến nghị: Cột B]';
      } else if (isCandidate && c !== 2) {
        label += ' - [Phát hiện mã TTHC]';
      }

      opt.textContent = label;
      codeColSelect.appendChild(opt);
    }

    // Ưu tiên chọn Cột B (index 2) hoặc cột được phát hiện
    if (autoDetectedCodeCol && autoDetectedCodeCol <= maxCol) {
      codeColSelect.value = autoDetectedCodeCol;
      qrModuleState.codeColIndex = autoDetectedCodeCol;
    } else {
      codeColSelect.value = 2;
      qrModuleState.codeColIndex = 2;
    }

    // Cập nhật hiển thị cột đích chèn mã QR
    const targetColLetter = colNumberToName(maxCol + 1);
    if (targetColDisplay) {
      targetColDisplay.value = `Cột ${targetColLetter} (Cột cuối bảng, Tự động thêm cột "MÃ QR TRA CỨU")`;
    }
  }

  if (codeColSelect) {
    codeColSelect.addEventListener('change', () => {
      qrModuleState.codeColIndex = parseInt(codeColSelect.value, 10) || 2;
    });
  }

  // Thực hiện tạo mã QR & đính vào Excel
  if (btnProcess) {
    btnProcess.addEventListener('click', async () => {
      await processGenerateAndEmbedQr();
    });
  }

  async function processGenerateAndEmbedQr() {
    if (!qrModuleState.arrayBuffer) {
      showToast('Vui lòng tải lên file danh sách TTHC trước!', 'error');
      return;
    }

    const headerRowNum = parseInt(headerRowSelect.value, 10) || 1;
    const codeColNum = parseInt(codeColSelect.value, 10) || 2;
    const sheetName = qrModuleState.selectedSheetName;

    btnProcess.disabled = true;
    if (progressCard) progressCard.style.display = 'block';
    if (resultSection) resultSection.style.display = 'none';

    try {
      progressTitle.textContent = 'Đang chuẩn bị logo & nạp dữ liệu...';
      progressDesc.textContent = 'Đang tải hình ảnh biểu trưng tỉnh Đắk Lắk...';
      progressBarFill.style.width = '5%';
      progressPercent.textContent = '5%';

      const logoImg = await getDakLakLogo();

      // Nạp lại workbook mới từ buffer gốc để không bị lặp đè
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(qrModuleState.arrayBuffer);
      const ws = wb.getWorksheet(sheetName);

      if (!ws) {
        throw new Error(`Không tìm thấy Sheet "${sheetName}" trong file.`);
      }

      // Xác định cột cuối cùng để đính mã QR
      let maxCol = ws.actualColumnCount || ws.columnCount || 1;
      const hRow = ws.getRow(headerRowNum);
      hRow.eachCell((cell, colNumber) => {
        if (colNumber > maxCol) maxCol = colNumber;
      });
      const targetColIndex = maxCol + 1;
      const targetColLetter = colNumberToName(targetColIndex);

      // Thêm tiêu đề cột mới
      const headerCell = ws.getCell(headerRowNum, targetColIndex);
      headerCell.value = 'MÃ QR TRA CỨU';
      headerCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Arial' };
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0284C7' } // Sky-600
      };
      headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerCell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };

      // Đặt độ rộng chuẩn cho cột mã QR
      ws.getColumn(targetColIndex).width = 18;

      // Tìm cột tên TTHC (nếu có) để hiển thị trong preview
      let nameColIndex = null;
      for (let c = 1; c <= maxCol; c++) {
        const hVal = cellToString(hRow.getCell(c).value);
        if (/tên\s*thủ\s*tục|ten\s*thu\s*tuc|tên\s*tthc/i.test(hVal)) {
          nameColIndex = c;
          break;
        }
      }
      if (!nameColIndex && maxCol >= 3 && codeColNum === 2) {
        nameColIndex = 3; // Cột C thường là Tên TTHC
      }

      // Thu thập các dòng hợp lệ cần xử lý
      const rowsToProcess = [];
      const totalSheetRows = ws.rowCount;

      for (let r = headerRowNum + 1; r <= totalSheetRows; r++) {
        const row = ws.getRow(r);
        const codeVal = cellToString(row.getCell(codeColNum).value);
        
        // Bỏ qua dòng trống hoặc dòng tiêu đề lặp
        if (!codeVal || codeVal.toLowerCase() === 'mã tthc' || codeVal.toLowerCase() === 'mã thủ tục') {
          continue;
        }

        let nameVal = '';
        if (nameColIndex) {
          nameVal = cellToString(row.getCell(nameColIndex).value);
        }

        rowsToProcess.push({
          rowNumber: r,
          code: codeVal,
          name: nameVal
        });
      }

      const totalItems = rowsToProcess.length;
      if (totalItems === 0) {
        throw new Error(`Không tìm thấy mã thủ tục nào tại Cột ${colNumberToName(codeColNum)} (từ dòng ${headerRowNum + 1} trở đi).`);
      }

      progressTitle.textContent = `Đang tạo mã QR cho ${totalItems} thủ tục...`;
      qrModuleState.generatedItems = [];

      let successCount = 0;

      for (let i = 0; i < totalItems; i++) {
        const item = rowsToProcess[i];
        const pct = Math.round(((i + 1) / totalItems) * 85) + 10;
        
        progressBarFill.style.width = `${pct}%`;
        progressPercent.textContent = `${pct}%`;
        progressCount.textContent = `${i + 1} / ${totalItems} thủ tục`;
        progressDesc.textContent = `Đang tạo mã QR cho thủ tục: "${item.code}"...`;

        try {
          const { targetUrl, dataUrl, base64Pure } = await generateQrWithLogo(item.code, logoImg);

          // Thêm ảnh vào workbook
          const imageId = wb.addImage({
            base64: base64Pure,
            extension: 'png'
          });

          // Đính ảnh vào ô của dòng tương ứng
          ws.addImage(imageId, {
            tl: { col: targetColIndex - 1 + 0.08, row: item.rowNumber - 1 + 0.08 },
            br: { col: targetColIndex - 0.08, row: item.rowNumber - 0.08 },
            editAs: 'oneCell'
          });

          // Đặt độ cao dòng thành 75pt để mã QR hiển thị vuông vắn, sắc nét
          ws.getRow(item.rowNumber).height = 75;

          const cell = ws.getCell(item.rowNumber, targetColIndex);
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          qrModuleState.generatedItems.push({
            rowNumber: item.rowNumber,
            code: item.code,
            name: item.name,
            targetUrl: targetUrl,
            dataUrl: dataUrl
          });

          successCount++;
        } catch (itemErr) {
          console.warn(`[QR] Lỗi khi tạo mã cho dòng ${item.rowNumber} (${item.code}):`, itemErr);
        }

        // Cứ mỗi 5 dòng nhường CPU một chút để trình duyệt cập nhật giao diện
        if (i % 5 === 0) {
          await new Promise(res => setTimeout(res, 0));
        }
      }

      progressTitle.textContent = 'Đang đóng gói file Excel kèm mã QR...';
      progressDesc.textContent = 'Hệ thống đang xuất tệp tin .xlsx hoàn chỉnh...';
      progressBarFill.style.width = '98%';
      progressPercent.textContent = '98%';

      const outBuffer = await wb.xlsx.writeBuffer();
      qrModuleState.processedWorkbookBuffer = outBuffer;

      // Đặt tên file tải về
      const baseName = qrModuleState.fileName.replace(/\.[^/.]+$/, '');
      qrModuleState.downloadFileName = `${baseName}_kem_ma_QR.xlsx`;

      progressBarFill.style.width = '100%';
      progressPercent.textContent = '100%';

      // Cập nhật thống kê và bảng preview
      if (statTotalRows) statTotalRows.textContent = totalItems.toLocaleString('vi-VN');
      if (statSuccessQrs) statSuccessQrs.textContent = successCount.toLocaleString('vi-VN');
      if (statColName) statColName.textContent = `Cột ${targetColLetter} (Cột ${targetColIndex})`;
      if (summaryText) {
        summaryText.textContent = `Đã tạo thành công ${successCount}/${totalItems} mã QR tra cứu TTHC kèm logo tỉnh và đính vào Cột ${targetColLetter}.`;
      }

      renderPreviewTable(qrModuleState.generatedItems);

      if (progressCard) progressCard.style.display = 'none';
      if (resultSection) {
        resultSection.style.display = 'flex';
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      showToast(`Hoàn tất tạo ${successCount} mã QR TTHC và đính vào file Excel!`, 'success');
    } catch (err) {
      console.error('[QR Module] Lỗi quá trình tạo mã QR:', err);
      showToast(`Lỗi: ${err.message}`, 'error');
      if (progressCard) progressCard.style.display = 'none';
    } finally {
      btnProcess.disabled = false;
    }
  }

  function renderPreviewTable(items) {
    if (!previewTbody) return;
    previewTbody.innerHTML = '';

    if (!items || items.length === 0) {
      previewTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: #64748b;">Không có dữ liệu mã QR để hiển thị</td></tr>';
      return;
    }

    if (previewCountBadge) {
      previewCountBadge.textContent = `${items.length} thủ tục`;
    }

    // Hiển thị tối đa 100 thủ tục trong preview để tối ưu hiệu năng DOM
    const displayLimit = Math.min(items.length, 100);

    for (let idx = 0; idx < displayLimit; idx++) {
      const item = items[idx];
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td style="text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
        <td>
          <span class="qr-code-pill">${escapeHtml(item.code)}</span>
        </td>
        <td>
          <div style="font-weight: 600; color: #0f172a; line-height: 1.4;">${escapeHtml(item.name || 'Thủ tục hành chính ' + item.code)}</div>
        </td>
        <td>
          <a href="${item.targetUrl}" target="_blank" rel="noopener noreferrer" class="qr-link-btn" title="${item.targetUrl}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Tra cứu DVC Quốc gia
          </a>
        </td>
        <td class="qr-thumb-cell">
          <img src="${item.dataUrl}" alt="QR ${item.code}" class="qr-thumb-img" title="Click hoặc di chuột để phóng to" />
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-outline-secondary btn-sm qr-btn-dl-single" data-code="${escapeHtml(item.code)}" data-src="${item.dataUrl}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Tải PNG
          </button>
        </td>
      `;

      previewTbody.appendChild(tr);
    }

    // Gắn sự kiện tải ảnh lẻ
    previewTbody.querySelectorAll('.qr-btn-dl-single').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const code = btn.getAttribute('data-code');
        const src = btn.getAttribute('data-src');
        downloadSingleQrImage(code, src);
      });
    });
  }

  function downloadSingleQrImage(code, dataUrl) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Đã tải ảnh mã QR cho thủ tục ${code}`, 'success');
  }

  // Tải file Excel kèm mã QR
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (!qrModuleState.processedWorkbookBuffer) {
        showToast('Chưa có file Excel hoàn chỉnh để tải về!', 'error');
        return;
      }

      try {
        const blob = new Blob([qrModuleState.processedWorkbookBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = qrModuleState.downloadFileName || 'danh-sach-tthc-kem-ma-QR.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`Đã tải xuống file "${qrModuleState.downloadFileName}"!`, 'success');
      } catch (err) {
        console.error('[QR Module] Lỗi tải file Excel:', err);
        showToast(`Không thể tải file: ${err.message}`, 'error');
      }
    });
  }
}





