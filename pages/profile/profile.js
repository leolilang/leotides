// profile.js
Page({
    data: {
        userInfo: {
            avatarUrl: '/images/default-avatar.png',
            nickName: '游客',
            intro: ''
        },
        isEditing: false,
        tempUserInfo: {
            nickName: '',
            intro: ''
        }
    },

    onLoad() {
        // 从本地存储获取用户信息
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.setData({ userInfo });
        }
    },

    onShow() {
        // 每次显示页面时更新用户信息
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.setData({ userInfo });
        }
    },

    // 开始编辑用户信息
    startEdit() {
        this.setData({
            isEditing: true,
            tempUserInfo: {
                nickName: this.data.userInfo.nickName,
                intro: this.data.userInfo.intro
            }
        });
    },

    // 取消编辑
    cancelEdit() {
        this.setData({
            isEditing: false
        });
    },

    // 保存用户信息
    saveUserInfo() {
        const { tempUserInfo } = this.data;
        const newUserInfo = {
            ...this.data.userInfo,
            nickName: tempUserInfo.nickName,
            intro: tempUserInfo.intro
        };

        // 更新本地存储
        wx.setStorageSync('userInfo', newUserInfo);
        
        // 更新全局数据
        const app = getApp();
        app.globalData.userInfo = newUserInfo;
        app.saveUserInfoToStorage();

        this.setData({
            userInfo: newUserInfo,
            isEditing: false
        });

        wx.showToast({
            title: '保存成功',
            icon: 'success'
        });
    },

    // 处理输入变化
    onInput(e) {
        const { field } = e.currentTarget.dataset;
        this.setData({
            [`tempUserInfo.${field}`]: e.detail.value
        });
    },

    // 选择头像
    chooseAvatar() {
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const tempFilePath = res.tempFilePaths[0];
                const newUserInfo = {
                    ...this.data.userInfo,
                    avatarUrl: tempFilePath
                };

                // 更新本地存储
                wx.setStorageSync('userInfo', newUserInfo);
                
                // 更新全局数据
                const app = getApp();
                app.globalData.userInfo = newUserInfo;
                app.saveUserInfoToStorage();

                this.setData({
                    userInfo: newUserInfo
                });
            }
        });
    },

    // 功能页面跳转
    navigateToFavorites() {
        wx.navigateTo({
            url: '/pages/profile/favorites/favorites'
        });
    },

    navigateToHistory() {
        wx.navigateTo({
            url: '/pages/profile/history/history'
        });
    },

    navigateToNotifications() {
        wx.navigateTo({
            url: '/pages/profile/notifications/notifications'
        });
    },

    navigateToAbout() {
        wx.navigateTo({
            url: '/pages/profile/about/about'
        });
    }
}); 