const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8089/api/v1';
let authToken = null;

// 测试结果收集
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    results: []
};

// 彩色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function logTest(name, status, error = null) {
    testResults.total++;
    const result = {
        name,
        status,
        timestamp: new Date().toISOString(),
        error: error ? error.message || error : null
    };
    
    if (status === 'pass') {
        testResults.passed++;
        console.log(`${colors.green}✓${colors.reset} ${name}`);
    } else {
        testResults.failed++;
        console.log(`${colors.red}✗${colors.reset} ${name}`);
        if (error) {
            console.log(`  ${colors.red}Error: ${typeof error === 'object' ? JSON.stringify(error) : error}${colors.reset}`);
        }
    }
    
    testResults.results.push(result);
}

// 客户端API测试
async function testClientAPIs() {
    console.log(`\n${colors.cyan}=== 测试客户端API ===${colors.reset}\n`);
    
    // 1. 获取所有门店
    try {
        const response = await axios.get(`${BASE_URL}/client/stores`);
        if (response.data.success && response.data.data.stores && response.data.data.stores.length > 0) {
            logTest('GET /client/stores - 获取所有门店', 'pass');
        } else {
            throw new Error('没有返回门店数据');
        }
    } catch (error) {
        logTest('GET /client/stores - 获取所有门店', 'fail', error.response?.data?.error || error.message);
    }
    
    // 2. 搜索技师
    try {
        const response = await axios.get(`${BASE_URL}/client/therapists/search?page=1&limit=10`);
        if (response.data.success && response.data.data.therapists && response.data.data.therapists.length > 0) {
            logTest('GET /client/therapists/search - 搜索技师', 'pass');
        } else {
            throw new Error('没有返回技师数据');
        }
    } catch (error) {
        logTest('GET /client/therapists/search - 搜索技师', 'fail', error.response?.data?.error || error.message);
    }
    
    // 3. 获取技师排班
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(`${BASE_URL}/client/therapists/7/schedule?date=${today}`);
        if (response.data.success && response.data.data.schedule && response.data.data.schedule.available_times) {
            logTest('GET /client/therapists/:id/schedule - 获取技师排班', 'pass');
        } else {
            throw new Error('没有返回排班数据');
        }
    } catch (error) {
        logTest('GET /client/therapists/:id/schedule - 获取技师排班', 'fail', error.response?.data?.error || error.message);
    }
    
    // 4. 创建预约
    let appointmentId = null;
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const appointmentData = {
            therapist_id: 7,
            user_name: '测试用户',
            user_phone: '13800138000',
            appointment_date: tomorrow.toISOString().split('T')[0],
            appointment_time: '14:00',
            notes: '测试预约'
        };
        const response = await axios.post(`${BASE_URL}/client/appointments`, appointmentData);
        if (response.data.success && response.data.data.appointment_id) {
            appointmentId = response.data.data.appointment_id;
            logTest('POST /client/appointments - 创建预约', 'pass');
        } else {
            throw new Error('创建预约失败');
        }
    } catch (error) {
        logTest('POST /client/appointments - 创建预约', 'fail', error.response?.data?.error || error.message);
    }
    
    // 5. 查询用户预约
    try {
        const response = await axios.get(`${BASE_URL}/client/appointments/user?phone=13800138000`);
        if (response.data.success && response.data.data.appointments) {
            logTest('GET /client/appointments - 查询用户预约', 'pass');
        } else {
            throw new Error('查询预约失败');
        }
    } catch (error) {
        logTest('GET /client/appointments - 查询用户预约', 'fail', error.response?.data?.error || error.message);
    }
    
    // 6. 取消预约
    if (appointmentId) {
        try {
            const response = await axios.delete(`${BASE_URL}/client/appointments/${appointmentId}`, {
                data: {
                    phone: '13800138000'
                }
            });
            if (response.data.success) {
                logTest('PATCH /client/appointments/:id/cancel - 取消预约', 'pass');
            } else {
                throw new Error('取消预约失败');
            }
        } catch (error) {
            logTest('PATCH /client/appointments/:id/cancel - 取消预约', 'fail', error.response?.data?.error || error.message);
        }
    }
}

