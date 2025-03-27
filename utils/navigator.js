// utils/navigator.js
const app = getApp();

// 跳转到主页
function goToHome() {
    wx.switchTab({
        url: '/pages/home/home',
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
        url: '/pages/weather/weather',
        success: () => {
            console.log('成功跳转到天气');
        },
        fail: err => {
            console.error('跳转失败:', err);
        }
    });
}

module.exports = {
    goToHome,
    goToWeather
};