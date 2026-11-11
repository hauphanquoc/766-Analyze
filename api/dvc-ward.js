const https = require('https');
const { URL } = require('url');
const { getUserFromRequest } = require('../src/auth');

const CSDL_HOST = 'csdltthc.dichvucong.gov.vn';
const BASE_ORIGIN = `https://${CSDL_HOST}`;
const LANDING_URL = `${BASE_ORIGIN}/ap-dung-dich-vu-cong`;

/**
 * Trình quản lý WAF Session & Cookie cho Cổng CSDL TTHC DVCQG
 * Tự động thu thập và duy trì cookie BIG-IP & ttqg_dmz để vượt qua NDC WAF
 */
class CsdlWafManager {
  constructor() {
    this.cookies = new Map();
    this.lastInitTime = 0;
    this.sessionLifetimeMs = 15 * 60 * 1000; // 15 phút
  }

  parseCookieString(cookieStr) {
    if (!cookieStr) return;
    const parts = cookieStr.split(';');
    for (const part of parts) {
      const idx = part.indexOf('=');
      if (idx > 0) {
        const key = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        if (key && val) {
          this.cookies.set(key, val);
        }
      }
    }
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

  hasValidWafToken() {
    for (const key of this.cookies.keys()) {
      if (key.startsWith('ttqg_dmz') || key.startsWith('BIGipServer') || key.length > 20) {
        return true;
      }
    }
    return false;
  }

  /**
   * Khởi tạo hoặc làm mới phiên WAF qua trang Landing
   */
  async initSession(force = false) {
    const now = Date.now();
    if (!force && this.hasValidWafToken() && (now - this.lastInitTime < this.sessionLifetimeMs)) {
      return;
    }

    return new Promise((resolve) => {
      const parsedUrl = new URL(LANDING_URL);
      const req = https.request({
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname,
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
        console.log(`[Anti-WAF] Đã lấy session WAF CSDL TTHC thành công. Số lượng cookie: ${this.cookies.size}`);
        resolve();
      });

      req.on('error', (err) => {
        console.warn('[Anti-WAF] Lỗi khi tạo session WAF:', err.message);
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        resolve();
      });

      req.end();
    });
  }
}

const wafManager = new CsdlWafManager();

/**
 * Kiểm tra xem phản hồi có bị WAF chặn không
 */
function isWafBlocked(status, text) {
  if (status === 403 || status === 406 || status === 429) return true;
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('ndc waf') ||
    lower.includes('request rejected') ||
    lower.includes('support id') ||
    lower.includes('the requested url was rejected') ||
    (text.trim().startsWith('<') && (lower.includes('<html') || lower.includes('<!doctype')))
  );
}

/**
 * Làm sạch và chuẩn hóa Bearer Token
 */
function sanitizeBearer(token) {
  if (!token) return '';
  let clean = String(token).trim();

  // Trường hợp dán JSON response từ auth/keycloak
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      clean = parsed.access_token || parsed.idToken || parsed.token || clean;
    } catch (e) {}
  }

  // Loại bỏ cú pháp biến Postman: {{bearer_token_xxx}}
  clean = clean.replace(/^{{\s*[\w.-]+\s*}}/, '').trim();

  if (clean.toLowerCase().startsWith('bearer ')) {
    return clean;
  }
  return `Bearer ${clean}`;
}

/**
 * Gửi request tới CSDL TTHC Quốc gia với Header chuẩn & Anti-WAF
 */
