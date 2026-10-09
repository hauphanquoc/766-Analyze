/**
 * Module phân tích và giải mã cấu trúc Số hồ sơ TTHC
 * Cấu trúc: {Mã định danh đơn vị}-{yymmdd}-{Số thứ tự trong ngày}
 * Ví dụ: H15.50.05.13-261008-0975
 */

const MINISTRY_PREFIX_MAP = {
  '09': 'Bộ Nội vụ',
  '18': 'Bộ Y Tế',
  '03': 'Bộ Giáo dục và Đào tạo',
  '10': 'Bộ Nông nghiệp và Môi trường',
  '17': 'Bộ Xây dựng',
  '02': 'Bộ Xây dựng',
  '06': 'Bộ Khoa học và Công nghệ',
  '15': 'Bộ Tư Pháp',
  '16': 'Bộ Văn hóa, thể thao và du lịch'
};

/**
 * Phân tích mã số hồ sơ TTHC
 * @param {string} dossierCode - Mã số hồ sơ (ví dụ: H15.50.05.13-261008-0975)
 * @returns {object|null} Kết quả phân tích chi tiết
 */
function parseDossierCode(dossierCode) {
  if (!dossierCode || typeof dossierCode !== 'string') return null;

  const parts = dossierCode.trim().split('-');
  if (parts.length < 3) return null;

  const unitCode = parts.slice(0, parts.length - 2).join('-');
  const dateStr = parts[parts.length - 2];
  const seqStr = parts[parts.length - 1];

  // Parse ngày (yymmdd)
  let dateFormatted = null;
  if (/^\d{6}$/.test(dateStr)) {
    const yy = dateStr.slice(0, 2);
    const mm = dateStr.slice(2, 4);
    const dd = dateStr.slice(4, 6);
    dateFormatted = `20${yy}-${mm}-${dd}`;
  }

  // Parse số thứ tự
  const seqLength = seqStr.length;
  const isDigits = /^\d+$/.test(seqStr);
  let portalType = 'UNKNOWN';
  let ministryName = null;
  let ministryCode = null;

  if (isDigits) {
    if (seqLength === 4) {
      portalType = 'PROVINCE'; // Cổng tỉnh
    } else if (seqLength === 6 || seqLength === 7) {
      portalType = 'MINISTRY'; // Cổng bộ
      const prefix2 = seqStr.slice(0, 2);
      ministryCode = prefix2;
      ministryName = MINISTRY_PREFIX_MAP[prefix2] || 'Bộ chưa xác định';
    }
  }

  return {
    raw: dossierCode,
    unitCode,
    dateStr,
    dateFormatted,
    sequence: seqStr,
    portalType, // 'PROVINCE' | 'MINISTRY' | 'UNKNOWN'
    portalTypeLabel: portalType === 'PROVINCE' ? 'Cổng Tỉnh' : (portalType === 'MINISTRY' ? 'Cổng Bộ' : 'Chưa xác định'),
    ministryCode,
    ministryName
  };
}

module.exports = {
  MINISTRY_PREFIX_MAP,
  parseDossierCode
};
