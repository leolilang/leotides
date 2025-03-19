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
      }
})