async function makeCsdlRequest(path, bearerToken, bodyPayload = {}, manualCookie = '', retryCount = 0) {
  // Đảm bảo đã có cookie WAF
  await wafManager.initSession(retryCount > 0);

  const cookieHeader = wafManager.getCookieString(manualCookie);
  const payload = JSON.stringify(bodyPayload);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: CSDL_HOST,
      port: 443,
      path: path,
      method: 'POST',
      rejectUnauthorized: false, // Bỏ qua UNABLE_TO_VERIFY_LEAF_SIGNATURE của chứng chỉ số nội bộ
      headers: {
        'Accept': 'application/json;odata=verbose',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8,en-GB;q=0.7,pl;q=0.6,vi-VN;q=0.5,pl-PL;q=0.4',
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
      timeout: 30000 // 30s timeout
    };

    if (cookieHeader) {
      options.headers['Cookie'] = cookieHeader;
    }

    const req = https.request(options, (res) => {
      // Cập nhật cookie mới nếu server gửi về
      wafManager.setFromHeaders(res.headers);

      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', async () => {
        // Kiểm tra nếu bị WAF chặn
        if (isWafBlocked(res.statusCode, rawData) && retryCount < 2) {
          console.warn(`[Anti-WAF] Phát hiện WAF chặn (HTTP ${res.statusCode}), đang tự động làm mới session và thử lại (lần ${retryCount + 1})...`);
          try {
            await wafManager.initSession(true);
            const retryRes = await makeCsdlRequest(path, bearerToken, bodyPayload, manualCookie, retryCount + 1);
            return resolve(retryRes);
          } catch (retryErr) {
            return reject(retryErr);
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
          let errMsg = json?.message || json?.error || `Lỗi máy chủ CSDL TTHC (HTTP ${res.statusCode})`;
          if (res.statusCode === 401 || json?.code === 'UNAUTHORIZED') {
            errMsg = 'Token CSDL TTHC không hợp lệ hoặc đã hết hạn. Vui lòng lấy Token mới và dán lại vào hệ thống.';
          } else if (res.statusCode === 403 || isWafBlocked(res.statusCode, rawData)) {
            errMsg = 'Yêu cầu bị hệ thống tường lửa (NDC WAF) của Cổng DVCQG từ chối. Vui lòng thử lại sau vài giây hoặc cập nhật lại Cookie trình duyệt.';
          }
          const err = new Error(errMsg);
          err.statusCode = res.statusCode;
          err.upstream = json;
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Lỗi kết nối tới CSDL TTHC: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Yêu cầu tới CSDL TTHC DVCQG bị quá thời gian chờ (Timeout 30s)'));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Trích xuất danh sách bản ghi từ cấu trúc phản hồi API
 */
function extractListItems(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.list)) return res.data.list;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.data?.results)) return res.data.results;
  if (Array.isArray(res?.list)) return res.list;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

/**
 * Trích xuất tổng số bản ghi (total) từ phản hồi API
 */
function extractTotalCount(res) {
  if (typeof res?.total === 'number') return res.total;
  if (typeof res?.data?.total === 'number') return res.data.total;
  if (typeof res?.data?.totalCount === 'number') return res.data.totalCount;
  if (typeof res?.totalCount === 'number') return res.totalCount;
  return 0;
}

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token, X-Csdl-Token, X-Csdl-Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Xác thực người dùng nội bộ (Quản trị viên)
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return res.status(401).json({
      success: false,
      error: 'Phiên làm việc hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập tài khoản Quản trị viên.'
    });
  }

  // 2. Kiểm tra quyền Admin
  if (currentUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Quyền truy cập bị từ chối. Chỉ Quản trị viên (Admin) mới có quyền sử dụng chức năng này.'
    });
  }

  // Parse Action
  let action = req.query?.action;
  if (!action && req.url) {
    const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
    const lastPart = urlParts[urlParts.length - 1];
    if (['list', 'detail', 'batch-details', 'test-token', 'waf-status'].includes(lastPart)) {
      action = lastPart;
    }
  }

  // Parse Body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  if (!action && body.action) {
    action = body.action;
  }
  if (!action) {
    action = 'list';
  }

  // Lấy token CSDL TTHC từ body hoặc header x-csdl-token
  const rawToken = body.token || req.headers['x-csdl-token'];
  if (!rawToken && action !== 'options' && action !== 'waf-status') {
    return res.status(400).json({
      success: false,
      error: 'Thiếu Token truy cập CSDL TTHC. Vui lòng cung cấp Bearer Token.'
    });
  }
  const bearerToken = sanitizeBearer(rawToken);
  const manualCookie = body.cookie || req.headers['x-csdl-cookie'] || '';

  try {
    // ACTION 0: WAF STATUS
    if (action === 'waf-status') {
      await wafManager.initSession();
      return res.status(200).json({
        success: true,
        hasWafToken: wafManager.hasValidWafToken(),
        activeCookiesCount: wafManager.cookies.size
      });
    }

    // ACTION 1: TEST TOKEN
    if (action === 'test-token') {
      const testResult = await makeCsdlRequest(
        '/api/v1/configuring/formality-case-v2/list-apply-by-admin',
        bearerToken,
        {
          limit: 1,
          filter: {
            administrativeLevels: ['ward'],
            issuingAgencyIds: [],
            applyDepartmentIds: []
          },
          lastId: ''
        },
        manualCookie
      );
      return res.status(200).json({
        success: true,
        message: 'Xác thực Token thành công! Kết nối CSDL TTHC DVCQG hoạt động bình thường.',
        sample: testResult
      });
    }

    // ACTION 2: LIST FORMALITIES FOR WARD (TỰ ĐỘNG PHÂN TRANG QUA lastId ĐỂ LẤY TOÀN BỘ)
    if (action === 'list') {
      const pageSize = 200; // Cổng CSDL TTHC giới hạn tối đa 200 bản ghi mỗi lượt gọi
      const filter = body.filter || {
        administrativeLevels: ['ward'],
        issuingAgencyIds: [],
        applyDepartmentIds: []
      };

      const fetchAll = body.fetchAll !== false; // Mặc định tự động lấy tất cả các record
      let allItems = [];
      let currentLastId = body.lastId || '';
      let totalRecords = 0;
      let pageIndex = 1;
      const maxPages = 30; // Giới hạn an toàn tối đa 6000 bản ghi

      while (pageIndex <= maxPages) {
        const listResult = await makeCsdlRequest(
          '/api/v1/configuring/formality-case-v2/list-apply-by-admin',
          bearerToken,
          {
            limit: pageSize,
            filter: filter,
            lastId: currentLastId
          },
          manualCookie
        );

        const pageItems = extractListItems(listResult);
        const reportedTotal = extractTotalCount(listResult);
        if (reportedTotal > 0) {
          totalRecords = reportedTotal;
        }

        if (pageItems.length === 0) {
          break;
        }

        allItems.push(...pageItems);

        // Lấy ID của phần tử cuối cùng để làm lastId cho lượt tiếp theo
        const lastItem = pageItems[pageItems.length - 1];
        const nextLastId = lastItem?.id || lastItem?._id || lastItem?.caseId;

        // Dừng nếu:
        // 1. Không có nextLastId hoặc trùng currentLastId
        // 2. Đã lấy đủ số lượng total (nếu total > 0)
        // 3. Số bản ghi trả về ở trang này ít hơn pageSize (đã tới trang cuối cùng)
        // 4. Chỉ yêu cầu lấy 1 trang (fetchAll === false)
        if (
          !nextLastId ||
          nextLastId === currentLastId ||
          (totalRecords > 0 && allItems.length >= totalRecords) ||
          pageItems.length < pageSize ||
          !fetchAll
        ) {
          break;
        }

        currentLastId = nextLastId;
        pageIndex++;

        // Nghỉ 150ms giữa các trang để an toàn với WAF
        await new Promise(r => setTimeout(r, 150));
      }

      console.log(`[DVC Ward API] Đã tải xong danh mục DVC cấp xã: Tổng ${allItems.length}/${totalRecords || allItems.length} thủ tục qua ${pageIndex} trang.`);

      return res.status(200).json({
        success: true,
        total: totalRecords || allItems.length,
        count: allItems.length,
        pages: pageIndex,
        data: allItems
      });
    }

    // ACTION 3: DETAIL OF A SINGLE FORMALITY CASE
    if (action === 'detail') {
      const id = body.id || req.query?.id;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu tham số ID cấu hình DVC (formality case ID).'
        });
      }

      const detailResult = await makeCsdlRequest(
        '/api/v1/configuring/formality-case/get-by-admin',
        bearerToken,
        { id },
        manualCookie
      );

      return res.status(200).json({
        success: true,
        data: detailResult
      });
    }

    // ACTION 4: BATCH DETAILS (Lấy phí/cấu hình hàng loạt với kiểm soát tải)
    if (action === 'batch-details') {
      const ids = Array.isArray(body.ids) ? body.ids : [];
      if (ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Danh sách ID cần tải cấu hình trống.'
        });
      }

      // Giới hạn tối đa 50 ID mỗi batch để tránh request quá lâu
      const batchIds = ids.slice(0, 50);
      const results = {};
      const errors = {};

      // Chạy 5 song song
      const concurrency = 5;
      for (let i = 0; i < batchIds.length; i += concurrency) {
        const slice = batchIds.slice(i, i + concurrency);
        await Promise.all(slice.map(async (id) => {
          try {
            const detail = await makeCsdlRequest(
              '/api/v1/configuring/formality-case/get-by-admin',
              bearerToken,
              { id },
              manualCookie
            );
            results[id] = detail;
          } catch (err) {
            errors[id] = err.message;
          }
        }));
      }

      return res.status(200).json({
        success: true,
        total: batchIds.length,
        results,
        errors
      });
    }

    return res.status(400).json({
      success: false,
      error: `Hành động "${action}" không được hỗ trợ.`
    });

  } catch (error) {
    console.error(`[DVC Ward API Error] [Action: ${action}]:`, error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Đã xảy ra lỗi khi gọi CSDL TTHC DVCQG.',
      details: error.upstream || null
    });
  }
};
