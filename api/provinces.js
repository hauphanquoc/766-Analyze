const storage = require('../src/storage');
const { fetchProvinceRankings } = require('../src/provinceCollector');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const forceRefresh = req.query?.refresh === 'true' || req.body?.refresh === true;

  try {
    let data = !forceRefresh ? await storage.getProvinceRankings() : null;
    if (!data) {
      data = await fetchProvinceRankings();
      await storage.saveProvinceRankings(data);
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error('[Provinces API Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
