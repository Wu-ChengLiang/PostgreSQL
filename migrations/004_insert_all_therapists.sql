-- 更新门店营业时间
UPDATE stores SET business_hours = '09:00-21:00' WHERE name = '名医堂·颈肩腰腿特色调理（国顺店）';
UPDATE stores SET business_hours = '09:00-21:00' WHERE name = '名医堂·颈肩腰腿特色调理（春申路店）';
UPDATE stores SET business_hours = '09:00-21:00' WHERE name = '名医堂·颈肩腰腿特色调理（兰溪路店）';
UPDATE stores SET business_hours = '09:00-21:00' WHERE name = '名医堂·颈肩腰腿特色调理（浦东大道店）';
UPDATE stores SET business_hours = '09:30-21:00' WHERE name = '名医堂·颈肩腰腿特色调理（龙华路店）';
UPDATE stores SET business_hours = '10:00-21:00' WHERE name = '名医堂·颈肩腰腿特色调理（世纪公园店）';

-- 删除现有技师数据（保留表结构）
DELETE FROM therapist_specialties;
DELETE FROM appointments;
DELETE FROM weekly_schedules;
DELETE FROM therapists;

-- 莘庄店技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count, is_recommended) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）'), '陈老师', '调理师', 18, 55, TRUE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）'), '孟老师', '调理师', 23, 109, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）'), '于老师', '调理师', 12, 78, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）'), '赵老师', '调理师', 24, 30, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）'), '李想', '调理师', 22, 34, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）'), '刘老师', '健康师', 20, 5, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）'), '朱老师', '艾灸师', 18, 3, FALSE);

-- 妙康中医技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count) VALUES
((SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸'), '何正芳', '医师', 7, 0),
((SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸'), '刁松山', '医师', 27, 0),
((SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸'), '胡科娜', '医师', 8, 0),
((SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸'), '阮明诸', '医师', 14, 0),
((SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸'), '高宏成', '医师', 27, 0),
((SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸'), '孙茂惠', '执业医师', 28, 0),
((SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸'), '李正义', '执业医师', 28, 0),
((SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸'), '华平东', '执业医师', 41, 0);

-- 永康中医技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count) VALUES
((SELECT id FROM stores WHERE name = '名医堂永康中医·推拿正骨·针灸·艾灸'), '胡科娜', '医师', 8, 0),
((SELECT id FROM stores WHERE name = '名医堂永康中医·推拿正骨·针灸·艾灸'), '周龙标', '医士', 66, 0),
((SELECT id FROM stores WHERE name = '名医堂永康中医·推拿正骨·针灸·艾灸'), '顾荣程', '副主任医师', 28, 0),
((SELECT id FROM stores WHERE name = '名医堂永康中医·推拿正骨·针灸·艾灸'), '李兴火', '医师', 9, 0),
((SELECT id FROM stores WHERE name = '名医堂永康中医·推拿正骨·针灸·艾灸'), '周韵', '医师', 57, 0),
((SELECT id FROM stores WHERE name = '名医堂永康中医·推拿正骨·针灸·艾灸'), '刁松山', '医师', 46, 0),
((SELECT id FROM stores WHERE name = '名医堂永康中医·推拿正骨·针灸·艾灸'), '阮明诸', '医师', 14, 0),
((SELECT id FROM stores WHERE name = '名医堂永康中医·推拿正骨·针灸·艾灸'), '汪虹', '医士', 2, 0);

-- 隆昌路店技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）'), '邹老师', '调理师', 15, 102),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）'), '吴老师', '调理师', 23, 90),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）'), '孙老师', '调理师', 12, 57),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）'), '陈老师', '推拿师', 15, 44),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）'), '鲍老师', '调理师', 21, 36),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）'), '裴老师', '执业医师', 19, 14),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）'), '费老师', '调理师', 14, 9),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）'), '唐老师', '执业医师', 20, 9);

-- 爱琴海店技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count, service_count, is_recommended) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）'), '杜老师', '调理师', 16, 26, 0, TRUE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）'), '邱老师', '调理师', 18, 79, 1, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）'), '肖老师', '调理师', 13, 83, 0, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）'), '刘老师', '调理师', 21, 20, 0, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）'), '周老师', '调理师', 22, 1, 0, FALSE);

-- 关山路店技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count, is_recommended) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）'), '赵老师', '高级调理师', 23, 0, TRUE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）'), '周老师', '专家医师', 47, 21, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）'), '周老师2', '推拿师', 19, 7, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）'), '陈老师', '艾灸师', 19, 3, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）'), '赵老师2', '康养师', 16, 0, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）'), '朱老师', '艾灸师', 13, 1, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）'), '冯老师', '推拿师', 26, 1, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）'), '史老师', '推拿师', 23, 0, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）'), '廖老师', '调理师', 18, 0, FALSE);

