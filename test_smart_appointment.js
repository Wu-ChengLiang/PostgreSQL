const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// 模拟大模型解析的自然语言预约请求
const NATURAL_LANGUAGE_INPUTS = [
    {
        description: "客户想要马老师16:30的预约",
        input: "我需要调理师-马老师为我服务，预计16:30到店",
        parsed: {
            therapist_name: "马老师",
            appointment_time: "16:30",
            customer_name: "联系人_1750127546284",
            store_name: "名医堂·颈肩腰腿特色调理（静安寺店）"
        }
    },
    {
        description: "客户要预约李老师下午3点",
        input: "预约今天下午3点钟的李老师",
        parsed: {
            therapist_name: "李老师",
            appointment_time: "15:00",
            customer_name: "测试用户A"
        }
    },
    {
        description: "客户要找张师傅做推拿",
        input: "想要找张师傅做推拿，时间是17:00",
        parsed: {
            therapist_name: "张师傅",
            appointment_time: "17:00",
            customer_name: "测试用户B",
            notes: "推拿服务"
        }
    },
    {
        description: "只说技师名称，其他自动填充",
        input: "我要预约陈老师",
        parsed: {
            therapist_name: "陈老师"
        }
    },
    {
        description: "只说时间，自动匹配技师",
        input: "我要预约明天上午10点半",
        parsed: {
            appointment_time: "10:30",
            appointment_date: "2025-06-18"
        }
    }
];

// 发送智能预约请求
async function sendSmartAppointment(testCase, index) {
    console.log(`\n🧠 测试 ${index + 1}: ${testCase.description}`);
    console.log(`📝 原始输入: "${testCase.input}"`);
    console.log(`🔍 解析结果:`, JSON.stringify(testCase.parsed, null, 2));

    try {
        const response = await axios.post(`${API_BASE}/client/appointments/smart`, testCase.parsed, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200 && response.data.success) {
            console.log(`✅ 预约创建成功!`);
            console.log(`📋 预约ID: ${response.data.data.appointment_id}`);
            console.log(`👨‍⚕️ 匹配技师: ${response.data.data.matched_therapist.name}`);
            console.log(`📅 预约时间: ${response.data.data.appointment_date} ${response.data.data.appointment_time}`);
            console.log(`👤 客户姓名: ${response.data.data.user_name}`);
            console.log(`💬 消息: ${response.data.message}`);
            
            return {
                success: true,
                appointmentId: response.data.data.appointment_id,
                therapist: response.data.data.matched_therapist.name,
                message: response.data.message
            };
        } else {
            console.log(`❌ 预约创建失败: ${response.data.error?.message || '未知错误'}`);
            return { success: false, error: response.data.error };
        }
    } catch (error) {
        console.log(`❌ 请求失败: ${error.response?.data?.error?.message || error.message}`);
        return { success: false, error: error.message };
    }
}

// 查询预约列表验证
async function verifyAppointments() {
    console.log(`\n📊 验证预约记录...`);
    
    try {
        const response = await axios.get(`${API_BASE}/admin/appointments`);
        
        if (response.status === 200 && response.data.success) {
            const appointments = response.data.data.appointments || [];
            console.log(`📋 当前预约总数: ${appointments.length}`);
            
            // 显示最近的5个预约
            const recentAppointments = appointments.slice(0, 5);
            recentAppointments.forEach((apt, index) => {
                console.log(`  ${index + 1}. ID:${apt.id} | ${apt.therapist_name} | ${apt.appointment_date} ${apt.start_time} | ${apt.user_name}`);
            });
            
            return appointments;
        }
    } catch (error) {
        console.log(`⚠️ 查询预约失败: ${error.message}`);
    }
    
    return [];
}

// 主测试函数
async function runSmartAppointmentTest() {
    console.log('🚀 开始智能预约测试');
    console.log('模拟大模型处理自然语言预约请求');
    console.log('=' * 60);

    const results = [];

    // 执行所有测试用例
    for (let i = 0; i < NATURAL_LANGUAGE_INPUTS.length; i++) {
        const testCase = NATURAL_LANGUAGE_INPUTS[i];
        const result = await sendSmartAppointment(testCase, i);
        results.push(result);
        
        // 短暂等待，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 验证结果
    console.log('\n📊 测试结果汇总');
    console.log('=' * 40);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log(`📊 成功率: ${((successCount / results.length) * 100).toFixed(1)}%`);

    // 查询数据库验证
    await verifyAppointments();

    console.log('\n🎉 智能预约测试完成!');
    console.log('请在前端查看预约记录是否正确显示');

    return results;
}

// 如果直接运行
if (require.main === module) {
    runSmartAppointmentTest().catch(console.error);
}

module.exports = { runSmartAppointmentTest, sendSmartAppointment }; 