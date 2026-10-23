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
 * Format numbers with comma separator (e.g. 10000 -> 10,000)
 */
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('vi-VN');
}

/**
 * Normalize and extract all 6 indicators and sub-criteria
 */
function extractNormalizedIndicators(indicatorDetailsOrIndicators, isProvince = false) {
  const result = [];
  const src = indicatorDetailsOrIndicators || {};

  // 1. Công khai, minh bạch
  const trans = src.transparency || {};
  const transMetrics = (trans.metrics || []).map((m) => ({
    code: m.code || '',
    name: m.name || '',
    ratio: m.ratio != null ? Number(m.ratio.toFixed(2)) : 0,
    score: m.score != null ? Number(m.score.toFixed(2)) : 0,
    maxScore: m.maxScore ?? null,
    numerator: m.numerator ?? null,
    denominator: m.denominator ?? null,
    displayCount: m.numerator != null && m.denominator != null ? `${formatNumber(m.numerator)}/${formatNumber(m.denominator)}` : null
  }));
  result.push({
    key: 'transparency',
    name: 'Công khai, minh bạch',
    score: trans.score != null ? Number(trans.score.toFixed(2)) : 0,
    maxScore: trans.maxScore || 18,
    ratio: trans.ratio != null ? Number(trans.ratio.toFixed(2)) : 0,
    subCriteria: transMetrics
  });

  // 2. Tiến độ giải quyết
  const prog = src.progress || {};
  const progMetrics = [];
  const totalReceived = prog.totalReceived ?? (prog.metrics?.totalReceived ?? 0);
  const avgDays = prog.avgProcessingDays ?? (prog.metrics?.avgProcessingDays ?? 0);

  const onTime = prog.onTime || prog.metrics?.onTime;
  if (onTime) {
    progMetrics.push({
      code: 'ON_TIME',
      name: onTime.name || 'Hồ sơ giải quyết đúng hạn',
      ratio: onTime.ratio != null ? Number(onTime.ratio.toFixed(2)) : 0,
      score: onTime.score != null ? Number(onTime.score.toFixed(2)) : (prog.score != null ? Number(prog.score.toFixed(2)) : 0),
      maxScore: onTime.maxScore || 20,
      numerator: onTime.numerator ?? null,
      denominator: onTime.denominator ?? null,
      displayCount: onTime.numerator != null && onTime.denominator != null ? `${formatNumber(onTime.numerator)}/${formatNumber(onTime.denominator)}` : null
    });
  }

  const overdue = prog.overdue || prog.metrics?.overdue;
  if (overdue) {
    progMetrics.push({
      code: 'OVERDUE',
      name: overdue.name || 'Hồ sơ giải quyết quá hạn',
      ratio: overdue.ratio != null ? Number(overdue.ratio.toFixed(2)) : 0,
      score: null,
      maxScore: null,
      numerator: overdue.numerator ?? null,
      denominator: overdue.denominator ?? null,
      displayCount: overdue.numerator != null && overdue.denominator != null ? `${formatNumber(overdue.numerator)}/${formatNumber(overdue.denominator)}` : null
    });
  }

  result.push({
    key: 'progress',
    name: 'Tiến độ giải quyết',
    score: prog.score != null ? Number(prog.score.toFixed(2)) : 0,
    maxScore: prog.maxScore || 20,
    ratio: prog.ratio != null ? Number(prog.ratio.toFixed(2)) : 0,
    totalReceived: totalReceived,
    avgProcessingDays: avgDays,
    subCriteria: progMetrics
  });

  // 3. Dịch vụ công trực tuyến
  const online = src.onlineService || {};
  const onlineMetrics = (online.metrics && online.metrics.length > 0)
    ? online.metrics.map((m) => ({
        code: 'ONLINE_SERVICE_RATIO',
        name: m.name || 'Tỷ lệ cung cấp dịch vụ công trực tuyến & nộp hồ sơ trực tuyến',
        ratio: m.ratio != null ? Number(m.ratio.toFixed(2)) : (online.ratio != null ? Number(online.ratio.toFixed(2)) : 0),
        score: m.score != null ? Number(m.score.toFixed(2)) : (online.score != null ? Number(online.score.toFixed(2)) : 0),
        maxScore: m.maxScore || 12,
        numerator: m.numerator ?? null,
        denominator: m.denominator ?? null,
        displayCount: null
      }))
    : [{
        code: 'ONLINE_SERVICE_RATIO',
        name: 'Tỷ lệ cung cấp dịch vụ công trực tuyến & nộp hồ sơ trực tuyến',
        ratio: online.ratio != null ? Number(online.ratio.toFixed(2)) : 0,
        score: online.score != null ? Number(online.score.toFixed(2)) : 0,
        maxScore: 12,
        numerator: null,
        denominator: null,
        displayCount: null
      }];

  result.push({
    key: 'onlineService',
    name: 'Dịch vụ công trực tuyến',
    score: online.score != null ? Number(online.score.toFixed(2)) : 0,
    maxScore: online.maxScore || 12,
    ratio: online.ratio != null ? Number(online.ratio.toFixed(2)) : 0,
    subCriteria: onlineMetrics
  });

  // 4. Số hóa hồ sơ
  const digi = src.digitized || {};
  const digiMetrics = (digi.metrics || []).map((m) => ({
    code: m.code || '',
    name: m.name || '',
    ratio: m.ratio != null ? Number(m.ratio.toFixed(2)) : 0,
    score: m.score != null ? Number(m.score.toFixed(2)) : 0,
    maxScore: m.maxScore ?? null,
    numerator: m.numerator ?? null,
    denominator: m.denominator ?? null,
    displayCount: m.numerator != null && m.denominator != null ? `${formatNumber(m.numerator)}/${formatNumber(m.denominator)}` : null
  }));
  result.push({
    key: 'digitized',
    name: 'Số hóa hồ sơ',
    score: digi.score != null ? Number(digi.score.toFixed(2)) : 0,
    maxScore: digi.maxScore || 22,
    ratio: digi.ratio != null ? Number(digi.ratio.toFixed(2)) : 0,
    subCriteria: digiMetrics
  });

  // 5. Thanh toán trực tuyến
  const pay = src.payment || {};
  const payMetrics = (pay.metrics || []).map((m) => ({
    code: m.code || '',
    name: m.name || '',
    ratio: m.ratio != null ? Number(m.ratio.toFixed(2)) : 0,
    score: m.score != null ? Number(m.score.toFixed(2)) : null,
    maxScore: m.maxScore ?? null,
    numerator: m.numerator ?? null,
    denominator: m.denominator ?? null,
    displayCount: m.numerator != null && m.denominator != null ? `${formatNumber(m.numerator)}/${formatNumber(m.denominator)}` : null
  }));
  result.push({
    key: 'payment',
    name: 'Thanh toán trực tuyến',
    score: pay.score != null ? Number(pay.score.toFixed(2)) : 0,
    maxScore: pay.maxScore || 10,
    ratio: pay.ratio != null ? Number(pay.ratio.toFixed(2)) : 0,
    subCriteria: payMetrics
  });

  // 6. Mức độ hài lòng
  const sat = src.satisfaction || {};
  const satMetrics = (sat.metrics || []).map((m) => ({
    code: m.code || '',
    name: m.name || '',
    ratio: m.ratio != null ? Number(m.ratio.toFixed(2)) : 0,
    score: m.score != null ? Number(m.score.toFixed(2)) : 0,
    maxScore: m.maxScore ?? null,
    numerator: m.numerator ?? null,
    denominator: m.denominator ?? null,
    displayCount: m.numerator != null && m.denominator != null ? `${formatNumber(m.numerator)}/${formatNumber(m.denominator)}` : null
  }));
  result.push({
    key: 'satisfaction',
    name: 'Mức độ hài lòng',
    score: sat.score != null ? Number(sat.score.toFixed(2)) : 0,
    maxScore: sat.maxScore || 18,
    ratio: sat.ratio != null ? Number(sat.ratio.toFixed(2)) : 0,
    subCriteria: satMetrics
  });

  return result;
}

