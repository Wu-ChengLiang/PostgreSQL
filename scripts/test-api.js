const http = require('http');

// 测试健康检查端点
const testHealthCheck = () => {
    console.log('\n测试健康检查端点...');
    
    const options = {
        hostname: 'localhost',
        port: 8089,
        path: '/health',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('状态码:', res.statusCode);
            console.log('响应:', JSON.parse(data));
        });
    });

    req.on('error', (e) => {
        console.error('请求失败:', e.message);
    });

    req.end();
};

// 测试获取门店列表
const testGetStores = () => {
    console.log('\n测试获取门店列表...');
    
    const options = {
        hostname: 'localhost',
        port: 8089,
        path: '/api/v1/client/stores',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('状态码:', res.statusCode);
            const response = JSON.parse(data);
            console.log('门店数量:', response.data?.stores?.length || 0);
            if (response.data?.stores?.length > 0) {
                console.log('第一家门店:', response.data.stores[0]);
            }
        });
    });

    req.on('error', (e) => {
        console.error('请求失败:', e.message);
    });

    req.end();
};

// 测试搜索技师
const testSearchTherapists = () => {
    console.log('\n测试搜索技师...');
    
    const options = {
        hostname: 'localhost',
        port: 8089,
        path: '/api/v1/client/therapists/search?specialty=按摩&min_experience=10',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('状态码:', res.statusCode);
            const response = JSON.parse(data);
            console.log('技师数量:', response.data?.total || 0);
            if (response.data?.therapists?.length > 0) {
                console.log('第一位技师:', response.data.therapists[0]);
            }
        });
    });

    req.on('error', (e) => {
        console.error('请求失败:', e.message);
    });

    req.end();
};

// 运行测试
console.log('开始API测试...');
testHealthCheck();

setTimeout(() => {
    testGetStores();
}, 1000);

setTimeout(() => {
    testSearchTherapists();
}, 2000);

setTimeout(() => {
    console.log('\nAPI测试完成！');
    process.exit(0);
}, 3000);