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
        tideData: [], // 存储潮汐
        userInfo: {}
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
        // 获取用户信息
       this.setData({
           userInfo: getApp().globalData.userInfo
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
    
                                    wx.showToast({
                                        title: '登录成功',
                                        icon: 'success'
                                    });
                                    // 登录成功后跳转到个人中心页面
                                    wx.redirectTo({
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
            wx.redirectTo({
                url: '../profile/profile/profile',
                success: () => {
                    console.log('成功跳转到个人中心页面');
                },
                fail: err => {
                    console.error('跳转失败:', err);
                }
            });
        }
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
        const maxHeight = 400; // Y轴最大潮高
        const minHeight = 0; // Y轴最小潮高
        const heightRange = maxHeight - minHeight;
    
        // 时间转换为分钟数（用于计算X轴比例）
        const timeToMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };
    
        const minTime = timeToMinutes("00:00");
        const maxTime = timeToMinutes("24:00");
        const totalTimeRange = maxTime - minTime;
    
        // 计算各点的位置
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
    
        // Y轴标签（潮高）
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
    
        // **绘制波浪曲线（使用贝塞尔曲线平滑）**
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
    
        for (let i = 0; i < points.length - 1; i++) {
            let current = points[i];
            let next = points[i + 1];
    
            let cp1x = (current.x + next.x) / 2; // 控制点 1 X 轴
            let cp1y = current.y; // 控制点 1 Y 轴 (保持与当前点相同高度)
            let cp2x = (current.x + next.x) / 2; // 控制点 2 X 轴
            let cp2y = next.y; // 控制点 2 Y 轴 (保持与下一个点相同高度)
    
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
    
            // **动态调整文本位置，避免重叠**
            let labelYOffset = (index % 2 === 0) ? -15 : 15;
            let labelXOffset = (index === points.length - 1) ? -30 : 5;
    
            // 确保满潮点的文本不会靠近曲线
            if (point.highLowTide === "满潮") {
                labelYOffset -= 10;
            }
    
            // 显示潮高信息
            ctx.fillStyle = '#000';
            ctx.fillText(`${point.tideTime} ${point.tideHeight}`, point.x + labelXOffset, point.y + labelYOffset);
        });
    
        ctx.draw();
    }

});