/**
 * Format a beautiful plain text message optimized for Zalo chat
 */
function buildZaloChatMessage(data) {
  const { unit, date, indicators } = data;
  const isProv = unit.code === 'H15';

  const dateParts = date ? date.split('-') : [];
  const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : date;

  const lines = [];
  lines.push('📊 KẾT QUẢ ĐÁNH GIÁ CHỈ SỐ 766 DVCQG');
  lines.push(`🏢 Đơn vị: ${unit.name}`);
  lines.push(`🏷️ Mã đơn vị: ${unit.code}${unit.level ? ` | ${unit.level}` : ''}`);
  lines.push(`📅 Ngày cập nhật: ${dateFormatted}`);
  lines.push(`🏆 Tổng điểm: ${unit.totalScore} / ${unit.maxScore || 100} điểm (Xếp loại: ${unit.classification})`);

  if (!isProv && unit.rank) {
    const rankText = `📈 Thứ hạng: ${unit.rank}/${unit.totalUnits || 115} toàn tỉnh` +
      (unit.rankInGroup && unit.groupTotal ? ` (${unit.rankInGroup}/${unit.groupTotal} ${unit.groupLabel || 'khối'})` : '');
    lines.push(rankText);
  }

  lines.push('──────────────────────────────');

  const icons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];

  indicators.forEach((ind, idx) => {
    const numIcon = icons[idx] || `[${idx + 1}]`;
    lines.push(`${numIcon} ${ind.name.toUpperCase()}: ${ind.score}/${ind.maxScore} điểm (${ind.ratio}%)`);

    if (ind.key === 'progress' && ind.totalReceived) {
      lines.push(`   • Tiếp nhận: ${formatNumber(ind.totalReceived)} HS (Xử lý TB: ${ind.avgProcessingDays} ngày)`);
    }

    if (Array.isArray(ind.subCriteria) && ind.subCriteria.length > 0) {
      ind.subCriteria.forEach((sub) => {
        let subText = `   • ${sub.name}: ${sub.ratio}%`;
        if (sub.score != null && sub.maxScore != null) {
          subText += ` (${sub.score}/${sub.maxScore} đ)`;
        } else if (sub.score != null) {
          subText += ` (${sub.score} đ)`;
        }
        if (sub.displayCount) {
          subText += ` [${sub.displayCount}]`;
        }
        lines.push(subText);
      });
    }
    lines.push('');
  });

  lines.push('💡 Tra cứu thêm: Gửi mã đơn vị (ví dụ: H15.100, H15.15, H15)');
  return lines.join('\n').trim();
}

