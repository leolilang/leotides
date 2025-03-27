// app.js
App({
    onLaunch() {
        // 展示本地存储能力
        const logs = wx.getStorageSync('logs') || [];
        logs.unshift(Date.now());
        wx.setStorageSync('logs', logs);

        // 从本地存储读取用户信息和登录状态
        const userInfo = wx.getStorageSync('userInfo') || null;
        const isLoggedIn = wx.getStorageSync('isLoggedIn') || false;

        // 初始化 globalData，确保用户数据不会被重置
        this.globalData = {
            userInfo: userInfo || {  // 如果本地没有存储，则使用默认值
                avatarUrl: '/images/default-avatar.png',
                nickName: '游客',
                intro: '' // 新增个人简介字段
            },
            isLoggedIn: isLoggedIn,  // 直接使用本地存储的登录状态
            contentHtml: ''
        };
    },

    globalData: {
        userInfo: {
            avatarUrl: '/images/default-avatar.png',
            nickName: '游客',
            intro: '' // 新增个人简介字段
        },
        isLoggedIn: false,  // 默认未登录
        contentHtml: '',
        apiKey: '3dc2b4606d7c431081593b6b46e55978' // 替换为你的实际API Key
    },

    // 保存用户信息到本地存储
    saveUserInfoToStorage() {
        wx.setStorageSync('userInfo', this.globalData.userInfo);
        wx.setStorageSync('isLoggedIn', this.globalData.isLoggedIn);
    }
});
