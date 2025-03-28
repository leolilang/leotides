// home.js
const { parse } = require('node-html-parser');
const echarts = require('../../ec-canvas/echarts'); // 引入 echarts
const navigator = require('../../utils/navigator');

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
        tideData: [], // 存储潮汐
        userInfo: {},
        // 新增位置列表和当前选择的位置索引
        locationList: [
            { name: '上海-黄埔公园', url: 'https://www.chaoxibiao.net/tides/30.html' },
            { name: '上海-佘山', url: 'https://www.chaoxibiao.net/tides/26.html' },
            { name: '上海-崇明', url: 'https://www.chaoxibiao.net/tides/27.html' },
            { name: '上海-吴淞', url: 'https://www.chaoxibiao.net/tides/347.html' },
            { name: '上海-奉贤', url: 'https://www.chaoxibiao.net/tides/504.html' }
        ],
        currentLocationIndex: 0,
        locationNames: [], // 存储位置名称列表
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
        // 提取位置名称列表
        const locationNames = this.data.locationList.map(item => item.name);
        this.setData({ locationNames });
        // 加载默认位置
        this.loadLocationData(this.data.locationList[this.data.currentLocationIndex].url);
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
    loadLocationData(url) {
        // 发起请求获取对应位置的内容
        wx.request({
            url: url,
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

                        // 解析潮汐
                        const tideData = this.extractTideInfo(contentHtml);
                        console.log('解析到的潮汐内容:', tideData);

                        this.drawTideWave(tideData);
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
    onLocationChange(e) {
        const index = e.detail.value;
        this.setData({
            currentLocationIndex: index
        });
        const url = this.data.locationList[index].url;
        this.loadLocationData(url);
    },

    extractTideInfo(html) {
        const doc = parse(html);
    
        // 提取潮汐位置和时间信息
        const locationAndTimeInfo = [];
        const title = doc.querySelector('h1').textContent;
        const dateInfo = doc.querySelector('#test1').textContent.trim().replace(/\s+/g, '');
        const changeDateButtonText = doc.querySelector('#changeDate').textContent;
        locationAndTimeInfo.push({
            title,
            dateInfo,
            changeDateButtonText
        });
    
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
            locationAndTimeInfo,
            tideTimeInfo,
            tideHeightInfo
        };
    },

    drawTideWave(data) {
        const ctx = wx.createCanvasContext('tideWaveCanvas');
        const { tideHeightInfo } = data;
        const canvasWidth = 320; // 画布宽度
        const canvasHeight = 300; // 画布高度
        const padding = 40; // 内边距
    
        // **动态计算潮高范围**
        let maxHeight = Math.max(...tideHeightInfo.map(item => parseInt(item.tideHeight.replace('cm', '')))) * 1.2;
        maxHeight = Math.min(maxHeight, 700); // 限制最大潮高，避免过大
        const minHeight = 0; // Y轴最小潮高
        const heightRange = maxHeight - minHeight;
    
        // 时间转换为分钟数
        const timeToMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };
    
        const minTime = timeToMinutes("00:00");
        const maxTime = timeToMinutes("24:00");
        const totalTimeRange = maxTime - minTime;
    
        // 计算各点位置
        const points = tideHeightInfo.map(item => {
            const x = padding + ((timeToMinutes(item.tideTime) - minTime) / totalTimeRange) * (canvasWidth - 2 * padding);
            const height = parseInt(item.tideHeight.replace('cm', ''));
            const y = canvasHeight - padding - ((height - minHeight) / heightRange) * (canvasHeight - 2 * padding);
            return { x, y, ...item };
        });
    
        // 绘制坐标轴
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvasHeight - padding);
        ctx.lineTo(canvasWidth - padding, canvasHeight - padding);
        ctx.strokeStyle = '#000';
        ctx.stroke();
    
        // **优化 Y 轴标签**
        ctx.fillStyle = '#000';
        ctx.setFontSize(12);
        ctx.fillText('潮高(cm)', 5, padding - 5);
        for (let i = 0; i <= 4; i++) {
            let yLabel = minHeight + (heightRange / 4) * i;
            let y = canvasHeight - padding - (i * (canvasHeight - 2 * padding) / 4);
            ctx.fillText(yLabel.toFixed(0), 10, y + 3);
        }
    
        // X轴标签（时间）
        ctx.fillText('时间', canvasWidth - 35, canvasHeight - 5);
        const timeLabels = ['00:00', '06:00', '12:00', '18:00', '24:00'];
        timeLabels.forEach((label, index) => {
            let x = padding + index * ((canvasWidth - 2 * padding) / 4);
            ctx.fillText(label, x - 10, canvasHeight - 5);
        });
    
        // **绘制波浪曲线**
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
    
        for (let i = 0; i < points.length - 1; i++) {
            let current = points[i];
            let next = points[i + 1];
    
            let cp1x = (current.x + next.x) / 2;
            let cp1y = current.y;
            let cp2x = (current.x + next.x) / 2;
            let cp2y = next.y;
    
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
        }
    
        ctx.strokeStyle = '#008000';
        ctx.setLineWidth(2);
        ctx.stroke();
    
        // **绘制点**
        points.forEach((point, index) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = point.highLowTide === "满潮" ? '#0000FF' : '#008000';
            ctx.fill();
    
            // **优化文本位置，防止重叠**
            let labelYOffset = (index % 2 === 0) ? -15 : 15;
            let labelXOffset = (index === points.length - 1) ? -30 : 5;
    
            if (point.highLowTide === "满潮") {
                labelYOffset -= 10;
            }
    
            ctx.fillStyle = '#000';
            ctx.fillText(`${point.tideTime} ${point.tideHeight}`, point.x + labelXOffset, point.y + labelYOffset);
        });
    
        ctx.draw();
    }
});