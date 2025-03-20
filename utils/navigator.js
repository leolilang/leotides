// utils/navigator.js
const app = getApp();

// 跳转到个人中心页面
function goToProfile() {
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

                                wx.showToast({
                                    title: '登录成功',
                                    icon: 'success'
                                });
                                // 登录成功后跳转到个人中心页面
                                wx.switchTab({
                                    url: '../profile/profile/profile',
                                    success: () => {
                                        console.log('成功跳转到个人中心页面');
                                    },
                                    fail: err => {
                                        console.error('跳转失败:', err);
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    } else {
        // 已登录，直接跳转到个人中心页面
        wx.switchTab({
            url: '../profile/profile/profile',
            success: () => {
                console.log('成功跳转到个人中心页面');
            },
            fail: err => {
                console.error('跳转失败:', err);
            }
        });
    }
}

// 跳转到主页
function goToHome() {
    wx.switchTab({
        url: '../home/home',
        success: () => {
            console.log('成功跳转到主页');
        },
        fail: err => {
            console.error('跳转失败:', err);
        }
    });
}

// 跳转到天气
function goToWeather() {
    wx.switchTab({
        url: '../weather/weather',
        success: () => {
            console.log('成功跳转到天气');
        },
        fail: err => {
            console.error('跳转失败:', err);
        }
    });
}

module.exports = {
    goToProfile,
    goToHome,
    goToWeather
};