// 管理员API测试
async function testAdminAPIs() {
    console.log(`\n${colors.cyan}=== 测试管理员API ===${colors.reset}\n`);
    
    // 1. 管理员登录
    try {
        const response = await axios.post(`${BASE_URL}/admin/login`, {
            username: 'admin',
            password: 'admin123'
        });
        if (response.data.success && response.data.data.token) {
            authToken = response.data.data.token;
            logTest('POST /admin/auth/login - 管理员登录', 'pass');
        } else {
            throw new Error('登录失败');
        }
    } catch (error) {
        logTest('POST /admin/auth/login - 管理员登录', 'fail', error.response?.data?.error || error.message);
        return; // 登录失败，无法继续测试其他管理员API
    }
    
    // 设置授权头
    const authConfig = {
        headers: { Authorization: `Bearer ${authToken}` }
    };
    
    // 2. 获取技师列表
    try {
        const response = await axios.get(`${BASE_URL}/admin/therapists`, authConfig);
        if (response.data.success && response.data.data && response.data.data.therapists) {
            logTest('GET /admin/therapists - 获取技师列表', 'pass');
        } else {
            throw new Error('获取技师列表失败');
        }
    } catch (error) {
        logTest('GET /admin/therapists - 获取技师列表', 'fail', error.response?.data?.error || error.message);
    }
    
    // 3. 创建技师
    let newTherapistId = null;
    try {
        const therapistData = {
            store_id: 1,
            name: '测试技师',
            position: '主治医师',
            years_of_experience: 5,
            specialties: ['推拿', '针灸'],
            phone: '13900139000'
        };
        const response = await axios.post(`${BASE_URL}/admin/therapists`, therapistData, authConfig);
        if (response.data.success && response.data.data && response.data.data.id) {
            newTherapistId = response.data.data.id;
            logTest('POST /admin/therapists - 创建技师', 'pass');
        } else {
            throw new Error('创建技师失败');
        }
    } catch (error) {
        logTest('POST /admin/therapists - 创建技师', 'fail', error.response?.data?.error || error.message);
    }
    
    // 4. 获取技师详情
    if (newTherapistId) {
        try {
            const response = await axios.get(`${BASE_URL}/admin/therapists/${newTherapistId}`, authConfig);
            if (response.data.success && response.data.data && response.data.data.id === newTherapistId) {
                logTest('GET /admin/therapists/:id - 获取技师详情', 'pass');
            } else {
                throw new Error('获取技师详情失败');
            }
        } catch (error) {
            logTest('GET /admin/therapists/:id - 获取技师详情', 'fail', error.response?.data?.error || error.message);
        }
    }
    
    // 5. 更新技师
    if (newTherapistId) {
        try {
            const updateData = {
                position: '专家医师',
                years_of_experience: 10
            };
            const response = await axios.put(`${BASE_URL}/admin/therapists/${newTherapistId}`, updateData, authConfig);
            if (response.data.success && response.data.data && response.data.data.position === '专家医师') {
                logTest('PUT /admin/therapists/:id - 更新技师', 'pass');
            } else {
                throw new Error('更新技师失败');
            }
        } catch (error) {
            logTest('PUT /admin/therapists/:id - 更新技师', 'fail', error.response?.data?.error || error.message);
        }
    }
    
    // 6. 删除技师
    if (newTherapistId) {
        try {
            const response = await axios.delete(`${BASE_URL}/admin/therapists/${newTherapistId}`, authConfig);
            if (response.data.success) {
                logTest('DELETE /admin/therapists/:id - 删除技师', 'pass');
            } else {
                throw new Error('删除技师失败');
            }
        } catch (error) {
            logTest('DELETE /admin/therapists/:id - 删除技师', 'fail', error.response?.data?.error || error.message);
        }
    }
    
    // 7. 获取预约列表
    try {
        const response = await axios.get(`${BASE_URL}/admin/appointments`, authConfig);
        if (response.data.success && response.data.data && response.data.data.appointments !== undefined) {
            logTest('GET /admin/appointments - 获取预约列表', 'pass');
        } else {
            throw new Error('获取预约列表失败');
        }
    } catch (error) {
        logTest('GET /admin/appointments - 获取预约列表', 'fail', error.response?.data?.error || error.message);
    }
    
    // 8. 获取门店列表
    try {
        const response = await axios.get(`${BASE_URL}/admin/stores`, authConfig);
        if (response.data.success && response.data.data && response.data.data.stores) {
            logTest('GET /admin/stores - 获取门店列表', 'pass');
        } else {
            throw new Error('获取门店列表失败');
        }
    } catch (error) {
        logTest('GET /admin/stores - 获取门店列表', 'fail', error.response?.data?.error || error.message);
    }
    
    // 9. 创建门店
    let newStoreId = null;
    try {
        const storeData = {
            name: '测试门店',
            address: '测试地址123号',
            phone: '021-12345678'
        };
        const response = await axios.post(`${BASE_URL}/admin/stores`, storeData, authConfig);
        if (response.data.success && response.data.data && response.data.data.id) {
            newStoreId = response.data.data.id;
            logTest('POST /admin/stores - 创建门店', 'pass');
        } else {
            throw new Error('创建门店失败');
        }
    } catch (error) {
        logTest('POST /admin/stores - 创建门店', 'fail', error.response?.data?.error || error.message);
    }
    
    // 10. 更新门店
    if (newStoreId) {
        try {
            const updateData = {
                phone: '021-87654321',
                business_hours: '08:00-22:00'
            };
            const response = await axios.put(`${BASE_URL}/admin/stores/${newStoreId}`, updateData, authConfig);
            if (response.data.success && response.data.data && response.data.data.phone === '021-87654321') {
                logTest('PUT /admin/stores/:id - 更新门店', 'pass');
            } else {
                throw new Error('更新门店失败');
            }
        } catch (error) {
            logTest('PUT /admin/stores/:id - 更新门店', 'fail', error.response?.data?.error || error.message);
        }
    }
    
    // 11. 获取统计数据
    try {
        const response = await axios.get(`${BASE_URL}/admin/statistics/overview`, authConfig);
        if (response.data.success && response.data.data && response.data.data.stores_count !== undefined) {
            logTest('GET /admin/statistics/overview - 获取统计概览', 'pass');
        } else {
            throw new Error('获取统计数据失败');
        }
    } catch (error) {
        logTest('GET /admin/statistics/overview - 获取统计概览', 'fail', error.response?.data?.error || error.message);
    }
}

