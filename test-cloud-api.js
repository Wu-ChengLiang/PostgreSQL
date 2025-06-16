const http = require('http');
const querystring = require('querystring');

// 云端API配置
const API_HOST = 'emagen.323424.xyz';
const API_PORT = 80;
const API_BASE = '/api/v1';

// 测试结果统计
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
};

// HTTP请求封装
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: API_HOST,
            port: API_PORT,
            ...options
        }, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        headers: res.headers,
                        data: responseData ? JSON.parse(responseData) : null
                    };
                    resolve(result);
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// 记录测试结果
function recordTest(name, endpoint, result, details) {
    testResults.total++;
    if (result) {
        testResults.passed++;
        console.log(`✅ ${name}`);
        console.log(`   ${endpoint}`);
        console.log(`   ${details}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${name}`);
        console.log(`   ${endpoint}`);
        console.log(`   ${details}`);
    }
    console.log('');
}

// 运行云端API测试
async function testCloudAPIs() {
    console.log('🌐 测试云端API...');
    console.log(`服务器: http://${API_HOST}`);
    console.log(`时间: ${new Date().toLocaleString('zh-CN')}\n`);

    // 1. 健康检查
    try {
        const res = await makeRequest({
            method: 'GET',
            path: '/health'
        });
        recordTest(
            '健康检查',
            'GET /health',
            res.status === 200,
            res.status === 200 ? `服务正常 - ${res.data.service}` : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('健康检查', 'GET /health', false, error.message);
    }

    // 2. 获取门店列表
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/stores`
        });
        recordTest(
            '获取门店列表',
            'GET /api/v1/client/stores',
            res.status === 200 && res.data.success,
            res.data.success ? `成功 - ${res.data.data.stores.length} 家门店` : `失败 - 状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('获取门店列表', 'GET /api/v1/client/stores', false, error.message);
    }

    // 3. 搜索技师
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/therapists/search?limit=5`
        });
        recordTest(
            '搜索技师',
            'GET /api/v1/client/therapists/search',
            res.status === 200 && res.data.success,
            res.data.success ? `成功 - ${res.data.data.therapists.length} 位技师` : `失败 - 状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('搜索技师', 'GET /api/v1/client/therapists/search', false, error.message);
    }

    // 4. 技师搜索（按专长）
    try {
        const params = querystring.stringify({ specialty: '艾灸' });
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/therapists/search?${params}`
        });
        recordTest(
            '搜索技师（按专长）',
            'GET /api/v1/client/therapists/search?specialty=艾灸',
            res.status === 200 && res.data.success,
            res.data.success ? `成功 - 找到 ${res.data.data.therapists.length} 位擅长艾灸的技师` : `失败 - 状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('搜索技师（按专长）', 'GET /api/v1/client/therapists/search?specialty=艾灸', false, error.message);
    }

    // 5. 管理员登录测试
    try {
        const res = await makeRequest({
            method: 'POST',
            path: `${API_BASE}/admin/login`,
            headers: { 'Content-Type': 'application/json' }
        }, {
            username: 'admin',
            password: 'admin123'
        });
        recordTest(
            '管理员登录',
            'POST /api/v1/admin/login',
            res.status === 200 && res.data.success,
            res.data.success ? '成功 - 获得认证令牌' : `失败 - 状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('管理员登录', 'POST /api/v1/admin/login', false, error.message);
    }

    // 6. 测试前端页面
    try {
        const res = await makeRequest({
            method: 'GET',
            path: '/frontend/index.html'
        });
        recordTest(
            '客户端页面',
            'GET /frontend/index.html',
            res.status === 200,
            res.status === 200 ? '页面可访问' : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('客户端页面', 'GET /frontend/index.html', false, error.message);
    }

    // 7. 测试管理端页面
    try {
        const res = await makeRequest({
            method: 'GET',
            path: '/frontend/admin.html'
        });
        recordTest(
            '管理端页面',
            'GET /frontend/admin.html',
            res.status === 200,
            res.status === 200 ? '页面可访问' : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('管理端页面', 'GET /frontend/admin.html', false, error.message);
    }

    // 统计结果
    console.log('========== 测试统计 ==========');
    console.log(`总测试数: ${testResults.total}`);
    console.log(`✅ 通过: ${testResults.passed}`);
    console.log(`❌ 失败: ${testResults.failed}`);
    console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
}

// 运行测试
testCloudAPIs().catch(console.error);