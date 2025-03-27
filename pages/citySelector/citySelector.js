// pages/citySelector/citySelector.js

// 新增防抖函数实现
function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }

Page({
    data: {
      searchResults: []  // 搜索结果列表
    },
  
    // 城市搜索
    searchCity: debounce(function(e)  {
      const keyword = e.detail.value.trim();
      if (!keyword) {
        this.setData({ searchResults: [] });
        return;
      }
  
      wx.request({
        url: 'https://geoapi.qweather.com/v2/city/lookup',
        header: {
            'X-QW-Api-Key':'3dc2b4606d7c431081593b6b46e55978'
          },
        data: {
          location: keyword,
          range: 'cn',
          number: 20
        },
        success: res => {
          if (res.data.code === '200') {
            this.setData({
              searchResults: res.data.location.map(item => ({
                id: item.id,
                name: item.name,
                adm2: item.adm2
              }))
            });
          }
        }
      });
    }, 500),
  
    // 选择城市
    selectCity(e) {
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      prevPage.onCitySelected({
        detail: e.currentTarget.dataset.city
      });
      console.log("当前选择城市："+e.currentTarget.dataset.city);
      wx.navigateBack();
    }
  });