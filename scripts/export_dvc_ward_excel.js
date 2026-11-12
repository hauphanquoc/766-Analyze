const https = require('https');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const CSDL_HOST = 'csdltthc.dichvucong.gov.vn';
const BASE_ORIGIN = `https://${CSDL_HOST}`;
const LANDING_URL = `${BASE_ORIGIN}/ap-dung-dich-vu-cong`;

/**
 * Trình quản lý WAF Session & Cookie
 */
class AntiWafManager {
  constructor() {
    this.cookies = new Map();
    this.lastInitTime = 0;
    this.sessionLifetimeMs = 15 * 60 * 1000;
  }

  setFromHeaders(headers) {
    if (!headers) return;
    const raw = headers['set-cookie'] || [];
    const list = Array.isArray(raw) ? raw : [raw];
    for (const item of list) {
      if (!item) continue;
      const first = item.split(';')[0];
      const idx = first.indexOf('=');
      if (idx > 0) {
        const key = first.slice(0, idx).trim();
        const val = first.slice(idx + 1).trim();
        if (key && val) {
          this.cookies.set(key, val);
        }
      }
    }
  }

  getCookieString(manualCookie = '') {
    const tempMap = new Map(this.cookies);
    if (manualCookie) {
      const parts = manualCookie.split(';');
      for (const part of parts) {
        const idx = part.indexOf('=');
        if (idx > 0) {
          const k = part.slice(0, idx).trim();
          const v = part.slice(idx + 1).trim();
          if (k && v) tempMap.set(k, v);
        }
      }
    }
    const pairs = [];
    for (const [k, v] of tempMap.entries()) {
      pairs.push(`${k}=${v}`);
    }
    return pairs.join('; ');
  }

  async initSession(force = false) {
    const now = Date.now();
    if (!force && this.cookies.size > 0 && (now - this.lastInitTime < this.sessionLifetimeMs)) {
      return;
    }

    return new Promise((resolve) => {
      const req = https.request({
        hostname: CSDL_HOST,
        port: 443,
        path: '/ap-dung-dich-vu-cong',
        method: 'GET',
        rejectUnauthorized: false,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0',
          'sec-ch-ua': '"Not-A.Brand";v="99", "Microsoft Edge";v="157", "Chromium";v="157"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none'
        },
        timeout: 15000
      }, (res) => {
        this.setFromHeaders(res.headers);
        this.lastInitTime = Date.now();
        resolve();
      });

      req.on('error', () => resolve());
      req.on('timeout', () => { req.destroy(); resolve(); });
      req.end();
    });
  }
}

const wafManager = new AntiWafManager();

function sanitizeToken(token) {
  if (!token) return '';
  let clean = String(token).trim();
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      clean = parsed.access_token || parsed.idToken || parsed.token || clean;
    } catch (e) {}
  }
  clean = clean.replace(/^{{\s*[\w.-]+\s*}}/, '').trim();
  if (clean.toLowerCase().startsWith('bearer ')) {
    return clean;
  }
  return `Bearer ${clean}`;
}

