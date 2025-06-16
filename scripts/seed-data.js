const Database = require('../src/database/connection');

async function seedData() {
    const db = new Database();
    await db.connect();

    console.log('🌱 开始导入种子数据...');

    // 禁用外键约束以清空数据
    await db.run('PRAGMA foreign_keys = OFF');
    
    // 清空现有数据（按照依赖顺序）
    await db.run('DELETE FROM appointments');
    await db.run('DELETE FROM therapists');
    await db.run('DELETE FROM users');
    await db.run('DELETE FROM services');
    await db.run('DELETE FROM stores');
    
    // 重新启用外键约束
    await db.run('PRAGMA foreign_keys = ON');

    // 插入服务项目
    const services = [
        { name: '按摩', category: '基础服务', duration: 60, price: 128.00, description: '专业中式按摩服务' },
        { name: '经络疏通', category: '特色服务', duration: 90, price: 168.00, description: '传统经络疏通调理' },
        { name: '艾灸', category: '中医调理', duration: 45, price: 98.00, description: '传统艾灸调理' },
        { name: '推拿正骨', category: '专业治疗', duration: 120, price: 288.00, description: '专业推拿正骨治疗' },
        { name: '脏腑调理', category: '深度调理', duration: 90, price: 198.00, description: '脏腑功能调理' },
        { name: '刮痧', category: '传统疗法', duration: 30, price: 68.00, description: '传统刮痧疗法' },
        { name: '拔罐', category: '传统疗法', duration: 30, price: 58.00, description: '传统拔罐疗法' },
        { name: '颈肩腰腿痛调理', category: '专科调理', duration: 90, price: 168.00, description: '颈肩腰腿痛专业调理' }
    ];

    for (const service of services) {
        await db.run(
            'INSERT INTO services (name, category, duration, price, description) VALUES (?, ?, ?, ?, ?)',
            [service.name, service.category, service.duration, service.price, service.description]
        );
    }

    // 插入门店数据
    const stores = [
        { name: '名医堂·颈肩腰腿特色调理（宜山路店）', address: '上海市徐汇区宜山路', phone: '021-64123456' },
        { name: '名医堂·颈肩腰腿特色调理（关山路店）', address: '上海市浦东新区关山路', phone: '021-58234567' },
        { name: '名医堂·颈肩腰腿特色调理（巨峰路店）', address: '上海市宝山区巨峰路', phone: '021-56345678' },
        { name: '名医堂·颈肩腰腿特色调理（隆昌路店）', address: '上海市杨浦区隆昌路', phone: '021-65456789' },
        { name: '名医堂·颈肩腰腿特色调理（长江西路店）', address: '上海市普陀区长江西路', phone: '021-62567890' },
        { name: '名医堂·颈肩腰腿特色调理（龙华路店）', address: '上海市徐汇区龙华路', phone: '021-64678901' },
        { name: '名医堂·颈肩腰腿特色调理（武宁南路店）', address: '上海市普陀区武宁南路', phone: '021-62789012' },
        { name: '名医堂·颈肩腰腿特色调理（豫园店）', address: '上海市黄浦区豫园', phone: '021-63890123' },
        { name: '名医堂·颈肩腰腿特色调理（斜土路店）', address: '上海市徐汇区斜土路', phone: '021-64901234' },
        { name: '名医堂妙康中医·推拿正骨·针灸·艾灸', address: '上海市静安区南京西路', phone: '021-62012345' },
        { name: '名医堂永康中医·推拿正骨·针灸·艾灸', address: '上海市徐汇区永康路', phone: '021-64123456' },
        { name: '名医堂·肩颈腰腿特色调理（港汇店）', address: '上海市徐汇区港汇广场', phone: '021-64234567' },
        { name: '名医堂·颈肩腰腿特色调理（兰溪路店）', address: '上海市普陀区兰溪路', phone: '021-62345678' },
        { name: '名医堂·颈肩腰腿特色调理（莘庄店）', address: '上海市闵行区莘庄', phone: '021-64456789' },
        { name: '名医堂·颈肩腰腿特色调理（五角场万达店）', address: '上海市杨浦区五角场万达广场', phone: '021-65567890' },
        { name: '名医堂·颈肩腰腿特色调理（国顺店）', address: '上海市杨浦区国顺路', phone: '021-65678901' },
        { name: '名医堂·颈肩腰腿特色调理（漕东里店）', address: '上海市徐汇区漕东里', phone: '021-64789012' },
        { name: '名医堂·颈肩腰腿特色调理（高岛屋店）', address: '上海市长宁区高岛屋', phone: '021-62890123' },
        { name: '名医堂·颈肩腰腿特色调理（春申路店）', address: '上海市闵行区春申路', phone: '021-64901234' },
        { name: '名医堂·颈肩腰腿特色调理（康桥店）', address: '上海市浦东新区康桥', phone: '021-58012345' },
        { name: '名医堂·颈肩腰腿特色调理（汇融天地店）', address: '上海市浦东新区汇融天地', phone: '021-58123456' },
        { name: '名医堂·颈肩腰腿特色调理（浦三路店）', address: '上海市浦东新区浦三路', phone: '021-58234567' },
        { name: '名医堂·颈肩腰腿特色调理（聚丰园路店）', address: '上海市宝山区聚丰园路', phone: '021-56345678' }
    ];

    for (const store of stores) {
        await db.run(
            'INSERT INTO stores (name, address, phone) VALUES (?, ?, ?)',
            [store.name, store.address, store.phone]
        );
    }

    // 插入技师数据
    const therapists = [
        // 宜山路店
        { store_id: 1, name: '彭老师', position: '调理师', experience_years: 13, specialties: '["按摩", "经络疏通", "艾灸"]' },
        { store_id: 1, name: '刘老师', position: '调理师', experience_years: 16, specialties: '["经络疏通", "艾灸", "颈肩腰腿痛"]' },
        { store_id: 1, name: '冯老师', position: '调理师', experience_years: 15, specialties: '["按摩", "经络疏通", "艾灸"]' },
        { store_id: 1, name: '邵老师', position: '调理师', experience_years: 13, specialties: '["颈肩腰腿调理", "按摩", "艾灸"]' },
        
        // 关山路店
        { store_id: 2, name: '赵老师', position: '调理师', experience_years: 23, specialties: '["脏腑调理", "刮痧", "经络疏通"]', honors: '高级调理师' },
        { store_id: 2, name: '周老师', position: '专家医师', experience_years: 47, specialties: '["经络疏通", "脾胃"]' },
        { store_id: 2, name: '周老师', position: '推拿师', experience_years: 19, specialties: '["刮痧", "拔罐", "按摩"]' },
        { store_id: 2, name: '陈老师', position: '艾灸师', experience_years: 19, specialties: '["脏腑调理", "经络疏通", "艾灸"]' },
        { store_id: 2, name: '赵老师', position: '康养师', experience_years: 16, specialties: '["拔罐", "按摩", "艾灸"]' },
        { store_id: 2, name: '朱老师', position: '艾灸师', experience_years: 13, specialties: '["脏腑调理", "经络疏通", "艾灸"]' },
        { store_id: 2, name: '冯老师', position: '推拿师', experience_years: 26, specialties: '["推拿正骨", "颈肩腰腿痛调理", "脏腑调理"]' },
        { store_id: 2, name: '史老师', position: '推拿师', experience_years: 23, specialties: '["推拿按摩", "刮痧", "拔罐"]' },
        { store_id: 2, name: '廖老师', position: '调理师', experience_years: 18, specialties: '["刮痧", "按摩", "经络疏通"]' },
        
        // 巨峰路店
        { store_id: 3, name: '张老师', position: '调理师', experience_years: 16, specialties: '["按摩", "经络疏通", "艾灸"]' },
        { store_id: 3, name: '付老师', position: '调理师', experience_years: 24, specialties: '["颈肩腰腿痛调理", "推拿正骨", "脏腑调理"]' },
        { store_id: 3, name: '康老师', position: '推拿师', experience_years: 11, specialties: '["颈肩腰腿痛调理", "脏腑调理", "艾灸"]' },
        { store_id: 3, name: '刘老师', position: '调理师', experience_years: 17, specialties: '["推拿正骨", "颈肩腰腿痛调理", "艾灸"]' },
        { store_id: 3, name: '赵老师', position: '健康管理师', experience_years: 7, specialties: '["刮痧", "经络疏通", "艾灸"]' },
        
        // 隆昌路店
        { store_id: 4, name: '邹老师', position: '调理师', experience_years: 15, specialties: '["颈肩腰腿疼特色", "经络疏通", "艾灸"]' },
        { store_id: 4, name: '吴老师', position: '调理师', experience_years: 23, specialties: '["按摩", "经络疏通", "颈肩腰腿疼特色"]' },
        { store_id: 4, name: '孙老师', position: '调理师', experience_years: 12, specialties: '["按摩", "经络疏通", "艾灸"]' },
        { store_id: 4, name: '陈老师', position: '调理师', experience_years: 15, specialties: '["颈肩腰腿疼特色", "整脊", "经络疏通"]', honors: '推拿师' },
        { store_id: 4, name: '鲍老师', position: '调理师', experience_years: 21, specialties: '["颈肩腰腿疼特色", "整脊", "推拿"]' },
        { store_id: 4, name: '裴老师', position: '调理师', experience_years: 19, specialties: '["按摩", "经络疏通", "艾灸"]', honors: '执业医师' },
        { store_id: 4, name: '费老师', position: '调理师', experience_years: 14, specialties: '["颈肩腰腿痛", "经络疏通", "艾灸"]' },
        { store_id: 4, name: '唐老师', position: '调理师', experience_years: 20, specialties: '["脾胃", "颈肩腰腿痛"]', honors: '执业医师' }
    ];

    for (const therapist of therapists) {
        await db.run(
            'INSERT INTO therapists (store_id, name, position, experience_years, specialties, service_types, honors) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [therapist.store_id, therapist.name, therapist.position, therapist.experience_years, therapist.specialties, therapist.specialties, therapist.honors || null]
        );
    }

    // 插入示例用户
    const users = [
        { name: '张三', username: 'zhangsan', email: 'zhangsan@example.com', phone: '13800138000', gender: 'male', age: 35 },
        { name: '李四', username: 'lisi', email: 'lisi@example.com', phone: '13900139000', gender: 'female', age: 28 },
        { name: '王五', username: 'wangwu', email: 'wangwu@example.com', phone: '13700137000', gender: 'male', age: 42 },
        { name: '赵六', username: 'zhaoliu', email: 'zhaoliu@example.com', phone: '13600136000', gender: 'female', age: 30 }
    ];

    for (const user of users) {
        await db.run(
            'INSERT INTO users (name, username, email, phone, gender, age) VALUES (?, ?, ?, ?, ?, ?)',
            [user.name, user.username, user.email, user.phone, user.gender, user.age]
        );
    }

    console.log('✅ 种子数据导入完成！');
    await db.close();
}

if (require.main === module) {
    seedData().catch(console.error);
}

module.exports = seedData;