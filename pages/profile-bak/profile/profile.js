// miniprogram-1/pages/profile/profile/profile.js
const navigator = require('../../../utils/navigator');

Page({
    data: {
        userInfo: {}
    },

    onLoad() {
        const app = getApp();
        this.setData({
            userInfo: app.globalData.userInfo || {
                avatarUrl: '/images/default-avatar.png',
                nickName: '游客',
                intro: '' // 新增个人简介字段，防止 undefined
            }
        });
    },

    onShow() {
        const app = getApp();
        if (!app.globalData.isLoggedIn) {
            // 弹出登录提示窗口
            wx.showModal({
                title: '登录提示',
                content: '请先登录以查看个人中心',
                confirmText: '登录',
                success: res => {
                    if (res.confirm) {
                        // 弹出带输入框的登录弹窗
                        wx.showModal({
                            title: '登录',
                            content: '游客',
                            editable: true,
                            placeholderText: '请输入昵称',
                            confirmText: '确定',
                            cancelText: '取消',
                            success: loginRes => {
                                if (loginRes.confirm) {
                                    const nickname = loginRes.content && loginRes.content.trim();
                                    // 验证昵称长度
                                    if (!nickname || nickname.length < 2 || nickname.length > 10) {
                                        wx.showToast({
                                            title: '请输入有效的昵称（2 - 10个字符）',
                                            icon: 'none'
                                        });
                                        return;
                                    }
                                    // 保存昵称信息到本地存储，并更新全局状态
                                    wx.setStorageSync('nickName', nickname);
                                    app.globalData.isLoggedIn = true;
                                    app.globalData.userInfo.nickName = nickname;
                                    this.setData({ userInfo: app.globalData.userInfo });
                                    wx.showToast({
                                        title: '登录成功',
                                        icon: 'success'
                                    });
                                    // 登录成功更新当前页面数据

                                }
                            }
                        });
                    }
                }
            });
        }
    },
     // 头像选择
    onChooseAvatar(e) {
        const { avatarUrl } = e.detail;
        const app = getApp();
        app.globalData.userInfo.avatarUrl = avatarUrl;
        this.setData({ userInfo: app.globalData.userInfo });
        app.saveUserInfoToStorage();
    },
    // 昵称输入
    onInputChange(e) {
        const nickName = e.detail.value;
        const app = getApp();
        app.globalData.userInfo.nickName = nickName;
        this.setData({ userInfo: app.globalData.userInfo });
        app.saveUserInfoToStorage();
    },
     // 个人简介输入
    onIntroInput(e) {
        const intro = e.detail.value;
        const app = getApp();
        app.globalData.userInfo.intro = intro;
        this.setData({ userInfo: app.globalData.userInfo });
        app.saveUserInfoToStorage();
      },

    // 选择背景图片
    onChooseBackgroundImage() {
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success: res => {
                const backgroundImage = res.tempFilePaths[0];
                const app = getApp();
                app.globalData.userInfo.backgroundImage = backgroundImage;
                this.setData({ userInfo: app.globalData.userInfo });
                app.saveUserInfoToStorage();
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
        // 跳转至主页
        navigator.goToHome();
    },
    // 退出登录
    onLogout() {
        const app = getApp();
        
        // 清除本地存储
        wx.removeStorageSync('userInfo');
        wx.removeStorageSync('isLoggedIn');

        // 重置全局数据
        const defaultUserInfo = {
            avatarUrl: '/images/default-avatar.png',
            nickName: '游客',
            intro: '' // 清空个人简介
        };
        app.globalData.userInfo = defaultUserInfo;
        app.globalData.isLoggedIn = false;

        // **关键：同步更新页面**
        this.setData({ userInfo: defaultUserInfo });

        wx.showToast({
            title: '退出登录成功',
            icon: 'success'
        });

        navigator.goToHome(); // 跳转至主页
    }
});