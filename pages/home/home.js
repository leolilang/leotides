// home.js
const { parse } = require('node-html-parser');

Page({
    data: {
        title: '淀山湖 - 拦路港潮汐时刻表',
        htmlContent: ''
    },
    goToProfile() {
        wx.navigateTo({
            url: '../profile/profile/profile', // 修正为完整路径
            success: function () {
                console.log('成功跳转到个人中心页面');
            },
            fail: function (err) {
                console.error('跳转失败:', err);
            }
        });
    },
    onLoad() {
        // 发起请求获取 https://www.chaoxibiao.net 的内容
        wx.request({
            url: 'https://www.chaoxibiao.net/tides/107.html',
            success: function (res) {
                if (res.statusCode === 200) {
                    const html = res.data;
                    // 使用 node-html-parser 解析 HTML
                    const root = parse(html);
                    const contentDiv = root.querySelector('#content');
                    if (contentDiv) {
                        const contentHtml = contentDiv.outerHTML;
                        this.setData({
                            htmlContent: contentHtml
                        });
                    }
                } else {
                    console.error('请求失败，状态码:', res.statusCode);
                }
            }.bind(this),
            fail: function (err) {
                console.error('请求失败:', err);
            }
        });
    }
});