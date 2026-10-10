/**
 * Module tạo Mã QR tra cứu Thủ tục hành chính (TTHC) có Logo Đắk Lắk ở giữa
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { PNG } = require('pngjs');

const DEFAULT_LOGO_PATH = path.join(__dirname, '..', 'icon-qr.png');

/**
 * Xây dựng URL tra cứu thủ tục hành chính chuẩn Cổng DVC Quốc gia
 * @param {string} procedureCode - Mã thủ tục (VD: 2.000206)
 * @returns {string} URL tra cứu đầy đủ
 */
function buildProcedureLookupUrl(procedureCode) {
  if (!procedureCode || typeof procedureCode !== 'string') {
    throw new Error('Mã thủ tục không hợp lệ');
  }
  const cleanCode = procedureCode.trim();
  return `https://dichvucong.gov.vn/tra-cuu-thu-tuc/danh-sach?keyword=${encodeURIComponent(cleanCode)}&showAdvanced=false&formalityType=STANDARD&limit=10&activeKey=STANDARD`;
}

/**
 * Tạo mã QR cho thủ tục hành chính có gắn Logo ở giữa
 * @param {string} procedureCode - Mã thủ tục (VD: 2.000206)
 * @param {object} options - Các tùy chọn
 * @returns {Promise<{ url: string, buffer: Buffer, dataUrl: string, width: number }>}
 */
async function generateProcedureQRCode(procedureCode, options = {}) {
  const url = buildProcedureLookupUrl(procedureCode);
  const qrSize = options.width || 800;
  const logoPath = options.logoPath || DEFAULT_LOGO_PATH;

  // 1. Sinh QR Code PNG với Error Correction Level H (phục hồi lỗi 30%)
  const qrBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: qrSize,
    margin: 3,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  const qrPng = PNG.sync.read(qrBuffer);

  // 2. Chèn Logo Đắk Lắk ở chính giữa nếu có file logo
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    const logoPng = PNG.sync.read(logoBuffer);

    // Kích thước logo ~ 22% chiều rộng QR
    const logoSize = Math.round(qrSize * 0.22);
    const centerX = Math.round(qrSize / 2);
    const centerY = Math.round(qrSize / 2);
    const bgRadius = Math.round(logoSize / 2 + 8); // Vòng đệm nền trắng an toàn

    // Vẽ nền tròn màu trắng phía sau logo để xóa các module QR đen
    for (let y = centerY - bgRadius - 2; y <= centerY + bgRadius + 2; y++) {
      for (let x = centerX - bgRadius - 2; x <= centerX + bgRadius + 2; x++) {
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (dist <= bgRadius) {
          const idx = (qrSize * y + x) << 2;
          qrPng.data[idx] = 255;     // R
          qrPng.data[idx + 1] = 255; // G
          qrPng.data[idx + 2] = 255; // B
          qrPng.data[idx + 3] = 255; // A
        }
      }
    }

    // Vẽ viền mỏng bao quanh logo
    for (let y = centerY - bgRadius - 2; y <= centerY + bgRadius + 2; y++) {
      for (let x = centerX - bgRadius - 2; x <= centerX + bgRadius + 2; x++) {
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (dist >= bgRadius - 2 && dist <= bgRadius) {
          const idx = (qrSize * y + x) << 2;
          qrPng.data[idx] = 226;     // Màu viền vi-VN #e2e8f0
          qrPng.data[idx + 1] = 232;
          qrPng.data[idx + 2] = 240;
          qrPng.data[idx + 3] = 255;
        }
      }
    }

    // Ghép ảnh logo với thuật toán nội suy Bilinear
    const logoStartX = Math.round(centerX - logoSize / 2);
    const logoStartY = Math.round(centerY - logoSize / 2);

    for (let ly = 0; ly < logoSize; ly++) {
      for (let lx = 0; lx < logoSize; lx++) {
        const srcX = (lx / logoSize) * (logoPng.width - 1);
        const srcY = (ly / logoSize) * (logoPng.height - 1);

        const x0 = Math.floor(srcX);
        const x1 = Math.min(x0 + 1, logoPng.width - 1);
        const y0 = Math.floor(srcY);
        const y1 = Math.min(y0 + 1, logoPng.height - 1);

        const dx = srcX - x0;
        const dy = srcY - y0;

        const idx00 = (logoPng.width * y0 + x0) << 2;
        const idx10 = (logoPng.width * y0 + x1) << 2;
        const idx01 = (logoPng.width * y1 + x0) << 2;
        const idx11 = (logoPng.width * y1 + x1) << 2;

        const alphaVal = (1 - dx) * (1 - dy) * logoPng.data[idx00 + 3] +
                         dx * (1 - dy) * logoPng.data[idx10 + 3] +
                         (1 - dx) * dy * logoPng.data[idx01 + 3] +
                         dx * dy * logoPng.data[idx11 + 3];

        const alpha = alphaVal / 255;
        const targetX = logoStartX + lx;
        const targetY = logoStartY + ly;

        if (targetX >= 0 && targetX < qrSize && targetY >= 0 && targetY < qrSize && alpha > 0) {
          const targetIdx = (qrSize * targetY + targetX) << 2;
          for (let rgb = 0; rgb < 3; rgb++) {
            const srcColor = (1 - dx) * (1 - dy) * logoPng.data[idx00 + rgb] +
                             dx * (1 - dy) * logoPng.data[idx10 + rgb] +
                             (1 - dx) * dy * logoPng.data[idx01 + rgb] +
                             dx * dy * logoPng.data[idx11 + rgb];
            qrPng.data[targetIdx + rgb] = Math.round(srcColor * alpha + qrPng.data[targetIdx + rgb] * (1 - alpha));
          }
        }
      }
    }
  }

  const outBuffer = PNG.sync.write(qrPng);
  const dataUrl = `data:image/png;base64,${outBuffer.toString('base64')}`;

  if (options.outputPath) {
    fs.writeFileSync(options.outputPath, outBuffer);
  }

  return {
    url,
    buffer: outBuffer,
    dataUrl,
    width: qrSize
  };
}

// Cho phép chạy trực tiếp từ dòng lệnh
if (require.main === module) {
  const code = process.argv[2] || '2.000206';
  const outPath = process.argv[3] || `qr-${code}.png`;
  generateProcedureQRCode(code, { outputPath: outPath })
    .then(res => {
      console.log(`Đã tạo thành công mã QR cho thủ tục [${code}]:`);
      console.log(`- URL: ${res.url}`);
      console.log(`- File xuất: ${outPath} (${res.buffer.length} bytes)`);
    })
    .catch(err => {
      console.error('Lỗi tạo mã QR:', err);
    });
}

module.exports = {
  buildProcedureLookupUrl,
  generateProcedureQRCode
};
