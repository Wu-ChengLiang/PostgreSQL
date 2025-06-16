const http = require('http');

// API配置
const API_HOST = 'localhost';
const API_PORT = 8089;
const API_BASE = '/api/v1';

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
                        data: responseData ? JSON.parse(responseData) : null
                    };
                    resolve(result);
                } catch (error) {
                    resolve({
                        status: res.statusCode,
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

async function testCRUDOperations() {
    console.log('🧪 开始测试技师CRUD操作...\n');

    try {
        // 1. 登录获取token
        console.log('1️⃣ 登录获取认证令牌...');
        const loginRes = await makeRequest({
            method: 'POST',
            path: `${API_BASE}/admin/login`,
            headers: { 'Content-Type': 'application/json' }
        }, {
            username: 'admin',
            password: 'admin123'
        });

        if (!loginRes.data.success) {
            console.error('❌ 登录失败:', loginRes.data);
            return;
        }

        const token = loginRes.data.data.token;
        console.log('✅ 登录成功，获得令牌\n');

        // 2. READ - 获取技师列表
        console.log('2️⃣ 测试READ - 获取技师列表...');
        const listRes = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/admin/therapists?limit=5`,
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (listRes.data.success) {
            console.log(`✅ 获取成功，共 ${listRes.data.data.total} 位技师`);
            console.log(`   前5位技师:`);
            listRes.data.data.therapists.slice(0, 5).forEach(t => {
                console.log(`   - ${t.name} (${t.position}) - ${t.experience_years}年经验`);
            });
        } else {
            console.log('❌ 获取失败:', listRes.data);
        }

        // 3. CREATE - 添加新技师
        console.log('\n3️⃣ 测试CREATE - 添加新技师...');
        const createRes = await makeRequest({
            method: 'POST',
            path: `${API_BASE}/admin/therapists`,
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }, {
            store_id: 1,
            name: '测试技师-' + Date.now(),
            position: '高级调理师',
            years_of_experience: 10,
            specialties: ['推拿', '艾灸', '拔罐'],
            phone: '13888888888',
            honors: '国家级推拿师'
        });

        let newTherapistId = null;
        if (createRes.data.success) {
            newTherapistId = createRes.data.data.therapist.id;
            console.log(`✅ 添加成功，新技师ID: ${newTherapistId}`);
            console.log(`   技师信息: ${createRes.data.data.therapist.name} - ${createRes.data.data.therapist.position}`);
        } else {
            console.log('❌ 添加失败:', createRes.data);
        }

        // 4. UPDATE - 更新技师信息
        if (newTherapistId) {
            console.log('\n4️⃣ 测试UPDATE - 更新技师信息...');
            const updateRes = await makeRequest({
                method: 'PUT',
                path: `${API_BASE}/admin/therapists/${newTherapistId}`,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }, {
                phone: '13999999999',
                specialties: ['推拿', '艾灸', '拔罐', '经络疏通'],
                honors: '国家级推拿师、高级调理师'
            });

            if (updateRes.data.success) {
                console.log('✅ 更新成功');
                console.log(`   新电话: ${updateRes.data.data.therapist.phone}`);
                console.log(`   新专长: ${updateRes.data.data.therapist.specialties.join('、')}`);
            } else {
                console.log('❌ 更新失败:', updateRes.data);
            }

            // 5. DELETE - 删除技师
            console.log('\n5️⃣ 测试DELETE - 删除技师...');
            const deleteRes = await makeRequest({
                method: 'DELETE',
                path: `${API_BASE}/admin/therapists/${newTherapistId}`,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (deleteRes.data.success) {
                console.log('✅ 删除成功（软删除）');
            } else {
                console.log('❌ 删除失败:', deleteRes.data);
            }
        }

        // 6. 验证前端数据可用性
        console.log('\n6️⃣ 验证客户端API数据可用性...');
        const clientRes = await makeRequest({
            method: 'GET',
            path: `${API_BASE}/client/therapists/search?limit=10`
        });

        if (clientRes.data.success) {
            console.log(`✅ 客户端API正常，返回 ${clientRes.data.data.therapists.length} 位技师`);
            
            // 显示专长分布
            const specialties = {};
            clientRes.data.data.therapists.forEach(t => {
                t.specialties.forEach(s => {
                    specialties[s] = (specialties[s] || 0) + 1;
                });
            });
            
            console.log('\n   技师专长分布:');
            Object.entries(specialties)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([specialty, count]) => {
                    console.log(`   - ${specialty}: ${count}位技师`);
                });
        } else {
            console.log('❌ 客户端API失败:', clientRes.data);
        }

        console.log('\n✅ CRUD操作测试完成！');

    } catch (error) {
        console.error('❌ 测试过程出错:', error);
    }
}

// 运行测试
testCRUDOperations().catch(console.error);