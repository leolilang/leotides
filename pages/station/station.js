const { config, request } = require('../../utils/config');

Page({
    data: {
        keyword: '',
        stations: [],
        loading: false,
        searchHistory: []
    },

    onLoad() {
        // 加载搜索历史
        const history = wx.getStorageSync('searchHistory') || [];
        this.setData({ searchHistory: history });
    },

    // 保存搜索历史
    saveSearchHistory(keyword) {
        let history = this.data.searchHistory;
        // 移除重复项
        history = history.filter(item => item !== keyword);
        // 添加到开头
        history.unshift(keyword);
        // 最多保存10条
        history = history.slice(0, 10);
        
        wx.setStorageSync('searchHistory', history);
        this.setData({ searchHistory: history });
    },

    // 清除搜索历史
    clearHistory() {
        wx.removeStorageSync('searchHistory');
        this.setData({ searchHistory: [] });
    },

    // 输入关键词
    onKeywordInput(e) {
        this.setData({
            keyword: e.detail.value
        });
    },

    // 搜索站点
    async onSearch() {
        const keyword = this.data.keyword.trim();
        if (!keyword) {
            wx.showToast({
                title: '请输入城市名称',
                icon: 'none'
            });
            return;
        }

        this.setData({ 
            loading: true,
            stations: [] // 清空之前的结果
        });

        try {
            const params = {
                location: keyword,
                type: 'TSTA',
                key: config.FREE_API_KEY
            };

            const response = await wx.request({
                url: `${config.GEO_API_URL}/poi/lookup`,
                data: params
            });

            if (response.data.code === '200' && response.data.poi) {
                // 按照rank排序
                const sortedStations = response.data.poi.sort((a, b) => b.rank - a.rank);
                this.setData({ stations: sortedStations });
                this.saveSearchHistory(keyword);
            } else {
                wx.showToast({
                    title: '未找到潮汐站点',
                    icon: 'none'
                });
            }
        } catch (error) {
            console.error('搜索站点失败:', error);
            wx.showToast({
                title: '搜索失败，请重试',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    // 选择站点
    onStationSelect(e) {
        const station = e.currentTarget.dataset.station;
        // 获取主页实例
        const pages = getCurrentPages();
        const homePage = pages[pages.length - 2];
        
        // 更新主页数据
        homePage.updateStationData({
            name: `${station.adm2}-${station.name}`,
            location: station.id,
            lat: station.lat,
            lon: station.lon,
            adm1: station.adm1,
            adm2: station.adm2
        });

        // 返回主页
        wx.navigateBack();
    },

    onPullDownRefresh() {
        if (this.data.keyword) {
            this.onSearch().then(() => {
                wx.stopPullDownRefresh();
            });
        } else {
            wx.stopPullDownRefresh();
        }
    }
}); 