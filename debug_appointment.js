const http = require('http');

async function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '::1',  // 使用IPv6
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testInvalidAppointment() {
    try {
        // 先登录获取token
        console.log('🔐 正在登录...');
        const loginResponse = await makeRequest('POST', '/api/v1/admin/login', {
            username: 'admin',
            password: 'admin123'
        });
        
        if (loginResponse.status !== 200) {
            console.log('❌ 登录失败:', loginResponse);
            return;
        }
        
        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功，获得token');
        
        // 测试无效预约ID
        console.log('🧪 测试无效预约ID...');
        const response = await makeRequest('GET', '/api/v1/admin/appointments/99999', null, {
            'Authorization': `Bearer ${token}`
        });
        
        console.log('📊 响应详情:');
        console.log('状态码:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        console.log('错误消息:', response.data.error?.message);
        console.log('错误消息类型:', typeof response.data.error?.message);
        console.log('错误消息长度:', response.data.error?.message?.length);
        console.log('是否包含"不存在":', response.data.error?.message?.includes('不存在'));
        
    } catch (error) {
        console.log('❌ 请求错误:', error.message);
    }
}

testInvalidAppointment(); 