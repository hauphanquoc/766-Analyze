const crypto = require('crypto');
const storage = require('./storage');

// Secret for signing JWT tokens (can be set via env or fallback)
const JWT_SECRET = process.env.JWT_SECRET || 'dvc766_daklak_secure_jwt_secret_2026_cchc';

// Default initial passwords (customizable via env)
const DEFAULT_ADMIN_PASS = process.env.AUTH_ADMIN_PASSWORD || 'Admin@766';
const DEFAULT_CANBO_PASS = process.env.AUTH_CANBO_PASSWORD || 'Canbo@766';

/**
 * Hash password with PBKDF2 (SHA-512)
 */
function hashPassword(password, salt) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored hash
 */
function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  try {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch (err) {
    return false;
  }
}

/**
 * Base64 URL Helpers for JWT
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Create a JWT Token
 */
function signJwt(payload, expiresInSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify a JWT Token
 */
function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  try {
    const expectedSignature = base64UrlEncode(
      crypto.createHmac('sha256', JWT_SECRET).update(`${encodedHeader}.${encodedPayload}`).digest()
    );

    if (encodedSignature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Build default system users
 */
function getDefaultUsers() {
  return [
    {
      username: 'admin',
      name: 'Quản trị viên (Đắk Lắk)',
      role: 'admin',
      passwordHash: hashPassword(DEFAULT_ADMIN_PASS, 'dvc766_salt_admin_daklak'),
      createdAt: new Date().toISOString()
    },
    {
      username: 'canbo',
      name: 'Cán bộ nghiệp vụ',
      role: 'officer',
      passwordHash: hashPassword(DEFAULT_CANBO_PASS, 'dvc766_salt_canbo_daklak'),
      createdAt: new Date().toISOString()
    }
  ];
}

/**
 * Get all existing users (seeding if empty)
 */
async function getAllUsers() {
  let users = await storage.getUsers();
  if (!users || !Array.isArray(users) || users.length === 0) {
    users = getDefaultUsers();
    await storage.saveUsers(users);
  }
  return users;
}

/**
 * Authenticate username & password
 */
async function authenticate(username, password) {
  if (!username || !password) {
    return { success: false, error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' };
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const users = await getAllUsers();

  const user = users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (!user) {
    return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
  }

  const isValid = verifyPassword(String(password), user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
  }

  const safeUser = {
    username: user.username,
    name: user.name,
    role: user.role
  };

  const token = signJwt(safeUser);

  return {
    success: true,
    token,
    user: safeUser
  };
}

/**
 * Extract token from HTTP request and verify user
 */
function getUserFromRequest(req) {
  let token = null;

  // 1. From Authorization Header
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2. From X-Auth-Token header
  if (!token && req.headers?.['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  // 3. From query param
  if (!token && req.query?.token) {
    token = req.query.token;
  }

  // 4. From Cookie
  if (!token && req.headers?.cookie) {
    const match = req.headers.cookie.match(/dvc766_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return null;
  return verifyJwt(token);
}

module.exports = {
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
  authenticate,
  getUserFromRequest,
  getAllUsers,
  getDefaultUsers
};
