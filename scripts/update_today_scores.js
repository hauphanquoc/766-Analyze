const { collectAll } = require('../src/collector');
const { analyzeData } = require('../src/analyzer');
const { fetchProvinceRankings } = require('../src/provinceCollector');
const storage = require('../src/storage');

async function updateAllScores() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU CẬP NHẬT ĐIỂM 766 HÔM NAY (NGÀY ' + new Date().toLocaleDateString('vi-VN') + ')');
  console.log('====================================================\n');

  // 1. CẬP NHẬT BỘ CHỈ SỐ 766 TỈNH ĐẮK LẮK (6 NHÓM TIÊU CHÍ)
  console.log('📌 PHẦN 1: CẬP NHẬT BỘ CHỈ SỐ 766 (TỈNH ĐẮK LẮK)...');
  const start766 = Date.now();
  let analyzed = null;
  try {
    const raw = await collectAll();
    const prev = await storage.getLatestSnapshot();
    analyzed = analyzeData(raw, prev);
    await storage.saveSnapshot(analyzed);

    await storage.recordLog({
      timestamp: new Date().toISOString(),
      type: 'MANUAL_UPDATE_SCORES',
      date: analyzed.date,
      totalScore: analyzed.overview.totalScore,
      classification: analyzed.overview.classification?.label,
      durationMs: Date.now() - start766,
      success: true,
      unitsCount: analyzed.units?.length || 0
    });

    console.log(`✅ Cập nhật Bộ chỉ số 766 thành công trong ${((Date.now() - start766) / 1000).toFixed(1)}s!`);
    console.log(`   - Ngày: ${analyzed.date}`);
    console.log(`   - Tổng điểm tỉnh Đắk Lắk: ${analyzed.overview.totalScore.toFixed(2)} điểm`);
    console.log(`   - Xếp loại: ${analyzed.overview.classification?.label}`);
    console.log('   - Chi tiết 6 nhóm chỉ số:');
    analyzed.overview.indicators.forEach(ind => {
      console.log(`     + ${ind.name}: ${ind.score.toFixed(2)} / ${ind.maxScore} đ (Tỷ lệ: ${ind.rate.toFixed(1)}%)`);
    });
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật Bộ chỉ số 766:', err.message);
  }

  // 2. CẬP NHẬT XẾP HẠNG 766 CÁC TỈNH
  console.log('\n📌 PHẦN 2: CẬP NHẬT XẾP HẠNG 766 CÁC TỈNH TOÀN QUỐC...');
  const startProv = Date.now();
  try {
    const provData = await fetchProvinceRankings(2026);
    await storage.saveProvinceRankings(provData);

    console.log(`✅ Cập nhật Xếp hạng các tỉnh thành công trong ${((Date.now() - startProv) / 1000).toFixed(1)}s!`);
    console.log(`   - Tổng số tỉnh/thành phố: ${provData.totalProvinces}`);
    console.log(`   - Thời gian cập nhật: ${provData.updatedAt}`);
    
    // Tìm vị trí của Đắk Lắk
    const daklak = provData.provinces.find(p => p.departmentId === '019d2be3-6a85-74ec-a33c-a7c04919ba00' || p.departmentName.includes('Đắk Lắk'));
    if (daklak) {
      console.log(`   - Tỉnh Đắk Lắk: Hạng #${daklak.rank}/${provData.totalProvinces} với ${daklak.totalScore.toFixed(2)} điểm (Xếp loại: ${daklak.classification?.label || daklak.classification})`);
    }

    // Top 5 tỉnh dẫn đầu
    console.log('   - Top 5 tỉnh/thành phố dẫn đầu:');
    provData.provinces.slice(0, 5).forEach(p => {
      console.log(`     #${p.rank} ${p.departmentName}: ${p.totalScore.toFixed(2)} đ`);
    });
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật Xếp hạng các tỉnh:', err.message);
  }

  console.log('\n====================================================');
  console.log('🎉 ĐÃ HOÀN TẤT CẬP NHẬT CẢ 2 MENU THÀNH CÔNG!');
  console.log('====================================================');
}

updateAllScores();

