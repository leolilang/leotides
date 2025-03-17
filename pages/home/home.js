// home.js
const { parse } = require('node-html-parser');
const echarts = require('../../ec-canvas/echarts'); // 引入 echarts

function initChart(canvas, width, height) {
    const chart = echarts.init(canvas, null, {
        width: width,
        height: height
    });
    canvas.setChart(chart);

    return chart;
}

Page({
    data: {
        title: '淀山湖 - 拦路港潮汐时刻表',
        htmlContent: '',
        ec: {
            onInit: initChart
        },
        tideData: [] // 存储潮汐数据
    },
    goToProfile() {
        wx.navigateTo({
            url: '../profile/profile/profile',
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
            url: 'https://www.chaoxibiao.net/tides/30.html',
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
                        console.log('提取到的 content 内容:', contentHtml);

                        // 解析潮汐数据
                        const tideData = this.extractTideInfo(contentHtml);
                        console.log('解析到的潮汐数据内容:', tideData);
                        this.setData({
                            tideData: tideData
                        });

                        // 初始化图表
                        this.initEcharts(tideData);
                    }
                } else {
                    console.error('请求失败，状态码:', res.statusCode);
                }
            }.bind(this),
            fail: function (err) {
                console.error('请求失败:', err);
            }
        });
    },

    extractTideInfo(html) {
    
        //const parser = new DOMParser();
        //const doc = parser.parseFromString(html, 'text/html');
        const doc = parse(html);
        // 提取潮汐时间段信息
        const tideTimeTable = doc.querySelectorAll('.tidesPoint')[0];
        const tideTimeRows = tideTimeTable.querySelectorAll('tr');
        const tideTimeInfo = [];
        tideTimeRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 2) {
                const type = cells[0].textContent;
                const time = cells[1].textContent;
                tideTimeInfo.push({ type, time });
            }
        });
    
        // 提取潮高信息
        const tideHeightTable = doc.querySelectorAll('.tidesPoint')[1];
        const tideHeightRows = tideHeightTable.querySelectorAll('tr');
        const highLowTide = Array.from(tideHeightRows[0].querySelectorAll('td')).slice(1).map(cell => cell.textContent);
        const tideTime = Array.from(tideHeightRows[1].querySelectorAll('td')).slice(1).map(cell => cell.textContent);
        const tideHeight = Array.from(tideHeightRows[2].querySelectorAll('td')).slice(1).map(cell => cell.textContent);
        const tideHeightInfo = [];
        for (let i = 0; i < highLowTide.length; i++) {
            tideHeightInfo.push({
                highLowTide: highLowTide[i],
                tideTime: tideTime[i],
                tideHeight: tideHeight[i]
            });
        }
    
        return {
            tideTimeInfo,
            tideHeightInfo
        };
    },

    initEcharts(tideData) {
        const chart = this.selectComponent('#mychart-dom-line').init((canvas, width, height) => {
            const myChart = echarts.init(canvas, null, {
                width: width,
                height: height
            });

            const option = {
                title: {
                    text: '潮汐信息波浪图'
                },
                xAxis: {
                    type: 'value',
                    min: 0,
                    max: 24,
                    name: '时间 (小时)'
                },
                yAxis: {
                    type: 'value',
                    name: '潮高 (cm)'
                },
                series: [{
                    data: tideData,
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8
                }]
            };

            myChart.setOption(option);
            return myChart;
        });
    }
});