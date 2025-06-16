const axios = require('axios');

// 配置基础URL - 根据实际运行端口调整
const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// 测试结果存储
let testResults = {
    passed: 0,
    failed: 0,
    errors: []
};

// 工具函数：发送HTTP请求
async function makeRequest(method, url, data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${API_BASE}${url}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message, 
            status: error.response?.status 
        };
    }
}

// 记录测试结果
function logTest(testName, result) {
    if (result.success) {
        console.log(`✅ ${testName} - 通过`);
        testResults.passed++;
    } else {
        console.log(`❌ ${testName} - 失败: ${JSON.stringify(result.error)}`);
        testResults.failed++;
        testResults.errors.push({ test: testName, error: result.error });
    }
}

// 全局变量存储测试数据
let authToken = null;
let testStoreId = null;
let testTherapistId = null;
let testAppointmentId = null;

// 1. 管理员认证测试
async function testAdminLogin() {
    console.log('\n🔐 管理员认证测试');
    
    const result = await makeRequest('POST', '/admin/login', {
        username: 'admin',
        password: 'admin123'
    });
    
    if (result.success && result.data.data.token) {
        authToken = result.data.data.token;
        console.log('✅ 管理员登录成功，获得token');
    } else {
        console.log('❌ 管理员登录失败，将尝试不使用token进行测试');
    }
    
    logTest('管理员登录', result);
}

// 2. 门店相关API测试
async function testStoreApis() {
    console.log('\n🏪 门店相关API测试');
    
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    // 获取门店列表 (客户端)
    let result = await makeRequest('GET', '/client/stores');
    logTest('获取门店列表(客户端)', result);
    
    // 获取门店列表 (管理员)
    result = await makeRequest('GET', '/admin/stores', null, headers);
    logTest('获取门店列表(管理员)', result);
    
    if (result.success && result.data.data.stores && result.data.data.stores.length > 0) {
        testStoreId = result.data.data.stores[0].id;
        console.log(`📝 使用测试门店ID: ${testStoreId}`);
    }
    
    // 创建门店
    const newStore = {
        name: '测试门店',
        address: '测试地址123号',
        phone: '13800138000',
        description: '这是一个测试门店'
    };
    result = await makeRequest('POST', '/admin/stores', newStore, headers);
    logTest('创建门店', result);
    
    // 获取门店详情 (如果有门店ID)
    if (testStoreId) {
        result = await makeRequest('GET', `/admin/stores/${testStoreId}`, null, headers);
        logTest('获取门店详情(管理员)', result);
        
        result = await makeRequest('GET', `/client/stores/${testStoreId}`);
        logTest('获取门店详情(客户端)', result);
        
        // 更新门店
        const updateData = { 
            business_hours: '9:00-22:00',
            manager_name: '测试店长',
            status: 'active'
        };
        result = await makeRequest('PUT', `/admin/stores/${testStoreId}`, updateData, headers);
        logTest('更新门店信息', result);
    }
}

// 3. 技师相关API测试
async function testTherapistApis() {
    console.log('\n👨‍⚕️ 技师相关API测试');
    
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    // 获取技师列表 (管理员)
    let result = await makeRequest('GET', '/admin/therapists', null, headers);
    logTest('获取技师列表(管理员)', result);
    
    if (result.success && result.data.data.therapists && result.data.data.therapists.length > 0) {
        testTherapistId = result.data.data.therapists[0].id;
        console.log(`📝 使用测试技师ID: ${testTherapistId}`);
    }
    
    // 搜索技师 (客户端)
    result = await makeRequest('GET', '/client/therapists/search');
    logTest('搜索技师(无条件)', result);
    
    // 带条件搜索技师
    if (testStoreId) {
        result = await makeRequest('GET', `/client/therapists/search?store_id=${testStoreId}`);
        logTest('搜索技师(按门店)', result);
    }
    
    // 创建技师
    if (testStoreId) {
        const newTherapist = {
            store_id: testStoreId,
            name: '测试技师',
            position: '高级技师',
            years_of_experience: 5,
            specialties: ['按摩', '理疗'],
            description: '测试技师描述'
        };
        result = await makeRequest('POST', '/admin/therapists', newTherapist, headers);
        logTest('创建技师', result);
    }
    
    // 获取技师详情
    if (testTherapistId) {
        result = await makeRequest('GET', `/admin/therapists/${testTherapistId}`, null, headers);
        logTest('获取技师详情', result);
        
        // 更新技师信息
        const updateData = { 
            name: '测试技师（已更新）',
            phone: '13900139001',
            honors: '测试荣誉'
        };
        result = await makeRequest('PUT', `/admin/therapists/${testTherapistId}`, updateData, headers);
        logTest('更新技师信息', result);
        
        // 查询技师排班
        const today = new Date().toISOString().split('T')[0];
        result = await makeRequest('GET', `/client/therapists/${testTherapistId}/schedule?date=${today}`);
        logTest('查询技师排班', result);
    }
}

