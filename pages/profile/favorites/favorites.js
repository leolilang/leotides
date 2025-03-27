Page({
    data: {
        favorites: [],
        loading: true
    },

    onLoad() {
        this.loadFavorites();
    },

    onShow() {
        this.loadFavorites();
    },

    // 加载收藏列表
    loadFavorites() {
        const favorites = wx.getStorageSync('favorites') || [];
        this.setData({
            favorites,
            loading: false
        });
    },

    // 取消收藏
    removeFavorite(e) {
        const { index } = e.currentTarget.dataset;
        const favorites = this.data.favorites;
        favorites.splice(index, 1);
        
        wx.setStorageSync('favorites', favorites);
        this.setData({ favorites });

        wx.showToast({
            title: '已取消收藏',
            icon: 'success'
        });
    },

    // 清空收藏
    clearFavorites() {
        wx.showModal({
            title: '提示',
            content: '确定要清空所有收藏吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.setStorageSync('favorites', []);
                    this.setData({ favorites: [] });
                    wx.showToast({
                        title: '已清空收藏',
                        icon: 'success'
                    });
                }
            }
        });
    }
}); 