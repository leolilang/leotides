            
            this.setData({
                locationList,
                locationNames
            });

            // 确保有默认位置时才加载数据
            if (locationList.length > 0) {
                await this.loadTideData(locationList[this.data.currentLocationIndex]);
            } else {
                console.error('No locations available');
                wx.showToast({
                    title: '没有可用的位置信息',
                    icon: 'none'
                });
            }
        } catch (error) {
            console.error('加载位置列表失败:', error);
            wx.showToast({
                title: '加载位置列表失败',
                icon: 'none'
            });
        }
    },

    // 加载潮汐数据
    async loadTideData(location) {
        this.setData({ loading: true });
        try {
            const formattedDate = this.data.selectedDate.replace(/-/g, '');
            
            const params = {
                location: location.location,
                date: formattedDate
            };
            
            // 添加调试日志
            console.log('Tide API request params:', params);
            
            const tideData = await request(config.ENDPOINTS.TIDE, params);
            
            if (tideData.code === '200') {
                this.updateChart(tideData);
                const tideDetails = this.processTideDetails(tideData);
                
                this.setData({
                    tideData,
                    tideDetails,
                    loading: false
                });

                cache.set(`${config.CACHE.TIDE_DATA}_${location.location}_${formattedDate}`, tideData);
            } else {
                throw new Error(tideData.msg || '获取潮汐数据失败');
            }
        } catch (error) {
            console.error('加载潮汐数据失败:', error);
            wx.showToast({
                title: '加载潮汐数据失败',
                icon: 'none'
            });
            this.setData({ loading: false });
        }
    },

    // 处理潮汐详情数据
    processTideDetails(tideData) {
        if (!tideData || !tideData.tideTable) return [];
        
        return tideData.tideTable.map(item => ({
            time: item.fxTime.split('T')[1].slice(0, 5),
            height: item.height + 'm',
            type: item.type === 'H' ? '满潮' : '干潮',
            updateTime: new Date(item.fxTime).toLocaleString()
        }));
    },

    // 更新图表
    updateChart(tideData) {
        const chart = this.selectComponent('#mychart-dom-bar');
        if (!chart || !tideData || !tideData.tideTable || tideData.tideTable.length === 0) {
            console.warn('无效的图表数据');
            return;
        }

        // 建议将图表配置移到单独的文件中
        const option = require('../../config/chartOptions').getTideChartOption(tideData);
        chart.setOption(option);
    },

    // 获取最大可选日期（未来10天）
    getMaxDate() {
        const date = new Date();
        date.setDate(date.getDate() + 9); // 改为9天后（当天+9=10天）
        return date.toISOString().split('T')[0];
    },

    // 获取最小可选日期（当天）
    getMinDate() {
        return new Date().toISOString().split('T')[0];
    },

    // 日期选择改变
    onDateChange(e) {
        const selectedDate = e.detail.value;
        const minDate = this.getMinDate();
        const maxDate = this.getMaxDate();
        
        // 检查日期是否在有效范围内
        if (selectedDate < minDate || selectedDate > maxDate) {
            wx.showToast({
                title: '只能查询最近10天的数据',
                icon: 'none'
            });
            return;
        }
        
        this.setData({ selectedDate });
        this.loadTideData(this.data.locationList[this.data.currentLocationIndex]);
    },

    // 位置选择改变
    onLocationChange(e) {
        const index = e.detail.value;
        this.setData({ currentLocationIndex: index });
        this.loadTideData(this.data.locationList[index]);
    },

    // 搜索潮汐站点
    async searchTideStations(keyword) {
        try {
            const params = {
                location: keyword,
                type: config.POI.TYPE,
                number: config.POI.MAX_RESULTS
            };

            const response = await request(config.ENDPOINTS.POI_LOOKUP, params, {
                isGeo: true,
                header: {
                    'Authorization': `Bearer ${config.API_KEY}`
                }
            });

            if (response.code === '200' && response.poi && response.poi.length > 0) {
                // 转换 POI 数据为位置列表格式
                return response.poi.map(item => ({
                    name: `${item.adm2}-${item.name}`, // 城市-站点名称
                    location: item.id,  // 使用POI的id作为location
                    isFavorite: false,
                    lat: item.lat,
                    lon: item.lon,
                    adm1: item.adm1,    // 省份
                    adm2: item.adm2,    // 城市
                    country: item.country,
                    timezone: item.tz,
                    rank: item.rank
                }));
            } else {
                wx.showToast({
                    title: '未找到潮汐站点',
                    icon: 'none'
                });
                return [];
            }
        } catch (error) {
            console.error('搜索潮汐站点失败:', error);
            wx.showToast({
                title: '搜索潮汐站点失败',
                icon: 'none'
            });
            return [];
        }
    },

    // 添加新位置
    async addNewLocation(keyword) {
        if (!keyword.trim()) {
            wx.showToast({
                title: '请输入位置名称',
                icon: 'none'
            });
            return;
        }

        this.setData({ loading: true });
        try {
            const newLocations = await this.searchTideStations(keyword);
            if (newLocations && newLocations.length > 0) {
                // 检查是否已存在相同位置
                const existingLocations = new Set(this.data.locationList.map(item => item.location));
                const uniqueNewLocations = newLocations.filter(item => !existingLocations.has(item.location));

                if (uniqueNewLocations.length === 0) {
                    wx.showToast({
                        title: '该位置已存在',
                        icon: 'none'
                    });
                    return;
                }

                // 更新位置列表
                const locationList = [...this.data.locationList, ...uniqueNewLocations];
                const locationNames = locationList.map(item => item.name);

                // 保存到缓存
                cache.set(config.CACHE.LOCATION_LIST, locationList);

                // 更新状态
                this.setData({
                    locationList,
                    locationNames,
                    currentLocationIndex: locationList.length - 1, // 自动选中新添加的位置
                    searchKeyword: '' // 清空搜索框
                });

                // 加载新位置的数据
                await this.loadTideData(locationList[locationList.length - 1]);

                wx.showToast({
                    title: '添加位置成功',
                    icon: 'success'
                });
            }
        } catch (error) {
            console.error('添加新位置失败:', error);
            wx.showToast({
                title: '添加位置失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    // 收藏/取消收藏位置
    toggleFavorite() {
        const locationList = this.data.locationList;
        const currentLocation = locationList[this.data.currentLocationIndex];
        currentLocation.isFavorite = !currentLocation.isFavorite;
        
        // 更新位置列表缓存
        cache.set(config.CACHE.LOCATION_LIST, locationList);
        
        // 更新收藏列表
        let favorites = cache.get(config.CACHE.FAVORITES) || [];
        
        if (currentLocation.isFavorite) {
            favorites.unshift({
                title: currentLocation.name,
                time: new Date().toLocaleString(),
                location: currentLocation.location,
                lat: currentLocation.lat,
                lon: currentLocation.lon
            });
        } else {
            favorites = favorites.filter(item => item.location !== currentLocation.location);
        }
        
        // 更新收藏缓存
        cache.set(config.CACHE.FAVORITES, favorites);

        this.setData({
            locationList,
            isFavorite: currentLocation.isFavorite
        });

        wx.showToast({
            title: currentLocation.isFavorite ? '已收藏' : '已取消收藏',
            icon: 'success'
        });
    },

    // 格式化时间
    formatTime(timeStr) {
        return timeStr.split('T')[1].slice(0, 5);
    },

    // 搜索输入处理
    onSearchInput(e) {
        this.setData({
            searchKeyword: e.detail.value.trim()
        });
    },

    // 搜索确认处理
    async onSearchConfirm() {
        const keyword = this.data.searchKeyword;
        if (keyword) {
            this.setData({ loading: true });
            try {
                await this.addNewLocation(keyword);
                this.setData({ 
                    searchKeyword: '',
                    loading: false
                });
            } catch (error) {
                this.setData({ loading: false });
            }
        }
    },

    // 处理加载错误
    handleLoadError() {
        if (this.data.retryCount < this.data.maxRetries) {
            this.setData({
                retryCount: this.data.retryCount + 1
            });
            // 使用指数退避策略
            const delay = Math.min(1000 * Math.pow(2, this.data.retryCount), 10000);
            setTimeout(() => {
                this.loadTideData(this.data.locationList[this.data.currentLocationIndex]);
            }, delay);
        } else {
            this.setData({ 
                loading: false,
                retryCount: 0
            });
            wx.showToast({
                title: '加载失败，请稍后重试',
                icon: 'none',
                duration: 2000
            });
        }
    },

    // 点击更改位置图标
    onChangeLocation() {
        wx.navigateTo({
            url: '/pages/location/location'
        });
    },

    // 更新位置数据（由位置搜索页面调用）
    async updateLocation(location) {
        this.setData({ loading: true });
        try {
            await this.loadTideData(location);
            // 更新位置列表
            const locationList = [location, ...this.data.locationList];
            const locationNames = locationList.map(item => item.name);
            
            this.setData({
                locationList,
                locationNames,
                currentLocationIndex: 0
            });

            // 更新缓存
            cache.set(config.CACHE.LOCATION_LIST, locationList);
        } catch (error) {
            console.error('更新位置失败:', error);
            wx.showToast({
                title: '更新位置失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    // 打开站点搜索页面
    onOpenStationSearch() {
        wx.navigateTo({
            url: '/pages/station/station'
        });
    },

    // 更新站点数据（由站点搜索页面调用）
    async updateStationData(station) {
        this.setData({ loading: true });
        try {
            // 更新位置列表
            const locationList = [station, ...this.data.locationList];
            const locationNames = locationList.map(item => item.name);
            
            this.setData({
                locationList,
                locationNames,
                currentLocationIndex: 0
            });

            // 更新缓存
            cache.set(config.CACHE.LOCATION_LIST, locationList);

            // 加载新站点的潮汐数据
            await this.loadTideData(station);

            wx.showToast({
                title: '更新成功',
                icon: 'success'
            });
        } catch (error) {
            console.error('更新站点数据失败:', error);
            wx.showToast({
                title: '更新失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    }
});
// home.js
const { config, request, cache } = require('../../utils/config');
const echarts = require('../../ec-canvas/echarts');
const navigator = require('../../utils/navigator');
const app = getApp();
const { STORAGE_KEYS } = require('../../utils/constants');

// 确保必要的配置存在
const DEFAULT_CONFIG = {
    DEFAULT_LOCATION: {
        name: '黄浦公园',
        location: 'P2447',
        isFavorite: false
    },
    MAX_LOCATION_COUNT: 10,
    REQUEST: {
        MAX_RETRIES: 3,
        TIMEOUT: 5000
    }
};

// 合并默认配置
if (!config) config = {};
Object.keys(DEFAULT_CONFIG).forEach(key => {
    if (!config[key]) config[key] = DEFAULT_CONFIG[key];
});

// 在文件开头添加调试日志
console.log('Loaded config:', config);

function initChart(canvas, width, height) {
    const chart = echarts.init(canvas, null, {
        width: width,
        height: height
    });
    canvas.setChart(chart);
    return chart;
}

Page({
    data: {
        title: '潮汐信息',
        htmlContent: '',
        ec: {
            onInit: initChart
        },
        loading: false,
        retryCount: 0,
        maxRetries: config.REQUEST.MAX_RETRIES,
        selectedDate: new Date().toISOString().split('T')[0],
        locationList: [],
        currentLocationIndex: 0,
        locationNames: [],
        tideData: null,
        tideDetails: [],
        userInfo: {},
        isFavorite: false,
        searchKeyword: ''
    },

    onLoad() {
        this.loadLocationList();
        this.setData({
            userInfo: app.globalData.userInfo || {
                avatarUrl: '/images/default-avatar.png',
                nickName: '游客',
                intro: ''
            }
        });
    },

    onShow() {
        try {
            const userInfo = wx.getStorageSync(config.STORAGE_KEYS.USER_INFO);
            if (userInfo) {
                this.setData({ userInfo });
            } else {
                this.setData({
                    userInfo: {
                        avatarUrl: '/images/default-avatar.png',
                        nickName: '游客',
                        intro: ''
                    }
                });
            }
        } catch (error) {
            console.error('Failed to get user info from storage:', error);
            this.setData({
                userInfo: {
                    avatarUrl: '/images/default-avatar.png',
                    nickName: '游客',
                    intro: ''
                }
            });
        }
    },

    // 加载位置列表
    async loadLocationList() {
        try {
            let locationList = cache.get(config.CACHE.LOCATION_LIST);
            const cacheExpiry = cache.get(config.CACHE.LOCATION_LIST_EXPIRY);
            
            // 检查缓存是否过期（24小时）
            if (!locationList || !cacheExpiry || Date.now() > cacheExpiry) {
                locationList = [{
                    name: config.DEFAULT_LOCATION.name,
                    location: config.DEFAULT_LOCATION.id,
                    isFavorite: false
                }];
                // 设置24小时过期时间
                cache.set(config.CACHE.LOCATION_LIST, locationList);
                cache.set(config.CACHE.LOCATION_LIST_EXPIRY, Date.now() + 24 * 60 * 60 * 1000);
            }

            // 限制位置列表最大数量
            if (locationList.length > config.MAX_LOCATION_COUNT) {
                locationList = locationList.slice(0, config.MAX_LOCATION_COUNT);
                cache.set(config.CACHE.LOCATION_LIST, locationList);
            }

            const locationNames = locationList.map(item => item.name);
            
            this.setData({
                locationList,
                locationNames
            });

            // 加载默认位置数据
            await this.loadTideData(locationList[this.data.currentLocationIndex]);
        } catch (error) {
            console.error('加载位置列表失败:', error);
            wx.showToast({
                title: '加载位置列表失败',
                icon: 'none'
            });
        }
    },

    // 加载潮汐数据
    async loadTideData(location) {
        this.setData({ loading: true });
        try {
            const formattedDate = this.data.selectedDate.replace(/-/g, '');
            
            const params = {
                location: location.location,
                date: formattedDate
            };
            
            // 添加调试日志
            console.log('Tide API request params:', params);
            
            const tideData = await request(config.ENDPOINTS.TIDE, params);
            
            if (tideData.code === '200') {
                this.updateChart(tideData);
                const tideDetails = this.processTideDetails(tideData);
                
                this.setData({
                    tideData,
                    tideDetails,
                    loading: false
                });

                cache.set(`${config.CACHE.TIDE_DATA}_${location.location}_${formattedDate}`, tideData);
            } else {
                throw new Error(tideData.msg || '获取潮汐数据失败');
            }
        } catch (error) {
            console.error('加载潮汐数据失败:', error);
            wx.showToast({
                title: '加载潮汐数据失败',
                icon: 'none'
            });
            this.setData({ loading: false });
        }
    },

    // 处理潮汐详情数据
    processTideDetails(tideData) {
        if (!tideData || !tideData.tideTable) return [];
        
        return tideData.tideTable.map(item => ({
            time: item.fxTime.split('T')[1].slice(0, 5),
            height: item.height + 'm',
            type: item.type === 'H' ? '满潮' : '干潮',
            updateTime: new Date(item.fxTime).toLocaleString()
        }));
    },

    // 更新图表
    updateChart(tideData) {
        const chart = this.selectComponent('#mychart-dom-bar');
        if (!chart || !tideData || !tideData.tideTable || tideData.tideTable.length === 0) {
            console.warn('无效的图表数据');
            return;
        }

        // 建议将图表配置移到单独的文件中
        const option = require('../../config/chartOptions').getTideChartOption(tideData);
        chart.setOption(option);
    },

    // 获取最大可选日期（未来10天）
    getMaxDate() {
        const date = new Date();
        date.setDate(date.getDate() + 9); // 改为9天后（当天+9=10天）
        return date.toISOString().split('T')[0];
    },

    // 获取最小可选日期（当天）
    getMinDate() {
        return new Date().toISOString().split('T')[0];
    },

    // 日期选择改变
    onDateChange(e) {
        const selectedDate = e.detail.value;
        const minDate = this.getMinDate();
        const maxDate = this.getMaxDate();
        
        // 检查日期是否在有效范围内
        if (selectedDate < minDate || selectedDate > maxDate) {
            wx.showToast({
                title: '只能查询最近10天的数据',
                icon: 'none'
            });
            return;
        }
        
        this.setData({ selectedDate });
        this.loadTideData(this.data.locationList[this.data.currentLocationIndex]);
    },

    // 位置选择改变
    onLocationChange(e) {
        const index = e.detail.value;
        this.setData({ currentLocationIndex: index });
        this.loadTideData(this.data.locationList[index]);
    },

    // 搜索潮汐站点
    async searchTideStations(keyword) {
        try {
            const params = {
                location: keyword,
                type: config.POI.TYPE,
                number: config.POI.MAX_RESULTS
            };

            const response = await request(config.ENDPOINTS.POI_LOOKUP, params, {
                isGeo: true,
                header: {
                    'Authorization': `Bearer ${config.API_KEY}`
                }
            });

            if (response.code === '200' && response.poi && response.poi.length > 0) {
                // 转换 POI 数据为位置列表格式
                return response.poi.map(item => ({
                    name: `${item.adm2}-${item.name}`, // 城市-站点名称
                    location: item.id,  // 使用POI的id作为location
                    isFavorite: false,
                    lat: item.lat,
                    lon: item.lon,
                    adm1: item.adm1,    // 省份
                    adm2: item.adm2,    // 城市
                    country: item.country,
                    timezone: item.tz,
                    rank: item.rank
                }));
            } else {
                wx.showToast({
                    title: '未找到潮汐站点',
                    icon: 'none'
                });
                return [];
            }
        } catch (error) {
            console.error('搜索潮汐站点失败:', error);
            wx.showToast({
                title: '搜索潮汐站点失败',
                icon: 'none'
            });
            return [];
        }
    },

    // 添加新位置
    async addNewLocation(keyword) {
        if (!keyword.trim()) {
            wx.showToast({
                title: '请输入位置名称',
                icon: 'none'
            });
            return;
        }

        this.setData({ loading: true });
        try {
            const newLocations = await this.searchTideStations(keyword);
            if (newLocations && newLocations.length > 0) {
                // 检查是否已存在相同位置
                const existingLocations = new Set(this.data.locationList.map(item => item.location));
                const uniqueNewLocations = newLocations.filter(item => !existingLocations.has(item.location));

                if (uniqueNewLocations.length === 0) {
                    wx.showToast({
                        title: '该位置已存在',
                        icon: 'none'
                    });
                    return;
                }

                // 更新位置列表
                const locationList = [...this.data.locationList, ...uniqueNewLocations];
                const locationNames = locationList.map(item => item.name);

                // 保存到缓存
                cache.set(config.CACHE.LOCATION_LIST, locationList);

                // 更新状态
                this.setData({
                    locationList,
                    locationNames,
                    currentLocationIndex: locationList.length - 1, // 自动选中新添加的位置
                    searchKeyword: '' // 清空搜索框
                });

                // 加载新位置的数据
                await this.loadTideData(locationList[locationList.length - 1]);

                wx.showToast({
                    title: '添加位置成功',
                    icon: 'success'
                });
            }
        } catch (error) {
            console.error('添加新位置失败:', error);
            wx.showToast({
                title: '添加位置失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    // 收藏/取消收藏位置
    toggleFavorite() {
        const locationList = this.data.locationList;
        const currentLocation = locationList[this.data.currentLocationIndex];
        currentLocation.isFavorite = !currentLocation.isFavorite;
        
        // 更新位置列表缓存
        cache.set(config.CACHE.LOCATION_LIST, locationList);
        
        // 更新收藏列表
        let favorites = cache.get(config.CACHE.FAVORITES) || [];
        
        if (currentLocation.isFavorite) {
            favorites.unshift({
                title: currentLocation.name,
                time: new Date().toLocaleString(),
                location: currentLocation.location,
                lat: currentLocation.lat,
                lon: currentLocation.lon
            });
        } else {
            favorites = favorites.filter(item => item.location !== currentLocation.location);
        }
        
        // 更新收藏缓存
        cache.set(config.CACHE.FAVORITES, favorites);

        this.setData({
            locationList,
            isFavorite: currentLocation.isFavorite
        });

        wx.showToast({
            title: currentLocation.isFavorite ? '已收藏' : '已取消收藏',
            icon: 'success'
        });
    },

    // 格式化时间
    formatTime(timeStr) {
        return timeStr.split('T')[1].slice(0, 5);
    },

    // 搜索输入处理
    onSearchInput(e) {
        this.setData({
            searchKeyword: e.detail.value.trim()
        });
    },

    // 搜索确认处理
    async onSearchConfirm() {
        const keyword = this.data.searchKeyword;
        if (keyword) {
            this.setData({ loading: true });
            try {
                await this.addNewLocation(keyword);
                this.setData({ 
                    searchKeyword: '',
                    loading: false
                });
            } catch (error) {
                this.setData({ loading: false });
            }
        }
    },

    // 处理加载错误
    handleLoadError() {
        if (this.data.retryCount < this.data.maxRetries) {
            this.setData({
                retryCount: this.data.retryCount + 1
            });
            // 使用指数退避策略
            const delay = Math.min(1000 * Math.pow(2, this.data.retryCount), 10000);
            setTimeout(() => {
                this.loadTideData(this.data.locationList[this.data.currentLocationIndex]);
            }, delay);
        } else {
            this.setData({ 
                loading: false,
                retryCount: 0
            });
            wx.showToast({
                title: '加载失败，请稍后重试',
                icon: 'none',
                duration: 2000
            });
        }
    },

    // 点击更改位置图标
    onChangeLocation() {
        wx.navigateTo({
            url: '/pages/location/location'
        });
    },

    // 更新位置数据（由位置搜索页面调用）
    async updateLocation(location) {
        this.setData({ loading: true });
        try {
            await this.loadTideData(location);
            // 更新位置列表
            const locationList = [location, ...this.data.locationList];
            const locationNames = locationList.map(item => item.name);
            
            this.setData({
                locationList,
                locationNames,
                currentLocationIndex: 0
            });

            // 更新缓存
            cache.set(config.CACHE.LOCATION_LIST, locationList);
        } catch (error) {
            console.error('更新位置失败:', error);
            wx.showToast({
                title: '更新位置失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    // 打开站点搜索页面
    onOpenStationSearch() {
        wx.navigateTo({
            url: '/pages/station/station'
        });
    },

    // 更新站点数据（由站点搜索页面调用）
    async updateStationData(station) {
        this.setData({ loading: true });
        try {
            // 更新位置列表
            const locationList = [station, ...this.data.locationList];
            const locationNames = locationList.map(item => item.name);
            
            this.setData({
                locationList,
                locationNames,
                currentLocationIndex: 0
            });

            // 更新缓存
            cache.set(config.CACHE.LOCATION_LIST, locationList);

            // 加载新站点的潮汐数据
            await this.loadTideData(station);

            wx.showToast({
                title: '更新成功',
                icon: 'success'
            });
        } catch (error) {
            console.error('更新站点数据失败:', error);
            wx.showToast({
                title: '更新失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    }
});