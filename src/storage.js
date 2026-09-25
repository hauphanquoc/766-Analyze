const fs = require('fs');
const path = require('path');

// Auto-load .env file if running locally
const envFile = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  try {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[k]) process.env[k] = v;
        }
      }
    }
  } catch (e) {}
}

// Check if Upstash Redis credentials exist in environment
const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.STORAGE_REST_API_URL ||
  process.env.STORAGE_URL ||
  process.env.REDIS_URL;

const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.STORAGE_REST_API_TOKEN ||
  process.env.STORAGE_TOKEN ||
  process.env.REDIS_TOKEN;

const isLocalOnly = process.env.SYNC_LOCAL_ONLY === 'true' || process.env.LOCAL_ONLY === 'true';
const hasRedis = Boolean(redisUrl && redisToken) && !isLocalOnly;

let redisClient = null;
if (hasRedis) {
  try {
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken
    });
    console.log('[Storage] Redis client initialized successfully');
  } catch (e) {
    console.warn('[Storage] Could not initialize Redis client:', e.message);
  }
}

// In-memory cache as fallback for Serverless without DB
const memoryCache = {
  snapshots: new Map(),
  dates: [],
  history: []
};

// Paths for local file storage
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const REPORTS_DIR = path.join(DATA_DIR, 'reports');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  } catch (err) {
    // Ephemeral or read-only filesystem (Vercel)
  }
}

ensureDirectories();

/**
 * Save snapshot by date
 */
async function saveSnapshot(analyzedData, options = {}) {
  const date = analyzedData.date;
  memoryCache.snapshots.set(date, analyzedData);
  if (!memoryCache.dates.includes(date)) {
    memoryCache.dates.unshift(date);
  }

  // 1. Save to Redis if available and NOT localOnly
  const localOnly = options.localOnly || process.env.SYNC_LOCAL_ONLY === 'true' || process.env.LOCAL_ONLY === 'true';
  if (redisClient && !localOnly) {
    try {
      await redisClient.set(`dvc:snapshot:${date}`, JSON.stringify(analyzedData));
      await redisClient.set('dvc:latest', date);
      let existingDates = (await redisClient.get('dvc:dates')) || [];
      if (typeof existingDates === 'string') {
        try { existingDates = JSON.parse(existingDates); } catch (e) { existingDates = []; }
      }
      if (!Array.isArray(existingDates)) existingDates = [];
      if (!existingDates.includes(date)) {
        existingDates.unshift(date);
        await redisClient.set('dvc:dates', JSON.stringify(existingDates));
      }
    } catch (err) {
      console.error('[Storage] Redis set error:', err.message);
    }
  }

  // 2. Save to local disk if writable
  try {
    ensureDirectories();
    const filePath = path.join(SNAPSHOTS_DIR, `${date}.json`);
    fs.writeFileSync(filePath, JSON.stringify(analyzedData, null, 2), 'utf-8');
  } catch (err) {
    // Disk write may fail on Vercel read-only root, which is fine
  }

  return true;
}

/**
 * Get snapshot by date
 */
async function getSnapshot(date) {
  // Check memory
  if (memoryCache.snapshots.has(date)) {
    return memoryCache.snapshots.get(date);
  }

  // Check Redis
  if (redisClient) {
    try {
      const data = await redisClient.get(`dvc:snapshot:${date}`);
      if (data) {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        memoryCache.snapshots.set(date, parsed);
        return parsed;
      }
    } catch (err) {
      console.error('[Storage] Redis get error:', err.message);
    }
  }

  // Check local disk
  try {
    const filePath = path.join(SNAPSHOTS_DIR, `${date}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      memoryCache.snapshots.set(date, parsed);
      return parsed;
    }
  } catch (err) {
    // Ignore
  }

  return null;
}

/**
 * Delete a snapshot by date (both Redis and local)
 */
async function deleteSnapshot(date) {
  memoryCache.snapshots.delete(date);
  memoryCache.dates = memoryCache.dates.filter((d) => d !== date);

  // 1. Delete from Redis if available
  if (redisClient) {
    try {
      await redisClient.del(`dvc:snapshot:${date}`);
      let existingDates = (await redisClient.get('dvc:dates')) || [];
      if (typeof existingDates === 'string') {
        try { existingDates = JSON.parse(existingDates); } catch (e) { existingDates = []; }
      }
      if (Array.isArray(existingDates)) {
        const filtered = existingDates.filter((d) => d !== date);
        await redisClient.set('dvc:dates', JSON.stringify(filtered));
        const latest = await redisClient.get('dvc:latest');
        if (latest === date) {
          await redisClient.set('dvc:latest', filtered[0] || '');
        }
      }

      // Clean up history entries for this date
      const historyData = await redisClient.get('dvc:history');
      if (historyData) {
        const hist = typeof historyData === 'string' ? JSON.parse(historyData) : historyData;
        if (Array.isArray(hist)) {
          const filteredHist = hist.filter((h) => h.date !== date);
          await redisClient.set('dvc:history', JSON.stringify(filteredHist));
        }
      }
    } catch (err) {
      console.error('[Storage] Redis delete error:', err.message);
    }
  }

  // 2. Delete from local disk
  try {
    const filePath = path.join(SNAPSHOTS_DIR, `${date}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (fs.existsSync(HISTORY_FILE)) {
      const hist = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      if (Array.isArray(hist)) {
        const filteredHist = hist.filter((h) => h.date !== date);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(filteredHist, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    // Ignore
  }

  return true;
}

/**
 * Get list of available snapshot dates (sorted newest first)
 */
async function listDates() {
  const datesSet = new Set(memoryCache.dates);

  // Check Redis
  if (redisClient) {
    try {
      const data = await redisClient.get('dvc:dates');
      if (data) {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (Array.isArray(parsed)) {
          parsed.forEach((d) => datesSet.add(d));
        }
      }
    } catch (err) {
      // Ignore
    }
  }

  // Check local disk
  try {
    if (fs.existsSync(SNAPSHOTS_DIR)) {
      const files = fs.readdirSync(SNAPSHOTS_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          datesSet.add(file.replace('.json', ''));
        }
      }
    }
  } catch (err) {
    // Ignore
  }

  const sorted = Array.from(datesSet).sort().reverse();
  return sorted;
}

/**
 * Get latest snapshot
 */
async function getLatestSnapshot() {
  const dates = await listDates();
  if (dates.length > 0) {
    return await getSnapshot(dates[0]);
  }
  return null;
}

/**
 * Record a run log entry
 */
async function recordLog(logEntry, options = {}) {
  memoryCache.history.unshift(logEntry);
  if (memoryCache.history.length > 50) memoryCache.history.pop();

  const localOnly = options.localOnly || process.env.SYNC_LOCAL_ONLY === 'true' || process.env.LOCAL_ONLY === 'true';
  if (redisClient && !localOnly) {
    try {
      await redisClient.set('dvc:history', JSON.stringify(memoryCache.history));
    } catch (err) {
      // Ignore
    }
  }

  try {
    ensureDirectories();
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
    history.unshift(logEntry);
    if (history.length > 50) history = history.slice(0, 50);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    // Ignore
  }
}

/**
 * Get history run logs
 */
async function getHistory() {
  if (redisClient) {
    try {
      const data = await redisClient.get('dvc:history');
      if (data) return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
      // Ignore
    }
  }

  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch (err) {
    // Ignore
  }

  return memoryCache.history;
}

module.exports = {
  saveSnapshot,
  getSnapshot,
  deleteSnapshot,
  getLatestSnapshot,
  listDates,
  recordLog,
  getHistory,
  DATA_DIR,
  REPORTS_DIR
};
