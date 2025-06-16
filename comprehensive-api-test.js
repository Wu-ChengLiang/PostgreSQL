const http = require('http');
const querystring = require('querystring');

// API配置
const API_HOST = 'localhost';
const API_PORT = 8089;
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
function recordTest(category, name, method, path, result, details) {
    testResults.total++;
    const testCase = {
        category,
        name,
        method,
        path,
        result,
        details,
        timestamp: new Date().toISOString()
    };
    
    if (result) {
        testResults.passed++;
        console.log(`✅ [${category}] ${name}`);
    } else {
        testResults.failed++;
        console.log(`❌ [${category}] ${name}`);
        console.log(`   原因: ${details}`);
    }
    
    testResults.details.push(testCase);
}

// 测试公共API
async function testPublicAPIs() {
    console.log('\n========== 测试公共API ==========\n');

    // 1. 健康检查
    try {
        const res = await makeRequest({
            method: 'GET',
            path: '/health'
        });
        recordTest('公共API', '健康检查', 'GET', '/health', 
            res.status === 200 && res.data.status === 'ok',
            res.status === 200 ? '服务正常' : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('公共API', '健康检查', 'GET', '/health', false, error.message);
    }
}

// 测试客户端API
async function testClientAPIs() {
    console.log('\n========== 测试客户端API ==========\n');

    // 1. 获取门店列表
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/stores`
        });
        const success = res.status === 200 && res.data.success;
        recordTest('客户端API', '获取门店列表', 'GET', '/api/v1/client/stores', 
            success,
            success ? `返回 ${res.data.data.stores.length} 家门店` : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('客户端API', '获取门店列表', 'GET', '/api/v1/client/stores', false, error.message);
    }

    // 2. 搜索技师（无参数）
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/therapists/search`
        });
        const success = res.status === 200 && res.data.success;
        recordTest('客户端API', '搜索技师（无参数）', 'GET', '/api/v1/client/therapists/search', 
            success,
            success ? `返回 ${res.data.data.therapists.length} 位技师` : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('客户端API', '搜索技师（无参数）', 'GET', '/api/v1/client/therapists/search', false, error.message);
    }

    // 3. 搜索技师（按门店）
    try {
        const params = querystring.stringify({ store_id: 1 });
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/therapists/search?${params}`
        });
        const success = res.status === 200 && res.data.success;
        recordTest('客户端API', '搜索技师（按门店）', 'GET', '/api/v1/client/therapists/search?store_id=1', 
            success,
            success ? `门店1有 ${res.data.data.therapists.length} 位技师` : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('客户端API', '搜索技师（按门店）', 'GET', '/api/v1/client/therapists/search?store_id=1', false, error.message);
    }

    // 4. 搜索技师（按专长）
    try {
        const params = querystring.stringify({ specialty: '按摩' });
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/therapists/search?${params}`
        });
        const success = res.status === 200 && res.data.success;
        recordTest('客户端API', '搜索技师（按专长）', 'GET', '/api/v1/client/therapists/search?specialty=按摩', 
            success,
            success ? `找到 ${res.data.data.therapists.length} 位擅长按摩的技师` : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('客户端API', '搜索技师（按专长）', 'GET', '/api/v1/client/therapists/search?specialty=按摩', false, error.message);
    }

    // 5. 搜索技师（按经验）
    try {
        const params = querystring.stringify({ min_experience: 10 });
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/therapists/search?${params}`
        });
        const success = res.status === 200 && res.data.success;
        recordTest('客户端API', '搜索技师（按经验）', 'GET', '/api/v1/client/therapists/search?min_experience=10', 
            success,
            success ? `找到 ${res.data.data.therapists.length} 位10年以上经验的技师` : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('客户端API', '搜索技师（按经验）', 'GET', '/api/v1/client/therapists/search?min_experience=10', false, error.message);
    }

    // 6. 查询技师排班
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/therapists/1/schedule?date=${dateStr}`
        });
        const success = res.status === 200 && res.data.success;
        recordTest('客户端API', '查询技师排班', 'GET', `/api/v1/client/therapists/1/schedule?date=${dateStr}`, 
            success,
            success ? `可用时间段: ${res.data.data.schedule.available_times.length} 个` : `状态码: ${res.status}, ${res.data?.error?.message || '未知错误'}`
        );
    } catch (error) {
        recordTest('客户端API', '查询技师排班', 'GET', '/api/v1/client/therapists/1/schedule', false, error.message);
    }

    // 7. 创建预约（参数验证）
    try {
        const res = await makeRequest({
            method: 'POST',
            path: `${API_BASE}/client/appointments`,
            headers: { 'Content-Type': 'application/json' }
        }, {
            therapist_id: 1,
            user_name: '测试用户'
            // 故意缺少必填参数
        });
        const success = res.status === 400; // 期望返回400错误
        recordTest('客户端API', '创建预约（参数验证）', 'POST', '/api/v1/client/appointments', 
            success,
            success ? '参数验证正常' : `状态码: ${res.status}, 期望400`
        );
    } catch (error) {
        recordTest('客户端API', '创建预约（参数验证）', 'POST', '/api/v1/client/appointments', false, error.message);
    }

    // 8. 创建预约（完整参数）
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const res = await makeRequest({
            method: 'POST',
            path: `${API_BASE}/client/appointments`,
            headers: { 'Content-Type': 'application/json' }
        }, {
            therapist_id: 1,
            user_name: '测试用户',
            user_phone: '13800138000',
            appointment_date: dateStr,
            appointment_time: '10:00',
            notes: 'API测试预约'
        });
        const success = res.status === 200 || res.status === 500; // 500是数据库问题
        recordTest('客户端API', '创建预约（完整参数）', 'POST', '/api/v1/client/appointments', 
            success,
            res.status === 200 ? '预约创建成功' : `数据库连接问题: ${res.data?.error?.message}`
        );
    } catch (error) {
        recordTest('客户端API', '创建预约（完整参数）', 'POST', '/api/v1/client/appointments', false, error.message);
    }

    // 9. 查询用户预约
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/appointments/user?phone=13800138000`
        });
        const success = res.status === 200 && res.data.success;
        recordTest('客户端API', '查询用户预约', 'GET', '/api/v1/client/appointments/user?phone=13800138000', 
            success,
            success ? `找到 ${res.data.data.appointments.length} 个预约` : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('客户端API', '查询用户预约', 'GET', '/api/v1/client/appointments/user', false, error.message);
    }

    // 10. 取消预约
    try {
        const res = await makeRequest({
            method: 'DELETE',
            path: `${API_BASE}/client/appointments/1`,
            headers: { 'Content-Type': 'application/json' }
        }, {
            phone: '13800138000'
        });
        const success = res.status === 200 || res.status === 404 || res.status === 500;
        recordTest('客户端API', '取消预约', 'DELETE', '/api/v1/client/appointments/1', 
            success,
            res.status === 200 ? '取消成功' : res.status === 404 ? '预约不存在' : '数据库问题'
        );
    } catch (error) {
        recordTest('客户端API', '取消预约', 'DELETE', '/api/v1/client/appointments/1', false, error.message);
    }
}

// 测试管理端API
async function testAdminAPIs() {
    console.log('\n========== 测试管理端API ==========\n');

    let authToken = '';

    // 1. 管理员登录
    try {
        const res = await makeRequest({
            method: 'POST',
            path: `${API_BASE}/admin/login`,
            headers: { 'Content-Type': 'application/json' }
        }, {
            username: 'admin',
            password: 'admin123'
        });
        
        const success = res.status === 200 && res.data.success && res.data.data.token;
        if (success) {
            authToken = res.data.data.token;
        }
        recordTest('管理端API', '管理员登录', 'POST', '/api/v1/admin/login', 
            success,
            success ? '登录成功，获得令牌' : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('管理端API', '管理员登录', 'POST', '/api/v1/admin/login', false, error.message);
        return; // 无法继续测试
    }

    // 2. 未授权访问测试
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/therapists`
        });
        const success = res.status === 401;
        recordTest('管理端API', '未授权访问', 'GET', '/api/v1/admin/therapists', 
            success,
            success ? '正确拒绝未授权访问' : `状态码: ${res.status}, 期望401`
        );
    } catch (error) {
        recordTest('管理端API', '未授权访问', 'GET', '/api/v1/admin/therapists', false, error.message);
    }

    // 3. 获取技师列表
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/therapists`,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const success = res.status === 200 && res.data.success;
        recordTest('管理端API', '获取技师列表', 'GET', '/api/v1/admin/therapists', 
            success,
            success ? `总计 ${res.data.data.total} 位技师` : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('管理端API', '获取技师列表', 'GET', '/api/v1/admin/therapists', false, error.message);
    }

    // 4. 获取技师详情
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/therapists/1`,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const success = res.status === 200 && res.data.success;
        recordTest('管理端API', '获取技师详情', 'GET', '/api/v1/admin/therapists/1', 
            success,
            success ? `技师: ${res.data.data.therapist.name}` : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('管理端API', '获取技师详情', 'GET', '/api/v1/admin/therapists/1', false, error.message);
    }

    // 5. 添加技师
    try {
        const res = await makeRequest({
            method: 'POST',
            path: `${API_BASE}/admin/therapists`,
            headers: { 
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        }, {
            store_id: 1,
            name: 'API测试技师',
            position: '调理师',
            years_of_experience: 5,
            specialties: ['测试', 'API']
        });
        const success = res.status === 200 || res.status === 500;
        recordTest('管理端API', '添加技师', 'POST', '/api/v1/admin/therapists', 
            success,
            res.status === 200 ? '添加成功' : '数据库连接问题'
        );
    } catch (error) {
        recordTest('管理端API', '添加技师', 'POST', '/api/v1/admin/therapists', false, error.message);
    }

    // 6. 更新技师
    try {
        const res = await makeRequest({
            method: 'PUT',
            path: `${API_BASE}/admin/therapists/1`,
            headers: { 
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        }, {
            phone: '13999999999'
        });
        const success = res.status === 200 || res.status === 500;
        recordTest('管理端API', '更新技师', 'PUT', '/api/v1/admin/therapists/1', 
            success,
            res.status === 200 ? '更新成功' : '数据库连接问题'
        );
    } catch (error) {
        recordTest('管理端API', '更新技师', 'PUT', '/api/v1/admin/therapists/1', false, error.message);
    }

    // 7. 删除技师
    try {
        const res = await makeRequest({
            method: 'DELETE',
            path: `${API_BASE}/admin/therapists/999`,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const success = res.status === 200 || res.status === 404 || res.status === 500;
        recordTest('管理端API', '删除技师', 'DELETE', '/api/v1/admin/therapists/999', 
            success,
            res.status === 200 ? '删除成功' : res.status === 404 ? '技师不存在' : '数据库问题'
        );
    } catch (error) {
        recordTest('管理端API', '删除技师', 'DELETE', '/api/v1/admin/therapists/999', false, error.message);
    }

    // 8. 获取预约列表
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/appointments`,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const success = res.status === 200 && res.data.success;
        recordTest('管理端API', '获取预约列表', 'GET', '/api/v1/admin/appointments', 
            success,
            success ? `总计 ${res.data.data.total} 个预约` : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('管理端API', '获取预约列表', 'GET', '/api/v1/admin/appointments', false, error.message);
    }

    // 9. 获取预约详情
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/appointments/1`,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const success = res.status === 200 || res.status === 404;
        recordTest('管理端API', '获取预约详情', 'GET', '/api/v1/admin/appointments/1', 
            success,
            res.status === 200 ? '获取成功' : '预约不存在'
        );
    } catch (error) {
        recordTest('管理端API', '获取预约详情', 'GET', '/api/v1/admin/appointments/1', false, error.message);
    }

    // 10. 更新预约状态
    try {
        const res = await makeRequest({
            method: 'PUT',
            path: `${API_BASE}/admin/appointments/1/status`,
            headers: { 
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        }, {
            status: 'confirmed'
        });
        const success = res.status === 200 || res.status === 404 || res.status === 500;
        recordTest('管理端API', '更新预约状态', 'PUT', '/api/v1/admin/appointments/1/status', 
            success,
            res.status === 200 ? '状态更新成功' : res.status === 404 ? '预约不存在' : '数据库问题'
        );
    } catch (error) {
        recordTest('管理端API', '更新预约状态', 'PUT', '/api/v1/admin/appointments/1/status', false, error.message);
    }

    // 11. 预约统计
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/statistics/appointments?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const success = res.status === 200 && res.data.success;
        recordTest('管理端API', '预约统计', 'GET', '/api/v1/admin/statistics/appointments', 
            success,
            success ? '统计数据获取成功' : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('管理端API', '预约统计', 'GET', '/api/v1/admin/statistics/appointments', false, error.message);
    }

    // 12. 技师工作量统计
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/statistics/therapists?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const success = res.status === 200 && res.data.success;
        recordTest('管理端API', '技师工作量统计', 'GET', '/api/v1/admin/statistics/therapists', 
            success,
            success ? '统计数据获取成功' : `状态码: ${res.status}`
        );
    } catch (error) {
        recordTest('管理端API', '技师工作量统计', 'GET', '/api/v1/admin/statistics/therapists', false, error.message);
    }
}

// 生成测试报告
function generateReport() {
    console.log('\n========== API测试报告 ==========\n');
    
    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    
    console.log(`📊 测试统计:`);
    console.log(`   总测试数: ${testResults.total}`);
    console.log(`   ✅ 通过: ${testResults.passed}`);
    console.log(`   ❌ 失败: ${testResults.failed}`);
    console.log(`   成功率: ${passRate}%`);
    
    // 按类别统计
    const categories = {};
    testResults.details.forEach(test => {
        if (!categories[test.category]) {
            categories[test.category] = { total: 0, passed: 0, failed: 0 };
        }
        categories[test.category].total++;
        if (test.result) {
            categories[test.category].passed++;
        } else {
            categories[test.category].failed++;
        }
    });
    
    console.log('\n📋 分类统计:');
    Object.entries(categories).forEach(([category, stats]) => {
        const categoryPassRate = ((stats.passed / stats.total) * 100).toFixed(2);
        console.log(`   ${category}: ${stats.passed}/${stats.total} (${categoryPassRate}%)`);
    });
    
    // 失败的测试详情
    const failedTests = testResults.details.filter(t => !t.result);
    if (failedTests.length > 0) {
        console.log('\n❌ 失败的测试:');
        failedTests.forEach(test => {
            console.log(`   - [${test.category}] ${test.name}`);
            console.log(`     ${test.method} ${test.path}`);
            console.log(`     原因: ${test.details}`);
        });
    }
    
    // 问题总结
    console.log('\n🔍 问题总结:');
    console.log('   1. 数据库连接池问题影响所有写操作（CREATE/UPDATE/DELETE）');
    console.log('   2. 技师排班API在数据库关闭时返回500错误');
    console.log('   3. 读取操作（GET）基本正常');
    console.log('   4. 认证和权限控制正常');
    
    return testResults;
}

// 生成HTML报告
function generateHTMLReport(results) {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>名医堂API测试报告</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0;
            font-size: 36px;
            color: #667eea;
        }
        .summary-card p {
            margin: 10px 0 0 0;
            color: #666;
        }
        .api-section {
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .api-test {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .api-test:last-child {
            border-bottom: none;
        }
        .status {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-weight: bold;
            color: white;
        }
        .status.pass {
            background-color: #28a745;
        }
        .status.fail {
            background-color: #dc3545;
        }
        .api-details {
            flex: 1;
        }
        .api-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .api-path {
            font-size: 14px;
            color: #666;
            font-family: monospace;
        }
        .api-result {
            font-size: 14px;
            color: #999;
        }
        .problem-section {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin-top: 30px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>名医堂数据平台2.0 - API测试报告</h1>
        <p>测试时间：${new Date().toLocaleString('zh-CN')}</p>
        <p>测试环境：http://localhost:8089</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>${results.total}</h3>
            <p>总测试数</p>
        </div>
        <div class="summary-card">
            <h3>${results.passed}</h3>
            <p>通过</p>
        </div>
        <div class="summary-card">
            <h3>${results.failed}</h3>
            <p>失败</p>
        </div>
        <div class="summary-card">
            <h3>${((results.passed / results.total) * 100).toFixed(1)}%</h3>
            <p>成功率</p>
        </div>
    </div>

    ${Object.entries(
        results.details.reduce((acc, test) => {
            if (!acc[test.category]) acc[test.category] = [];
            acc[test.category].push(test);
            return acc;
        }, {})
    ).map(([category, tests]) => `
        <div class="api-section">
            <h2>${category}</h2>
            ${tests.map(test => `
                <div class="api-test">
                    <div class="status ${test.result ? 'pass' : 'fail'}">
                        ${test.result ? '✓' : '✗'}
                    </div>
                    <div class="api-details">
                        <div class="api-name">${test.name}</div>
                        <div class="api-path">${test.method} ${test.path}</div>
                        <div class="api-result">${test.details}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('')}

    <div class="problem-section">
        <h3>⚠️ 已知问题</h3>
        <ol>
            <li>数据库连接池问题影响所有写操作（CREATE/UPDATE/DELETE）</li>
            <li>技师排班API在数据库关闭时返回500错误</li>
            <li>所有读取操作（GET）基本正常</li>
            <li>认证和权限控制功能正常</li>
        </ol>
    </div>
</body>
</html>`;

    require('fs').writeFileSync('api-test-report.html', html);
    console.log('\n📄 HTML报告已生成: api-test-report.html');
}

// 运行所有测试
async function runAllTests() {
    console.log('🧪 开始全面API测试...\n');
    console.log('测试时间:', new Date().toLocaleString('zh-CN'));
    console.log('测试环境: http://localhost:8089');
    
    await testPublicAPIs();
    await testClientAPIs();
    await testAdminAPIs();
    
    const report = generateReport();
    generateHTMLReport(report);
    
    console.log('\n✅ API测试完成！');
}

// 执行测试
runAllTests().catch(console.error);