function formatVnd(amount) {
  if (amount === undefined || amount === null || amount === '') return '0 đ';
  const n = Number(amount);
  if (isNaN(n)) return String(amount);
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function makeCsdlPost(apiPath, bearerToken, bodyPayload = {}, manualCookie = '', retryCount = 0) {
  await wafManager.initSession(retryCount > 0);
  const cookieHeader = wafManager.getCookieString(manualCookie);
  const payload = JSON.stringify(bodyPayload);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: CSDL_HOST,
      port: 443,
      path: apiPath,
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Accept': 'application/json;odata=verbose',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Authorization': bearerToken,
        'Connection': 'keep-alive',
        'Content-Type': 'application/json; charset=UTF-8',
        'Is-Configuring-Request': 'true',
        'Origin': BASE_ORIGIN,
        'Referer': `${BASE_ORIGIN}/ap-dung-dich-vu-cong?filter.administrativeLevels=ward&limit=10`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'sec-ch-ua': '"Not-A.Brand";v="99", "Microsoft Edge";v="157", "Chromium";v="157"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 30000
    };

    if (cookieHeader) {
      options.headers['Cookie'] = cookieHeader;
    }

    const req = https.request(options, (res) => {
      wafManager.setFromHeaders(res.headers);
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', async () => {
        const isWaf = res.statusCode === 403 || res.statusCode === 406 || res.statusCode === 429 ||
          rawData.toLowerCase().includes('ndc waf') || rawData.toLowerCase().includes('the requested url was rejected');

        if (isWaf && retryCount < 3) {
          console.warn(`   ⚠️ WAF chặn (HTTP ${res.statusCode}), đang đổi session WAF và thử lại sau 1.5s (lần ${retryCount + 1})...`);
          await sleep(1500);
          await wafManager.initSession(true);
          try {
            const retryRes = await makeCsdlPost(apiPath, bearerToken, bodyPayload, manualCookie, retryCount + 1);
            return resolve(retryRes);
          } catch (e) {
            return reject(e);
          }
        }

        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch (e) {
          json = { raw: rawData };
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(json);
        } else {
          let msg = json?.message || `Lỗi HTTP ${res.statusCode}`;
          if (res.statusCode === 401) {
            msg = 'Token CSDL TTHC không hợp lệ hoặc đã hết hạn (401 Unauthorized)';
          }
          const err = new Error(msg);
          err.statusCode = res.statusCode;
          err.upstream = json;
          reject(err);
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Lỗi kết nối CSDL TTHC: ${err.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout 30s khi kết nối CSDL TTHC')); });
    req.write(payload);
    req.end();
  });
}

function extractItems(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.list)) return res.data.list;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
}

function extractTotal(res) {
  if (typeof res?.total === 'number') return res.total;
  if (typeof res?.data?.total === 'number') return res.data.total;
  if (typeof res?.totalCount === 'number') return res.totalCount;
  return 0;
}

/**
 * Tải toàn bộ danh sách DVC cấp xã
 */
async function fetchAllWardDvcList(bearerToken, manualCookie) {
  console.log('\n======================================================');
  console.log('📌 BƯỚC 1: TẢI TOÀN BỘ DANH SÁCH DVC CẤP XÃ (API 1)');
  console.log('======================================================');

  let allItems = [];
  let currentLastId = '';
  let pageIndex = 1;
  let totalReported = 0;
  const pageSize = 200;

  while (true) {
    process.stdout.write(`⏳ Đang tải trang ${pageIndex} (lastId: "${currentLastId || 'đầu trang'}")... `);
    const res = await makeCsdlPost(
      '/api/v1/configuring/formality-case-v2/list-apply-by-admin',
      bearerToken,
      {
        limit: pageSize,
        filter: {
          administrativeLevels: ['ward'],
          issuingAgencyIds: [],
          applyDepartmentIds: []
        },
        lastId: currentLastId
      },
      manualCookie
    );

    const items = extractItems(res);
    const total = extractTotal(res);
    if (total > 0) totalReported = total;

    console.log(`✅ Lấy được ${items.length} thủ tục.`);
    if (items.length === 0) break;

    allItems.push(...items);

    const lastItem = items[items.length - 1];
    const nextLastId = lastItem?.id || lastItem?._id;

    if (!nextLastId || nextLastId === currentLastId || items.length < pageSize || (totalReported > 0 && allItems.length >= totalReported)) {
      break;
    }

    currentLastId = nextLastId;
    pageIndex++;

    // Tạm dừng 300ms giữa các trang
    await sleep(300);
  }

  console.log(`\n🎉 ĐÃ TẢI XONG DANH SÁCH: Tổng ${allItems.length}/${totalReported || allItems.length} thủ tục qua ${pageIndex} trang.\n`);
  return allItems;
}

