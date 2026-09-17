/**
 * Configuration for DVCQG Decision 766 indicators and APIs
 */
module.exports = {
  DEFAULT_DEPARTMENT_ID: process.env.DEPARTMENT_ID || '019d2be3-6a85-74ec-a33c-a7c04919ba00',
  DEFAULT_DEPARTMENT_NAME: 'UBND tỉnh Đắk Lắk',
  DEFAULT_DEPARTMENT_CODE: 'H15',
  LANDING_URL: 'https://dichvucong.gov.vn/danh-gia-chat-luong-phuc-vu',
  BASE_URL: 'https://dichvucong.gov.vn',

  HEADERS: {
    'Accept': 'application/json;odata=verbose, text/plain, */*',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Content-Type': 'application/json; charset=UTF-8',
    'Origin': 'https://dichvucong.gov.vn',
    'Referer': 'https://dichvucong.gov.vn/danh-gia-chat-luong-phuc-vu',
    'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  },

  // Polite delay range between API calls (milliseconds) to prevent WAF rate-limiting
  CRAWL_DELAY_MIN: 350,
  CRAWL_DELAY_MAX: 700,

  INDICATORS: [
    {
      key: 'transparency',
      name: 'Công khai, minh bạch',
      shortName: 'Công khai minh bạch',
      url: 'https://dichvucong.gov.vn/api/v1/reporting/evaluation/transparency',
      maxScore: 18,
      type: 'overview_list',
      getBody: (deptId, year) => ({
        timeType: 'year',
        year: year || new Date().getFullYear(),
        rootDepartmentId: deptId,
        currentPage: 1,
        pageSize: 200
      })
    },
    {
      key: 'progress',
      name: 'Tiến độ giải quyết',
      shortName: 'Tiến độ giải quyết',
      url: 'https://dichvucong.gov.vn/api/v1/reporting/evaluation/dvc-progress-tree',
      maxScore: 20,
      type: 'tree',
      getBody: (deptId, year) => ({
        timeType: 'year',
        year: year || new Date().getFullYear(),
        rootDepartmentId: deptId,
        currentPage: 1,
        pageSize: 200
      })
    },
    {
      key: 'onlineService',
      name: 'Dịch vụ công trực tuyến',
      shortName: 'DVC trực tuyến',
      url: 'https://dichvucong.gov.vn/api/v1/reporting/evaluation/provide-online-tree',
      maxScore: 12,
      type: 'tree',
      getBody: (deptId, year) => ({
        timeType: 'year',
        year: year || new Date().getFullYear(),
        rootDepartmentId: deptId,
        currentPage: 1,
        pageSize: 200
      })
    },
    {
      key: 'digitized',
      name: 'Số hóa hồ sơ',
      shortName: 'Số hóa hồ sơ',
      url: 'https://dichvucong.gov.vn/api/v1/reporting/evaluation/dossier-digitized',
      maxScore: 22,
      type: 'overview_list',
      getBody: (deptId, year) => ({
        timeType: 'year',
        year: year || new Date().getFullYear(),
        rootDepartmentId: deptId,
        currentPage: 1,
        pageSize: 200
      })
    },
    {
      key: 'payment',
      name: 'Thanh toán trực tuyến',
      shortName: 'Thanh toán trực tuyến',
      url: 'https://dichvucong.gov.vn/api/v1/reporting/evaluation/formality-online-payment-tree',
      maxScore: 10,
      type: 'tree',
      getBody: (deptId, year) => ({
        timeType: 'year',
        year: year || new Date().getFullYear(),
        rootDepartmentId: deptId,
        currentPage: 1,
        pageSize: 200
      })
    },
    {
      key: 'satisfaction',
      name: 'Mức độ hài lòng',
      shortName: 'Mức độ hài lòng',
      url: 'https://dichvucong.gov.vn/api/v1/reporting/evaluation/handling-satisfaction',
      maxScore: 18,
      type: 'overview_list',
      getBody: (deptId, year) => {
        const y = year || new Date().getFullYear();
        return {
          fromDate: `${y}-01-01`,
          toDate: `${y}-12-31`,
          rootDepartmentId: deptId,
          currentPage: 1,
          pageSize: 200
        };
      }
    }
  ]
};
