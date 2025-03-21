// weather.js

const { parse } = require('node-html-parser');

Page({
    data: {
        current: {},       // 当前天气
        hourly: [],        // 24小时预报
        daily15: [],       // 15天预报
        lifeIndexes: [],   // 生活指数
        airQuality: {}     // 空气质量
      },
    onLoad() {
        wx.request({
            url: 'https://weathernew.pae.baidu.com/weathernew/pc?query=上海天气&srcid=4982&forecast=long_day_forecast',
            success: (res) => {
                if (res.statusCode === 200) {
                    // console.log('API 响应数据:', res.data); // 打印整个响应数据
                    // 这里需要根据实际返回的结构进行解析
                    const resWeatherData = res.data;
                    // 解析 HTML
                    const root = parse(resWeatherData);
                    // 获取所有 <script> 标签
                    const scriptTags = root.querySelectorAll('script');
                    let tplData = null;
                    // 遍历 script 标签，查找包含 window.tplData 的内容
                    scriptTags.forEach(script => {
                        const scriptText = script.text;
                        const match = scriptText.match(/window\.tplData\s*=\s*(\{.*?\});/s);
                        if (match) {
                            try {
                                tplData = JSON.parse(match[1]);
                            } catch (error) {
                                console.error('JSON 解析失败:', error);
                            }
                        }
                    });
                    console.log('提取的 JSON:',tplData); // 输出提取的 JSON 数据
                    this.processData(tplData);
                } else {
                    console.error('请求失败，状态码:', res.statusCode);
                }
            },
            fail: (err) => {
                console.error('请求失败:', err);
            }
        });
    },
    processData(data) {
        // 当前天气
        const current = {
          temp: data.weather.temperature,
          weather: data.weather.weather,
          wind: `${data.weather.wind_direction}${data.weather.wind_power}`,
          humidity: data.weather.humidity + '%',
          sunrise: data.feature.sunriseTime,
          sunset: data.feature.sunsetTime
        };
    
        // 24小时预报
        const hourly = data['24_hour_forecast'].info
          .slice(0, 24)
          .map(item => ({
            time: item.hour.slice(8, 10) + '时',
            temp: item.temperature,
            icon: this.getWeatherIcon(item.weather)
          }));
    
        // 15天预报
        const daily15 = data['15_day_forecast'].info
          .slice(0, 15)
          .map(item => ({
            date: this.formatDate(item.date),
            dayIcon: this.getWeatherIcon(item.weather_day),
            nightIcon: this.getWeatherIcon(item.weather_night),
            temp: `${item.temperature_day}°/${item.temperature_night}°`
          }));
    
        // 生活指数
        const lifeIndexes = data.recommend_zhishu.item.map(item => ({
          name: item.item_name,
          value: item.item_desc
        }));
    
        // 空气质量
        const airQuality = {
          level: data.ps_pm25.level,
          value: data.ps_pm25.ps_pm25
        };
    
        this.setData({ current, hourly, daily15, lifeIndexes, airQuality });
      },
    
      getWeatherIcon(weather) {
        const icons = {
          '晴': 'sunny',
          '多云': 'cloudy',
          '阴': 'overcast',
          '小雨': 'rain'
        };
        return icons[weather] || 'unknown';
      },
    
      formatDate(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
      },
      goToHomePage() {
        wx.switchTab({
            url: '../home/home',
            success: () => {
                console.log('成功跳转到主页');
            },
            fail: err => {
                console.error('跳转失败:', err);
            }
        });
    },
    goToProfile() {
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
                                            title: '请输入有效的昵称（2-10个字符）',
                                            icon: 'none'
                                        });
                                        return;
                                    }
                                    // 保存昵称信息到本地存储，并更新全局状态
                                    wx.setStorageSync('nickName', nickname);
                                    app.globalData.isLoggedIn = true;
                                    app.globalData.userInfo.nickName = nickname;
                                    app.saveUserInfoToStorage(); // 保存用户信息和登录状态

                                    wx.showToast({
                                        title: '登录成功',
                                        icon: 'success'
                                    });
                                    // 登录成功后跳转到个人中心页面
                                    wx.switchTab ({
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
            wx.switchTab ({
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
})