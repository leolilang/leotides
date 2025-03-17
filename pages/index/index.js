// miniprogram-1/pages/index/index.js
Page({
    data: {
        userInfo: {
            // 修改为本地图片路径
            avatarUrl: '/images/default-avatar.png', 
            nickName: '游客'
        },
        canIUseNicknameComp: wx.canIUse('button.open-type.chooseAvatar'),
        canIUseGetUserProfile: wx.canIUse('getUserProfile'),
        hasUserInfo: false
    },

    goToHomePage() {
        wx.navigateTo({
            url: '../home/home'
        });
    },

    onChooseAvatar(e) {
        const { avatarUrl } = e.detail;
        getApp().globalData.userInfo.avatarUrl = avatarUrl;
        this.setData({ userInfo: getApp().globalData.userInfo, hasUserInfo: true });
    },

    onInputChange(e) {
        const nickName = e.detail.value;
        getApp().globalData.userInfo.nickName = nickName;
        this.setData({ userInfo: getApp().globalData.userInfo, hasUserInfo: true });
    },

    getUserProfile() {
        wx.getUserProfile({
            desc: '用于完善个人资料',
            success: res => {
                getApp().globalData.userInfo = {
                    avatarUrl: res.userInfo.avatarUrl,
                    nickName: res.userInfo.nickName
                };
                this.setData({
                    userInfo: getApp().globalData.userInfo,
                    hasUserInfo: true
                });
            },
            fail: err => {
                console.error('获取用户信息失败:', err);
            }
        });
    }
});