/**
 * Tải chi tiết phí từng thủ tục (với giãn cách để tránh WAF)
 */
async function fetchAllFeesWithPacing(items, bearerToken, manualCookie, delayMs = 300) {
  console.log('======================================================');
  console.log(`📌 BƯỚC 2: TẢI CHI TIẾT CẤU HÌNH PHÍ (API 2)`);
  console.log(`   Số lượng: ${items.length} thủ tục`);
  console.log(`   Độ giãn cách an toàn giữa các request: ${delayMs}ms`);
  console.log('======================================================\n');

  const detailedItems = [];
  let successCount = 0;
  let noConfigCount = 0;
  let hasFeeCount = 0;
  let errorCount = 0;

  const startTime = Date.now();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const stt = i + 1;
    const itemId = item.id;

    let fees = [];
    let isConfigured = false;
    let rawDetail = null;

    try {
      const detailRes = await makeCsdlPost(
        '/api/v1/configuring/formality-case/get-by-admin',
        bearerToken,
        { id: itemId },
        manualCookie
      );

      rawDetail = detailRes?.data || detailRes || {};
      const feeArr = Array.isArray(rawDetail.fees) ? rawDetail.fees : (Array.isArray(rawDetail.fee) ? rawDetail.fee : []);

      if (feeArr && feeArr.length > 0) {
        fees = feeArr;
        isConfigured = true;
        hasFeeCount++;
      } else {
        isConfigured = false;
        noConfigCount++;
      }
      successCount++;
    } catch (err) {
      errorCount++;
      isConfigured = false;
      console.warn(`   ❌ [${stt}/${items.length}] Lỗi tải chi tiết: ${item.formalityCode} - ${err.message}`);
    }

    detailedItems.push({
      ...item,
      loadedFees: fees,
      isConfiguredFee: isConfigured,
      rawDetail: rawDetail
    });

    // In tiến độ mỗi 15 bản ghi hoặc bản ghi cuối
    if (stt % 15 === 0 || stt === items.length) {
      const pct = Math.round((stt / items.length) * 100);
      const elapsedSec = Math.round((Date.now() - startTime) / 1000);
      const estTotalSec = Math.round((elapsedSec / stt) * items.length);
      const remainSec = Math.max(0, estTotalSec - elapsedSec);

      console.log(`📊 [${stt}/${items.length} - ${pct}%] Đã xử lý (Có phí: ${hasFeeCount}, Không cấu hình: ${noConfigCount}, Lỗi: ${errorCount}) | Thời gian: ${elapsedSec}s - Còn lại ~${remainSec}s`);
    }

    // Giãn cách an toàn giữa các lượt gọi API để WAF không chặn
    if (i < items.length - 1) {
      // Jitter delay +- 50ms
      const jitter = Math.floor(Math.random() * 80) - 40;
      await sleep(Math.max(150, delayMs + jitter));
    }
  }

  console.log(`\n🎉 HOÀN THÀNH TẢI PHÍ:`);
  console.log(`   - Tổng thủ tục: ${items.length}`);
  console.log(`   - Thủ tục có phí/lệ phí: ${hasFeeCount}`);
  console.log(`   - Thủ tục không có cấu hình: ${noConfigCount}`);
  console.log(`   - Lỗi kết nối: ${errorCount}`);
  console.log(`   - Tổng thời gian: ${Math.round((Date.now() - startTime) / 1000)}s\n`);

  return detailedItems;
}

/**
 * Xuất file Excel chuẩn hóa theo yêu cầu
 */
