// app.js
App({
    onLaunch() {
        // 展示本地存储能力
        const logs = wx.getStorageSync('logs') || [];
        logs.unshift(Date.now());
        wx.setStorageSync('logs', logs);

        // 初始化用户登录状态
        this.globalData = {
            userInfo: {
                // 使用本地图片的相对路径
                avatarUrl: '/images/default-avatar.png', 
                nickName: '游客'
            },
            contentHtml: '',
            isLoggedIn: false // 添加登录状态标志
        };
        // 添加 saveUserInfoToStorage 方法
        this.saveUserInfoToStorage = function() {
            wx.setStorageSync('userInfo', this.globalData.userInfo);
        }
    },
    globalData: {
        userInfo: {
            // 使用本地图片的相对路径
            avatarUrl: '/images/default-avatar.png', 
            nickName: '游客'
        },
        contentHtml: ''
    },
    // 添加 saveUserInfoToStorage 方法
    saveUserInfoToStorage() {
        wx.setStorageSync('userInfo', this.globalData.userInfo);
    }
});