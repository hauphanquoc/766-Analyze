const config = require('./config');

/**
 * Cookie Manager for WAF Session persistence & renewal
 */
class CookieManager {
  constructor() {
    this.cookies = new Map();
    this.lastInitTime = 0;
    this.sessionLifetimeMs = 15 * 60 * 1000; // 15 minutes fresh window

    // Load manual cookie from environment if configured
    if (process.env.DVC_COOKIE) {
      this.parseCookieString(process.env.DVC_COOKIE);
    }
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
    let cookieHeaders = [];
    if (typeof headers.getSetCookie === 'function') {
      cookieHeaders = headers.getSetCookie();
    } else if (typeof headers.get === 'function') {
      const single = headers.get('set-cookie');
      if (single) cookieHeaders = [single];
    }

    for (const raw of cookieHeaders) {
      if (!raw) continue;
      const firstPart = raw.split(';')[0];
      const idx = firstPart.indexOf('=');
      if (idx > 0) {
        const key = firstPart.slice(0, idx).trim();
        const val = firstPart.slice(idx + 1).trim();
        if (key && val) {
          this.cookies.set(key, val);
        }
      }
    }
  }

  getCookieString() {
    const pairs = [];
    for (const [k, v] of this.cookies.entries()) {
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
    return this.cookies.size > 0;
  }

  /**
   * Acquire or refresh active session from landing page
   */
  async initSession(force = false) {
    const now = Date.now();
    if (!force && this.hasValidWafToken() && now - this.lastInitTime < this.sessionLifetimeMs) {
      return;
    }

    try {
      console.log('[Anti-WAF] Initializing session via landing page to acquire fresh WAF token...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(config.LANDING_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'User-Agent': config.HEADERS['User-Agent'],
          'Sec-Ch-Ua': config.HEADERS['Sec-Ch-Ua'],
          'Sec-Ch-Ua-Mobile': config.HEADERS['Sec-Ch-Ua-Mobile'],
          'Sec-Ch-Ua-Platform': config.HEADERS['Sec-Ch-Ua-Platform']
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      this.setFromHeaders(res.headers);
      this.lastInitTime = Date.now();
      console.log(`[Anti-WAF] Session established. Active cookies count: ${this.cookies.size}`);
    } catch (err) {
      console.warn('[Anti-WAF] Could not pre-fetch session cookies:', err.message);
    }
  }
}

// Global cookie manager instance
const cookieManager = new CookieManager();

/**
 * Check if the response was intercepted/rejected by NDC WAF
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
 * Polite sleep utility
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch a single API with retry and automatic WAF protection
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Ensure we have a session cookie before requesting
      await cookieManager.initSession(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout to fail fast on firewall drop

      // Attach current dynamic cookies
      const cookieStr = cookieManager.getCookieString();
      const requestHeaders = {
        ...options.headers,
        ...(cookieStr ? { 'Cookie': cookieStr } : {})
      };

      let response;
      try {
        response = await fetch(url, {
          ...options,
          headers: requestHeaders,
          signal: controller.signal
        });
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          throw new Error('Không thể kết nối đến Cổng DVCQG (14.238.3.76): Tường lửa Trung tâm Dữ liệu VNPT đang chặn kết nối từ máy chủ đám mây nước ngoài (Vercel/AWS). Vui lòng đồng bộ dữ liệu từ máy trạm trong nước.');
        }
        throw fetchErr;
      }
      clearTimeout(timeoutId);

      // Extract any updated cookies returned
      cookieManager.setFromHeaders(response.headers);

      const responseText = await response.text();

      // Detect NDC WAF blockage
      if (isWafBlocked(response.status, responseText)) {
        console.warn(
          `[Anti-WAF Triggered] NDC WAF blocked request to ${url} (Status: ${response.status}). ` +
          `Attempt ${attempt + 1}/${maxRetries + 1}. Refreshing session & backing off...`
        );

        if (attempt < maxRetries) {
          // Force refresh session to get a brand new WAF cookie
          await cookieManager.initSession(true);

          // Exponential backoff with random jitter to clear WAF burst counters
          const backoff = (attempt + 1) * 3000 + Math.floor(Math.random() * 2000);
          console.log(`[Anti-WAF] Waiting ${backoff}ms before retry...`);
          await sleep(backoff);
          continue;
        } else {
          throw new Error('NDC WAF rejected request after retries. Support ID detected.');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Invalid JSON response: ${responseText.slice(0, 150)}...`);
      }

      if (json.code !== 'OK' && json.code !== 200) {
        throw new Error(`API Error: ${json.message || json.code}`);
      }

      return json.data;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = (attempt + 1) * 2000 + Math.floor(Math.random() * 1000);
        console.warn(`[Collector] Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Collect all 6 indicators sequentially with polite delay to avoid WAF rate limits
 */
async function collectAll(deptId = config.DEFAULT_DEPARTMENT_ID, year = new Date().getFullYear()) {
  const startTime = Date.now();
  const results = {};
  const errors = {};

  // 1. Initialize session to get valid WAF cookies
  await cookieManager.initSession();

  console.log(`[Collector] Starting sequential collection for 6 indicators (Dept: ${deptId}, Year: ${year})...`);

  // 2. Fetch sequentially with polite random delays
  for (let i = 0; i < config.INDICATORS.length; i++) {
    const ind = config.INDICATORS[i];
    console.log(`[Collector] (${i + 1}/${config.INDICATORS.length}) Fetching: ${ind.name} [${ind.key}]...`);

    try {
      const body = JSON.stringify(ind.getBody(deptId, year));
      const data = await fetchWithRetry(ind.url, {
        method: 'POST',
        headers: config.HEADERS,
        body
      });

      results[ind.key] = {
        success: true,
        key: ind.key,
        name: ind.name,
        maxScore: ind.maxScore,
        data
      };
      console.log(`[Collector] -> ${ind.name}: SUCCESS`);
    } catch (err) {
      console.error(`[Collector] -> ${ind.name}: FAILED (${err.message})`);
      errors[ind.key] = err.message;
      results[ind.key] = {
        success: false,
        key: ind.key,
        name: ind.name,
        maxScore: ind.maxScore,
        error: err.message
      };
    }

    // Polite delay between indicators to avoid burst triggers (except after last indicator)
    if (i < config.INDICATORS.length - 1) {
      const delay = config.CRAWL_DELAY_MIN + Math.floor(Math.random() * (config.CRAWL_DELAY_MAX - config.CRAWL_DELAY_MIN));
      await sleep(delay);
    }
  }

  const durationMs = Date.now() - startTime;
  const successCount = Object.values(results).filter((r) => r.success).length;

  console.log(`[Collector] Completed collection: ${successCount}/${config.INDICATORS.length} successful (${(durationMs / 1000).toFixed(1)}s)`);

  return {
    success: successCount > 0,
    successCount,
    totalCount: config.INDICATORS.length,
    durationMs,
    deptId,
    year,
    timestamp: new Date().toISOString(),
    results,
    errors: Object.keys(errors).length > 0 ? errors : null
  };
}

module.exports = {
  collectAll,
  cookieManager
};