async function generateExcel(detailedItems, outputPath) {
  console.log('======================================================');
  console.log(`📌 BƯỚC 3: TỔNG HỢP VÀ KẾT XUẤT FILE EXCEL`);
  console.log(`   Đích: ${outputPath}`);
  console.log('======================================================\n');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Antigravity - Bộ chỉ số 766 DVCQG';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Danh mục DVC Cấp Xã', {
    views: [{ showGridLines: true }]
  });

  // Setup cột
  sheet.columns = [
    { key: 'stt', width: 8 },             // A: STT
    { key: 'formalityCode', width: 22 },    // B: Mã thủ tục
    { key: 'formalityName', width: 45 },    // C: Tên thủ tục
    { key: 'code', width: 20 },             // D: Mã DVC
    { key: 'categoryName', width: 28 },     // E: Tên lĩnh vực
    { key: 'feesDisplay', width: 42 },      // F: Phí / Lệ phí chi tiết
    { key: 'totalAmount', width: 18 },      // G: Tổng tiền phí
    { key: 'feeStatus', width: 20 }         // H: Trạng thái thu phí
  ];

  // Tiêu đề lớn
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'DANH MỤC DỊCH VỤ CÔNG CẤP XÃ & CẤU HÌNH PHÍ, LỆ PHÍ';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' } // Navy blue
  };
  sheet.getRow(1).height = 40;

  // Metadata dòng 2
  sheet.mergeCells('A2:H2');
  const metaCell = sheet.getCell('A2');
  const nowStr = new Date().toLocaleString('vi-VN');
  metaCell.value = `Nguồn: CSDL Quốc gia về TTHC (csdltthc.dichvucong.gov.vn)  |  Ngày xuất: ${nowStr}  |  Tổng số: ${detailedItems.length} thủ tục`;
  metaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF334155' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  metaCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' }
  };
  sheet.getRow(2).height = 24;

  // Dòng 3 để trống nhẹ
  sheet.getRow(3).height = 10;

  // Header dòng 4
  const headers = [
    'STT',
    'Mã thủ tục (formalityCode)',
    'Tên thủ tục hành chính (formalityName)',
    'Mã DVC (code)',
    'Tên lĩnh vực (category.name)',
    'Khoản Phí / Lệ phí cấu hình (fees)',
    'Tổng phí (VNĐ)',
    'Trạng thái thu phí'
  ];

  const headerRow = sheet.getRow(4);
  headerRow.height = 32;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' } // Royal blue
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1D4ED8' } },
      bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } },
      left: { style: 'thin', color: { argb: 'FF93C5FD' } },
      right: { style: 'thin', color: { argb: 'FF93C5FD' } }
    };
  });

  // Đổ dữ liệu
  let currentStt = 1;
  let countHasFee = 0;
  let countNoConfig = 0;

  for (const item of detailedItems) {
    const rowIndex = 4 + currentStt;
    const row = sheet.getRow(rowIndex);

    const formalityCode = item.formalityCode || '--';
    const formalityName = item.formalityName || '--';
    const code = item.code || '--';
    const categoryName = item.category?.name || item.categoryName || 'Chung';

    const fees = item.loadedFees || [];
    let feesDisplay = '';
    let totalAmt = 0;
    let feeStatus = '';

    if (fees && fees.length > 0) {
      countHasFee++;
      feeStatus = 'Có cấu hình phí';
      const lines = fees.map(f => {
        const name = f.feeName || f.name || 'Phí/Lệ phí';
        const amt = Number(f.amount || 0);
        totalAmt += amt;
        return `• ${name}: ${formatVnd(amt)}`;
      });
      feesDisplay = lines.join('\n');
    } else {
      countNoConfig++;
      feeStatus = 'Không có cấu hình';
      feesDisplay = 'Không có cấu hình';
    }

    row.getCell(1).value = currentStt;
    row.getCell(2).value = formalityCode;
    row.getCell(3).value = formalityName;
    row.getCell(4).value = code;
    row.getCell(5).value = categoryName;
    row.getCell(6).value = feesDisplay;
    row.getCell(7).value = totalAmt > 0 ? totalAmt : 0;
    row.getCell(8).value = feeStatus;

    // Formatting
    const isEven = currentStt % 2 === 0;
    const bgArgb = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 10, color: { argb: 'FF0F172A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    }

    // Alignments
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    row.getCell(6).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(7).numFmt = '#,##0 "đ"';
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

    // Highlight trạng thái
    if (fees.length > 0) {
      row.getCell(8).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF047857' } }; // Xanh lá
    } else {
      row.getCell(8).font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }; // Xám
      row.getCell(6).font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
    }

    // Tự tính chiều cao dòng theo số dòng phí hoặc tên dài
    const feeLines = feesDisplay.split('\n').length;
    const nameLines = Math.ceil(formalityName.length / 45);
    const maxLines = Math.max(feeLines, nameLines, 1);
    row.height = Math.max(26, maxLines * 18 + 8);

    currentStt++;
  }

  // Bật bộ lọc Auto-filter cho bảng
  sheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4 + detailedItems.length, column: 8 }
  };

  // Đảm bảo thư mục đích tồn tại
  const parentDir = path.dirname(outputPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Đã ghi thành công file Excel: ${outputPath}`);

  // Sao lưu thêm 1 bản vào public/downloads để có thể tải qua web nếu cần
  const webDownloadPath = path.join(__dirname, '..', 'public', 'downloads', path.basename(outputPath));
  const webDir = path.dirname(webDownloadPath);
  if (!fs.existsSync(webDir)) {
    fs.mkdirSync(webDir, { recursive: true });
  }
  await workbook.xlsx.writeFile(webDownloadPath);
  console.log(`✅ Đã sao lưu bản tải web: ${webDownloadPath}`);
}

/**
 * HÀM CHÍNH THỰC THI TOÀN BỘ QUY TRÌNH
 */
/**
 * Trích xuất Token và Cookie từ lệnh cURL (nếu user dán cả đoạn cURL từ Postman / DevTools)
 */
function parseCurl(curlText) {
  let token = '';
  let cookie = '';
  if (!curlText || typeof curlText !== 'string') return { token, cookie };

  // Match Authorization header
  const authMatch = curlText.match(/-H\s+['"]authorization:\s*([^'"]+)['"]/i) ||
                    curlText.match(/--header\s+['"]authorization:\s*([^'"]+)['"]/i);
  if (authMatch) {
    token = authMatch[1].trim();
  }

  // Match Cookie header (cả -b, --cookie và -H 'Cookie: ...')
  const cookieMatch = curlText.match(/-b\s+['"]([^'"]+)['"]/i) ||
                      curlText.match(/--cookie\s+['"]([^'"]+)['"]/i) ||
                      curlText.match(/-H\s+['"]cookie:\s*([^'"]+)['"]/i) ||
                      curlText.match(/--header\s+['"]cookie:\s*([^'"]+)['"]/i);
  if (cookieMatch) {
    cookie = cookieMatch[1].trim();
  }

  return { token, cookie };
}

async function main() {
  // Lấy token và cookie từ nhiều nguồn: Đối số CLI > csdl_token.txt > curl.txt > biến môi trường
  let token = process.argv[2] || process.env.CSDL_TOKEN || '';
  let manualCookie = process.argv[3] || process.env.CSDL_COOKIE || '';

  const tokenFilePath = path.join(__dirname, '..', 'config', 'csdl_token.txt');
  const curlFilePath = path.join(__dirname, '..', 'config', 'curl.txt');
  const cookieFilePath = path.join(__dirname, '..', 'config', 'csdl_cookie.txt');

  if (!token && fs.existsSync(tokenFilePath)) {
    try {
      token = fs.readFileSync(tokenFilePath, 'utf8').trim();
      if (token.toLowerCase().startsWith('curl')) {
        const parsed = parseCurl(token);
        if (parsed.token) token = parsed.token;
        if (parsed.cookie) manualCookie = parsed.cookie;
      }
    } catch (e) {}
  }

  // Nếu tham số là một lệnh curl
  if (token && token.toLowerCase().startsWith('curl')) {
    const parsed = parseCurl(token);
    if (parsed.token) token = parsed.token;
    if (parsed.cookie) manualCookie = parsed.cookie;
  } else if (!token && fs.existsSync(curlFilePath)) {
    try {
      const curlContent = fs.readFileSync(curlFilePath, 'utf8').trim();
      const parsed = parseCurl(curlContent);
      if (parsed.token) token = parsed.token;
      if (parsed.cookie) manualCookie = parsed.cookie;
    } catch (e) {}
  }

  if (!manualCookie && fs.existsSync(cookieFilePath)) {
    try {
      manualCookie = fs.readFileSync(cookieFilePath, 'utf8').trim();
    } catch (e) {}
  }

  if (!token) {
    console.error('\n❌ LỖI: Chưa cung cấp Bearer Token!');
    console.error('👉 Cách sử dụng:');
    console.error('   Cách 1: node scripts/export_dvc_ward_excel.js "<CHUỖI_BEARER_TOKEN>"');
    console.error('   Cách 2: Ghi token vào file config/csdl_token.txt rồi chạy: node scripts/export_dvc_ward_excel.js');
    console.error('   Cách 3: Đặt biến môi trường CSDL_TOKEN=<token>');
    process.exit(1);
  }

  const bearerToken = sanitizeToken(token);
  if (manualCookie) {
    console.log(`   Cookie thủ công: ${manualCookie.slice(0, 30)}...`);
  }

  console.log('🚀 BẮT ĐẦU TIẾN TRÌNH TỰ ĐỘNG THU THẬP VÀ XUẤT EXCEL DVC CẤP XÃ...');
  console.log(`   Host CSDL TTHC: ${CSDL_HOST}`);
  console.log(`   Token nhận dạng: Bearer ${bearerToken.slice(7, 25)}...${bearerToken.slice(-15)}`);

  try {
    // 1. Lấy danh sách toàn bộ DVC cấp xã
    const wardItems = await fetchAllWardDvcList(bearerToken, manualCookie);

    if (!wardItems || wardItems.length === 0) {
      console.warn('⚠️ Danh sách DVC trả về rỗng. Kết thúc tiến trình.');
      return;
    }

    // 2. Lấy chi tiết phí từng DVC với pacing 300ms
    const detailedItems = await fetchAllFeesWithPacing(wardItems, bearerToken, manualCookie, 300);

    // 3. Kết xuất file Excel
    const outputFile = path.join(__dirname, '..', 'Danh_Muc_DVC_Cap_Xa_CSDL_TTHC.xlsx');
    await generateExcel(detailedItems, outputFile);

    // Đồng thời sao chép vào public/downloads để tải trực tiếp từ web
    const publicDownloadsDir = path.join(__dirname, '..', 'public', 'downloads');
    if (!fs.existsSync(publicDownloadsDir)) {
      fs.mkdirSync(publicDownloadsDir, { recursive: true });
    }
    const publicDownloadFile = path.join(publicDownloadsDir, 'Danh_Muc_DVC_Cap_Xa_CSDL_TTHC.xlsx');
    fs.copyFileSync(outputFile, publicDownloadFile);

    console.log('\n======================================================');
    console.log('🎉 TOÀN BỘ TIẾN TRÌNH ĐÃ HOÀN TẤT THÀNH CÔNG!');
    console.log(`📁 File Excel gốc: ${outputFile}`);
    console.log(`🌐 Link tải web: http://localhost:3000/downloads/Danh_Muc_DVC_Cap_Xa_CSDL_TTHC.xlsx`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n❌ TIẾN TRÌNH THẤT BẠI:', err.message);
    if (err.statusCode === 401) {
      console.error('👉 Gợi ý: Token CSDL TTHC đã hết hạn. Vui lòng đăng nhập lại https://csdltthc.dichvucong.gov.vn, mở F12 -> Network copy chuỗi Authorization Token mới.');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  fetchAllWardDvcList,
  fetchAllFeesWithPacing,
  generateExcel
};

