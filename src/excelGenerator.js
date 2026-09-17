const ExcelJS = require('exceljs');

/**
 * Generate a beautifully styled Excel workbook from analyzed 766 data
 */
async function generateWorkbook(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Hệ thống Đánh giá Bộ chỉ số 766 - DVCQG';
  workbook.created = new Date();

  // Colors
  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' } // Deep Navy Blue
  };
  const subHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' } // Royal Blue
  };
  const totalFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' } // Amber Light
  };

  const headerFont = {
    name: 'Arial',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  // ==========================================
  // SHEET 1: TỔNG QUAN BỘ CHỈ SỐ 766
  // ==========================================
  const wsOverview = workbook.addWorksheet('1. Tổng quan Bộ Chỉ số 766');
  wsOverview.views = [{ showGridLines: true }];

  // Title block
  wsOverview.mergeCells('A1:F1');
  wsOverview.getCell('A1').value = 'BÁO CÁO KẾT QUẢ ĐÁNH GIÁ CHẤT LƯỢNG PHỤC VỤ (QUYẾT ĐỊNH 766/QĐ-TTg)';
  wsOverview.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  wsOverview.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  wsOverview.getRow(1).height = 30;

  wsOverview.mergeCells('A2:F2');
  wsOverview.getCell('A2').value = `Đơn vị: ${data.department?.name || 'UBND tỉnh Đắk Lắk'} (Mã: ${data.department?.code || 'H15'}) - Ngày báo cáo: ${data.date}`;
  wsOverview.getCell('A2').font = { name: 'Arial', size: 11, italic: true };
  wsOverview.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
  wsOverview.getRow(2).height = 20;

  // KPI Summary box
  wsOverview.getCell('A4').value = 'TỔNG ĐIỂM ĐẠT ĐƯỢC:';
  wsOverview.getCell('A4').font = { bold: true };
  wsOverview.getCell('B4').value = `${data.overview.totalScore} / 100 điểm`;
  wsOverview.getCell('B4').font = { bold: true, size: 14, color: { argb: 'FF047857' } };

  wsOverview.getCell('D4').value = 'XẾP LOẠI:';
  wsOverview.getCell('D4').font = { bold: true };
  wsOverview.getCell('E4').value = data.overview.classification?.label || 'Chưa xếp loại';
  wsOverview.getCell('E4').font = { bold: true, size: 14, color: { argb: 'FF1D4ED8' } };

  // Indicator table headers
  const headers1 = ['STT', 'Nhóm Chỉ số Đánh giá', 'Điểm Đạt được', 'Điểm Tối đa', 'Tỷ lệ Hoàn thành (%)', 'Trạng thái'];
  const row6 = wsOverview.getRow(6);
  row6.height = 25;
  headers1.forEach((h, i) => {
    const cell = row6.getCell(i + 1);
    cell.value = h;
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : 'center' };
    cell.border = thinBorder;
  });

  // Table rows
  const indKeys = Object.keys(data.indicators);
  let currentRow = 7;
  indKeys.forEach((k, idx) => {
    const ind = data.indicators[k];
    const r = wsOverview.getRow(currentRow);
    r.height = 22;

    r.getCell(1).value = idx + 1;
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(2).value = ind.name;
    r.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    r.getCell(3).value = ind.score;
    r.getCell(3).numFmt = '#,##0.00';
    r.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    r.getCell(4).value = ind.maxScore;
    r.getCell(4).numFmt = '#,##0.00';
    r.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    r.getCell(5).value = ind.ratio / 100;
    r.getCell(5).numFmt = '0.00%';
    r.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    r.getCell(6).value = ind.status === 'OK' ? 'Đã thu thập' : 'Lỗi kết nối';
    r.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

    for (let c = 1; c <= 6; c++) {
      r.getCell(c).border = thinBorder;
    }
    currentRow++;
  });

  // Total row
  const rTotal = wsOverview.getRow(currentRow);
  rTotal.height = 25;
  rTotal.getCell(1).value = '';
  rTotal.getCell(2).value = 'TỔNG CỘNG TOÀN TỈNH';
  rTotal.getCell(2).font = { bold: true };
  rTotal.getCell(3).value = data.overview.totalScore;
  rTotal.getCell(3).numFmt = '#,##0.00';
  rTotal.getCell(3).font = { bold: true };
  rTotal.getCell(4).value = data.overview.maxScore;
  rTotal.getCell(4).numFmt = '#,##0.00';
  rTotal.getCell(4).font = { bold: true };
  rTotal.getCell(5).value = data.overview.ratio / 100;
  rTotal.getCell(5).numFmt = '0.00%';
  rTotal.getCell(5).font = { bold: true };
  rTotal.getCell(6).value = data.overview.classification?.label;
  rTotal.getCell(6).font = { bold: true };

  for (let c = 1; c <= 6; c++) {
    rTotal.getCell(c).fill = totalFill;
    rTotal.getCell(c).border = thinBorder;
  }

  wsOverview.columns = [
    { width: 8 },
    { width: 35 },
    { width: 18 },
    { width: 16 },
    { width: 22 },
    { width: 18 }
  ];

  // ==========================================
  // SHEET 2: CHI TIẾT CÁC TIÊU CHÍ THÀNH PHẦN
  // ==========================================
  const wsDetail = workbook.addWorksheet('2. Chi tiết Tiêu chí Thành phần');
  wsDetail.views = [{ showGridLines: true }];

  wsDetail.mergeCells('A1:G1');
  wsDetail.getCell('A1').value = 'BẢNG KÊ CHI TIẾT TỪNG TIÊU CHÍ THÀNH PHẦN (QUYẾT ĐỊNH 766)';
  wsDetail.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1E3A8A' } };
  wsDetail.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  wsDetail.getRow(1).height = 28;

  const headers2 = ['STT', 'Nhóm Chỉ số', 'Tên Tiêu chí Thành phần', 'Tử số', 'Mẫu số', 'Tỷ lệ (%)', 'Điểm Đạt / Tối đa'];
  const row3 = wsDetail.getRow(3);
  row3.height = 25;
  headers2.forEach((h, i) => {
    const cell = row3.getCell(i + 1);
    cell.value = h;
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  let detailRow = 4;
  let metricIndex = 1;
  for (const indKey of indKeys) {
    const ind = data.indicators[indKey];
    if (ind.metrics && ind.metrics.length > 0) {
      for (const m of ind.metrics) {
        const r = wsDetail.getRow(detailRow);
        r.height = 20;
        r.getCell(1).value = metricIndex++;
        r.getCell(1).alignment = { horizontal: 'center' };
        r.getCell(2).value = ind.shortName;
        r.getCell(3).value = m.name;
        r.getCell(4).value = m.numerator ?? m.value ?? '-';
        r.getCell(5).value = m.denominator ?? '-';
        r.getCell(6).value = m.ratio != null ? `${m.ratio}%` : '-';
        r.getCell(6).alignment = { horizontal: 'right' };
        r.getCell(7).value = `${m.score ?? '-'} / ${m.maxScore ?? '-'}`;
        r.getCell(7).alignment = { horizontal: 'right' };

        for (let c = 1; c <= 7; c++) r.getCell(c).border = thinBorder;
        detailRow++;
      }
    }
  }

  wsDetail.columns = [
    { width: 8 },
    { width: 25 },
    { width: 45 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 20 }
  ];

  // ==========================================
  // SHEET 3: XẾP HẠNG ĐƠN VỊ TRỰC THUỘC (119 ĐƠN VỊ)
  // ==========================================
  const wsUnits = workbook.addWorksheet('3. Xếp hạng 119 Đơn vị');
  wsUnits.views = [{ showGridLines: true }];

  wsUnits.mergeCells('A1:L1');
  wsUnits.getCell('A1').value = 'BẢNG XẾP HẠNG CHẤT LƯỢNG PHỤC VỤ CÁC ĐƠN VỊ TRỰC THUỘC TỈNH ĐẮK LẮK';
  wsUnits.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1E3A8A' } };
  wsUnits.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  wsUnits.getRow(1).height = 28;

  const headers3 = [
    'Hạng',
    'Tên Đơn vị, Cơ quan',
    'Cấp Đơn vị',
    'Mã Đơn vị',
    'Công khai (18đ)',
    'Tiến độ (20đ)',
    'DVC TT (12đ)',
    'Số hóa (22đ)',
    'Thanh toán (10đ)',
    'Hài lòng (18đ)',
    'TỔNG ĐIỂM (100đ)',
    'Xếp loại'
  ];

  const rowUnitHeaders = wsUnits.getRow(3);
  rowUnitHeaders.height = 25;
  headers3.forEach((h, i) => {
    const cell = rowUnitHeaders.getCell(i + 1);
    cell.value = h;
    cell.fill = subHeaderFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  let unitRowIdx = 4;
  (data.units || []).forEach((u) => {
    const r = wsUnits.getRow(unitRowIdx);
    r.height = 20;

    r.getCell(1).value = u.rank;
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(2).value = u.departmentName;
    r.getCell(3).value = u.levelLabel;
    r.getCell(4).value = u.departmentCode || '-';
    r.getCell(4).alignment = { horizontal: 'center' };

    r.getCell(5).value = u.scores?.transparency ?? 0;
    r.getCell(5).numFmt = '0.00';
    r.getCell(6).value = u.scores?.progress ?? 0;
    r.getCell(6).numFmt = '0.00';
    r.getCell(7).value = u.scores?.onlineService ?? 0;
    r.getCell(7).numFmt = '0.00';
    r.getCell(8).value = u.scores?.digitized ?? 0;
    r.getCell(8).numFmt = '0.00';
    r.getCell(9).value = u.scores?.payment ?? 0;
    r.getCell(9).numFmt = '0.00';
    r.getCell(10).value = u.scores?.satisfaction ?? 0;
    r.getCell(10).numFmt = '0.00';

    r.getCell(11).value = u.totalScore;
    r.getCell(11).numFmt = '0.00';
    r.getCell(11).font = { bold: true };
    r.getCell(11).alignment = { horizontal: 'right' };

    r.getCell(12).value = u.classification?.label || '-';
    r.getCell(12).alignment = { horizontal: 'center' };

    for (let c = 1; c <= 12; c++) {
      r.getCell(c).border = thinBorder;
    }
    unitRowIdx++;
  });

  wsUnits.columns = [
    { width: 8 },
    { width: 40 },
    { width: 22 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 16 }
  ];

  return workbook;
}

module.exports = {
  generateWorkbook
};
