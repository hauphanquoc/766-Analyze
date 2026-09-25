const { collectAll } = require('../src/collector');
const { analyzeData } = require('../src/analyzer');
const storage = require('../src/storage');

module.exports = async function handler(req, res) {
  const host = req.headers.host || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  if (process.env.VERCEL === '1' || !isLocal) {
    return res.status(503).json({
      success: false,
      suspended: true,
      message: 'Hệ thống ngừng hoạt động cho tới khi có thông báo mới.'
    });
  }

  // Verify Vercel Cron authorization if secret is configured
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized cron request' });
  }

  const startTime = Date.now();
  console.log('[Cron] Triggered 06:00 AM daily job...');

  try {
    const rawResult = await collectAll();
    const previousSnapshot = await storage.getLatestSnapshot();
    const analyzed = analyzeData(rawResult, previousSnapshot);

    await storage.saveSnapshot(analyzed);

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'CRON_JOB',
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
      message: 'Cron job executed successfully',
      data: {
        date: analyzed.date,
        totalScore: analyzed.overview.totalScore,
        classification: analyzed.overview.classification?.label,
        durationMs: Date.now() - startTime
      }
    });
  } catch (err) {
    console.error('[Cron] Error during execution:', err);
    await storage.recordLog({
      timestamp: new Date().toISOString(),
      type: 'CRON_JOB',
      success: false,
      error: err.message
    });
    return res.status(500).json({ success: false, error: err.message });
  }
};