-- 五角场万达店技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）'), '师傅1', '师傅', 18, 93),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）'), '师傅2', '师傅', 17, 9),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）'), '单老师', '调理师', 16, 6);

-- 国顺店技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count, is_recommended) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（国顺店）'), '周老师', '专家医师', 56, 0, TRUE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（国顺店）'), '翟老师', '调理师', 21, 31, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（国顺店）'), '崔老师', '调理师', 19, 26, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（国顺店）'), '武老师', '推拿师', 33, 21, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（国顺店）'), '杨老师', '老师', 13, 5, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（国顺店）'), '陈老师', '艾灸师', 12, 1, FALSE);

-- 春申路店技师（与国顺店相同）
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count, is_recommended) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（春申路店）'), '周老师', '专家医师', 56, 0, TRUE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（春申路店）'), '翟老师', '调理师', 21, 31, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（春申路店）'), '崔老师', '调理师', 19, 26, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（春申路店）'), '武老师', '推拿师', 33, 21, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（春申路店）'), '杨老师', '老师', 13, 5, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（春申路店）'), '陈老师', '艾灸师', 12, 1, FALSE);

-- 兰溪路店技师（与国顺店相同）
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count, is_recommended) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（兰溪路店）'), '周老师', '专家医师', 56, 0, TRUE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（兰溪路店）'), '翟老师', '调理师', 21, 31, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（兰溪路店）'), '崔老师', '调理师', 19, 26, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（兰溪路店）'), '武老师', '推拿师', 33, 21, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（兰溪路店）'), '杨老师', '老师', 13, 5, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（兰溪路店）'), '陈老师', '艾灸师', 12, 1, FALSE);

-- 浦东大道店技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count, service_count) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（浦东大道店）'), '聂老师', '调理师', 13, 36, 0),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（浦东大道店）'), '李老师', '推拿师', 17, 5, 0),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（浦东大道店）'), '谭老师', '健康师', 11, 1, 472),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（浦东大道店）'), '陈老师', '调理师', 16, 0, 0);

-- 龙华路店技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（龙华路店）'), '潘老师', '调理师', 18, 25),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（龙华路店）'), '杨老师', '调理师', 15, 15),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（龙华路店）'), '张老师', '调理师', 15, 4);

-- 世纪公园店技师
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（世纪公园店）'), '宋老师', '调理师', 23, 34),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（世纪公园店）'), '马老师', '调理师', 14, 8),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（世纪公园店）'), '贺老师', '调理师', 15, 5),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（世纪公园店）'), '钟老师', '调理师', 22, 6);

