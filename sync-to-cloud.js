/**
 * Script thu thập dữ liệu Bộ Chỉ số 766 và lưu trữ cục bộ (Local Only)
 * Cách dùng: node sync-to-cloud.js (hoặc npm run sync)
 * Chế độ: Chỉ lưu vào data/snapshots/ trên máy tính, KHÔNG đẩy lên Vercel Cloud
 */
process.env.SYNC_LOCAL_ONLY = 'true';

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
        process.env[k] = v;
      }
    }
  }
}
process.env.SYNC_LOCAL_ONLY = 'true';

const collector = require('./src/collector');
const analyzer = require('./src/analyzer');
const storage = require('./src/storage');

async function sync() {
  console.log('====================================================');
  console.log('  BẮT ĐẦU THU THẬP & LƯU TRỮ DỮ LIỆU BỘ CHỈ SỐ 766  ');
  console.log('  [CHẾ ĐỘ NỘI BỘ - LƯU MÁY CỤC BỘ / KHÔNG ĐẨY CLOUD] ');
  console.log('====================================================');

  const startTime = Date.now();
  try {
    console.log('\n[1/3] Đang thu thập 6 chỉ số từ Cổng DVCQG (mạng trong nước)...');
    const rawResult = await collector.collectAll();

    if (!rawResult.success) {
      throw new Error('Thu thập dữ liệu thất bại: ' + JSON.stringify(rawResult.errors));
    }

    console.log(`[1/3] Thu thập thành công 6/6 chỉ số trong ${(rawResult.durationMs / 1000).toFixed(1)}s!`);

    console.log('\n[2/3] Đang phân tích số liệu toàn tỉnh và 119 đơn vị...');
    const previousSnapshot = await storage.getLatestSnapshot();
    const analyzed = analyzer.analyzeData(rawResult, previousSnapshot);
    console.log(`[2/3] Phân tích hoàn tất: Tổng điểm ${analyzed.overview.totalScore}đ (${analyzed.overview.classification?.label})`);

    console.log('\n[3/3] Đang lưu trữ dữ liệu cục bộ vào thư mục data/snapshots/...');
    await storage.saveSnapshot(analyzed, { localOnly: true });

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'LOCAL_SYNC_ONLY',
      date: analyzed.date,
      durationMs: Date.now() - startTime,
      totalScore: analyzed.overview.totalScore,
      classification: analyzed.overview.classification?.label,
      success: true,
      unitsCount: analyzed.units?.length || 0
    };
    await storage.recordLog(logEntry, { localOnly: true });

    console.log('====================================================');
    console.log('  LƯU TRỮ DỮ LIỆU CỤC BỘ THÀNH CÔNG!                ');
    console.log(`  Ngày dữ liệu: ${analyzed.date}                  `);
    console.log(`  Tổng điểm:    ${analyzed.overview.totalScore} / 100 điểm       `);
    console.log(`  Chế độ:       Nội bộ (Local Web)                  `);
    console.log(`  File lưu:     data/snapshots/${analyzed.date}.json `);
    console.log(`  Địa chỉ Web:  http://localhost:3000               `);
    console.log('====================================================');
  } catch (err) {
    console.error('\n[LỖI THU THẬP/LƯU TRỮ]:', err.message);
  }
}

sync();
