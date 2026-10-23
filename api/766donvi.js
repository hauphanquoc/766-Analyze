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
 * Extract only the 6 main criteria (without smaller sub-metrics)
 */
function extractMainIndicators(scores = {}, indicatorDetails = {}) {
  return CRITERIA_DEFINITIONS.map((def) => {
    const detail = indicatorDetails[def.key] || {};
    const score = scores[def.key] != null
      ? Number(Number(scores[def.key]).toFixed(2))
      : (detail.score != null ? Number(Number(detail.score).toFixed(2)) : 0);
    const maxScore = detail.maxScore || def.maxScore;
    const ratio = detail.ratio != null
      ? Number(Number(detail.ratio).toFixed(2))
      : (maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0);

    return {
      key: def.key,
      name: def.name,
      score,
      maxScore,
      ratio
    };
  });
}

/**
 * Format a beautiful and concise plain text message optimized for Zalo chat
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
    lines.push(`${numIcon} ${ind.name}: ${ind.score} / ${ind.maxScore} đ (${ind.ratio}%)`);
  });

  lines.push('──────────────────────────────');
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
        message: 'API Tra cứu Điểm 766 Bộ Chỉ số DVCQG (6 tiêu chí)',
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
      const provScores = {
        transparency: snapshot.indicators?.transparency?.score ?? 0,
        progress: snapshot.indicators?.progress?.score ?? 0,
        onlineService: snapshot.indicators?.onlineService?.score ?? 0,
        digitized: snapshot.indicators?.digitized?.score ?? 0,
        payment: snapshot.indicators?.payment?.score ?? 0,
        satisfaction: snapshot.indicators?.satisfaction?.score ?? 0
      };
      const indicators = extractMainIndicators(provScores, snapshot.indicators);

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
        summary: provScores,
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

    // 8. Extract only 6 main indicators (clean, concise)
    const indicators = extractMainIndicators(matchedUnit.scores, matchedUnit.indicatorDetails);

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
