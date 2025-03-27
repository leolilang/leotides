// config.js
const config = {
    // API Base URLs
    FREE_API_URL: 'https://devapi.qweather.com/v7',  // 免费API地址
    GEO_API_URL: 'https://geoapi.qweather.com/v2',   // 位置服务API地址
    PAID_API_URL: 'https://api.qweather.com/v7',     // 付费API地址（潮汐数据）

    // API Keys
    FREE_API_KEY: '3dc2b4606d7c431081593b6b46e55978',  // 免费版API密钥
    PAID_API_KEY: '817fc264ceb744c59edf4d548b51cd85',  // 付费版API密钥（潮汐数据）

    // API Endpoints
    ENDPOINTS: {
        // 免费接口
        WEATHER: '/weather/3d',     // 天气数据
        POI_LOOKUP: '/poi/lookup',  // POI查询

        // 付费接口
        TIDE: '/ocean/tide',        // 潮汐数据
        TIDE_TABLE: '/ocean/tide/table', // 潮汐表数据
    },

    // Cache Configuration
    CACHE: {
        LOCATION_LIST: 'locationList',
        WEATHER_DATA: 'weatherData',
        TIDE_DATA: 'tideData',
        FAVORITES: 'favorites',
        EXPIRE_TIME: 1800000 // 30分钟过期
    },

    // Default Location
    DEFAULT_LOCATION: {
        name: '黄浦公园',
        location: 'P2447',  // 舟山的 locationId
        isFavorite: false
    },

    // Request Configuration
    REQUEST: {
        TIMEOUT: 10000,
        FREE_API_RETRIES: 3,     // 免费接口重试3次
        PAID_API_RETRIES: 1,     // 付费接口只重试1次
        RETRY_DELAY: 1000
    },

    // POI Configuration
    POI: {
        TYPE: 'TSTA',  // 潮汐站点类型
        MAX_RESULTS: 10, // 默认返回结果数量
        ENDPOINT: '/poi/lookup' // POI查询端点
    }
};

// 构建API URL，根据不同类型使用不同的基础URL和密钥
const buildApiUrl = (endpoint, params = {}, options = {}) => {
    let baseUrl;
    let apiKey;

    // 根据端点类型选择对应的API地址和密钥
    if (endpoint.startsWith('/ocean/')) {
        // 潮汐相关的付费接口
        baseUrl = config.PAID_API_URL;
        apiKey = config.PAID_API_KEY;
    } else if (endpoint === config.ENDPOINTS.POI_LOOKUP) {
        // 位置服务接口
        baseUrl = config.GEO_API_URL;
        apiKey = config.FREE_API_KEY;
    } else {
        // 其他免费接口
        baseUrl = config.FREE_API_URL;
        apiKey = config.FREE_API_KEY;
    }

    let url = `${baseUrl}${endpoint}?key=${apiKey}`;
    
    // 添加其他参数
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url += `&${key}=${encodeURIComponent(value)}`;
        }
    });
    
    return url;
};

// 统一的请求方法
const request = async (endpoint, params = {}, options = {}) => {
    const url = buildApiUrl(endpoint, params, options);
    const requestOptions = {
        timeout: config.REQUEST.TIMEOUT,
        ...options
    };

    // 根据接口类型确定重试次数
    const maxRetries = endpoint.startsWith('/ocean/') 
        ? config.REQUEST.PAID_API_RETRIES 
        : config.REQUEST.FREE_API_RETRIES;

    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await new Promise((resolve, reject) => {
                wx.request({
                    url,
                    ...requestOptions,
                    success: resolve,
                    fail: reject
                });
            });

            if (response.statusCode === 200) {
                return response.data;
            }

            throw new Error(`Request failed with status ${response.statusCode}`);
        } catch (error) {
            console.error('API请求失败:', error, url);
            retries++;
            if (retries === maxRetries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, config.REQUEST.RETRY_DELAY));
        }
    }
};

// 缓存管理
const cache = {
    set: (key, data, expireTime = config.CACHE.EXPIRE_TIME) => {
        wx.setStorageSync(key, {
            data,
            expireTime: Date.now() + expireTime
        });
    },

    get: (key) => {
        const cached = wx.getStorageSync(key);
        if (!cached) return null;

        if (Date.now() > cached.expireTime) {
            wx.removeStorageSync(key);
            return null;
        }

        return cached.data;
    },

    clear: (key) => {
        wx.removeStorageSync(key);
    }
};

module.exports = {
    config,
    buildApiUrl,
    request,
    cache
}; 