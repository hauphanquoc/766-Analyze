const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { collectAll } = require('./src/collector');
const { analyzeData } = require('./src/analyzer');
const storage = require('./src/storage');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serverless functions adapter for Express
const cronHandler = require('./api/cron');
const crawlHandler = require('./api/crawl');
const dataHandler = require('./api/data');
const exportHandler = require('./api/export');
const provincesHandler = require('./api/provinces');

app.all('/api/cron', (req, res) => cronHandler(req, res));
app.all('/api/crawl', (req, res) => crawlHandler(req, res));
app.all('/api/data', (req, res) => dataHandler(req, res));
app.all('/api/export', (req, res) => exportHandler(req, res));
app.all('/api/provinces', (req, res) => provincesHandler(req, res));

// Fallback to index.html for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local Cron Job: 06:00 AM every day
cron.schedule('0 6 * * *', async () => {
  console.log('[Local Cron] Running daily 06:00 AM collection task...');
  try {
    const raw = await collectAll();
    const prev = await storage.getLatestSnapshot();
    const analyzed = analyzeData(raw, prev);
    await storage.saveSnapshot(analyzed);
    await storage.recordLog({
      timestamp: new Date().toISOString(),
      type: 'LOCAL_CRON_6AM',
      date: analyzed.date,
      totalScore: analyzed.overview.totalScore,
      classification: analyzed.overview.classification?.label,
      success: true
    });
    console.log('[Local Cron] Task finished successfully for date:', analyzed.date);

    // Nhiệm vụ mỗi sáng thứ 6: Thu thập bảng xếp hạng 766 các tỉnh
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 5) {
      console.log('[Local Cron] [Sáng thứ 6] Đang thu thập bảng xếp hạng 766 các tỉnh...');
      const { fetchProvinceRankings } = require('./src/provinceCollector');
      const provData = await fetchProvinceRankings();
      await storage.saveProvinceRankings(provData);
      console.log('[Local Cron] [Sáng thứ 6] Cập nhật xếp hạng các tỉnh thành công!');
    }
  } catch (err) {
    console.error('[Local Cron] Task failed:', err);
  }
});

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`  HỆ THỐNG THEO DÕI BỘ CHỈ SỐ 766 DVCQG ĐANG CHẠY  `);
  console.log(`  Địa chỉ: http://localhost:${PORT}                 `);
  console.log(`  Lịch tự động: 06:00:00 Sáng hàng ngày (node-cron) `);
  console.log('====================================================');
});
