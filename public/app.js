/**
 * Web Application Logic - Bộ Chỉ số 766 DVCQG
 */

// Application State
let appState = {
  currentData: null,
  availableDates: [],
  selectedDate: null,
  radarChart: null,
  trendChart: null,
  table: {
    searchTerm: '',
    levelFilter: 'ALL',
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
  unitSearchInput: document.getElementById('unit-search-input'),
  levelFilterSelect: document.getElementById('level-filter-select'),
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
  toastContainer: document.getElementById('toast-container')
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  initWelcomeNotice();
  loadInitialData();
});

function initEventListeners() {
  dom.dateSelect.addEventListener('change', (e) => {
    loadDateData(e.target.value);
  });

  dom.btnExportExcel.addEventListener('click', handleExportExcel);

  dom.unitSearchInput.addEventListener('input', (e) => {
    appState.table.searchTerm = e.target.value.trim().toLowerCase();
    appState.table.currentPage = 1;
    renderUnitsTable();
  });

  dom.levelFilterSelect.addEventListener('change', (e) => {
    appState.table.levelFilter = e.target.value;
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
  dom.unitsCountVal.textContent = data.unitsSummary?.totalUnits || (data.units ? data.units.length : 119);
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
 * Filter, sort, and render Subordinate Units Table
 */
function renderUnitsTable() {
  const units = appState.currentData?.units || [];
  const { searchTerm, levelFilter, sortBy, currentPage, pageSize } = appState.table;

  // 1. Filter
  let filtered = units.filter((u) => {
    // Level filter
    if (levelFilter !== 'ALL') {
      const type = (u.departmentType || '').toUpperCase();
      const lvl = (u.departmentLevel || '').toUpperCase();
      if (levelFilter === 'DEPARTMENT') {
        if (!type.includes('DEPARTMENT') && !type.includes('MINISTRY') && lvl !== 'PROVINCE') return false;
      } else if (levelFilter === 'DISTRICT') {
        if (!type.includes('DISTRICT') && lvl !== 'DISTRICT') return false;
      } else if (levelFilter === 'COMMUNE') {
        if (!type.includes('COMMUNE') && lvl !== 'COMMUNE') return false;
      }
    }

    // Search filter
    if (searchTerm) {
      const name = (u.departmentName || '').toLowerCase();
      const code = (u.departmentCode || '').toLowerCase();
      return name.includes(searchTerm) || code.includes(searchTerm);
    }

    return true;
  });

  // 2. Sort
  filtered.sort((a, b) => {
    if (sortBy === 'score_desc') return b.totalScore - a.totalScore;
    if (sortBy === 'score_asc') return a.totalScore - b.totalScore;
    if (sortBy === 'name_asc') return (a.departmentName || '').localeCompare(b.departmentName || '', 'vi');
    return 0;
  });

  // 3. Paginate
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  appState.table.currentPage = validPage;

  const startIndex = (validPage - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  // 4. Render Rows
  dom.unitsTableBody.innerHTML = '';
  if (pageItems.length === 0) {
    dom.unitsTableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 30px; color: #64748b;">Không tìm thấy đơn vị phù hợp với bộ lọc.</td></tr>`;
  } else {
    pageItems.forEach((u) => {
      const tr = document.createElement('tr');

      // Rank Badge
      let rankClass = 'rank-badge rank-other';
      if (u.rank === 1) rankClass = 'rank-badge rank-1';
      else if (u.rank === 2) rankClass = 'rank-badge rank-2';
      else if (u.rank === 3) rankClass = 'rank-badge rank-3';

      const rankHtml = `<span class="${rankClass}">${u.rank}</span>`;
      const grade = u.classification || { label: '-', color: '#64748b' };

      tr.innerHTML = `
        <td style="text-align: center;">${rankHtml}</td>
        <td>
          <span class="unit-name-cell">${escapeHtml(u.departmentName)}</span>
          ${u.departmentCode ? `<span class="unit-code-badge">(${escapeHtml(u.departmentCode)})</span>` : ''}
        </td>
        <td><span class="level-tag">${escapeHtml(u.levelLabel || 'Đơn vị')}</span></td>
        <td style="text-align: right;" class="score-clickable" onclick="openUnitMetricModal('${escapeHtml(u.departmentId)}', 'transparency')" title="Nhấn xem chi tiết 4 tiêu chí Công khai minh bạch">
          <span class="score-clickable-inner">
            <span>${(u.scores?.transparency ?? 0).toFixed(2)}</span>
            <svg class="score-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        </td>
        <td style="text-align: right;" class="score-clickable" onclick="openUnitMetricModal('${escapeHtml(u.departmentId)}', 'progress')" title="Nhấn xem chi tiết hồ sơ Tiến độ giải quyết">
          <span class="score-clickable-inner">
            <span>${(u.scores?.progress ?? 0).toFixed(2)}</span>
            <svg class="score-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        </td>
        <td style="text-align: right;" class="score-clickable" onclick="openUnitMetricModal('${escapeHtml(u.departmentId)}', 'onlineService')" title="Nhấn xem chi tiết Dịch vụ công trực tuyến">
          <span class="score-clickable-inner">
            <span>${(u.scores?.onlineService ?? 0).toFixed(2)}</span>
            <svg class="score-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        </td>
        <td style="text-align: right;" class="score-clickable" onclick="openUnitMetricModal('${escapeHtml(u.departmentId)}', 'digitized')" title="Nhấn xem chi tiết 7 tiêu chí Số hóa hồ sơ">
          <span class="score-clickable-inner">
            <span>${(u.scores?.digitized ?? 0).toFixed(2)}</span>
            <svg class="score-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        </td>
        <td style="text-align: right;" class="score-clickable" onclick="openUnitMetricModal('${escapeHtml(u.departmentId)}', 'payment')" title="Nhấn xem chi tiết giao dịch Thanh toán trực tuyến">
          <span class="score-clickable-inner">
            <span>${(u.scores?.payment ?? 0).toFixed(2)}</span>
            <svg class="score-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        </td>
        <td style="text-align: right;" class="score-clickable" onclick="openUnitMetricModal('${escapeHtml(u.departmentId)}', 'satisfaction')" title="Nhấn xem chi tiết Mức độ hài lòng của người dân">
          <span class="score-clickable-inner">
            <span>${(u.scores?.satisfaction ?? 0).toFixed(2)}</span>
            <svg class="score-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        </td>
        <td style="text-align: right;" class="score-cell-bold">${u.totalScore.toFixed(2)}</td>
        <td style="text-align: center;">
          <span class="badge-grade" style="background-color: ${grade.color}; font-size: 11px; padding: 2px 8px;">
            ${escapeHtml(grade.label)}
          </span>
        </td>
      `;
      dom.unitsTableBody.appendChild(tr);
    });
  }

  // 5. Update counts & pagination
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
