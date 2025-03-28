// home.js
const echarts = require('../../ec-canvas/echarts'); // 引入 echarts

// 初始化 ECharts 图表
function initChart(canvas, width, height) {
    const chart = echarts.init(canvas, null, { width, height });
    canvas.setChart(chart);
    console.log('ECharts 图表初始化成功:', chart);
    // 保存 chart 实例到当前页面对象上
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    currentPage.chart = chart;
    return chart;
}

Page({
    data: {
        // 第一行：站点信息、日期选择
        station: { name: '上海-黄埔公园', id: 'P2447' },
        selectedDate: '', // 格式：YYYYMMDD
        dateOptions: [], // 可选日期列表（10天）
        // 潮汐
        tideHourly: [], // 24小时潮汐 ，用于波浪图
        tideTable: [],
        fxLink: '',
        // ECharts 配置
        ec: {
            onInit: initChart
        },
        userInfo: {}
    },

    onLoad() {
        // 获取用户信息
        const app = getApp();
        this.setData({
            userInfo: app.globalData.userInfo || {
                avatarUrl: '/images/default-avatar.png',
                nickName: '游客',
                intro: '' // 新增个人简介字段，防止 undefined
            }
        });
        // 设置默认日期（当前日期）
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = (today.getMonth() + 1).toString().padStart(2, '0');
        const dd = today.getDate().toString().padStart(2, '0');
        const formattedToday = `${yyyy}${mm}${dd}`;

        // 生成未来 10 天（包含今天）的日期列表
        let dateOptions = [];
        for (let i = 0; i < 10; i++) {
            let d = new Date();
            d.setDate(today.getDate() + i);
            let y = d.getFullYear();
            let m = (d.getMonth() + 1).toString().padStart(2, '0');
            let day = d.getDate().toString().padStart(2, '0');
            dateOptions.push(`${y}${m}${day}`);
        }

        this.setData({
            selectedDate: formattedToday,
            dateOptions
        });
        // 不再此处调用 fetchTideData，等待 onReady 保证组件加载完毕后调用
    },

    onReady() {
        // onReady 中 ec-canvas 组件应该已经初始化完成
        if (this.chart) {
            console.log('Chart 实例已保存:', this.chart);
        } else {
            console.warn('Chart 实例尚未保存，请检查 ec-canvas 组件');
        }
        // 加载潮汐 （此时组件已准备好）
        this.fetchTideData();
    },

    onShow() {
        // 从本地存储中读取最新的用户信息
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.setData({
                userInfo: userInfo
            });
        }
    },

    // 点击站点选择图标，跳转至站点搜索页
    onStationSelect() {
        wx.navigateTo({
            url: '/pages/searchStation/searchStation',
            events: {
                // 接收站点搜索页面传回的 
                acceptStationData: (data) => {
                    if (data && data.station) {
                        this.setData({
                            station: data.station
                        });
                        // 更新潮汐 
                        this.fetchTideData();
                    }
                }
            }
        });
    },

    // 日期选择变化事件
    onDateChange(e) {
        const index = e.detail.value; 
        const selectedDate = this.data.dateOptions[index];
        this.setData({
            selectedDate
        });
        this.fetchTideData();
    },

    // 根据当前站点 id 和选中日期调用潮汐查询接口
    fetchTideData() {
        const { station, selectedDate } = this.data;
        const tideApiKey = '817fc264ceb744c59edf4d548b51cd85';
        const tideUrl = `https://api.qweather.com/v7/ocean/tide?key=${tideApiKey}&date=${selectedDate}&location=${station.id}`;
        
        wx.request({
            url: tideUrl,
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === "200") {
                    const tideData = res.data;
                    const tideHourly = tideData.tideHourly;
                    console.log('获取到的 tideTable  :', tideData.tideTable); // 打印获取到的 tideTable  
                    this.setData({
                        tideTable: this.processTidePeriods(tideData.tideTable, tideHourly[tideHourly.length - 1].height),
                        tideHourly: tideHourly,
                        fxLink: tideData.fxLink // 存储 fxLink
                    });
                    // 更新潮汐波浪图
                    this.drawTideWave(tideData.tideHourly);
                } else {
                    console.error('潮汐请求失败：', res);
                }
            },
            fail: (err) => {
                console.error('请求错误：', err);
            }
        });
    },
    // 处理涨潮退潮时间段
    processTidePeriods(tideTable,lastHeight23) {
        const periods = [];
        for (let i = 0; i < tideTable.length; i++) {
            const current = tideTable[i];
            const currentTime = current.fxTime.substring(11, 16);
            const currentHeight = current.height;
            if (i === 0) {
                periods.push({
                    startTime: '00:00',
                    endTime: currentTime,
                    type: current.type === 'H' ? '涨潮' : '退潮',
                    height: currentHeight
                });
            } else {
                const prev = tideTable[i - 1];
                const prevTime = prev.fxTime.substring(11, 16);
                periods.push({
                    startTime: prevTime,
                    endTime: currentTime,
                    type: current.type === 'H' ? '涨潮' : '退潮',
                    height: currentHeight
                });
            }
        }
        // 处理最后一个时间段到 23:00
        if (tideTable.length > 0) {
            const last = tideTable[tideTable.length - 1];
            const lastTime = last.fxTime.substring(11, 16);
            const lastType = last.type === 'H' ? '退潮' : '涨潮'; // 与最后一个点相反
            periods.push({
                startTime: lastTime,
                endTime: '23:00',
                type: lastType,
                height: lastHeight23
            });
        }
        return periods;
    },

    // 使用 ECharts 绘制潮汐波浪图（24小时）
    drawTideWave(tideHourly) {
        console.log('开始绘制潮汐图，tideHourly:', tideHourly);
        if (!tideHourly || tideHourly.length === 0) {
            console.warn('tideHourly 为空，无法绘制图表');
            return;
        }
        // 直接使用在 initChart 中保存的 chart 实例
        const chart = this.chart;
        if (!chart) {
            console.error('Chart 实例未找到');
            return;
        }
        
        // 处理时间和潮高 
        const times = tideHourly.map(item => item.fxTime.substring(11, 16));
        const heights = tideHourly.map(item => parseFloat(item.height));
        
        const option = {
            title: {
                text: '潮汐波浪图',
                left: 'center'
            },
            xAxis: {
                type: 'category',
                data: times,
                boundaryGap: false,
                axisLabel: {
                    rotate: 45
                },
                splitLine: {
                    show: true
                }
            },
            yAxis: {
                type: 'value',
                name: '潮高(m)',
                splitLine: {
                    show: true
                }
            },
            series: [{
                data: heights,
                type: 'line',
                smooth: true,
                lineStyle: {
                    color: '#008000',
                    width: 2
                },
                symbol: 'circle',
                symbolSize: 6
            }],
            tooltip: {
                trigger: 'axis'
            }
        };
        chart.setOption(option);
        console.log('图表配置已设置', option);
    }
    
});
