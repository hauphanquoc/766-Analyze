module.exports = async function handler(req, res) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const r = await fetch('https://dichvucong.gov.vn/danh-gia-chat-luong-phuc-vu', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const cookies = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get('set-cookie')];

    return res.status(200).json({
      success: true,
      status: r.status,
      timeMs: Date.now() - start,
      cookiesCount: cookies.filter(Boolean).length
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      error: err.message,
      name: err.name,
      timeMs: Date.now() - start
    });
  }
};
