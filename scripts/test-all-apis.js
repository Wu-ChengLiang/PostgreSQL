const http = require('http');
const querystring = require('querystring');

// API基础配置
const API_HOST = 'localhost';
const API_PORT = 8089;
const API_BASE = '/api/v1';

// 测试结果记录
const testResults = [];

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
function recordTest(name, result, expected, actual) {
    testResults.push({
        name,
        result,
        expected,
        actual,
        time: new Date().toISOString()
    });
    console.log(`${result ? '✅' : '❌'} ${name}`);
    if (!result) {
        console.log(`   期望: ${expected}`);
        console.log(`   实际: ${actual}`);
    }
}

// 测试客户端API
async function testClientAPIs() {
    console.log('\n========== 测试客户端API ==========\n');

    // 1. 健康检查
    try {
        const res = await makeRequest({
            method: 'GET',
            path: '/health'
        });
        recordTest('健康检查', res.status === 200, '200', res.status);
    } catch (error) {
        recordTest('健康检查', false, '200', error.message);
    }

    // 2. 获取门店列表
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/stores`
        });
        recordTest('获取门店列表', res.status === 200 && res.data.success, '成功', res.status);
        if (res.data.success) {
            console.log(`   返回 ${res.data.data.stores.length} 家门店`);
        }
    } catch (error) {
        recordTest('获取门店列表', false, '成功', error.message);
    }

    // 3. 搜索技师
    try {
        const params = querystring.stringify({
            specialty: '按摩',
            limit: 5
        });
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/therapists/search?${params}`
        });
        recordTest('搜索技师（按专长）', res.status === 200 && res.data.success, '成功', res.status);
        if (res.data.success) {
            console.log(`   找到 ${res.data.data.total} 位技师`);
        }
    } catch (error) {
        recordTest('搜索技师（按专长）', false, '成功', error.message);
    }

    // 4. 查询技师排班
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/therapists/1/schedule?date=${dateStr}`
        });
        recordTest('查询技师排班', res.status === 200 && res.data.success, '成功', res.status);
        if (res.data.success) {
            console.log(`   可用时间段: ${res.data.data.schedule.available_times.length} 个`);
        }
    } catch (error) {
        recordTest('查询技师排班', false, '成功', error.message);
    }

    // 5. 创建预约（缺少参数的情况）
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
        recordTest('创建预约（参数验证）', res.status === 400, '400错误', res.status);
    } catch (error) {
        recordTest('创建预约（参数验证）', false, '400错误', error.message);
    }

    // 6. 查询用户预约
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/appointments/user?phone=13800138000`
        });
        recordTest('查询用户预约', res.status === 200 && res.data.success, '成功', res.status);
        if (res.data.success) {
            console.log(`   找到 ${res.data.data.appointments.length} 个预约`);
        }
    } catch (error) {
        recordTest('查询用户预约', false, '成功', error.message);
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
        
        const loginSuccess = res.status === 200 && res.data.success && res.data.data.token;
        recordTest('管理员登录', loginSuccess, '成功', res.status);
        
        if (loginSuccess) {
            authToken = res.data.data.token;
            console.log(`   获得令牌: ${authToken.substring(0, 20)}...`);
        }
    } catch (error) {
        recordTest('管理员登录', false, '成功', error.message);
        return; // 无法继续测试
    }

    // 2. 未授权访问测试
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/therapists`
        });
        recordTest('未授权访问', res.status === 401, '401错误', res.status);
    } catch (error) {
        recordTest('未授权访问', false, '401错误', error.message);
    }

    // 3. 获取技师列表（带认证）
    try {
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/therapists`,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        recordTest('获取技师列表（管理端）', res.status === 200 && res.data.success, '成功', res.status);
        if (res.data.success) {
            console.log(`   总计 ${res.data.data.total} 位技师`);
        }
    } catch (error) {
        recordTest('获取技师列表（管理端）', false, '成功', error.message);
    }

    // 4. 获取预约列表
    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/appointments?date=${today}`,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        recordTest('获取预约列表', res.status === 200 && res.data.success, '成功', res.status);
        if (res.data.success) {
            console.log(`   今日预约: ${res.data.data.total} 个`);
        }
    } catch (error) {
        recordTest('获取预约列表', false, '成功', error.message);
    }

    // 5. 获取统计数据
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const res = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/statistics/appointments?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        recordTest('获取预约统计', res.status === 200 && res.data.success, '成功', res.status);
    } catch (error) {
        recordTest('获取预约统计', false, '成功', error.message);
    }

    // 6. 添加技师（测试）
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
            name: '测试技师',
            position: '调理师',
            years_of_experience: 5,
            specialties: ['测试', 'API测试']
        });
        recordTest('添加技师', res.status === 200 && res.data.success, '成功', res.status);
        
        // 如果添加成功，尝试删除
        if (res.data.success && res.data.data.therapist) {
            const deleteRes = await makeRequest({
                method: 'DELETE',
                path: `${API_BASE}/admin/therapists/${res.data.data.therapist.id}`,
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            console.log(`   清理测试数据: ${deleteRes.status === 200 ? '成功' : '失败'}`);
        }
    } catch (error) {
        recordTest('添加技师', false, '成功', error.message);
    }
}

// 生成测试报告
function generateReport() {
    console.log('\n========== 测试报告 ==========\n');
    
    const passed = testResults.filter(t => t.result).length;
    const failed = testResults.filter(t => !t.result).length;
    const total = testResults.length;
    
    console.log(`总测试数: ${total}`);
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(2)}%`);
    
    if (failed > 0) {
        console.log('\n失败的测试:');
        testResults.filter(t => !t.result).forEach(t => {
            console.log(`- ${t.name}`);
        });
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('🧪 开始API测试...\n');
    
    await testClientAPIs();
    await testAdminAPIs();
    
    generateReport();
}

// 执行测试
runAllTests().catch(console.error);