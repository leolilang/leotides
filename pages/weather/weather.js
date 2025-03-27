// pages/weather/weather.js
import wxCharts from '../../utils/wxcharts';

Page({
    data: {
      currentCityCode: "101020100",      // 当前选中城市id
      currentCity: "上海",      // 当前选中城市name
      currentWeather: null,    // 当前天气
      dailyForecast: [],       // 七日预报
      loading: false,          // 加载状态
      apiKey: "3dc2b4606d7c431081593b6b46e55978",   // 替换为实际天气API
      chart: null, // 存储折线图实例
      retryCount: 0, // 重试次数
      maxRetries: 3  // 最大重试次数
    },
  
    onLoad() {
      this.loadWeatherData();
    },
  
    // 启用下拉刷新
    onPullDownRefresh() {
      this.loadWeatherData().then(() => {
        wx.stopPullDownRefresh();
      }).catch(() => {
        wx.stopPullDownRefresh();
      });
    },
  
    // 页面显示时检查是否需要更新数据
    onShow() {
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.route === 'pages/home/home') {
        const location = prevPage.data.selectedLocation;
        if (location && location.location !== this.data.currentCityCode) {
          console.log('从主页面接收到位置更新:', location);
          this.updateLocationAndWeather(location);
        }
      }
    },
  
    // 加载天气
    async loadWeatherData(location = null) {
      if (this.data.loading) return;
      
      this.setData({ 
        loading: true,
        retryCount: 0
      });
      
      try {
        // 如果提供了位置参数，使用该位置；否则使用当前城市
        const cityCode = location ? location.location : this.data.currentCityCode;
        const cityName = location ? location.name : this.data.currentCity;
        
        console.log('开始加载天气数据:', { cityCode, cityName });
        
        // 获取实时天气
        const current = await this.getWeather('now', cityCode);
        // 获取七日预报
        const daily = await this.getWeather('7d', cityCode);
        
        if (!current || !daily) {
          throw new Error('天气数据获取失败');
        }
        
        this.setData({
          currentWeather: this.formatCurrent(current),
          dailyForecast: this.formatDaily(daily),
          currentCityCode: cityCode,
          currentCity: cityName,
          loading: false
        });
        
        this.drawWeatherChart(this.formatDailyChart(daily));
        console.log("天气数据加载成功:", {
          currentWeather: this.data.currentWeather,
          dailyForecast: this.data.dailyForecast
        });
      } catch (error) {
        console.error('天气数据加载失败:', error);
        this.handleLoadError();
      }
    },
  
    // 处理加载错误
    handleLoadError() {
      if (this.data.retryCount < this.data.maxRetries) {
        this.setData({
          retryCount: this.data.retryCount + 1
        });
        console.log(`重试加载天气数据 (${this.data.retryCount}/${this.data.maxRetries})`);
        setTimeout(() => {
          this.loadWeatherData();
        }, 1000 * this.data.retryCount); // 递增重试延迟
      } else {
        this.setData({ loading: false });
        wx.showToast({ 
          title: '加载失败，请稍后重试', 
          icon: 'none',
          duration: 2000
        });
      }
    },
  
    // 调用天气API
    getWeather(type, location) {
      return new Promise((resolve, reject) => {
        wx.request({
          url: 'https://devapi.qweather.com/v7/weather/' + type,
          header: {
            'X-QW-Api-Key': this.data.apiKey
          },
          data: {
            location: location
          },
          success: res => {
            if (res.data.code === '200') {
              resolve(res.data);
            } else {
              reject(new Error(res.data.code));
            }
          },
          fail: reject
        });
      });
    },
  
    // 格式化当前天气
    formatCurrent(data) {
        return {
        temp: data.now.temp + "°C",
        feelsLike: data.now.feelsLike + "°C",
        weather: data.now.text,
        icon: this.getWeatherIcon(data.now.icon),
        humidity: data.now.humidity + "%",
        windSpeed: data.now.windSpeed + " km/h",
        windDir: data.now.windDir,
        windScale: data.now.windScale + " 级",
        pressure: data.now.pressure + " hPa",
        visibility: data.now.vis + " km"
        };
    },

    // 格式化 7 日折线
  formatDailyChart(data) {
    return data.daily.map(item => ({
      date: item.fxDate.substr(5).replace('-', '/'),
      tempMin: Number(item.tempMin),
      tempMax: Number(item.tempMax),
      icon: this.getWeatherIcon(item.iconDay)
    }));
  },

    // 格式化 7 天预报
    formatDaily(data) {
        return data.daily.map(item => ({
        date: item.fxDate.substr(5).replace('-', '/'),
        weekday: this.getWeekday(item.fxDate),  
        textDay: item.textDay,
        tempMin: item.tempMin + "°C",
        tempMax: item.tempMax + "°C",
        icon: this.getWeatherIcon(item.iconDay),
        sunrise: item.sunrise,
        sunset: item.sunset,
        moonrise: item.moonrise,
        moonset: item.moonset,
        moonPhase: item.moonPhase,
        windDirDay: item.windDirDay,
        windScaleDay: item.windScaleDay,
        windDirNight: item.windDirNight,
        windScaleNight: item.windScaleNight,
        humidity: item.humidity + "%",
        pressure: item.pressure + " hPa",
        uvIndex: item.uvIndex
        }));
    },
    // 绘制 7 日温度折线图
    drawWeatherChart(dailyData) {
        const categories = dailyData.map(item => item.date); // X轴日期
        const tempMax = dailyData.map(item => item.tempMax); // 最高温度
        const tempMin = dailyData.map(item => item.tempMin); // 最低温度

        // 获取屏幕宽度，确保适配
        const systemInfo = wx.getSystemInfoSync();
        const windowWidth = systemInfo.windowWidth || 320;

        if (this.data.chart) {
        this.data.chart.updateData({ categories, series: [{ data: tempMax }, { data: tempMin }] });
        } else {
        this.setData({
            chart: new wxCharts({
            canvasId: 'weatherChart',
            type: 'line',
            categories: categories,
            series: [
                {
                name: '最高温度',
                data: tempMax,
                format: val => `${val}°C`,
                color: '#ff5722'
                },
                {
                name: '最低温度',
                data: tempMin,
                format: val => `${val}°C`,
                color: '#03a9f4'
                }
            ],
            xAxis: {
                disableGrid: true
            },
            yAxis: {
                title: '温度 (°C)',
                min: Math.min(...tempMin) - 2,
                max: Math.max(...tempMax) + 2
            },
            width: windowWidth - 40,
            height: 300,
            dataLabel: true
            })
        });
        }
    },
    // 获取当天星期
    getWeekday(dateStr) {
        const date = new Date(dateStr);
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return weekdays[date.getDay()];
      },
    // 获取天气图标
    getWeatherIcon(iconCode) {
      return `/images/weather-icons/${iconCode}.png`;
    },
  
    // 选择城市
    chooseCity() {
      wx.navigateTo({
        url: '/pages/citySelector/citySelector'
      });
    },
  
    // 接收城市选择结果
    onCitySelected(e) {
      const city = e.detail;
      if (!city) return;

      wx.request({
        url: 'https://geoapi.qweather.com/v2/city/lookup',
        header: {
          'X-QW-Api-Key': this.data.apiKey
        },
        data: {
          location: city,
          range: 'cn',
          number: 20
        },
        success: res => {
          if (res.data.code === '200' && res.data.location && res.data.location.length > 0) {
            const location = {
              name: city,
              location: res.data.location[0].id
            };
            console.log("获取到的位置信息:", location);
            this.updateLocationAndWeather(location);
          } else {
            wx.showToast({
              title: '城市信息获取失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
        }
      });
    },
  
    // 更新位置并加载天气数据
    updateLocationAndWeather(location) {
      if (!location || !location.location) {
        console.warn('无效的位置数据:', location);
        return;
      }
      
      console.log('更新位置和天气数据:', location);
      this.loadWeatherData(location);
    }
  });