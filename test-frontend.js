const axios = require('axios');

// 测试前端功能
async function testFrontend() {
    console.log('🧪 开始测试前端功能...\n');

    const baseURL = 'http://localhost:3001';
    
    // 1. 测试客户端API
    console.log('📡 测试客户端API...');
    
    try {
        // 测试门店列表
        const storesRes = await axios.get(`${baseURL}/api/v1/client/stores`);
        console.log(`✅ 门店列表API: ${storesRes.data.data.stores.length} 家门店`);
        
        // 测试技师搜索
        const therapistsRes = await axios.get(`${baseURL}/api/v1/client/therapists/search?limit=5`);
        console.log(`✅ 技师搜索API: ${therapistsRes.data.data.total} 位技师`);
        
        // 测试特定门店的技师
        if (storesRes.data.data.stores.length > 0) {
            const firstStore = storesRes.data.data.stores[0];
            try {
                const storeTherapistsRes = await axios.get(
                    `${baseURL}/api/v1/client/stores/${encodeURIComponent(firstStore.name)}/therapists-schedule`
                );
                console.log(`✅ 门店技师排班API: ${firstStore.name}`);
            } catch (err) {
                console.log(`❌ 门店技师排班API失败: ${err.response?.data?.error?.message || err.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ API测试失败:', error.message);
    }
    
    // 2. 测试页面加载
    console.log('\n📄 测试页面加载...');
    
    const pages = [
        { url: '/', name: '客户端首页' },
        { url: '/admin.html', name: '管理端页面' },
        { url: '/frontend/css/style.css', name: 'CSS样式' },
        { url: '/frontend/js/client.js', name: '客户端JS' },
        { url: '/frontend/js/admin.js', name: '管理端JS' }
    ];
    
    for (const page of pages) {
        try {
            const res = await axios.get(`${baseURL}${page.url}`);
            console.log(`✅ ${page.name}: ${res.status}`);
        } catch (err) {
            console.log(`❌ ${page.name}: ${err.response?.status || err.message}`);
        }
    }
    
    // 3. 测试管理端API
    console.log('\n🔐 测试管理端API...');
    
    try {
        // 登录
        const loginRes = await axios.post(`${baseURL}/api/v1/admin/login`, {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.data.token;
        console.log('✅ 管理员登录成功');
        
        // 测试带认证的API
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const adminStoresRes = await axios.get(`${baseURL}/api/v1/admin/stores`, config);
        console.log(`✅ 管理端门店列表: ${adminStoresRes.data.data.stores.length} 家门店`);
        
        const adminTherapistsRes = await axios.get(`${baseURL}/api/v1/admin/therapists`, config);
        console.log(`✅ 管理端技师列表: ${adminTherapistsRes.data.data.total} 位技师`);
        
    } catch (error) {
        console.error('❌ 管理端API测试失败:', error.response?.data || error.message);
    }
    
    // 4. 测试前端功能完整性
    console.log('\n🎯 功能完整性检查...');
    
    try {
        // 获取客户端HTML
        const htmlRes = await axios.get(`${baseURL}/`);
        const html = htmlRes.data;
        
        // 检查关键元素
        const elements = [
            { selector: 'storeSelect', name: '门店选择下拉框' },
            { selector: 'therapistStoreFilter', name: '技师门店筛选' },
            { selector: 'appointmentStore', name: '预约门店选择' },
            { selector: 'showStores', name: '显示门店函数' },
            { selector: 'showTherapists', name: '显示技师函数' },
            { selector: 'showAppointment', name: '显示预约函数' }
        ];
        
        elements.forEach(el => {
            if (html.includes(el.selector)) {
                console.log(`✅ ${el.name}: 存在`);
            } else {
                console.log(`❌ ${el.name}: 缺失`);
            }
        });
        
    } catch (error) {
        console.error('❌ 功能检查失败:', error.message);
    }
    
    console.log('\n✨ 测试完成！');
}

// 运行测试
testFrontend().catch(console.error);