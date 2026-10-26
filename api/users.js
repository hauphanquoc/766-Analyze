const {
  getUserFromRequest,
  getAllUsersSafe,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getAvailableUnits
} = require('../src/auth');

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Authenticate user
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return res.status(401).json({
      success: false,
      error: 'Phiên làm việc hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập tài khoản Quản trị viên.'
    });
  }

  // 2. Authorize Admin only
  if (currentUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Quyền truy cập bị từ chối. Chỉ Quản trị viên (Admin) mới có quyền sử dụng chức năng này.'
    });
  }

  // Parse action from query or url path
  let action = req.query?.action;
  if (!action && req.url) {
    const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
    const lastPart = urlParts[urlParts.length - 1];
    if (['units', 'create', 'update', 'delete', 'reset-password'].includes(lastPart)) {
      action = lastPart;
    }
  }

  // Parse JSON body if present
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  try {
    // 3. ACTION: UNITS (Get list of units for dropdown selection)
    if (action === 'units' && req.method === 'GET') {
      const units = await getAvailableUnits();
      return res.status(200).json({ success: true, units });
    }

    // 4. ACTION: LIST USERS (GET)
    if (req.method === 'GET' && (!action || action === 'list')) {
      const users = await getAllUsersSafe();
      return res.status(200).json({ success: true, users });
    }

    // 5. ACTION: CREATE USER (POST)
    if (action === 'create' || (req.method === 'POST' && (!action || action === 'create'))) {
      if (body.action === 'reset-password') {
        action = 'reset-password';
      } else if (body.action === 'update') {
        action = 'update';
      } else if (body.action === 'delete') {
        action = 'delete';
      } else {
        const newUser = await createUser(body);
        return res.status(201).json({
          success: true,
          message: `Đã tạo thành công tài khoản cán bộ "${newUser.username}".`,
          user: newUser
        });
      }
    }

    // 6. ACTION: UPDATE USER (POST/PUT)
    if (action === 'update' || req.method === 'PUT') {
      const username = body.username || req.query?.username;
      const updatedUser = await updateUser(username, body);
      return res.status(200).json({
        success: true,
        message: `Đã cập nhật thông tin tài khoản "${updatedUser.username}" thành công.`,
        user: updatedUser
      });
    }

    // 7. ACTION: RESET PASSWORD
    if (action === 'reset-password') {
      const username = body.username || req.query?.username;
      const newPassword = body.newPassword || body.password;
      await resetUserPassword(username, newPassword);
      return res.status(200).json({
        success: true,
        message: `Đã đổi mật khẩu cho tài khoản "${username}" thành công.`
      });
    }

    // 8. ACTION: DELETE USER (DELETE/POST)
    if (action === 'delete' || req.method === 'DELETE') {
      const username = body.username || req.query?.username;
      const deletedUser = await deleteUser(username, currentUser.username);
      return res.status(200).json({
        success: true,
        message: `Đã xóa tài khoản "${deletedUser.username}" khỏi hệ thống.`,
        user: deletedUser
      });
    }

    return res.status(400).json({ success: false, error: `Hành động "${action}" không được hỗ trợ.` });
  } catch (err) {
    console.error('[Users API] Error:', err.message);
    return res.status(400).json({ success: false, error: err.message || 'Lỗi xử lý yêu cầu quản lý người dùng.' });
  }
};
