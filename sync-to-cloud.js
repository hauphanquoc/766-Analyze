/**
 * Script thu thập dữ liệu Bộ Chỉ số 766 và lưu trữ (Local Disk + Upstash Cloud nếu có)
 * Cách dùng: node sync-to-cloud.js (hoặc npm run sync)
 */

const fs = require('fs');
const path = require('path');

// Đọc file .env nếu có
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

const collector = require('./src/collector');
const analyzer = require('./src/analyzer');
const storage = require('./src/storage');

async function waitForNetwork(maxWaitMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch('https://dichvucong.gov.vn', {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000)
      });
      if (res && res.status) return true;
    } catch (e) {
      console.log('[Mạng] Đang chờ kết nối Internet sẵn sàng (sau khi mở máy)...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  return false;
}

async function sync() {
  console.log('====================================================');
  console.log('  BẮT ĐẦU THU THẬP & ĐỒNG BỘ DỮ LIỆU BỘ CHỈ SỐ 766  ');
  console.log('====================================================');

  const startTime = Date.now();
  try {
    await waitForNetwork();

    console.log('\n[1/3] Đang thu thập 6 chỉ số từ Cổng DVCQG (mạng trong nước)...');
    const rawResult = await collector.collectAll();

    if (!rawResult.success) {
      throw new Error('Thu thập dữ liệu thất bại: ' + JSON.stringify(rawResult.errors));
    }

    const previousSnapshot = await storage.getLatestSnapshot();

    // Bảo vệ dữ liệu: Nếu lần chạy này bị thiếu chỉ số (< 6/6)
    if (rawResult.successCount < rawResult.totalCount) {
      const todayDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      if (previousSnapshot && previousSnapshot.date === todayDate && previousSnapshot.overview.collectedCount === 6) {
        console.warn(`\n[BẢO VỆ DỮ LIỆU] Lần chạy này chỉ lấy được ${rawResult.successCount}/6 chỉ số (có thể do mạng gián đoạn).`);
        console.warn(`Hôm nay (${todayDate}) đã có sẵn snapshot 6/6 hoàn chỉnh. Hệ thống giữ nguyên dữ liệu đầy đủ, KHÔNG ghi đè.`);
        return;
      }
    }

    console.log(`[1/3] Thu thập thành công ${rawResult.successCount}/6 chỉ số trong ${(rawResult.durationMs / 1000).toFixed(1)}s!`);

    console.log('\n[2/3] Đang phân tích số liệu toàn tỉnh và 119 đơn vị...');
    const analyzed = analyzer.analyzeData(rawResult, previousSnapshot);
    console.log(`[2/3] Phân tích hoàn tất: Tổng điểm ${analyzed.overview.totalScore}đ (${analyzed.overview.classification?.label})`);

    console.log('\n[3/3] Đang lưu trữ dữ liệu (Local Snapshots + Upstash Cloud nếu có)...');
    await storage.saveSnapshot(analyzed);

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'SYNC',
      date: analyzed.date,
      durationMs: Date.now() - startTime,
      totalScore: analyzed.overview.totalScore,
      classification: analyzed.overview.classification?.label,
      success: true,
      unitsCount: analyzed.units?.length || 0
    };
    await storage.recordLog(logEntry);

    console.log('====================================================');
    console.log('  LƯU TRỮ VÀ ĐỒNG BỘ DỮ LIỆU THÀNH CÔNG!            ');
    console.log(`  Ngày dữ liệu: ${analyzed.date}                  `);
    console.log(`  Tổng điểm:    ${analyzed.overview.totalScore} / 100 điểm       `);
    console.log(`  File lưu:     data/snapshots/${analyzed.date}.json `);
    console.log('====================================================');

    // Nhiệm vụ mỗi sáng 6h: Thu thập & xếp hạng 766 của các tỉnh/thành phố
    console.log('\n[XẾP HẠNG CÁC TỈNH] Đang thu thập bảng điểm 766 toàn bộ các tỉnh thành...');
    try {
      const { fetchProvinceRankings } = require('./src/provinceCollector');
      const provData = await fetchProvinceRankings();
      await storage.saveProvinceRankings(provData);
      console.log(`[XẾP HẠNG CÁC TỈNH] Thành công: Cập nhật ${provData.totalCount} tỉnh (Đắk Lắk xếp #${provData.dakLak?.rank || '?'})`);
    } catch (errProv) {
      console.warn('[XẾP HẠNG CÁC TỈNH] Chưa thể cập nhật dữ liệu các tỉnh:', errProv.message);
    }
  } catch (err) {
    console.error('\n[LỖI THU THẬP/LƯU TRỮ]:', err.message);
  }
}

sync();
