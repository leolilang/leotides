// app.js
App({
    onLaunch() {
        // 展示本地存储能力
        const logs = wx.getStorageSync('logs') || [];
        logs.unshift(Date.now());
        wx.setStorageSync('logs', logs);

        // 移除初始登录逻辑
        // wx.login({
        //     success: res => {
        //         // 发送 res.code 到后台换取 openId, sessionKey, unionId
        //     }
        // });
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