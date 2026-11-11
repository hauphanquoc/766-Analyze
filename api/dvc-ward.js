const https = require('https');
const { URL } = require('url');
const { getUserFromRequest } = require('../src/auth');

const CSDL_HOST = 'csdltthc.dichvucong.gov.vn';
const BASE_ORIGIN = `https://${CSDL_HOST}`;

/**
 * Làm sạch và chuẩn hóa Bearer Token
 * Hỗ trợ các trường hợp người dùng copy từ Postman, JSON hoặc chuỗi trần
 */
function sanitizeBearer(token) {
  if (!token) return '';
  let clean = String(token).trim();

  // Trường hợp người dùng dán cả chuỗi JSON response từ keycloak / auth
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      clean = parsed.access_token || parsed.idToken || parsed.token || clean;
    } catch (e) {
      // bỏ qua nếu parse thất bại
    }
  }

  // Trường hợp còn sót cú pháp biến Postman: {{bearer_token_xxx}}
  clean = clean.replace(/^{{\s*[\w.-]+\s*}}/, '').trim();

  if (clean.toLowerCase().startsWith('bearer ')) {
    return clean;
  }
  return `Bearer ${clean}`;
}

/**
 * Gửi request tới CSDL TTHC Quốc gia (bỏ qua xác thực SSL do chứng chỉ nội bộ)
 */
function makeCsdlRequest(path, bearerToken, bodyPayload = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(bodyPayload);
    const options = {
      hostname: CSDL_HOST,
      port: 443,
      path: path,
      method: 'POST',
      rejectUnauthorized: false, // Bỏ qua UNABLE_TO_VERIFY_LEAF_SIGNATURE
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept': 'application/json;odata=verbose',
        'Authorization': bearerToken,
        'Is-Configuring-Request': 'true',
        'Origin': BASE_ORIGIN,
        'Referer': `${BASE_ORIGIN}/ap-dung-dich-vu-cong?filter.administrativeLevels=ward&limit=10`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 30000 // 30s timeout
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
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

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');

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
    if (['list', 'detail', 'batch-details', 'test-token'].includes(lastPart)) {
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
  if (!rawToken && action !== 'options') {
    return res.status(400).json({
      success: false,
      error: 'Thiếu Token truy cập CSDL TTHC. Vui lòng cung cấp Bearer Token.'
    });
  }
  const bearerToken = sanitizeBearer(rawToken);

  try {
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
        }
      );
      return res.status(200).json({
        success: true,
        message: 'Xác thực Token thành công! Kết nối CSDL TTHC DVCQG hoạt động bình thường.',
        sample: testResult
      });
    }

    // ACTION 2: LIST FORMALITIES FOR WARD
    if (action === 'list') {
      const limit = Number(body.limit) || 500;
      const filter = body.filter || {
        administrativeLevels: ['ward'],
        issuingAgencyIds: [],
        applyDepartmentIds: []
      };
      const lastId = body.lastId || '';

      const listResult = await makeCsdlRequest(
        '/api/v1/configuring/formality-case-v2/list-apply-by-admin',
        bearerToken,
        { limit, filter, lastId }
      );

      return res.status(200).json({
        success: true,
        data: listResult
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
        { id }
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
              { id }
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