-- 插入技师专长数据
-- 莘庄店
INSERT INTO therapist_specialties (therapist_id, specialty) VALUES
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '妇科调理'),
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '孟老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '孟老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '孟老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '于老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '于老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '于老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), 'SPA'),
((SELECT id FROM therapists WHERE name = '赵老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '颈肩腰腿疼调理'),
((SELECT id FROM therapists WHERE name = '赵老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '脏腑调理'),
((SELECT id FROM therapists WHERE name = '赵老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '推拿正骨'),
((SELECT id FROM therapists WHERE name = '李想' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '李想' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '李想' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '刘老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '刮痧'),
((SELECT id FROM therapists WHERE name = '刘老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '刘老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '朱老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '刮痧'),
((SELECT id FROM therapists WHERE name = '朱老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '朱老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（莘庄店）')), '艾灸');

-- 妙康中医专长
INSERT INTO therapist_specialties (therapist_id, specialty) VALUES
((SELECT id FROM therapists WHERE name = '何正芳' AND store_id = (SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸')), '中医内科'),
((SELECT id FROM therapists WHERE name = '何正芳' AND store_id = (SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸')), '中医妇科'),
((SELECT id FROM therapists WHERE name = '何正芳' AND store_id = (SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸')), '中医皮肤科'),
((SELECT id FROM therapists WHERE name = '何正芳' AND store_id = (SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸')), '中医不孕不育'),
((SELECT id FROM therapists WHERE name = '何正芳' AND store_id = (SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸')), '中医耳鼻喉'),
((SELECT id FROM therapists WHERE name = '刁松山' AND store_id = (SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸')), '中医内科'),
((SELECT id FROM therapists WHERE name = '刁松山' AND store_id = (SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸')), '中医男科'),
((SELECT id FROM therapists WHERE name = '刁松山' AND store_id = (SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸')), '中医不孕不育'),
((SELECT id FROM therapists WHERE name = '刁松山' AND store_id = (SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸')), '中医康复科'),
((SELECT id FROM therapists WHERE name = '刁松山' AND store_id = (SELECT id FROM stores WHERE name = '名医堂妙康中医·推拿正骨·针灸·艾灸')), '中医肠胃科');

-- 隆昌路店专长
INSERT INTO therapist_specialties (therapist_id, specialty) VALUES
((SELECT id FROM therapists WHERE name = '邹老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '颈肩腰腿疼特色'),
((SELECT id FROM therapists WHERE name = '邹老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '邹老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '吴老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '吴老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '吴老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '颈肩腰腿疼特色'),
((SELECT id FROM therapists WHERE name = '孙老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '孙老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '孙老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '颈肩腰腿疼特色'),
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '整脊'),
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '鲍老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '颈肩腰腿疼特色'),
((SELECT id FROM therapists WHERE name = '鲍老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '整脊'),
((SELECT id FROM therapists WHERE name = '鲍老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '推拿'),
((SELECT id FROM therapists WHERE name = '裴老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '裴老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '裴老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '费老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '颈肩腰腿痛'),
((SELECT id FROM therapists WHERE name = '费老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '费老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '唐老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '脾胃'),
((SELECT id FROM therapists WHERE name = '唐老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（隆昌路店）')), '颈肩腰腿痛');

-- 爱琴海店专长
INSERT INTO therapist_specialties (therapist_id, specialty) VALUES
((SELECT id FROM therapists WHERE name = '杜老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '脾胃调理'),
((SELECT id FROM therapists WHERE name = '杜老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '颈肩腰腿痛调理'),
((SELECT id FROM therapists WHERE name = '杜老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '推拿正骨'),
((SELECT id FROM therapists WHERE name = '邱老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '正骨'),
((SELECT id FROM therapists WHERE name = '邱老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '颈肩腰腿疼特色'),
((SELECT id FROM therapists WHERE name = '邱老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '脏腑调理'),
((SELECT id FROM therapists WHERE name = '肖老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '精简腰腿疼调理'),
((SELECT id FROM therapists WHERE name = '肖老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '乳腺妇科'),
((SELECT id FROM therapists WHERE name = '肖老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '刘老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '刘老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '刘老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '周老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '刮痧'),
((SELECT id FROM therapists WHERE name = '周老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '周老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（爱琴海店）')), '艾灸');

-- 其他店铺专长（继续添加...）
-- 关山路店专长
INSERT INTO therapist_specialties (therapist_id, specialty) VALUES
((SELECT id FROM therapists WHERE name = '赵老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）')), '脏腑调理'),
((SELECT id FROM therapists WHERE name = '赵老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）')), '刮痧'),
((SELECT id FROM therapists WHERE name = '赵老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '周老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '周老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（关山路店）')), '脾胃');

-- 五角场万达店专长
INSERT INTO therapist_specialties (therapist_id, specialty) VALUES
((SELECT id FROM therapists WHERE name = '师傅1' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）')), '拔罐'),
((SELECT id FROM therapists WHERE name = '师傅1' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '师傅1' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '师傅2' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）')), '拔罐'),
((SELECT id FROM therapists WHERE name = '师傅2' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '师傅2' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '单老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '单老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（五角场万达店）')), '艾灸');

-- 为所有技师插入默认排班（周一到周日，根据门店营业时间）
INSERT INTO weekly_schedules (therapist_id, day_of_week, start_time, end_time)
SELECT t.id, day_num, 
    CASE 
        WHEN s.business_hours = '09:30-21:00' THEN '09:30'::TIME
        WHEN s.business_hours = '10:00-21:00' THEN '10:00'::TIME
        ELSE '09:00'::TIME
    END,
    '21:00'::TIME
FROM therapists t
JOIN stores s ON t.store_id = s.id
CROSS JOIN generate_series(0, 6) AS day_num
WHERE NOT EXISTS (
    SELECT 1 FROM weekly_schedules ws 
    WHERE ws.therapist_id = t.id AND ws.day_of_week = day_num
);

-- 添加用户名字段到预约表（支持基于用户名的预约系统）
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);