/**
 * Main API Handler
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
    const dateParam = query.date || body.date || null;
    const format = query.format || body.format || 'json';

    // 2. Load Snapshot (specified date or latest)
    let snapshot = null;
    if (dateParam) {
      snapshot = await storage.getSnapshot(dateParam);
      if (!snapshot) {
        return res.status(404).json({
          success: false,
          error: `Không tìm thấy dữ liệu ngày ${dateParam}`,
          hint: 'Kiểm tra danh sách ngày có sẵn tại /api/data?action=dates'
        });
      }
    } else {
      snapshot = await storage.getLatestSnapshot();
      if (!snapshot) {
        return res.status(404).json({
          success: false,
          error: 'Chưa có dữ liệu nào trong cơ sở dữ liệu. Vui lòng chạy đồng bộ dữ liệu trước.',
          hint: 'Gọi GET /api/data để hệ thống tự động thu thập lần đầu.'
        });
      }
    }

    const availableUnits = snapshot.units || [];
    const date = snapshot.date || new Date().toISOString().slice(0, 10);

    // 3. If no code provided, return instructions and sample units
    if (!rawCode || !rawCode.trim()) {
      const sampleList = availableUnits.slice(0, 10).map((u) => ({
        code: u.departmentCode,
        name: u.departmentName,
        level: u.levelLabel,
        totalScore: u.totalScore
      }));

      return res.status(200).json({
        success: true,
        message: 'API Tra cứu Điểm 766 Bộ Chỉ số DVCQG',
        usage: {
          endpoint: '/766donvi?ma=MÃ_ĐƠN_VỊ',
          method: 'GET hoặc POST',
          examples: [
            '/766donvi?ma=H15.100 (UBND phường Buôn Ma Thuột)',
            '/766donvi?ma=H15.15 (Sở Văn hóa, Thể thao và Du lịch)',
            '/766donvi?ma=H15 (Toàn tỉnh Đắk Lắk)',
            '/766donvi?ma=H15.100&format=text (Lấy trực tiếp văn bản cho Zalo)'
          ]
        },
        totalUnitsAvailable: availableUnits.length,
        sampleUnits: sampleList
      });
    }

    const searchCode = rawCode.trim();
    const searchCodeUpper = searchCode.toUpperCase();
    const searchCodeClean = searchCodeUpper.replace(/\s+/g, '');
    const searchWithoutAccents = removeVietnameseTones(searchCode);

    // 4. Check if querying Whole Province (H15 / TINH / DAKLAK)
    if (
      searchCodeUpper === 'H15' ||
      searchCodeUpper === 'TINH' ||
      searchCodeUpper === 'TOANTINH' ||
      searchWithoutAccents === 'dak lak' ||
      searchWithoutAccents === 'toan tinh'
    ) {
      const provOverview = snapshot.overview || {};
      const indicators = extractNormalizedIndicators(snapshot.indicators, true);

      const responseData = {
        date,
        unit: {
          code: snapshot.department?.code || 'H15',
          name: snapshot.department?.name || 'UBND tỉnh Đắk Lắk',
          level: 'Cấp Tỉnh',
          totalScore: provOverview.totalScore ?? 0,
          maxScore: provOverview.maxScore ?? 100,
          classification: provOverview.classification?.label || 'Chưa xếp loại',
          rank: null,
          totalUnits: availableUnits.length
        },
        summary: {
          transparency: snapshot.indicators?.transparency?.score ?? 0,
          progress: snapshot.indicators?.progress?.score ?? 0,
          onlineService: snapshot.indicators?.onlineService?.score ?? 0,
          digitized: snapshot.indicators?.digitized?.score ?? 0,
          payment: snapshot.indicators?.payment?.score ?? 0,
          satisfaction: snapshot.indicators?.satisfaction?.score ?? 0
        },
        indicators
      };

      const chatMessage = buildZaloChatMessage(responseData);
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

    // 5. Search for unit in snapshot
    // Step 5a: Exact match (case-insensitive & whitespace removed)
    let matchedUnit = availableUnits.find((u) => {
      const code = (u.departmentCode || '').toUpperCase().replace(/\s+/g, '');
      return code === searchCodeClean;
    });

    // Step 5b: Match by suffix (e.g. user enters "100" or ".100" -> match "H15.100")
    if (!matchedUnit) {
      matchedUnit = availableUnits.find((u) => {
        const code = (u.departmentCode || '').toUpperCase().replace(/\s+/g, '');
        return (
          code.endsWith('.' + searchCodeClean) ||
          code === 'H15.' + searchCodeClean ||
          code === searchCodeClean
        );
      });
    }

    // Step 5c: Search by unit name if not found by code
    if (!matchedUnit) {
      const matchesByName = availableUnits.filter((u) => {
        const nameNoAccent = removeVietnameseTones(u.departmentName);
        return nameNoAccent.includes(searchWithoutAccents);
      });

      if (matchesByName.length === 1) {
        matchedUnit = matchesByName[0];
      } else if (matchesByName.length > 1) {
        // Return suggestions
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

    // 6. If still not found, return helpful error with close matches
    if (!matchedUnit) {
      // Find possible suggestions
      const suggestions = availableUnits
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

    // 7. Calculate group counts for rank context
    const groupUnits = availableUnits.filter((u) => u.group === matchedUnit.group);
    const groupTotal = groupUnits.length;

    // 8. Extract normalized indicators and sub-criteria
    const indicators = extractNormalizedIndicators(matchedUnit.indicatorDetails, false);

    const responseData = {
      date,
      unit: {
        code: matchedUnit.departmentCode,
        name: matchedUnit.departmentName,
        level: matchedUnit.levelLabel,
        group: matchedUnit.group,
        groupLabel: matchedUnit.groupLabel,
        rank: matchedUnit.rank,
        totalUnits: availableUnits.length,
        rankInGroup: matchedUnit.rankInGroup,
        groupTotal,
        totalScore: matchedUnit.totalScore,
        maxScore: matchedUnit.maxScore || 100,
        classification: matchedUnit.classification?.label || 'Chưa xếp loại'
      },
      summary: {
        transparency: matchedUnit.scores?.transparency ?? 0,
        progress: matchedUnit.scores?.progress ?? 0,
        onlineService: matchedUnit.scores?.onlineService ?? 0,
        digitized: matchedUnit.scores?.digitized ?? 0,
        payment: matchedUnit.scores?.payment ?? 0,
        satisfaction: matchedUnit.scores?.satisfaction ?? 0
      },
      indicators
    };

    // 9. Generate formatted plain text message for Zalo Chatbot
    const chatMessage = buildZaloChatMessage(responseData);
    responseData.chatMessage = chatMessage;

    // If caller specifically requested plain text
    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(chatMessage);
    }

    // Return rich JSON response
    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (err) {
    console.error('[API 766donvi] Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
