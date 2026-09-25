const { collectAll } = require('../src/collector');
const { analyzeData } = require('../src/analyzer');
const storage = require('../src/storage');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const host = req.headers.host || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  // Chặn truy cập trên Vercel / domain công khai khi đang tạm ngừng
  if (process.env.VERCEL === '1' || !isLocal) {
    return res.status(503).json({
      success: false,
      suspended: true,
      message: 'Hệ thống ngừng hoạt động cho tới khi có thông báo mới.'
    });
  }

  const { date, action } = req.query || {};

  try {
    if (action === 'dates') {
      const dates = await storage.listDates();
      return res.status(200).json({ success: true, dates });
    }

    if (action === 'history') {
      const history = await storage.getHistory();
      return res.status(200).json({ success: true, history });
    }

    // Specific date requested
    if (date) {
      const snapshot = await storage.getSnapshot(date);
      if (snapshot) {
        return res.status(200).json({ success: true, data: snapshot });
      }
      return res.status(404).json({ success: false, error: `Không tìm thấy dữ liệu ngày ${date}` });
    }

    // Latest date requested
    let latest = await storage.getLatestSnapshot();
    if (!latest) {
      // If no data exists yet, trigger initial crawl automatically
      console.log('[Data API] No stored data found. Performing initial crawl...');
      const raw = await collectAll();
      latest = analyzeData(raw);
      await storage.saveSnapshot(latest);
      await storage.recordLog({
        timestamp: new Date().toISOString(),
        type: 'INITIAL_AUTORUN',
        date: latest.date,
        totalScore: latest.overview.totalScore,
        classification: latest.overview.classification?.label,
        success: true
      });
    }

    // Also get all dates for timeline selector
    const availableDates = await storage.listDates();

    return res.status(200).json({
      success: true,
      data: latest,
      availableDates
    });
  } catch (err) {
    console.error('[Data API] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
