const config = require('./config');

/**
 * Classify performance based on total score (out of 100)
 */
function getClassification(totalScore) {
  if (totalScore >= 90) return { label: 'Xuất sắc', grade: 'excellent', color: '#10b981' };
  if (totalScore >= 80) return { label: 'Tốt', grade: 'good', color: '#3b82f6' };
  if (totalScore >= 70) return { label: 'Khá', grade: 'fair', color: '#f59e0b' };
  if (totalScore >= 50) return { label: 'Trung bình', grade: 'average', color: '#ec4899' };
  return { label: 'Yếu / Kém', grade: 'poor', color: '#ef4444' };
}

/**
 * Format agency level name in Vietnamese
 */
function getAgencyLevelName(type, level) {
  if (level === 'PROVINCE' || type === 'PROVINCE') return 'Cấp Tỉnh';
  if (level === 'DISTRICT' || type === 'DISTRICT') return 'UBND Cấp Huyện/Thị xã/TP';
  if (level === 'COMMUNE' || type === 'COMMUNE' || type === 'COMMUNE_UNIT') return 'Cấp Xã / Đơn vị trực thuộc';
  if (type === 'DEPARTMENT' || type === 'MINISTRY') return 'Sở / Ban / Ngành';
  return 'Đơn vị chuyên trách';
}

/**
 * Analyze raw collection data from the 6 APIs
 */
