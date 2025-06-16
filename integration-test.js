const http = require('http');

// 测试配置
const BASE_URL = 'http://localhost:3001';
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
};

// 辅助函数：发送HTTP请求
function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

// 测试函数
async function runTest(name, testFn) {
    testResults.total++;
    console.log(`\n测试: ${name}`);
    
    try {
        await testFn();
        testResults.passed++;
        testResults.details.push({ name, status: 'PASS' });
        console.log('✅ 通过');
    } catch (error) {
        testResults.failed++;
        testResults.details.push({ name, status: 'FAIL', error: error.message });
        console.log('❌ 失败:', error.message);
    }
}

// 测试用例
async function runAllTests() {
    console.log('=== 名医堂3.0集成测试 ===\n');
    
    // 1. 健康检查
    await runTest('健康检查API', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/health',
            method: 'GET'
        });
        if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
        if (res.data.status !== 'ok') throw new Error('健康状态异常');
    });
    
    // 2. 获取门店列表
    await runTest('获取门店列表', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/v1/client/stores',
            method: 'GET'
        });
        if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
        if (!res.data.success) throw new Error('API返回失败');
        if (!Array.isArray(res.data.data.stores)) throw new Error('数据格式错误');
        console.log(`  找到 ${res.data.data.stores.length} 家门店`);
    });
    
    // 3. 搜索技师
    await runTest('搜索技师API', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/v1/client/therapists/search?limit=10',
            method: 'GET'
        });
        if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
        if (!res.data.success) throw new Error('API返回失败');
        console.log(`  找到 ${res.data.data.total} 位技师`);
    });
    
    // 4. 测试新的实验性API
    await runTest('门店技师预约时间查询API（新）', async () => {
        const storeName = encodeURIComponent('名医堂·颈肩腰腿特色调理（宜山路店）');
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: `/api/v1/client/stores/${storeName}/therapists-schedule`,
            method: 'GET'
        });
        if (res.status !== 200 && res.status !== 404) throw new Error(`状态码: ${res.status}`);
        if (res.status === 200) {
            console.log(`  门店: ${res.data.data.store.name}`);
            console.log(`  技师数: ${res.data.data.therapists.length}`);
        }
    });
    
    // 5. 管理员登录
    await runTest('管理员登录API', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/v1/admin/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                username: 'admin',
                password: 'admin123'
            }
        });
        if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
        if (!res.data.success) throw new Error('登录失败');
        if (!res.data.data.token) throw new Error('未返回token');
        console.log('  Token获取成功');
    });
    
    // 6. 前端页面测试
    await runTest('前端首页可访问', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/',
            method: 'GET'
        });
        if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    });
    
    await runTest('管理后台页面可访问', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/admin.html',
            method: 'GET'
        });
        if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    });
    
    // 打印测试报告
    console.log('\n=== 测试报告 ===');
    console.log(`总测试数: ${testResults.total}`);
    console.log(`通过: ${testResults.passed}`);
    console.log(`失败: ${testResults.failed}`);
    console.log(`通过率: ${(testResults.passed / testResults.total * 100).toFixed(2)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n失败的测试:');
        testResults.details.filter(t => t.status === 'FAIL').forEach(t => {
            console.log(`- ${t.name}: ${t.error}`);
        });
    }
    
    // 返回是否全部通过
    return testResults.failed === 0;
}

// 运行测试
runAllTests().then(allPassed => {
    if (allPassed) {
        console.log('\n✅ 所有测试通过！可以部署到云服务器。');
        process.exit(0);
    } else {
        console.log('\n❌ 有测试失败，请修复后再部署。');
        process.exit(1);
    }
}).catch(err => {
    console.error('\n测试执行失败:', err);
    process.exit(1);
});