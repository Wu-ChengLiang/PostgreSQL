#!/usr/bin/env node

/**
 * 前端CRUD功能测试脚本
 * 测试所有前端的增删改查功能是否正常工作
 */

const http = require('http');

// 配置
const API_BASE_URL = 'http://localhost:8089/api/v1';
const ADMIN_TOKEN = 'test-admin-token'; // 需要先登录获取

// 颜色代码
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// 测试计数器
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 共享数据
let sharedTherapistId = null;

// 日志函数
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP请求封装
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (error) {
                    resolve({ status: res.statusCode, data: body });
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

// 测试函数
async function runTest(testName, testFn) {
    totalTests++;
    try {
        await testFn();
        passedTests++;
        log(`✓ ${testName}`, 'green');
    } catch (error) {
        failedTests++;
        log(`✗ ${testName}`, 'red');
        log(`  错误: ${error.message}`, 'red');
    }
}

// 测试数据
const testData = {
    therapist: {
        store_id: 1,
        name: '测试技师' + Date.now(),
        position: '推拿师',
        years_of_experience: 5,
        specialties: ['颈椎调理', '腰椎调理'],
        phone: '13800138000',
        honors: '测试荣誉'
    },
    appointment: {
        therapist_id: null, // 将在查询后动态设置
        user_name: '测试用户',
        user_phone: '13900139000',
        appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 明天
        appointment_time: '14:00',
        notes: '测试预约'
    },
    user: {
        phone: '13900139000'
    }
};

// 测试客户端CRUD
async function testClientCRUD() {
    log('\n=== 测试客户端CRUD功能 ===', 'blue');
    
    // 1. 查询门店 (READ)
    await runTest('查询门店列表', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 8089,
            path: '/api/v1/client/stores',
            method: 'GET'
        });
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('查询门店失败');
        }
        if (!Array.isArray(response.data.data.stores)) {
            throw new Error('门店数据格式错误');
        }
    });
    
    // 2. 查询技师 (READ)
    let activeTherapistId;
    await runTest('查询技师列表', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 8089,
            path: '/api/v1/client/therapists/search',
            method: 'GET'
        });
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('查询技师失败');
        }
        if (!Array.isArray(response.data.data.therapists)) {
            throw new Error('技师数据格式错误');
        }
        
        // 获取第一个活跃的技师ID
        const activeTherapist = response.data.data.therapists.find(t => t.status === 'active');
        if (activeTherapist) {
            activeTherapistId = activeTherapist.id;
            testData.appointment.therapist_id = activeTherapistId;
        }
    });
    
    // 3. 创建预约 (CREATE)
    let appointmentId;
    await runTest('创建预约', async () => {
        const therapistIdToUse = activeTherapistId || sharedTherapistId || 1;
        testData.appointment.therapist_id = therapistIdToUse;
        
        console.log('使用的预约数据:', testData.appointment);
        const response = await makeRequest({
            hostname: 'localhost',
            port: 8089,
            path: '/api/v1/client/appointments',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, testData.appointment);
        
        if ((response.status !== 201 && response.status !== 200) || !response.data.success) {
            console.error('创建预约响应:', response.data);
            throw new Error('创建预约失败: ' + (response.data.error?.message || JSON.stringify(response.data)));
        }
        appointmentId = response.data.data.id;
    });
    
    // 4. 查询我的预约 (READ)
    await runTest('查询我的预约', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 8089,
            path: `/api/v1/client/appointments/user?phone=${testData.user.phone}`,
            method: 'GET'
        });
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('查询预约失败');
        }
        if (!Array.isArray(response.data.data.appointments)) {
            throw new Error('预约数据格式错误');
        }
    });
    
    // 5. 取消预约 (DELETE)
    if (appointmentId) {
        await runTest('取消预约', async () => {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 8089,
                path: `/api/v1/client/appointments/${appointmentId}`,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, { phone: testData.user.phone });
            
            if (response.status !== 200 || !response.data.success) {
                throw new Error('取消预约失败');
            }
        });
    }
}