// 生成测试报告
function generateReport() {
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    
    console.log(`\n${colors.cyan}=== 测试结果汇总 ===${colors.reset}`);
    console.log(`总测试数: ${testResults.total}`);
    console.log(`${colors.green}通过: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}失败: ${testResults.failed}${colors.reset}`);
    console.log(`成功率: ${successRate}%`);
    
    // 生成JSON报告
    const report = {
        summary: {
            total: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            successRate: `${successRate}%`,
            timestamp: new Date().toISOString(),
            environment: 'local'
        },
        details: testResults.results
    };
    
    const reportPath = path.join(__dirname, 'api-test-report-local.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n测试报告已保存到: ${reportPath}`);
    
    return successRate;
}

// 主测试函数
async function runTests() {
    console.log(`${colors.yellow}开始API测试 - 本地环境${colors.reset}`);
    console.log(`测试服务器: ${BASE_URL}`);
    console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
    
    try {
        // 确保服务器正在运行
        await axios.get('http://localhost:8089/health');
        console.log(`${colors.green}服务器连接成功${colors.reset}`);
    } catch (error) {
        console.error(`${colors.red}无法连接到服务器，请确保服务器正在运行${colors.reset}`);
        process.exit(1);
    }
    
    // 运行测试
    await testClientAPIs();
    await testAdminAPIs();
    
    // 生成报告
    const successRate = generateReport();
    
    // 根据成功率决定退出码
    process.exit(successRate === '100.00' ? 0 : 1);
}

// 运行测试
runTests().catch(error => {
    console.error(`${colors.red}测试过程中发生错误:${colors.reset}`, error);
    process.exit(1);
});