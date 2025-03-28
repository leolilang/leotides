// history.js
Page({
    data: {
        history: [],
        loading: true
    },

    onLoad() {
        this.loadHistory();
    },

    onShow() {
        this.loadHistory();
    },

    // 加载浏览历史
    loadHistory() {
        const history = wx.getStorageSync('browseHistory') || [];
        this.setData({
            history,
            loading: false
        });
    },

    // 清空历史记录
    clearHistory() {
        wx.showModal({
            title: '提示',
            content: '确定要清空浏览历史吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.setStorageSync('browseHistory', []);
                    this.setData({ history: [] });
                    wx.showToast({
                        title: '已清空历史记录',
                        icon: 'success'
                    });
                }
            }
        });
    },

    // 删除单条历史记录
    deleteHistoryItem(e) {
        const { index } = e.currentTarget.dataset;
        const history = this.data.history;
        history.splice(index, 1);
        
        wx.setStorageSync('browseHistory', history);
        this.setData({ history });

        wx.showToast({
            title: '已删除',
            icon: 'success'
        });
    }
}); 