// 测试管理端CRUD
async function testAdminCRUD() {
    log('\n=== 测试管理端CRUD功能 ===', 'blue');
    
    // 先登录获取token
    let token;
    await runTest('管理员登录', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 8089,
            path: '/api/v1/admin/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            username: 'admin',
            password: 'admin123'
        });
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('登录失败');
        }
        token = response.data.data.token;
    });
    
    if (!token) {
        log('无法获取管理员token，跳过管理端测试', 'yellow');
        return;
    }
    
    // 1. 创建技师 (CREATE)
    let therapistId;
    await runTest('创建技师', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 8089,
            path: '/api/v1/admin/therapists',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, testData.therapist);
        
        if ((response.status !== 201 && response.status !== 200) || !response.data.success) {
            console.error('创建技师响应:', response.data);
            throw new Error('创建技师失败: ' + (response.data.error?.message || JSON.stringify(response.data)));
        }
        therapistId = response.data.data.id;
        sharedTherapistId = therapistId; // 保存供客户端测试使用
    });
    
    // 2. 查询技师列表 (READ)
    await runTest('查询技师列表（管理端）', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 8089,
            path: '/api/v1/admin/therapists',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('查询技师失败');
        }
    });
    
    // 3. 更新技师 (UPDATE)
    if (therapistId) {
        await runTest('更新技师信息', async () => {
            const updatedData = {
                ...testData.therapist,
                name: '更新后的技师名',
                years_of_experience: 8
            };
            
            const response = await makeRequest({
                hostname: 'localhost',
                port: 8089,
                path: `/api/v1/admin/therapists/${therapistId}`,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }, updatedData);
            
            if (response.status !== 200 || !response.data.success) {
                throw new Error('更新技师失败');
            }
        });
    }
    
    // 4. 查询预约列表 (READ)
    await runTest('查询预约列表（管理端）', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 8089,
            path: '/api/v1/admin/appointments',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('查询预约失败');
        }
    });
    
    // 5. 查询统计数据 (READ)
    await runTest('查询统计数据', async () => {
        const today = new Date().toISOString().split('T')[0];
        const response = await makeRequest({
            hostname: 'localhost',
            port: 8089,
            path: `/api/v1/admin/statistics/appointments?start_date=${today}&end_date=${today}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('查询统计数据失败');
        }
    });
    
    // 保存therapistId供后续清理使用
    return { therapistId, token };
}

// 清理测试数据
async function cleanupTestData(adminData) {
    if (!adminData || !adminData.therapistId || !adminData.token) return;
    
    log('\n=== 清理测试数据 ===', 'blue');
    
    await runTest('删除测试技师', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 8089,
            path: `/api/v1/admin/therapists/${adminData.therapistId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminData.token}`
            }
        });
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('删除技师失败');
        }
    });
}

// 主测试函数
async function runAllTests() {
    log('开始测试前端CRUD功能...', 'blue');
    log('请确保服务器运行在 http://localhost:8089', 'yellow');
    
    try {
        // 测试服务器连接
        await runTest('测试服务器连接', async () => {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 8089,
                path: '/api/v1/client/stores',
                method: 'GET'
            });
            
            if (response.status !== 200) {
                throw new Error('无法连接到服务器');
            }
        });
        
        // 运行测试 - 先运行管理端测试以创建技师
        const adminData = await testAdminCRUD();
        await testClientCRUD();
        await cleanupTestData(adminData);
        
        // 显示测试结果
        log('\n=== 测试结果 ===', 'blue');
        log(`总测试数: ${totalTests}`);
        log(`通过: ${passedTests}`, 'green');
        log(`失败: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
        log(`成功率: ${((passedTests / totalTests) * 100).toFixed(2)}%`, 
            failedTests === 0 ? 'green' : 'yellow');
        
    } catch (error) {
        log(`\n测试过程中发生错误: ${error.message}`, 'red');
    }
}

// 运行测试
runAllTests();