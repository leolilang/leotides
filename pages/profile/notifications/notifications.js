Page({
    data: {
        notifications: [],
        loading: true
    },

    onLoad() {
        this.loadNotifications();
    },

    onShow() {
        this.loadNotifications();
    },

    // 加载消息通知
    loadNotifications() {
        const notifications = wx.getStorageSync('notifications') || [];
        this.setData({
            notifications,
            loading: false
        });
    },

    // 标记消息为已读
    markAsRead(e) {
        const { index } = e.currentTarget.dataset;
        const notifications = this.data.notifications;
        notifications[index].isRead = true;
        
        wx.setStorageSync('notifications', notifications);
        this.setData({ notifications });

        wx.showToast({
            title: '已标记为已读',
            icon: 'success'
        });
    },

    // 清空所有消息
    clearNotifications() {
        wx.showModal({
            title: '提示',
            content: '确定要清空所有消息吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.setStorageSync('notifications', []);
                    this.setData({ notifications: [] });
                    wx.showToast({
                        title: '已清空消息',
                        icon: 'success'
                    });
                }
            }
        });
    }
}); 