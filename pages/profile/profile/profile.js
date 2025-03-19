// miniprogram-1/pages/profile/profile/profile.js
Page({
    data: {
        userInfo: {},
        genderList: ['男', '女'],
        genderIndex: -1
    },

    onLoad() {
        const app = getApp();
        this.setData({
            userInfo: app.globalData.userInfo
        });
        const genderIndex = this.data.genderList.indexOf(this.data.userInfo.gender);
        this.setData({ genderIndex });
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

    onIntroInput(e) {
        const intro = e.detail.value;
        getApp().globalData.userInfo.intro = intro;
        this.setData({ userInfo: getApp().globalData.userInfo });
      },

    onGenderChange(e) {
        const gender = this.data.genderList[e.detail.value];
        getApp().globalData.userInfo.gender = gender;
        this.setData({ 
            userInfo: getApp().globalData.userInfo,
            genderIndex: e.detail.value
        });
    },

    onChooseBackgroundImage() {
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success: res => {
                const backgroundImage = res.tempFilePaths[0];
                getApp().globalData.userInfo.backgroundImage = backgroundImage;
                this.setData({ userInfo: getApp().globalData.userInfo });
                getApp().saveUserInfoToStorage();
            }
        });
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
        // 跳转至主页
        wx.redirectTo({
            url: '../../home/home'
        });
    },
    // 退出登录逻辑
    onLogout() {
        // 清空本地存储的用户信息
        wx.removeStorageSync('userInfo');
        wx.removeStorageSync('isLoggedIn');
        getApp().globalData.userInfo = {
            avatarUrl: '/images/default-avatar.png', 
            nickName: '游客',
            intro: '' // 新增个人简介字段
        };
        getApp().globalData.isLoggedIn = false;
        // 跳转至主页
        wx.showToast({
            title: '退出登录成功',
            icon: 'success'
        });
        wx.switchTab({
            url: '../../home/home'
        });
    },
    goToWeatherPage() {
        wx.switchTab({
            url: '../weather/weather',
            success: () => {
                console.log('成功跳转到天气页面');
            },
            fail: err => {
                console.error('跳转失败:', err);
            }
        });
    }
});