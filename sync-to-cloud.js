/**
 * Script đồng bộ dữ liệu từ máy tính (mạng VNPT trong nước) lên Cloud Redis của Vercel
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
        process.env[k] = v;
      }
    }
  }
}

const collector = require('./src/collector');
const analyzer = require('./src/analyzer');
const storage = require('./src/storage');

async function sync() {
  console.log('====================================================');
  console.log('  BẮT ĐẦU ĐỒNG BỘ DỮ LIỆU BỘ CHỈ SỐ 766 LÊN CLOUD  ');
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

    console.log('\n[3/3] Đang lưu trữ và đồng bộ lên Cloud Redis (Upstash)...');
    await storage.saveSnapshot(analyzed);

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'LOCAL_SYNC_TO_CLOUD',
      date: analyzed.date,
      durationMs: Date.now() - startTime,
      totalScore: analyzed.overview.totalScore,
      classification: analyzed.overview.classification?.label,
      success: true,
      unitsCount: analyzed.units?.length || 0
    };
    await storage.recordLog(logEntry);

    console.log('====================================================');
    console.log('  ĐỒNG BỘ THÀNH CÔNG LÊN VERCEL CLOUD REDIS!        ');
    console.log(`  Ngày dữ liệu: ${analyzed.date}                  `);
    console.log(`  Tổng điểm:    ${analyzed.overview.totalScore} / 100 điểm       `);
    console.log(`  Website:      https://766-analyze.vercel.app      `);
    console.log('====================================================');
  } catch (err) {
    console.error('\n[LỖI ĐỒNG BỘ]:', err.message);
  }
}

sync();
