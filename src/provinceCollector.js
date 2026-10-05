/**
 * Module thu thập và xếp hạng Bộ chỉ số 766 của tất cả các tỉnh/thành phố trên cả nước
 * Nguồn: Cổng Dịch vụ công Quốc gia (dichvucong.gov.vn)
 */

const API_URL = 'https://dichvucong.gov.vn/api/v1/reporting/evaluation/service-results';

function assignCompetitionRank(items, valFn, rankProp) {
  const sorted = [...items].sort((a, b) => valFn(b) - valFn(a));
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && Math.abs(valFn(sorted[i]) - valFn(sorted[i - 1])) > 0.001) {
      currentRank = i + 1;
    }
    sorted[i][rankProp] = currentRank;
  }
}

async function fetchProvinceRankings(year = 2026) {
  const startTime = Date.now();
  console.log(`[Province Collector] Đang lấy số liệu xếp hạng 766 các tỉnh năm ${year} từ DVCQG...`);

  const payload = {
    timeType: 'year',
    year: Number(year) || 2026,
    departmentType: 'ADMINISTRATIVE_UNIT'
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://dichvucong.gov.vn',
      'Referer': 'https://dichvucong.gov.vn/danh-gia-chat-luong-phuc-vu'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`DVCQG API trả về lỗi HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.code !== 'OK' || !result.data) {
    throw new Error('DVCQG API trả về dữ liệu không hợp lệ: ' + JSON.stringify(result));
  }

  const rawList = result.data.evaluation || [];
  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error('Không có danh sách tỉnh/thành phố trong kết quả trả về');
  }

  // Chuẩn hóa dữ liệu từng tỉnh
  const provinces = rawList.map(item => {
    const gs = item.groupScores || {};
    return {
      departmentId: item.departmentId,
      departmentName: item.departmentName || '',
      departmentCode: item.departmentCode || '',
      totalScore: Number((item.totalScore || 0).toFixed(2)),
      scoreDelta: item.scoreDelta != null ? Number(item.scoreDelta.toFixed(2)) : 0,
      scores: {
        CKMB: Number((gs.CKMB || 0).toFixed(2)), // Công khai, minh bạch (18đ)
        TDGQ: Number((gs.TDGQ || 0).toFixed(2)), // Tiến độ giải quyết (20đ)
        CLGQ: Number((gs.CLGQ || 0).toFixed(2)), // Dịch vụ công trực tuyến (12đ)
        MDSH: Number((gs.MDSH || 0).toFixed(2)), // Số hóa hồ sơ (22đ)
        MDHL: Number((gs.MDHL || 0).toFixed(2)), // Mức độ hài lòng (18đ)
        TTTT: Number((gs.TTTT || 0).toFixed(2))  // Thanh toán trực tuyến (10đ)
      },
      isDakLak: (item.departmentName || '').includes('Đắk Lắk') || item.departmentCode === 'H15'
    };
  });

  // Tính thứ hạng tổng điểm (Competition ranking 1224)
  assignCompetitionRank(provinces, p => p.totalScore, 'rank');

  // Tính thứ hạng riêng cho từng chỉ số
  assignCompetitionRank(provinces, p => p.scores.CKMB, 'rank_CKMB');
  assignCompetitionRank(provinces, p => p.scores.TDGQ, 'rank_TDGQ');
  assignCompetitionRank(provinces, p => p.scores.CLGQ, 'rank_CLGQ');
  assignCompetitionRank(provinces, p => p.scores.MDSH, 'rank_MDSH');
  assignCompetitionRank(provinces, p => p.scores.MDHL, 'rank_MDHL');
  assignCompetitionRank(provinces, p => p.scores.TTTT, 'rank_TTTT');

  // Sắp xếp thứ tự theo thứ hạng tổng (từ hạng 1 đến hết)
  provinces.sort((a, b) => a.rank - b.rank);

  // Tìm thông tin riêng của Đắk Lắk
  const dakLakInfo = provinces.find(p => p.isDakLak) || null;

  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const dateFormatted = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);

  const formattedData = {
    year,
    date: dateFormatted,
    updatedAt: now.toISOString(),
    updatedAtVN: `${timeFormatter.format(now)} (giờ Việt Nam)`,
    totalCount: provinces.length,
    overview: result.data.overview || {},
    growthPercent: result.data.growthPercent || 0,
    radar: result.data.radar || [],
    dakLak: dakLakInfo,
    provinces,
    durationMs: Date.now() - startTime
  };

  console.log(`[Province Collector] Lấy thành công dữ liệu ${provinces.length} tỉnh/thành phố trong ${(formattedData.durationMs / 1000).toFixed(1)}s.`);
  if (dakLakInfo) {
    console.log(`[Province Collector] Đắk Lắk xếp hạng #${dakLakInfo.rank}/${provinces.length} với ${dakLakInfo.totalScore} điểm.`);
  }

  return formattedData;
}

module.exports = {
  fetchProvinceRankings
};
