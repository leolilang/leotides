// searchStation.js
Page({
    data: {
      searchKeyword: '',
      stationList: []  // 存储搜索结果
    },
  
    // 输入框绑定事件
    onInputChange(e) {
      this.setData({
        searchKeyword: e.detail.value
      });
    },
  
    // 搜索按钮点击事件，调用站点查询接口
    onSearch() {
      const { searchKeyword } = this.data;
      if (!searchKeyword) {
        wx.showToast({
          title: '请输入搜索条件',
          icon: 'none'
        });
        return;
      }
      // 站点查询 API 参数，替换 location 为用户输入的条件
      const stationApiKey = '3dc2b4606d7c431081593b6b46e55978';
      const url = `https://geoapi.qweather.com/v2/poi/lookup?type=TSTA&location=${encodeURIComponent(searchKeyword)}&key=${stationApiKey}`;
      
      wx.request({
        url: url,
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === "200") {
            this.setData({
              stationList: res.data.poi || []
            });
          } else {
            console.error('站点搜索失败：', res);
            wx.showToast({
              title: '无数据，请重试',
              icon: '/images/empty.png'
            });
          }
        },
        fail: (err) => {
          console.error('请求错误：', err);
          wx.showToast({
            title: '请求错误',
            icon: 'none'
          });
        }
      });
    },
  
    // 用户点击某个站点时，将站点信息传回首页
    onStationSelect(e) {
      const index = e.currentTarget.dataset.index;
      const station = this.data.stationList[index];
      if (station) {
        // 通过事件传递回首页
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit('acceptStationData', { station });
        wx.navigateBack();
      }
    }
  });
  