// 4. 预约相关API测试
async function testAppointmentApis() {
    console.log('\n📅 预约相关API测试');
    
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    // 获取预约列表 (管理员)
    let result = await makeRequest('GET', '/admin/appointments', null, headers);
    logTest('获取预约列表(管理员)', result);
    
    if (result.success && result.data.data.appointments && result.data.data.appointments.length > 0) {
        testAppointmentId = result.data.data.appointments[0].id;
        console.log(`📝 使用测试预约ID: ${testAppointmentId}`);
    }
    
    // 创建预约
    if (testTherapistId) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const appointmentDate = tomorrow.toISOString().split('T')[0];
        
        const newAppointment = {
            therapist_id: testTherapistId,
            user_name: '测试用户',
            user_phone: '13900139000',
            appointment_date: appointmentDate,
            appointment_time: '14:00',
            notes: '测试预约'
        };
        
        result = await makeRequest('POST', '/client/appointments', newAppointment);
        logTest('创建预约', result);
        
        if (result.success && result.data.data.id) {
            testAppointmentId = result.data.data.id;
        }
    }
    
    // 查看用户预约
    result = await makeRequest('GET', '/client/appointments/user?phone=13900139000');
    logTest('查看用户预约', result);
    
    // 获取预约详情
    if (testAppointmentId) {
        result = await makeRequest('GET', `/admin/appointments/${testAppointmentId}`, null, headers);
        logTest('获取预约详情', result);
        
        // 更新预约状态
        result = await makeRequest('PUT', `/admin/appointments/${testAppointmentId}/status`, 
            { status: 'confirmed' }, headers);
        logTest('更新预约状态', result);
    }
    
    // 取消预约
    if (testAppointmentId) {
        result = await makeRequest('DELETE', `/client/appointments/${testAppointmentId}`, {
            phone: '13900139000'
        });
        logTest('取消预约', result);
    }
}

// 5. 门店技师排班API测试
async function testStoreTherapistSchedule() {
    console.log('\n🏥 门店技师排班API测试');
    
    // 测试中文门店名（需要URL编码）
    const storeName = encodeURIComponent('名医堂·颈肩腰腿特色调理（世纪公园店）');
    let result = await makeRequest('GET', `/client/stores/${storeName}/therapists-schedule`);
    logTest('获取门店技师排班(中文店名)', result);
    
    // 如果有测试门店，也可以用ID测试，但先检查门店是否存在
    if (testStoreId) {
        // 先检查门店是否存在
        const storeCheck = await makeRequest('GET', `/client/stores/${testStoreId}`);
        if (storeCheck.success) {
            result = await makeRequest('GET', `/client/stores/${testStoreId}/therapists-schedule`);
            logTest('获取门店技师排班(门店ID)', result);
        } else {
            logTest('获取门店技师排班(门店ID)', { 
                success: false, 
                error: `测试门店ID ${testStoreId} 不存在，跳过测试` 
            });
        }
    }
}

// 6. 统计相关API测试
async function testStatisticsApis() {
    console.log('\n📊 统计相关API测试');
    
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    // 日期范围
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // 预约统计
    let result = await makeRequest('GET', 
        `/admin/statistics/appointments?start_date=${startDateStr}&end_date=${endDate}`, 
        null, headers);
    logTest('预约统计', result);
    
    // 技师工作量统计
    result = await makeRequest('GET', 
        `/admin/statistics/therapists?start_date=${startDateStr}&end_date=${endDate}`, 
        null, headers);
    logTest('技师工作量统计', result);
    
    // 统计概览
    result = await makeRequest('GET', '/admin/statistics/overview', null, headers);
    logTest('统计概览', result);
}

// 7. 边界情况和错误处理测试
async function testErrorHandling() {
    console.log('\n🚫 错误处理测试');
    
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    // 无效的技师ID
    let result = await makeRequest('GET', '/admin/therapists/99999', null, headers);
    logTest('无效技师ID(应该返回404)', { 
        success: result.status === 404,
        error: result.status !== 404 ? `期望404，实际${result.status}` : null
    });
    
    // 无效的预约ID
    result = await makeRequest('GET', '/admin/appointments/99999', null, headers);
    logTest('无效预约ID(应该返回404)', { 
        success: result.status === 404,
        error: result.status !== 404 ? `期望404，实际${result.status}` : null
    });
    
    // 缺少必填参数的预约创建
    result = await makeRequest('POST', '/client/appointments', {
        user_name: '测试用户'
        // 缺少其他必填字段
    });
    logTest('创建预约缺少参数(应该返回400)', { success: result.status === 400 });
    
    // 无效的预约状态更新
    if (testAppointmentId) {
        result = await makeRequest('PUT', `/admin/appointments/${testAppointmentId}/status`, 
            { status: 'invalid_status' }, headers);
        logTest('无效预约状态(应该返回400)', { success: result.status === 400 });
    }
}

// 主测试函数
async function runAllTests() {
    console.log('🚀 开始执行API综合测试\n');
    console.log(`📡 测试服务器: ${BASE_URL}`);
    console.log('='.repeat(50));
    
    try {
        // 按顺序执行测试
        await testAdminLogin();
        await testStoreApis();
        await testTherapistApis();
        await testAppointmentApis();
        await testStoreTherapistSchedule();
        await testStatisticsApis();
        await testErrorHandling();
        
    } catch (error) {
        console.error('❌ 测试执行过程中发生错误:', error);
        testResults.failed++;
        testResults.errors.push({ test: '测试执行', error: error.message });
    }
    
    // 输出测试总结
    console.log('\n' + '='.repeat(50));
    console.log('📋 测试总结');
    console.log('='.repeat(50));
    console.log(`✅ 通过: ${testResults.passed}`);
    console.log(`❌ 失败: ${testResults.failed}`);
    console.log(`📊 总计: ${testResults.passed + testResults.failed}`);
    
    if (testResults.errors.length > 0) {
        console.log('\n❌ 失败详情:');
        testResults.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.test}: ${JSON.stringify(error.error, null, 2)}`);
        });
    }
    
    console.log('\n🎉 测试完成!');
    
    // 返回测试结果
    return testResults;
}

// 如果直接运行此脚本
if (require.main === module) {
    runAllTests().then((results) => {
        // 设置退出码
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch((error) => {
        console.error('💥 测试执行失败:', error);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    makeRequest,
    testResults
}; 