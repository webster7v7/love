/**
 * 测试实时访问统计功能
 * 模拟多个访客访问，验证统计是否实时更新
 */

const http = require('http');

// 模拟访问的函数
function simulateVisit(visitNumber) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': `TestBot-${visitNumber}-${Date.now()}`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ 访问 ${visitNumber}: 状态码 ${res.statusCode}`);
        resolve({
          visitNumber,
          statusCode: res.statusCode,
          timestamp: new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' })
        });
      });
    });

    req.on('error', (err) => {
      console.error(`❌ 访问 ${visitNumber} 失败:`, err.message);
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`访问 ${visitNumber} 超时`));
    });

    req.end();
  });
}

// 主测试函数
async function testRealTimeVisits() {
  console.log('🧪 开始测试实时访问统计功能...\n');
  console.log('📊 将模拟5个不同的访客访问网站');
  console.log('⏰ 每次访问间隔5秒，观察统计数据变化\n');

  const results = [];

  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`🚀 正在模拟第 ${i} 个访客访问...`);
      const result = await simulateVisit(i);
      results.push(result);
      
      if (i < 5) {
        console.log(`⏳ 等待5秒后进行下一次访问...\n`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`❌ 第 ${i} 次访问失败:`, error.message);
    }
  }

  console.log('\n📋 测试结果汇总:');
  console.log('==================');
  results.forEach(result => {
    console.log(`访问 ${result.visitNumber}: ${result.timestamp} - 状态码 ${result.statusCode}`);
  });

  console.log('\n✅ 测试完成！');
  console.log('💡 请在浏览器中打开 http://localhost:3000 查看访问统计是否实时更新');
  console.log('📊 今日访问数应该增加了 ' + results.length + ' 次');
}

// 检查服务器是否运行
function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'HEAD',
      timeout: 3000
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 启动测试
async function main() {
  console.log('🔍 检查开发服务器状态...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ 开发服务器未运行！');
    console.log('💡 请先运行: npm run dev');
    process.exit(1);
  }

  console.log('✅ 开发服务器运行正常\n');
  
  await testRealTimeVisits();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { simulateVisit, testRealTimeVisits };