function analyzeData(collectionResult, previousSnapshot = null) {
  const { results, timestamp, year } = collectionResult;

  // 1. Province Overview (UBND tỉnh Đắk Lắk)
  const indicatorSummaries = {};
  let calculatedTotalScore = 0;
  let maxTotalPossible = 0;

  for (const ind of config.INDICATORS) {
    const rawRes = results[ind.key];
    maxTotalPossible += ind.maxScore;

    if (!rawRes || !rawRes.success || !rawRes.data) {
      indicatorSummaries[ind.key] = {
        key: ind.key,
        name: ind.name,
        shortName: ind.shortName,
        maxScore: ind.maxScore,
        score: 0,
        ratio: 0,
        metrics: [],
        status: 'ERROR'
      };
      continue;
    }

    const data = rawRes.data;
    let score = 0;
    let ratio = 0;
    let metrics = [];
    let monthlyChart = data.monthlyChart || null;

    if (ind.type === 'overview_list' && data.overview) {
      score = Number((data.overview.totalScore ?? 0).toFixed(2));
      ratio = Number((data.overview.ratio ?? (score / ind.maxScore) * 100).toFixed(2));
      metrics = (data.overview.metrics || []).map((m) => ({
        code: m.code,
        name: m.name,
        numerator: m.numerator ?? 0,
        denominator: m.denominator ?? 0,
        ratio: m.ratio != null ? Number(m.ratio.toFixed(2)) : 0,
        score: m.score != null ? Number(m.score.toFixed(2)) : 0,
        maxScore: m.maxScore ?? 0,
        note: m.dataQualityMessage || ''
      }));
    } else if (ind.type === 'tree' && data.parent) {
      score = Number((data.parent.totalScore ?? data.parent.score ?? 0).toFixed(2));
      ratio = Number((data.parent.ratio ?? (score / ind.maxScore) * 100).toFixed(2));
      
      // Tree types may have specific top-level breakdown
      if (ind.key === 'progress') {
        const p = data.parent;
        const totalReceived = p.totalReceived ?? 0;
        const totalOnTime = p.totalOnTime ?? 0;
        const totalOverdue = p.totalOverdue ?? 0;
        const avgProcessingDays = p.avgProcessingDays ?? 0;
        const onTimeRatio = totalReceived > 0
          ? Number(((totalOnTime / totalReceived) * 100).toFixed(2))
          : 0;
        const overdueRatio = totalReceived > 0
          ? Number(((totalOverdue / totalReceived) * 100).toFixed(2))
          : 0;

        metrics = {
          totalReceived,
          avgProcessingDays,
          onTime: {
            name: 'Hồ sơ giải quyết đúng hạn',
            desc: 'Số hồ sơ giải quyết đúng hạn (và trước hạn) trên tổng số hồ sơ tiếp nhận',
            numerator: totalOnTime,
            denominator: totalReceived,
            ratio: onTimeRatio,
            score: score,
            maxScore: 20
          },
          overdue: {
            name: 'Hồ sơ giải quyết quá hạn',
            desc: 'Số hồ sơ giải quyết quá hạn trên tổng số hồ sơ tiếp nhận',
            numerator: totalOverdue,
            denominator: totalReceived,
            ratio: overdueRatio,
            score: null
          }
        };
      } else if (ind.key === 'payment') {
        const d = data.parent;
        const ratio1 = d.totalDossierFinancialObligation > 0
          ? Number(((d.totalDossierOnlinePaymentSuccess / d.totalDossierFinancialObligation) * 100).toFixed(2))
          : 0;
        const ratio2 = d.totalFeeDossierFormalityDistinct > 0
          ? Number(((d.totalDossierOnlineFormalityPaymentSuccess / d.totalFeeDossierFormalityDistinct) * 100).toFixed(2))
          : 0;
        const ratio3 = (d.totalFeeFormality || d.totalFeeDossierFormalityDistinct) > 0
          ? Number(((d.totalFeeDossierFormality / (d.totalFeeFormality || d.totalFeeDossierFormalityDistinct)) * 100).toFixed(2))
          : 0;

        metrics = [
          {
            name: 'Tỷ lệ hồ sơ thanh toán trực tuyến',
            desc: 'Số hồ sơ thanh toán trực tuyến thành công trên tổng số hồ sơ có nghĩa vụ tài chính',
            numerator: d.totalDossierOnlinePaymentSuccess ?? 0,
            denominator: d.totalDossierFinancialObligation ?? 0,
            ratio: ratio1
          },
          {
            name: 'Tỷ lệ TTHC có phát sinh giao dịch thanh toán trực tuyến',
            desc: 'Số TTHC có phát sinh giao dịch thanh toán trực tuyến trên tổng số TTHC có phát sinh hồ sơ có thu phí',
            numerator: d.totalDossierOnlineFormalityPaymentSuccess ?? 0,
            denominator: d.totalFeeDossierFormalityDistinct ?? 0,
            ratio: ratio2
          },
          {
            name: 'Tỷ lệ TTHC có thu phí, lệ phí phát sinh hồ sơ',
            desc: 'Số TTHC có thu phí, lệ phí có phát sinh hồ sơ trên tổng số TTHC có thu phí, lệ phí',
            numerator: d.totalFeeDossierFormality ?? 0,
            denominator: d.totalFeeFormality ?? d.totalFeeDossierFormalityDistinct ?? 0,
            ratio: ratio3
          }
        ];
      }
    }

    calculatedTotalScore += score;
    indicatorSummaries[ind.key] = {
      key: ind.key,
      name: ind.name,
      shortName: ind.shortName,
      maxScore: ind.maxScore,
      score,
      ratio,
      metrics,
      monthlyChart,
      status: 'OK'
    };
  }

  calculatedTotalScore = Number(calculatedTotalScore.toFixed(2));
  const overallRatio = Number(((calculatedTotalScore / maxTotalPossible) * 100).toFixed(2));
  const classification = getClassification(calculatedTotalScore);

  // Compare with previous day if available
  let deltaScore = null;
  let deltaDirection = 'same';
  if (previousSnapshot && previousSnapshot.overview && typeof previousSnapshot.overview.totalScore === 'number') {
    deltaScore = Number((calculatedTotalScore - previousSnapshot.overview.totalScore).toFixed(2));
    if (deltaScore > 0) deltaDirection = 'up';
    else if (deltaScore < 0) deltaDirection = 'down';
  }

  // 2. Child Units (Sở, Ban, Ngành, Huyện, Thị xã, Xã phường)
  const unitsMap = new Map();

  // Helper to ensure unit entry exists
  function getOrCreateUnit(id, name, code, type, level) {
    if (!unitsMap.has(id)) {
      unitsMap.set(id, {
        departmentId: id,
        departmentName: name || 'Chưa đặt tên',
        departmentCode: code || '',
        departmentType: type || '',
        departmentLevel: level || '',
        levelLabel: getAgencyLevelName(type, level),
        scores: {
          transparency: 0,
          progress: 0,
          onlineService: 0,
          digitized: 0,
          payment: 0,
          satisfaction: 0
        },
        indicatorDetails: {
          transparency: null,
          progress: null,
          onlineService: null,
          digitized: null,
          payment: null,
          satisfaction: null
        },
        totalScore: 0,
        maxScore: 100
      });
    }
    const unit = unitsMap.get(id);
    if (!unit.departmentName && name) unit.departmentName = name;
    if (!unit.departmentCode && code) unit.departmentCode = code;
    if (!unit.departmentType && type) unit.departmentType = type;
    if (!unit.departmentLevel && level) unit.departmentLevel = level;
    return unit;
  }

  // Extract from overview_list APIs (transparency, digitized, satisfaction)
  const listKeys = ['transparency', 'digitized', 'satisfaction'];
  for (const key of listKeys) {
    const list = results[key]?.data?.evaluation || [];
    for (const item of list) {
      if (!item.departmentId) continue;
      const u = getOrCreateUnit(
        item.departmentId,
        item.departmentName,
        item.departmentCode,
        item.departmentType,
        item.departmentLevel
      );
      const score = Number((item.totalScore ?? item.score ?? 0).toFixed(2));
      u.scores[key] = score;
      u.indicatorDetails[key] = {
        score,
        maxScore: item.totalMaxScore ?? (key === 'digitized' ? 22 : 18),
        ratio: item.ratio != null ? Number(item.ratio.toFixed(2)) : 0,
        metrics: (item.metrics || []).map((m) => ({
          code: m.code,
          name: m.name,
          numerator: m.numerator ?? null,
          denominator: m.denominator ?? null,
          ratio: m.ratio != null ? Number(m.ratio.toFixed(2)) : 0,
          score: m.score != null ? Number(m.score.toFixed(2)) : 0,
          maxScore: m.maxScore ?? null,
          note: m.dataQualityMessage || ''
        }))
      };
    }
  }

  // Extract from tree APIs (progress, onlineService, payment)
  const treeKeys = ['progress', 'onlineService', 'payment'];
  for (const key of treeKeys) {
    const list = results[key]?.data?.children || [];
    for (const item of list) {
      if (!item.departmentId) continue;
      const u = getOrCreateUnit(
        item.departmentId,
        item.departmentName,
        item.departmentCode,
        item.departmentType,
        item.level || item.departmentLevel
      );
      const score = Number((item.totalScore ?? item.score ?? 0).toFixed(2));
      u.scores[key] = score;

      if (key === 'progress') {
        const totalReceived = item.totalReceived ?? 0;
        const totalOnTime = item.totalOnTime ?? 0;
        const totalOverdue = item.totalOverdue ?? 0;
        const avgProcessingDays = item.avgProcessingDays ?? 0;
        const onTimeRatio = totalReceived > 0
          ? Number(((totalOnTime / totalReceived) * 100).toFixed(2))
          : 0;
        const overdueRatio = totalReceived > 0
          ? Number(((totalOverdue / totalReceived) * 100).toFixed(2))
          : 0;

        u.indicatorDetails.progress = {
          score,
          maxScore: item.maxScore ?? 20,
          ratio: item.ratio != null ? Number(item.ratio.toFixed(2)) : 0,
          isProgressDedicated: true,
          totalReceived,
          avgProcessingDays,
          onTime: {
            name: 'Hồ sơ giải quyết đúng hạn',
            desc: 'Số hồ sơ giải quyết đúng hạn (và trước hạn) trên tổng số hồ sơ tiếp nhận',
            numerator: totalOnTime,
            denominator: totalReceived,
            ratio: onTimeRatio,
            score: score,
            maxScore: 20
          },
          overdue: {
            name: 'Hồ sơ giải quyết quá hạn',
            desc: 'Số hồ sơ giải quyết quá hạn trên tổng số hồ sơ tiếp nhận',
            numerator: totalOverdue,
            denominator: totalReceived,
            ratio: overdueRatio,
            score: null
          }
        };
      } else if (key === 'payment') {
        const ratio1 = item.totalDossierFinancialObligation > 0
          ? Number(((item.totalDossierOnlinePaymentSuccess / item.totalDossierFinancialObligation) * 100).toFixed(2))
          : 0;
        const ratio2 = item.totalFeeDossierFormalityDistinct > 0
          ? Number(((item.totalDossierOnlineFormalityPaymentSuccess / item.totalFeeDossierFormalityDistinct) * 100).toFixed(2))
          : 0;
        const ratio3 = (item.totalFeeFormality || item.totalFeeDossierFormalityDistinct) > 0
          ? Number(((item.totalFeeDossierFormality / (item.totalFeeFormality || item.totalFeeDossierFormalityDistinct)) * 100).toFixed(2))
          : 0;

        u.indicatorDetails.payment = {
          score,
          maxScore: item.totalMaxScore ?? 10,
          ratio: item.ratio != null ? Number(item.ratio.toFixed(2)) : 0,
          isPaymentDedicated: true,
          metrics: [
            {
              name: 'Tỷ lệ hồ sơ thanh toán trực tuyến',
              desc: 'Số hồ sơ thanh toán trực tuyến thành công trên tổng số hồ sơ có nghĩa vụ tài chính',
              numerator: item.totalDossierOnlinePaymentSuccess ?? 0,
              denominator: item.totalDossierFinancialObligation ?? 0,
              ratio: ratio1
            },
            {
              name: 'Tỷ lệ TTHC có phát sinh giao dịch thanh toán trực tuyến',
              desc: 'Số TTHC có phát sinh giao dịch thanh toán trực tuyến trên tổng số TTHC có phát sinh hồ sơ có thu phí',
              numerator: item.totalDossierOnlineFormalityPaymentSuccess ?? 0,
              denominator: item.totalFeeDossierFormalityDistinct ?? 0,
              ratio: ratio2
            },
            {
              name: 'Tỷ lệ TTHC có thu phí, lệ phí phát sinh hồ sơ',
              desc: 'Số TTHC có thu phí, lệ phí có phát sinh hồ sơ trên tổng số TTHC có thu phí, lệ phí',
              numerator: item.totalFeeDossierFormality ?? 0,
              denominator: item.totalFeeFormality ?? item.totalFeeDossierFormalityDistinct ?? 0,
              ratio: ratio3
            }
          ]
        };
      } else if (key === 'onlineService') {
        u.indicatorDetails.onlineService = {
          score,
          maxScore: item.totalMaxScore ?? 12,
          ratio: item.ratio != null ? Number(item.ratio.toFixed(2)) : 0,
          metrics: [
            { name: 'Tỷ lệ cung cấp dịch vụ công trực tuyến & nộp hồ sơ trực tuyến', numerator: null, denominator: null, ratio: item.ratio != null ? Number(item.ratio.toFixed(2)) : 0, score: score, maxScore: 12 }
          ]
        };
      }
    }
  }

  // Calculate total score and rank units
  const units = Array.from(unitsMap.values()).map((unit) => {
    const sum = Object.values(unit.scores).reduce((a, b) => a + b, 0);
    unit.totalScore = Number(sum.toFixed(2));
    unit.classification = getClassification(unit.totalScore);
    return unit;
  });

  // Sort descending by total score
  units.sort((a, b) => b.totalScore - a.totalScore);
  units.forEach((u, idx) => {
    u.rank = idx + 1;
  });

  // Top and Bottom performing units
  const topUnits = units.slice(0, 5);
  const bottomUnits = units.slice(-5).reverse();

  // Date strings (YYYY-MM-DD)
  const dateStr = timestamp ? timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10);

  return {
    date: dateStr,
    timestamp,
    year,
    department: {
      id: config.DEFAULT_DEPARTMENT_ID,
      name: config.DEFAULT_DEPARTMENT_NAME,
      code: config.DEFAULT_DEPARTMENT_CODE
    },
    overview: {
      totalScore: calculatedTotalScore,
      maxScore: maxTotalPossible,
      ratio: overallRatio,
      classification,
      deltaScore,
      deltaDirection,
      collectedCount: collectionResult.successCount,
      totalExpected: collectionResult.totalCount,
      durationMs: collectionResult.durationMs
    },
    indicators: indicatorSummaries,
    unitsSummary: {
      totalUnits: units.length,
      topUnits,
      bottomUnits
    },
    units
  };
}

module.exports = {
  analyzeData,
  getClassification
};
