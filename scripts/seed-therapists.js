const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'mingyi.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath);

// 技师数据（根据用户提供的数据）
const therapistsData = {
    '名医堂·颈肩腰腿特色调理（宜山路店）': [
        { position: '调理师', name: '彭老师', experience: 13, specialties: '按摩、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '刘老师', experience: 16, specialties: '经络疏通、艾灸、颈肩腰腿痛', honors: '' },
        { position: '调理师', name: '冯老师', experience: 15, specialties: '按摩、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '邵老师', experience: 13, specialties: '颈肩腰腿调理、按摩、艾灸', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（关山路店）': [
        { position: '调理师', name: '赵老师', experience: 23, specialties: '脏腑调理、刮痧、经络疏通', honors: '高级调理师' },
        { position: '专家医师', name: '周老师', experience: 47, specialties: '经络疏通、脾胃', honors: '' },
        { position: '推拿师', name: '周老师', experience: 19, specialties: '刮痧、拔罐、按摩', honors: '' },
        { position: '艾灸师', name: '陈老师', experience: 19, specialties: '脏腑调理、经络疏通、艾灸', honors: '' },
        { position: '康养师', name: '赵老师', experience: 16, specialties: '拔罐、按摩、艾灸', honors: '' },
        { position: '艾灸师', name: '朱老师', experience: 13, specialties: '脏腑调理、经络疏通、艾灸', honors: '' },
        { position: '推拿师', name: '冯老师', experience: 26, specialties: '推拿正骨、颈肩腰腿痛调理、脏腑调理', honors: '' },
        { position: '推拿师', name: '史老师', experience: 23, specialties: '推拿按摩、刮痧、拔罐', honors: '' },
        { position: '调理师', name: '廖老师', experience: 18, specialties: '刮痧、按摩、经络疏通', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（巨峰路店）': [
        { position: '调理师', name: '张老师', experience: 16, specialties: '按摩、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '付老师', experience: 24, specialties: '颈肩腰腿痛调理、推拿正骨、脏腑调理', honors: '' },
        { position: '推拿师', name: '康老师', experience: 11, specialties: '颈肩腰腿痛调理、脏腑调理、艾灸', honors: '' },
        { position: '调理师', name: '刘老师', experience: 17, specialties: '推拿正骨、颈肩腰腿痛调理、艾灸', honors: '' },
        { position: '健康管理师', name: '赵老师', experience: 7, specialties: '刮痧、经络疏通、艾灸', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（隆昌路店）': [
        { position: '调理师', name: '邹老师', experience: 15, specialties: '颈肩腰腿疼特色、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '吴老师', experience: 23, specialties: '按摩、经络疏通、颈肩腰腿疼特色', honors: '' },
        { position: '调理师', name: '孙老师', experience: 12, specialties: '按摩、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '陈老师', experience: 15, specialties: '颈肩腰腿疼特色、整脊、经络疏通', honors: '推拿师' },
        { position: '调理师', name: '鲍老师', experience: 21, specialties: '颈肩腰腿疼特色、整脊、推拿', honors: '' },
        { position: '调理师', name: '裴老师', experience: 19, specialties: '按摩、经络疏通、艾灸', honors: '执业医师' },
        { position: '调理师', name: '费老师', experience: 14, specialties: '颈肩腰腿痛、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '唐老师', experience: 20, specialties: '脾胃、颈肩腰腿痛', honors: '执业医师' }
    ],
    '名医堂·颈肩腰腿特色调理（长江西路店）': [
        { position: '调理师', name: '韩老师', experience: 16, specialties: '推拿正骨、脏腑调理、颈肩腰腿痛', honors: '' },
        { position: '调理师', name: '武老师', experience: 24, specialties: '颈肩腰腿痛、脏腑调理、型体塑造', honors: '' },
        { position: '调理师', name: '刘老师', experience: 22, specialties: '推拿按摩、经络疏通、颈肩腰腿痛', honors: '' },
        { position: '调理师', name: '康老师', experience: 22, specialties: '艾灸、按摩、刮痧', honors: '特级' },
        { position: '调理师', name: '徐师傅', experience: 16, specialties: '拔罐、按摩、经络疏通', honors: '特级' }
    ],
    '名医堂·颈肩腰腿特色调理（龙华路店）': [
        { position: '调理师', name: '潘老师', experience: 18, specialties: '颈肩腰腿痛、按摩、经络疏通', honors: '' },
        { position: '调理师', name: '杨老师', experience: 15, specialties: '颈肩腰腿痛、按摩、艾灸', honors: '' },
        { position: '调理师', name: '张老师', experience: 15, specialties: '按摩、经络疏通', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（武宁南路店）': [
        { position: '艾灸师', name: '杜老师', experience: 16, specialties: '刮痧、经络疏通、艾灸', honors: '' },
        { position: '艾灸师', name: '赵老师', experience: 21, specialties: '脏腑调理、经络疏通、艾灸', honors: '' },
        { position: '推拿师', name: '冯老师', experience: 20, specialties: '推拿正骨、颈肩腰腿痛、经络疏通', honors: '' },
        { position: '艾灸师', name: '朱老师', experience: 15, specialties: '脏腑调理、经络疏通、艾灸', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（豫园店）': [
        { position: '健康师', name: '李老师', experience: 4, specialties: '推拿按摩、纤体塑形、艾灸', honors: '' },
        { position: '调理师', name: '靳老师', experience: 7, specialties: '颈肩腰腿痛调理、刮痧、艾灸', honors: '' },
        { position: '艾灸师', name: '张老师', experience: 8, specialties: '推拿按摩、经络疏通、艾灸', honors: '' },
        { position: '专家健康师', name: '李店长', experience: 21, specialties: '纤体塑型、皮肤调理、健康管理', honors: '店长' },
        { position: '推拿师', name: '肖老师', experience: 12, specialties: '推拿正骨、颈肩腰腿痛调理、经络疏通', honors: '' },
        { position: '调理师', name: '王老师', experience: 7, specialties: '推拿按摩、纤体塑型、经络疏通', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（斜土路店）': [
        { position: '调理师', name: '杨老师', experience: 12, specialties: '推拿、拔罐、经络疏通', honors: '' },
        { position: '调理师', name: '马老师', experience: 20, specialties: '龙氏正骨、颈椎错位、脊柱侧弯骨盆修复', honors: '' },
        { position: '调理师', name: '孙老师', experience: 14, specialties: '按摩、经络疏通', honors: '执业医师' },
        { position: '调理师', name: '朱老师', experience: 15, specialties: '按摩、经络疏通、艾灸', honors: '' }
    ],
    '名医堂妙康中医·推拿正骨·针灸·艾灸': [
        { position: '医师', name: '何正芳', experience: 7, specialties: '中医内科，中医妇科，中医皮肤科，中医不孕不育，中医耳鼻喉', honors: '' },
        { position: '医师', name: '刁松山', experience: 27, specialties: '中医内科，中医男科，中医不孕不育，中医康复科，中医肠胃科', honors: '' },
        { position: '医师', name: '胡科娜', experience: 8, specialties: '中医内科，中医妇科，中医康复科，针灸，推拿/按摩，中药，经穴', honors: '' },
        { position: '医师', name: '阮明诸', experience: 14, specialties: '中医内科，中医妇科，中医康复科，中医肠胃科，中医儿科，针', honors: '' },
        { position: '医师', name: '高宏成', experience: 27, specialties: '中医内科，中医男科，中医妇科，中医康复科，中医肠胃科，中', honors: '' },
        { position: '执业医师', name: '孙茂惠', experience: 28, specialties: '中医内科，中医外科，中医肠胃科，中医妇科，针灸，中药，推拿', honors: '' },
        { position: '执业医师', name: '李正义', experience: 28, specialties: '中医内科，中医外科，推拿/按摩，敷贴，熏蒸，把脉', honors: '' },
        { position: '执业医师', name: '华平东', experience: 41, specialties: '中医内科，中医眼科，针灸，熏蒸，把脉，中药，敷贴，颈肩腰腿', honors: '' }
    ],
    '名医堂永康中医·推拿正骨·针灸·艾灸': [
        { position: '医师', name: '胡科娜', experience: 8, specialties: '中医内科，针灸，经穴，把脉，中药，擅长各类急、慢性病', honors: '' },
        { position: '医士', name: '周龙标', experience: 66, specialties: '中医内科，中医不孕不育，中医妇科，中医康复科，中医肿瘤科', honors: '' },
        { position: '副主任医师', name: '顾荣程', experience: 28, specialties: '中医内科，中医肠胃科，中医皮肤科，中医肿瘤科，把脉，中药', honors: '' },
        { position: '医师', name: '李兴火', experience: 9, specialties: '中医内科，艾灸，中医内科，针农', honors: '' },
        { position: '医师', name: '周韵', experience: 57, specialties: '中医内科，中医肠胃科，中医妇科，中医儿科，中医康复科，中医', honors: '' },
        { position: '医师', name: '刁松山', experience: 46, specialties: '中医内科，中医妇科，中医男科，中医不孕不育，中医康复科', honors: '' },
        { position: '医师', name: '阮明诸', experience: 14, specialties: '中医妇科，中医儿科，中医肠胃科，中医内科，针灸，推拿/按摩', honors: '' },
        { position: '医士', name: '汪虹', experience: 2, specialties: '中医妇科，中医肠胃科，针灸艾灸，埋线减肥，刺络，面部针灸等', honors: '' }
    ],
    '名医堂·肩颈腰腿特色调理（港汇店）': [
        { position: '调理师', name: '杨老师', experience: 23, specialties: '脏腑调理、刮痧、艾灸', honors: '' },
        { position: '调理师', name: '张老师', experience: 8, specialties: '按摩、经络疏通、艾灸', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（兰溪路店）': [
        { position: '艾灸师', name: '朱老师', experience: 17, specialties: '刮痧、经络疏通、艾灸', honors: '' },
        { position: '专家医师', name: '周老师', experience: 56, specialties: '膏方、中医内科、中医妇科', honors: '执业医师' },
        { position: '调理师', name: '陈老师', experience: 18, specialties: '脏腑调理、刮痧、经络疏通', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（莘庄店）': [
        { position: '调理师', name: '陈老师', experience: 18, specialties: '妇科调理、经络疏通、艾灸', honors: '康复理疗师' },
        { position: '调理师', name: '孟老师', experience: 23, specialties: '按摩、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '于老师', experience: 12, specialties: '经络疏通、艾灸、SPA', honors: '' },
        { position: '调理师', name: '赵老师', experience: 24, specialties: '颈肩腰腿疼调理、脏腑调理、推拿正骨', honors: '' },
        { position: '调理师', name: '李想', experience: 22, specialties: '按摩、艾灸、经络疏通', honors: '' },
        { position: '健康师', name: '刘老师', experience: 20, specialties: '刮痧、按摩、艾灸', honors: '' },
        { position: '艾灸师', name: '朱老师', experience: 18, specialties: '刮痧、经络疏通、艾灸', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（五角场万达店）': [
        { position: '调理师', name: '师傅', experience: 18, specialties: '拔罐、按摩、经络疏通', honors: '' },
        { position: '调理师', name: '师傅', experience: 17, specialties: '拔罐、按摩、艾灸', honors: '' },
        { position: '调理师', name: '单老师', experience: 16, specialties: '按摩、艾灸', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（国顺店）': [
        { position: '专家医师', name: '周老师', experience: 56, specialties: '中医内科、脏腑调理、肠胃调理', honors: '' },
        { position: '调理师', name: '翟老师', experience: 21, specialties: '脏腑调理、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '崔老师', experience: 19, specialties: '刮痧、经络疏通、艾灸', honors: '' },
        { position: '推拿师', name: '武老师', experience: 33, specialties: '推拿正骨、经络疏通、脏腑调理', honors: '颈肩腰腿痛专家' },
        { position: '调理师', name: '杨老师', experience: 13, specialties: '按摩、经络疏通、艾灸', honors: '' },
        { position: '艾灸师', name: '陈老师', experience: 12, specialties: '刮痧、按摩、艾灸', honors: '颈肩腰腿痛专家' }
    ],
    '名医堂·颈肩腰腿特色调理（漕东里店）': [
        { position: '调理师', name: '马老师', experience: 16, specialties: '脏腑调理、经络疏通、艾灸', honors: '' },
        { position: '高级调理师', name: '张老师', experience: 20, specialties: '颈肩腰腿特色、拔罐、经络疏通', honors: '' },
        { position: '调理师', name: '王老师', experience: 16, specialties: '脏腑调理、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '赵老师', experience: 14, specialties: '脏腑调理、刮痧、经络疏通', honors: '' },
        { position: '艾灸师', name: '陈老师', experience: 13, specialties: '推拿按摩、拔罐、经络疏通', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（高岛屋店）': [
        { position: '调理师', name: '宋老师', experience: 22, specialties: '艾灸、正骨推拿、颈肩腰腿痛', honors: '' },
        { position: '推拿师', name: '陈老师', experience: 33, specialties: '拔罐、经络疏通', honors: '' },
        { position: '调理师', name: '赵老师', experience: 19, specialties: '推拿按摩、腑脏调理、妇科调理', honors: '健康理疗师' },
        { position: '艾灸师', name: '杜老师', experience: 23, specialties: '脏腑调理、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '陈老师', experience: 16, specialties: '拔罐、按摩、经络疏通', honors: '' },
        { position: '艾灸师', name: '朱老师', experience: 17, specialties: '刮痧、经络疏通、艾灸', honors: '' },
        { position: '专家医师', name: '周老师', experience: 56, specialties: '脏腑调理、中医内科、不孕不育', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（春申路店）': [
        { position: '调理师', name: '聂老师', experience: 13, specialties: '推拿正骨、刮痧、拔罐', honors: '' },
        { position: '推拿师', name: '李老师', experience: 17, specialties: '脏腑调理、经络疏通、艾灸', honors: '健康理疗师' },
        { position: '健康师', name: '谭老师', experience: 11, specialties: '健康管理、推拿按摩、刮痧', honors: '' },
        { position: '调理师', name: '陈老师', experience: 16, specialties: '脏腑调理、经络疏通、艾灸', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（康桥店）': [
        { position: '调理师', name: '孙老师', experience: 18, specialties: '按摩、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '晟垚老师', experience: 13, specialties: '颈肩腰腿疼特色、按摩、艾灸', honors: '' },
        { position: '调理师', name: '何老师', experience: 29, specialties: '颈肩腰腿、亚健康调理、按摩', honors: '' },
        { position: '调理师', name: '饶老师', experience: 15, specialties: '按摩、经络疏通、艾灸', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（汇融天地店）': [
        { position: '按摩师', name: '张老师', experience: 27, specialties: '按摩、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '贺老师', experience: 17, specialties: '整脊、颈肩腰腿痛、经络疏通', honors: '' },
        { position: '调理师', name: '王老师', experience: 8, specialties: '按摩、经络疏通', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（浦三路店）': [
        { position: '高级调理师', name: '宁老师', experience: 24, specialties: 'SPA、按摩、经络疏通', honors: '技术总监' },
        { position: '调理师', name: '彭老师', experience: 13, specialties: '', honors: '执业医师' },
        { position: '调理师', name: '于老师', experience: 11, specialties: 'SPA、刮痧、经络疏通', honors: '高级调理师' },
        { position: '调理师', name: '魏老师', experience: 13, specialties: '拔罐、按摩、经络疏通', honors: '' }
    ],
    '名医堂·颈肩腰腿特色调理（聚丰园路店）': [
        { position: '调理师', name: '侯老师', experience: 13, specialties: '按摩、经络疏通、艾灸', honors: '' },
        { position: '调理师', name: '关老师', experience: 14, specialties: '颈肩腰腿、按摩、经络疏通', honors: '' },
        { position: '调理师', name: '张老师', experience: 8, specialties: '拔罐、按摩、经络疏通', honors: '' }
    ]
};

// 插入数据
db.serialize(() => {
    console.log('开始导入技师数据...');

    // 首先获取所有门店ID映射
    db.all('SELECT id, name FROM stores', (err, storeRows) => {
        if (err) {
            console.error('获取门店列表失败:', err);
            return;
        }

        if (storeRows.length === 0) {
            console.error('请先运行 init-database.js 和 seed-data.js 初始化门店数据');
            db.close();
            return;
        }

        const storeMap = {};
        storeRows.forEach(store => {
            storeMap[store.name] = store.id;
        });

        // 清空现有技师数据
        db.run('DELETE FROM therapists', (err) => {
            if (err) {
                console.error('清空技师数据失败:', err);
            }
        });

        // 插入技师数据
        const insertTherapist = db.prepare(
            `INSERT INTO therapists (store_id, name, position, experience_years, specialties, honors) 
             VALUES (?, ?, ?, ?, ?, ?)`
        );

        let totalTherapists = 0;
        let insertedCount = 0;

        Object.entries(therapistsData).forEach(([storeName, therapists]) => {
            const storeId = storeMap[storeName];
            if (!storeId) {
                console.error(`找不到门店: ${storeName}`);
                return;
            }

            therapists.forEach(therapist => {
                // 将专长转换为JSON数组格式
                const specialtiesArray = therapist.specialties
                    .split(/[，、,]/)
                    .map(s => s.trim())
                    .filter(s => s);
                const specialtiesJson = JSON.stringify(specialtiesArray);

                insertTherapist.run(
                    storeId,
                    therapist.name,
                    therapist.position,
                    therapist.experience,
                    specialtiesJson,
                    therapist.honors || null,
                    (err) => {
                        if (err) {
                            console.error(`插入技师失败: ${therapist.name}`, err);
                        } else {
                            insertedCount++;
                        }
                    }
                );
                totalTherapists++;
            });
        });

        insertTherapist.finalize(() => {
            console.log(`✓ 成功导入 ${insertedCount}/${totalTherapists} 位技师`);
            
            // 显示统计信息
            db.all(
                `SELECT s.name as store_name, COUNT(t.id) as therapist_count
                 FROM stores s
                 LEFT JOIN therapists t ON s.id = t.store_id
                 GROUP BY s.id
                 ORDER BY therapist_count DESC`,
                (err, rows) => {
                    if (!err) {
                        console.log('\n各门店技师统计：');
                        rows.forEach(row => {
                            console.log(`- ${row.store_name}: ${row.therapist_count} 位技师`);
                        });
                    }
                    
                    console.log('\n✓ 技师数据导入完成！');
                    db.close();
                }
            );
        });
    });
});