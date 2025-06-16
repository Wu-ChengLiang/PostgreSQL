const http = require('http');

// 测试新的实验性API
function testNewAPI() {
    const storeName = encodeURIComponent('名医堂·颈肩腰腿特色调理（宜山路店）');
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/v1/client/stores/${storeName}/therapists-schedule`,
        method: 'GET'
    };
    
    console.log('测试新API:', decodeURIComponent(storeName));
    console.log('请求路径:', options.path);
    
    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('状态码:', res.statusCode);
            try {
                const result = JSON.parse(data);
                console.log('响应数据:', JSON.stringify(result, null, 2));
            } catch (e) {
                console.log('响应内容:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('请求失败:', error);
    });
    
    req.end();
}

// 确保服务器已启动
console.log('请确保服务器已在3001端口启动...');
console.log('可以使用: npm start');
console.log('');

// 延迟执行测试
setTimeout(testNewAPI, 1000);