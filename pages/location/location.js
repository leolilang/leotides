const { config, request } = require('../../utils/config');

Page({
    data: {
        keyword: '',
        searchResults: [],
        loading: false
    },

    // 输入关键词
    onKeywordInput(e) {
        this.setData({
            keyword: e.detail.value
        });
    },

    // 搜索位置
    async onSearch() {
        const keyword = this.data.keyword.trim();
        if (!keyword) {
            wx.showToast({
                title: '请输入搜索关键词',
                icon: 'none'
            });
            return;
        }

        this.setData({ loading: true });
        try {
            const params = {
                location: keyword,
                type: config.POI.TYPE,
                number: config.POI.MAX_RESULTS
            };

            const response = await request(config.ENDPOINTS.POI_LOOKUP, params, {
                isGeo: true
            });

            if (response.code === '200' && response.poi) {
                const locations = response.poi.map(item => ({
                    name: item.name,
                    location: item.id,
                    adm2: item.adm2,
                    lat: item.lat,
                    lon: item.lon
                }));

                this.setData({ searchResults: locations });
            } else {
                this.setData({ searchResults: [] });
                wx.showToast({
                    title: '未找到相关位置',
                    icon: 'none'
                });
            }
        } catch (error) {
            console.error('搜索位置失败:', error);
            wx.showToast({
                title: '搜索失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    // 选择位置
    onLocationSelect(e) {
        const location = e.currentTarget.dataset.location;
        // 返回首页并更新数据
        const pages = getCurrentPages();
        const homePage = pages[pages.length - 2];
        
        homePage.updateLocation(location);
        wx.navigateBack();
    }
}); 