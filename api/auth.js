const { authenticate, getUserFromRequest } = require('../src/auth');

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse action from query or url path
  let action = req.query?.action;
  if (!action && req.url) {
    const urlParts = req.url.split('?')[0].split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (['login', 'me', 'logout'].includes(lastPart)) {
      action = lastPart;
    }
  }

  // Fallback: If POST without action, default to login
  if (!action && req.method === 'POST') {
    action = 'login';
  } else if (!action && req.method === 'GET') {
    action = 'me';
  }

  try {
    // 1. ACTION: LOGIN
    if (action === 'login') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Phương thức không được hỗ trợ' });
      }

      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          body = {};
        }
      }

      const { username, password } = body || {};
      const result = await authenticate(username, password);

      if (!result.success) {
        return res.status(401).json(result);
      }

      // Return token & safe user info
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công!',
        token: result.token,
        user: result.user
      });
    }

    // 2. ACTION: ME (Check current session)
    if (action === 'me') {
      const user = getUserFromRequest(req);
      if (user) {
        return res.status(200).json({
          success: true,
          authenticated: true,
          user: {
            username: user.username,
            name: user.name,
            role: user.role
          }
        });
      }

      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    // 3. ACTION: LOGOUT
    if (action === 'logout') {
      return res.status(200).json({
        success: true,
        message: 'Đã đăng xuất thành công.'
      });
    }

    return res.status(400).json({ success: false, error: `Action '${action}' không được hỗ trợ.` });
  } catch (err) {
    console.error('[Auth API] Error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi máy chủ nội bộ trong quá trình xác thực.' });
  }
};
