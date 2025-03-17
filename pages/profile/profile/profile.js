// miniprogram-1/pages/profile/profile/profile.js
Page({
    data: {
        userInfo: {}
    },

    onLoad() {
        // 从本地存储中读取用户信息
        const userInfo = wx.getStorageSync('userInfo') || {};
        this.setData({ userInfo });
    },

    onChooseAvatar(e) {
        const { avatarUrl } = e.detail;
        getApp().globalData.userInfo.avatarUrl = avatarUrl;
        this.setData({ userInfo: getApp().globalData.userInfo });
        getApp().saveUserInfoToStorage();
    },

    onInputChange(e) {
        const nickName = e.detail.value;
        getApp().globalData.userInfo.nickName = nickName;
        this.setData({ userInfo: getApp().globalData.userInfo });
    },

    onBirthdayChange(e) {
        const birthday = e.detail.value;
        getApp().globalData.userInfo.birthday = birthday;
        this.setData({ userInfo: getApp().globalData.userInfo });
    },

    onRegionChange(e) {
        const region = e.detail.value;
        getApp().globalData.userInfo.region = region;
        this.setData({ userInfo: getApp().globalData.userInfo }, () => {
            console.log('地区选择更新后 userInfo:', this.data.userInfo);
        });
    },

    onIntroductionChange(e) {
        const introduction = e.detail.value;
        getApp().globalData.userInfo.introduction = introduction;
        this.setData({ userInfo: getApp().globalData.userInfo });
    },

    // 新增确认按钮点击事件
    onConfirm() {
        getApp().saveUserInfoToStorage();
        wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
        });
        console.log('点击确认按钮，保存用户信息:', getApp().globalData.userInfo);
    }
});