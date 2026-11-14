const storage = require('../src/storage');

/**
 * Remove Vietnamese accents/diacritics for flexible fuzzy searching
 */
function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str.trim().toLowerCase();
}

/**
 * 6 Main Criteria of Decision 766
 */
const CRITERIA_DEFINITIONS = [
  { key: 'transparency', name: 'Công khai, minh bạch', maxScore: 18 },
  { key: 'progress', name: 'Tiến độ giải quyết', maxScore: 20 },
  { key: 'onlineService', name: 'Dịch vụ công trực tuyến', maxScore: 12 },
  { key: 'digitized', name: 'Số hóa hồ sơ', maxScore: 22 },
  { key: 'payment', name: 'Thanh toán trực tuyến', maxScore: 10 },
  { key: 'satisfaction', name: 'Mức độ hài lòng', maxScore: 18 }
];

/**
 * Format YYYY-MM-DD -> DD/MM/YYYY
 */
function formatDateVn(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

/**
 * Format score delta for display: +X.XXđ, -X.XXđ, 0.00đ
 */
function formatDeltaScore(delta) {
  if (delta > 0) return `📈 +${delta.toFixed(2)}đ`;
  if (delta < 0) return `📉 ${delta.toFixed(2)}đ`;
  return `➖ 0.00đ`;
}

/**
 * Format rank delta for display: (Tăng X bậc), (Giảm X bậc), (Giữ nguyên)
 * Note: deltaRank = rankYesterday - rankToday (positive means climbed rank)
 */
function formatDeltaRank(deltaRank) {
  if (deltaRank == null) return '';
  if (deltaRank > 0) return `(📈 Tăng ${deltaRank} bậc)`;
  if (deltaRank < 0) return `(📉 Giảm ${Math.abs(deltaRank)} bậc)`;
  return `(➖ Giữ nguyên)`;
}

/**
 * Build comparison for the 6 main criteria
 */
function compareMainIndicators(scoresTo = {}, detailsTo = {}, scoresFrom = {}, detailsFrom = {}) {
  return CRITERIA_DEFINITIONS.map((def) => {
    const detailTo = detailsTo[def.key] || {};
    const detailFrom = detailsFrom[def.key] || {};

    const scoreToday = scoresTo[def.key] != null
      ? Number(Number(scoresTo[def.key]).toFixed(2))
      : (detailTo.score != null ? Number(Number(detailTo.score).toFixed(2)) : 0);

    const scoreYesterday = scoresFrom[def.key] != null
      ? Number(Number(scoresFrom[def.key]).toFixed(2))
      : (detailFrom.score != null ? Number(Number(detailFrom.score).toFixed(2)) : 0);

    const delta = Number((scoreToday - scoreYesterday).toFixed(2));
    const maxScore = detailTo.maxScore || def.maxScore;

    const ratioToday = detailTo.ratio != null
      ? Number(Number(detailTo.ratio).toFixed(2))
      : (maxScore > 0 ? Number(((scoreToday / maxScore) * 100).toFixed(2)) : 0);

    const ratioYesterday = detailFrom.ratio != null
      ? Number(Number(detailFrom.ratio).toFixed(2))
      : (maxScore > 0 ? Number(((scoreYesterday / maxScore) * 100).toFixed(2)) : 0);

    const deltaRatio = Number((ratioToday - ratioYesterday).toFixed(2));

    return {
      key: def.key,
      name: def.name,
      maxScore,
      scoreToday,
      scoreYesterday,
      delta,
      ratioToday,
      ratioYesterday,
      deltaRatio
    };
  });
}

/**
 * Format a beautiful plain text message optimized for Zalo Chatbot
 */
function buildZaloCompareMessage(data) {
  const { unit, dateToVn, dateFromVn, indicators } = data;
  const isProv = unit.code === 'H15';

  const lines = [];
  lines.push('📊 SO SÁNH BIẾN ĐỘNG CHỈ SỐ 766 DVCQG');
  lines.push(`🏢 Đơn vị: ${unit.name}`);
  lines.push(`🏷️ Mã đơn vị: ${unit.code}${unit.level ? ` | ${unit.level}` : ''}`);
  lines.push(`📅 Thời gian: ${dateToVn} so với ${dateFromVn}`);
  lines.push('──────────────────────────────');

  // Tổng điểm
  const deltaScoreStr = formatDeltaScore(unit.deltaScore);
  lines.push(`🏆 Tổng điểm: ${unit.scoreToday} / ${unit.maxScore || 100}đ (Trước: ${unit.scoreYesterday}đ | ${deltaScoreStr})`);

  let classText = `🎖️ Xếp loại: ${unit.classificationToday}`;
  if (unit.classificationYesterday && unit.classificationYesterday !== unit.classificationToday) {
    classText += ` (Trước: ${unit.classificationYesterday})`;
  }
  lines.push(classText);

  // Thứ hạng (nếu là đơn vị)
  if (!isProv && unit.rankToday != null) {
    const rankChange = formatDeltaRank(unit.deltaRank);
    lines.push(`📈 Thứ hạng tỉnh: #${unit.rankToday}/${unit.totalUnits || 115} toàn tỉnh ${rankChange}`.trim());
    if (unit.rankInGroupToday != null && unit.groupTotal) {
      const groupRankChange = formatDeltaRank(unit.deltaRankInGroup);
      lines.push(`👥 Khối ${unit.groupLabel || 'đơn vị'}: #${unit.rankInGroupToday}/${unit.groupTotal} ${groupRankChange}`.trim());
    }
  }

  lines.push('──────────────────────────────');
  lines.push('📋 BIẾN ĐỘNG 6 NHÓM TIÊU CHÍ:');

  const icons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
  indicators.forEach((ind, idx) => {
    const numIcon = icons[idx] || `[${idx + 1}]`;
    const deltaStr = formatDeltaScore(ind.delta);
    lines.push(`${numIcon} ${ind.name}: ${ind.scoreToday}/${ind.maxScore}đ (Trước: ${ind.scoreYesterday}đ | ${deltaStr})`);
  });

  lines.push('──────────────────────────────');
  lines.push('💡 Tra cứu thêm: Gửi mã đơn vị (ví dụ: H15.100, H15.15, H15)');
  return lines.join('\n').trim();
}

/**
 * Main API Handler for /766sosanh
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Parse parameters from query, body, or route params
    const query = req.query || {};
    const body = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
    const params = req.params || {};

    const rawCode =
      query.code ||
      query.ma ||
      query.madonvi ||
      query.q ||
      body.code ||
      body.ma ||
      body.madonvi ||
      body.q ||
      params.code ||
      params.ma ||
      params[0] ||
      '';

    let dateToParam = query.dateTo || query.date || query.to || query.den_ngay || body.dateTo || body.date || null;
    let dateFromParam = query.dateFrom || query.from || query.tu_ngay || body.dateFrom || null;
    const format = query.format || body.format || 'json';

    // 2. Load available dates
    const availableDates = await storage.listDates();
    if (!availableDates || availableDates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chưa có dữ liệu nào trong cơ sở dữ liệu. Vui lòng đồng bộ dữ liệu trước.'
      });
    }

    // Determine targetDateTo and targetDateFrom
    let targetDateTo = dateToParam;
    if (!targetDateTo) {
      targetDateTo = availableDates[0]; // latest date
    }

    let targetDateFrom = dateFromParam;
    if (!targetDateFrom) {
      const idxTo = availableDates.indexOf(targetDateTo);
      if (idxTo >= 0 && idxTo + 1 < availableDates.length) {
        targetDateFrom = availableDates[idxTo + 1];
      } else if (availableDates.length > 1) {
        targetDateFrom = availableDates[1];
      } else {
        targetDateFrom = targetDateTo;
      }
    }

    // 3. Load snapshots for both dates
    const [snapshotTo, snapshotFrom] = await Promise.all([
      storage.getSnapshot(targetDateTo),
      storage.getSnapshot(targetDateFrom)
    ]);

    if (!snapshotTo) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy dữ liệu cho ngày ${targetDateTo}`,
        availableDates: availableDates.slice(0, 10)
      });
    }

    if (!snapshotFrom) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy dữ liệu đối chiếu cho ngày ${targetDateFrom}`,
        availableDates: availableDates.slice(0, 10)
      });
    }

    const availableUnitsTo = snapshotTo.units || [];
    const availableUnitsFrom = snapshotFrom.units || [];

    // 4. If no code provided, return API instructions and sample units
    if (!rawCode || !rawCode.trim()) {
      const sampleList = availableUnitsTo.slice(0, 10).map((u) => ({
        code: u.departmentCode,
        name: u.departmentName,
        level: u.levelLabel,
        totalScore: u.totalScore
      }));

      return res.status(200).json({
        success: true,
        message: 'API So sánh Biến động Điểm 766 Bộ Chỉ số DVCQG (Điểm tổng & 6 tiêu chí lớn)',
        usage: {
          endpoint: '/766sosanh?ma=MÃ_ĐƠN_VỊ',
          method: 'GET hoặc POST',
          parameters: {
            ma: 'Mã đơn vị (ví dụ: H15.100, H15.15, H15)',
            dateTo: 'Ngày so sánh (mặc định: ngày mới nhất)',
            dateFrom: 'Ngày đối chiếu (mặc định: ngày liền trước)',
            format: 'json (mặc định) hoặc text (lấy trực tiếp văn bản định dạng cho Bot Zalo)'
          },
          examples: [
            '/766sosanh?ma=H15.100 (UBND phường Buôn Ma Thuột)',
            '/766sosanh?ma=H15.15 (Sở Văn hóa, Thể thao và Du lịch)',
            '/766sosanh?ma=H15 (Toàn tỉnh Đắk Lắk)',
            '/766sosanh?ma=H15.100&format=text (Lấy tin nhắn văn bản cho Bot Zalo)',
            '/766sosanh?ma=H15.100&dateTo=2026-11-14&dateFrom=2026-11-13'
          ]
        },
        currentComparisonDates: {
          dateTo: targetDateTo,
          dateFrom: targetDateFrom,
          dateToVn: formatDateVn(targetDateTo),
          dateFromVn: formatDateVn(targetDateFrom)
        },
        totalUnitsAvailable: availableUnitsTo.length,
        sampleUnits: sampleList
      });
    }

    const searchCode = rawCode.trim();
    const searchCodeUpper = searchCode.toUpperCase();
    const searchCodeClean = searchCodeUpper.replace(/\s+/g, '');
    const searchWithoutAccents = removeVietnameseTones(searchCode);

    // 5. Check if querying Whole Province (H15 / TINH / DAKLAK)
    if (
      searchCodeUpper === 'H15' ||
      searchCodeUpper === 'TINH' ||
      searchCodeUpper === 'TOANTINH' ||
      searchWithoutAccents === 'dak lak' ||
      searchWithoutAccents === 'toan tinh'
    ) {
      const provOverviewTo = snapshotTo.overview || {};
      const provOverviewFrom = snapshotFrom.overview || {};

      const scoreToday = Number(Number(provOverviewTo.totalScore ?? 0).toFixed(2));
      const scoreYesterday = Number(Number(provOverviewFrom.totalScore ?? 0).toFixed(2));
      const deltaScore = Number((scoreToday - scoreYesterday).toFixed(2));

      const provScoresTo = {
        transparency: snapshotTo.indicators?.transparency?.score ?? 0,
        progress: snapshotTo.indicators?.progress?.score ?? 0,
        onlineService: snapshotTo.indicators?.onlineService?.score ?? 0,
        digitized: snapshotTo.indicators?.digitized?.score ?? 0,
        payment: snapshotTo.indicators?.payment?.score ?? 0,
        satisfaction: snapshotTo.indicators?.satisfaction?.score ?? 0
      };

      const provScoresFrom = {
        transparency: snapshotFrom.indicators?.transparency?.score ?? 0,
        progress: snapshotFrom.indicators?.progress?.score ?? 0,
        onlineService: snapshotFrom.indicators?.onlineService?.score ?? 0,
        digitized: snapshotFrom.indicators?.digitized?.score ?? 0,
        payment: snapshotFrom.indicators?.payment?.score ?? 0,
        satisfaction: snapshotFrom.indicators?.satisfaction?.score ?? 0
      };

      const indicators = compareMainIndicators(
        provScoresTo,
        snapshotTo.indicators,
        provScoresFrom,
        snapshotFrom.indicators
      );

      const responseData = {
        dateTo: targetDateTo,
        dateFrom: targetDateFrom,
        dateToVn: formatDateVn(targetDateTo),
        dateFromVn: formatDateVn(targetDateFrom),
        unit: {
          code: snapshotTo.department?.code || 'H15',
          name: snapshotTo.department?.name || 'UBND tỉnh Đắk Lắk',
          level: 'Cấp Tỉnh',
          scoreToday,
          scoreYesterday,
          deltaScore,
          maxScore: provOverviewTo.maxScore ?? 100,
          classificationToday: provOverviewTo.classification?.label || 'Chưa xếp loại',
          classificationYesterday: provOverviewFrom.classification?.label || 'Chưa xếp loại',
          rankToday: null,
          rankYesterday: null,
          deltaRank: null,
          totalUnits: availableUnitsTo.length
        },
        indicators
      };

      const chatMessage = buildZaloCompareMessage(responseData);
      responseData.chatMessage = chatMessage;

      if (format === 'text') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(chatMessage);
      }

      return res.status(200).json({
        success: true,
        data: responseData
      });
    }

    // 6. Search for unit in snapshotTo
    // Step 6a: Exact match (case-insensitive & whitespace removed)
    let unitTo = availableUnitsTo.find((u) => {
      const code = (u.departmentCode || '').toUpperCase().replace(/\s+/g, '');
      return code === searchCodeClean;
    });

    // Step 6b: Match by suffix (e.g. "100" -> "H15.100")
    if (!unitTo) {
      unitTo = availableUnitsTo.find((u) => {
        const code = (u.departmentCode || '').toUpperCase().replace(/\s+/g, '');
        return (
          code.endsWith('.' + searchCodeClean) ||
          code === 'H15.' + searchCodeClean ||
          code === searchCodeClean
        );
      });
    }

    // Step 6c: Search by unit name if not found by code
    if (!unitTo) {
      const matchesByName = availableUnitsTo.filter((u) => {
        const nameNoAccent = removeVietnameseTones(u.departmentName);
        return nameNoAccent.includes(searchWithoutAccents);
      });

      if (matchesByName.length === 1) {
        unitTo = matchesByName[0];
      } else if (matchesByName.length > 1) {
        const suggestions = matchesByName.slice(0, 10).map((u) => ({
          code: u.departmentCode,
          name: u.departmentName,
          level: u.levelLabel,
          totalScore: u.totalScore
        }));

        return res.status(200).json({
          success: false,
          error: `Tìm thấy ${matchesByName.length} đơn vị phù hợp với từ khóa "${searchCode}". Vui lòng chọn chính xác mã đơn vị.`,
          suggestions
        });
      }
    }

    // 7. If still not found, return helpful error with close matches
    if (!unitTo) {
      const suggestions = availableUnitsTo
        .filter((u) => {
          const c = (u.departmentCode || '').toLowerCase();
          const n = removeVietnameseTones(u.departmentName);
          return c.includes(searchCode.toLowerCase()) || n.includes(searchWithoutAccents);
        })
        .slice(0, 8)
        .map((u) => ({
          code: u.departmentCode,
          name: u.departmentName,
          level: u.levelLabel
        }));

      return res.status(404).json({
        success: false,
        error: `Không tìm thấy đơn vị với mã hoặc tên: "${searchCode}"`,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        hint: 'Ví dụ mã đơn vị: H15.100 (Buôn Ma Thuột), H15.15 (Sở VHTTDL), H15 (Toàn tỉnh)'
      });
    }

    // 8. Find matching unit in snapshotFrom
    const unitFrom = availableUnitsFrom.find((u) => {
      const codeFrom = (u.departmentCode || '').toUpperCase().replace(/\s+/g, '');
      const codeTo = (unitTo.departmentCode || '').toUpperCase().replace(/\s+/g, '');
      return codeFrom === codeTo;
    }) || availableUnitsFrom.find((u) => u.departmentName === unitTo.departmentName) || null;

    // 9. Calculate rank changes and group contexts
    const scoreToday = Number(Number(unitTo.totalScore || 0).toFixed(2));
    const scoreYesterday = unitFrom ? Number(Number(unitFrom.totalScore || 0).toFixed(2)) : 0;
    const deltaScore = Number((scoreToday - scoreYesterday).toFixed(2));

    const rankToday = unitTo.rank ?? null;
    const rankYesterday = unitFrom?.rank ?? null;
    // deltaRank > 0 means climbed, < 0 means dropped
    const deltaRank = (rankYesterday != null && rankToday != null) ? (rankYesterday - rankToday) : null;

    const rankInGroupToday = unitTo.rankInGroup ?? null;
    const rankInGroupYesterday = unitFrom?.rankInGroup ?? null;
    const deltaRankInGroup = (rankInGroupYesterday != null && rankInGroupToday != null)
      ? (rankInGroupYesterday - rankInGroupToday)
      : null;

    const groupUnits = availableUnitsTo.filter((u) => u.group === unitTo.group);
    const groupTotal = groupUnits.length;

    // 10. Extract & compare the 6 main criteria
    const indicators = compareMainIndicators(
      unitTo.scores,
      unitTo.indicatorDetails,
      unitFrom ? unitFrom.scores : {},
      unitFrom ? unitFrom.indicatorDetails : {}
    );

    const responseData = {
      dateTo: targetDateTo,
      dateFrom: targetDateFrom,
      dateToVn: formatDateVn(targetDateTo),
      dateFromVn: formatDateVn(targetDateFrom),
      unit: {
        code: unitTo.departmentCode,
        name: unitTo.departmentName,
        level: unitTo.levelLabel,
        group: unitTo.group,
        groupLabel: unitTo.groupLabel,
        scoreToday,
        scoreYesterday,
        deltaScore,
        maxScore: unitTo.maxScore || 100,
        classificationToday: unitTo.classification?.label || 'Chưa xếp loại',
        classificationYesterday: unitFrom?.classification?.label || 'Chưa xếp loại',
        rankToday,
        rankYesterday,
        deltaRank,
        totalUnits: availableUnitsTo.length,
        rankInGroupToday,
        rankInGroupYesterday,
        deltaRankInGroup,
        groupTotal
      },
      indicators
    };

    // 11. Generate formatted plain text message for Zalo Chatbot
    const chatMessage = buildZaloCompareMessage(responseData);
    responseData.chatMessage = chatMessage;

    // Return text if requested
    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(chatMessage);
    }

    // Return rich JSON
    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (err) {
    console.error('[API 766sosanh] Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

