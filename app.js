// app.js
const { config } = require('./utils/config');

App({
    onLaunch() {
        // 获取用户信息
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                    wx.getUserInfo({
                        success: res => {
                            this.globalData.userInfo = res.userInfo;
                            if (this.userInfoReadyCallback) {
                                this.userInfoReadyCallback(res);
                            }
                        }
                    });
                }
            }
        });
    },

    globalData: {
        userInfo: null,
        defaultLocation: config.DEFAULT_LOCATION
    }
});
