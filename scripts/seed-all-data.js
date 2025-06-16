const { Database } = require('../src/database/db');

async function seedAllData() {
    const db = new Database();
    await db.connect();

    console.log('🌱 开始导入所有数据...');

    try {
        // 清空现有数据（按顺序，先删除有外键依赖的表）
        await db.run('DELETE FROM appointments');
        await db.run('DELETE FROM therapists');
        await db.run('DELETE FROM users');
        await db.run('DELETE FROM admins');
        await db.run('DELETE FROM services');
        await db.run('DELETE FROM stores');

        // 插入门店数据
        const stores = [
            { name: '名医堂·颈肩腰腿特色调理（宜山路店）', address: '上海市宜山路' },
            { name: '名医堂·颈肩腰腿特色调理（关山路店）', address: '上海市关山路' },
            { name: '名医堂·颈肩腰腿特色调理（巨峰路店）', address: '上海市巨峰路' },
            { name: '名医堂·颈肩腰腿特色调理（隆昌路店）', address: '上海市隆昌路' },
            { name: '名医堂·颈肩腰腿特色调理（长江西路店）', address: '上海市长江西路' },
            { name: '名医堂·颈肩腰腿特色调理（龙华路店）', address: '上海市龙华路' },
            { name: '名医堂·颈肩腰腿特色调理（武宁南路店）', address: '上海市武宁南路' },
            { name: '名医堂·颈肩腰腿特色调理（豫园店）', address: '上海市豫园' },
            { name: '名医堂·颈肩腰腿特色调理（斜土路店）', address: '上海市斜土路' },
            { name: '名医堂妙康中医·推拿正骨·针灸·艾灸', address: '上海市' },
            { name: '名医堂永康中医·推拿正骨·针灸·艾灸', address: '上海市' },
            { name: '名医堂·肩颈腰腿特色调理（港汇店）', address: '上海市港汇' },
            { name: '名医堂·颈肩腰腿特色调理（兰溪路店）', address: '上海市兰溪路' },
            { name: '名医堂·颈肩腰腿特色调理（莘庄店）', address: '上海市莘庄' },
            { name: '名医堂·颈肩腰腿特色调理（五角场万达店）', address: '上海市五角场万达' },
            { name: '名医堂·颈肩腰腿特色调理（国顺店）', address: '上海市国顺路' },
            { name: '名医堂·颈肩腰腿特色调理（漕东里店）', address: '上海市漕东里' },
            { name: '名医堂·颈肩腰腿特色调理（高岛屋店）', address: '上海市高岛屋' },
            { name: '名医堂·颈肩腰腿特色调理（春申路店）', address: '上海市春申路' },
            { name: '名医堂·颈肩腰腿特色调理（康桥店）', address: '上海市康桥' },
            { name: '名医堂·颈肩腰腿特色调理（汇融天地店）', address: '上海市汇融天地' },
            { name: '名医堂·颈肩腰腿特色调理（浦三路店）', address: '上海市浦三路' },
            { name: '名医堂·颈肩腰腿特色调理（聚丰园路店）', address: '上海市聚丰园路' }
        ];

        for (const store of stores) {
            await db.run(
                'INSERT INTO stores (name, address) VALUES (?, ?)',
                [store.name, store.address]
            );
        }
        console.log(`✓ 成功导入 ${stores.length} 家门店`);

        // 获取门店ID映射
        const storeRows = await db.all('SELECT id, name FROM stores');
        const storeMap = {};
        storeRows.forEach(store => {
            storeMap[store.name] = store.id;
        });

        // 技师数据（简化版本，只展示部分）
        const therapistsData = [
            // 宜山路店
            { storeName: '名医堂·颈肩腰腿特色调理（宜山路店）', position: '调理师', name: '彭老师', experience: 13, specialties: ['按摩', '经络疏通', '艾灸'], honors: '' },
            { storeName: '名医堂·颈肩腰腿特色调理（宜山路店）', position: '调理师', name: '刘老师', experience: 16, specialties: ['经络疏通', '艾灸', '颈肩腰腿痛'], honors: '' },
            { storeName: '名医堂·颈肩腰腿特色调理（宜山路店）', position: '调理师', name: '冯老师', experience: 15, specialties: ['按摩', '经络疏通', '艾灸'], honors: '' },
            { storeName: '名医堂·颈肩腰腿特色调理（宜山路店）', position: '调理师', name: '邵老师', experience: 13, specialties: ['颈肩腰腿调理', '按摩', '艾灸'], honors: '' },
            
            // 关山路店
            { storeName: '名医堂·颈肩腰腿特色调理（关山路店）', position: '调理师', name: '赵老师', experience: 23, specialties: ['脏腑调理', '刮痧', '经络疏通'], honors: '高级调理师' },
            { storeName: '名医堂·颈肩腰腿特色调理（关山路店）', position: '专家医师', name: '周老师', experience: 47, specialties: ['经络疏通', '脾胃'], honors: '' },
            
            // 更多技师数据...（这里只是示例，实际应该包含所有技师）
        ];

        let therapistCount = 0;
        for (const therapist of therapistsData) {
            const storeId = storeMap[therapist.storeName];
            if (storeId) {
                await db.run(
                    'INSERT INTO therapists (store_id, name, position, experience_years, specialties, honors) VALUES (?, ?, ?, ?, ?, ?)',
                    [storeId, therapist.name, therapist.position, therapist.experience, JSON.stringify(therapist.specialties), therapist.honors || null]
                );
                therapistCount++;
            }
        }
        console.log(`✓ 成功导入 ${therapistCount} 位技师`);

        // 插入示例用户
        const users = [
            { name: '张三', phone: '13800138000' },
            { name: '李四', phone: '13900139000' },
            { name: '王五', phone: '13700137000' }
        ];

        for (const user of users) {
            await db.run(
                'INSERT INTO users (name, phone) VALUES (?, ?)',
                [user.name, user.phone]
            );
        }
        console.log(`✓ 成功导入 ${users.length} 位用户`);

        console.log('\n✅ 所有数据导入完成！');

    } catch (error) {
        console.error('导入数据时出错:', error);
    } finally {
        await db.close();
    }
}

// 运行脚本
seedAllData().catch(console.error);