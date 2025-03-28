// about.js
Page({
    data: {
        version: '1.0.0',
        appInfo: {
            name: '潮汐助手',
            description: '为您提供准确的潮汐信息和天气服务',
            contact: 'lilangleo@qq.com'
        }
    },

    // 复制联系方式
    copyContact() {
        wx.setClipboardData({
            data: this.data.appInfo.contact,
            success: () => {
                wx.showToast({
                    title: '已复制联系方式',
                    icon: 'success'
                });
            }
        });
    },

    // 检查更新
    checkUpdate() {
        wx.showLoading({
            title: '检查更新中...'
        });

        // 模拟检查更新
        setTimeout(() => {
            wx.hideLoading();
            wx.showModal({
                title: '检查更新',
                content: '当前已是最新版本',
                showCancel: false
            });
        }, 1500);
    },

    // 用户协议
    showUserAgreement() {
        wx.showModal({
            title: '用户协议',
            content: '1. 本应用仅供用户查询潮汐和天气信息使用。\n2. 我们会保护您的个人信息安全。\n3. 使用本应用即表示您同意本协议。',
            showCancel: false
        });
    },

    // 隐私政策
    showPrivacyPolicy() {
        wx.showModal({
            title: '隐私政策',
            content: '1. 我们收集的信息仅用于提供更好的服务。\n2. 我们不会将您的信息用于其他用途。\n3. 您可以随时删除您的个人信息。',
            showCancel: false
        });
    }
}); 