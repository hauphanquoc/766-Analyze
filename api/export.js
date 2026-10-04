const { generateWorkbook } = require('../src/excelGenerator');
const storage = require('../src/storage');

module.exports = async function handler(req, res) {
  const { date } = req.query || {};

  try {
    let snapshot = null;
    if (date) {
      snapshot = await storage.getSnapshot(date);
    }
    if (!snapshot) {
      snapshot = await storage.getLatestSnapshot();
    }

    if (!snapshot) {
      return res.status(404).json({ error: 'Không có dữ liệu để xuất Excel' });
    }

    const workbook = await generateWorkbook(snapshot);
    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `Bao_cao_Chi_so_766_${snapshot.date || 'DVC'}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.setHeader('Content-Length', buffer.length);

    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('[Export API] Error generating Excel:', err);
    return res.status(500).json({ error: 'Lỗi khi xuất file Excel: ' + err.message });
  }
};
