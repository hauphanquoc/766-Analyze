const { collectAll } = require('../src/collector');
const { analyzeData } = require('../src/analyzer');
const storage = require('../src/storage');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const host = req.headers.host || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  if (process.env.VERCEL === '1' || !isLocal) {
    return res.status(503).json({
      success: false,
      suspended: true,
      message: 'Hệ thống ngừng hoạt động cho tới khi có thông báo mới.'
    });
  }

  const startTime = Date.now();
  console.log('[Manual Crawl] Starting collection from DVCQG...');

  try {
    const rawResult = await collectAll();
    const previousSnapshot = await storage.getLatestSnapshot();
    const analyzed = analyzeData(rawResult, previousSnapshot);

    await storage.saveSnapshot(analyzed);

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'MANUAL_CRAWL',
      date: analyzed.date,
      durationMs: Date.now() - startTime,
      totalScore: analyzed.overview.totalScore,
      classification: analyzed.overview.classification?.label,
      success: true,
      unitsCount: analyzed.units?.length || 0
    };

    await storage.recordLog(logEntry);

    return res.status(200).json({
      success: true,
      message: 'Dữ liệu đã được cập nhật thành công!',
      data: analyzed
    });
  } catch (err) {
    console.error('[Manual Crawl] Error:', err);
    await storage.recordLog({
      timestamp: new Date().toISOString(),
      type: 'MANUAL_CRAWL',
      success: false,
      error: err.message
    });
    return res.status(500).json({ success: false, error: err.message });
  }
};
