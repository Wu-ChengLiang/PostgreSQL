const { getInstance } = require('../src/database/db');

// 技师数据
const therapistsData = [
    {
        storeName: '名医堂·颈肩腰腿特色调理（宜山路店）',
        therapists: [
            { position: '调理师', name: '彭老师', experience: 13, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '刘老师', experience: 16, specialties: '经络疏通、艾灸、颈肩腰腿痛', phone: '', honors: '' },
            { position: '调理师', name: '冯老师', experience: 15, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '邵老师', experience: 13, specialties: '颈肩腰腿调理、按摩、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（关山路店）',
        therapists: [
            { position: '调理师', name: '赵老师', experience: 23, specialties: '脏腑调理、刮痧、经络疏通', phone: '', honors: '高级调理师' },
            { position: '专家医师', name: '周老师', experience: 47, specialties: '经络疏通、脾胃', phone: '', honors: '' },
            { position: '推拿师', name: '周老师', experience: 19, specialties: '刮痧、拔罐、按摩', phone: '', honors: '' },
            { position: '艾灸师', name: '陈老师', experience: 19, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '' },
            { position: '康养师', name: '赵老师', experience: 16, specialties: '拔罐、按摩、艾灸', phone: '', honors: '' },
            { position: '艾灸师', name: '朱老师', experience: 13, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '' },
            { position: '推拿师', name: '冯老师', experience: 26, specialties: '推拿正骨、颈肩腰腿痛调理、脏腑调理', phone: '', honors: '' },
            { position: '推拿师', name: '史老师', experience: 23, specialties: '推拿按摩、刮痧、拔罐', phone: '', honors: '' },
            { position: '调理师', name: '廖老师', experience: 18, specialties: '刮痧、按摩、经络疏通', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（巨峰路店）',
        therapists: [
            { position: '调理师', name: '张老师', experience: 16, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '付老师', experience: 24, specialties: '颈肩腰腿痛调理、推拿正骨、脏腑调理', phone: '', honors: '' },
            { position: '推拿师', name: '康老师', experience: 11, specialties: '颈肩腰腿痛调理、脏腑调理、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '刘老师', experience: 17, specialties: '推拿正骨、颈肩腰腿痛调理、艾灸', phone: '', honors: '' },
            { position: '健康管理师', name: '赵老师', experience: 7, specialties: '刮痧、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（隆昌路店）',
        therapists: [
            { position: '调理师', name: '邹老师', experience: 15, specialties: '颈肩腰腿疼特色、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '吴老师', experience: 23, specialties: '按摩、经络疏通、颈肩腰腿疼特色', phone: '', honors: '' },
            { position: '调理师', name: '孙老师', experience: 12, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '陈老师', experience: 15, specialties: '颈肩腰腿疼特色、整脊、经络疏通', phone: '', honors: '推拿师' },
            { position: '调理师', name: '鲍老师', experience: 21, specialties: '颈肩腰腿疼特色、整脊、推拿', phone: '', honors: '' },
            { position: '调理师', name: '裴老师', experience: 19, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '执业医师' },
            { position: '调理师', name: '费老师', experience: 14, specialties: '颈肩腰腿痛、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '唐老师', experience: 20, specialties: '脾胃、颈肩腰腿痛', phone: '', honors: '执业医师' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（长江西路店）',
        therapists: [
            { position: '调理师', name: '韩老师', experience: 16, specialties: '推拿正骨、脏腑调理、颈肩腰腿痛', phone: '', honors: '' },
            { position: '调理师', name: '武老师', experience: 24, specialties: '颈肩腰腿痛、脏腑调理、型体塑造', phone: '', honors: '' },
            { position: '调理师', name: '刘老师', experience: 22, specialties: '推拿按摩、经络疏通、颈肩腰腿痛', phone: '', honors: '' },
            { position: '调理师', name: '康老师', experience: 22, specialties: '艾灸、按摩、刮痧', phone: '', honors: '特级' },
            { position: '调理师', name: '徐师傅', experience: 16, specialties: '拔罐、按摩、经络疏通', phone: '', honors: '特级' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（龙华路店）',
        therapists: [
            { position: '调理师', name: '潘老师', experience: 18, specialties: '颈肩腰腿痛、按摩、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '杨老师', experience: 15, specialties: '颈肩腰腿痛、按摩、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '张老师', experience: 15, specialties: '按摩、经络疏通', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（武宁南路店）',
        therapists: [
            { position: '艾灸师', name: '杜老师', experience: 16, specialties: '刮痧、经络疏通、艾灸', phone: '', honors: '' },
            { position: '艾灸师', name: '赵老师', experience: 21, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '' },
            { position: '推拿师', name: '冯老师', experience: 20, specialties: '推拿正骨、颈肩腰腿痛、经络疏通', phone: '', honors: '' },
            { position: '艾灸师', name: '朱老师', experience: 15, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（豫园店）',
        therapists: [
            { position: '健康师', name: '李老师', experience: 4, specialties: '推拿按摩、纤体塑形、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '靳老师', experience: 7, specialties: '颈肩腰腿痛调理、刮痧、艾灸', phone: '', honors: '' },
            { position: '艾灸师', name: '张老师', experience: 8, specialties: '推拿按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '专家健康师', name: '李店长', experience: 21, specialties: '纤体塑型、皮肤调理、健康管理', phone: '', honors: '店长' },
            { position: '推拿师', name: '肖老师', experience: 12, specialties: '推拿正骨、颈肩腰腿痛调理、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '王老师', experience: 7, specialties: '推拿按摩、纤体塑型、经络疏通', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（斜土路店）',
        therapists: [
            { position: '调理师', name: '杨老师', experience: 12, specialties: '推拿、拔罐、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '马老师', experience: 20, specialties: '龙氏正骨、颈椎错位、脊柱侧弯骨盆修复', phone: '', honors: '' },
            { position: '调理师', name: '孙老师', experience: 14, specialties: '按摩、经络疏通', phone: '', honors: '执业医师' },
            { position: '调理师', name: '朱老师', experience: 15, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂妙康中医·推拿正骨·针灸·艾灸',
        therapists: [
            { position: '医师', name: '何正芳', experience: 7, specialties: '中医内科，中医妇科，中医皮肤科，中医不孕不育，中医耳鼻喉', phone: '', honors: '' },
            { position: '医师', name: '刁松山', experience: 27, specialties: '中医内科，中医男科，中医不孕不育，中医康复科，中医肠胃科', phone: '', honors: '' },
            { position: '医师', name: '胡科娜', experience: 8, specialties: '中医内科，中医妇科，中医康复科，针灸，推拿/按摩，中药，经穴', phone: '', honors: '' },
            { position: '医师', name: '阮明诸', experience: 14, specialties: '中医内科，中医妇科，中医康复科，中医肠胃科，中医儿科，针', phone: '', honors: '' },
            { position: '医师', name: '高宏成', experience: 27, specialties: '中医内科，中医男科，中医妇科，中医康复科，中医肠胃科，中', phone: '', honors: '' },
            { position: '执业医师', name: '孙茂惠', experience: 28, specialties: '中医内科，中医外科，中医肠胃科，中医妇科，针灸，中药，推拿', phone: '', honors: '' },
            { position: '执业医师', name: '李正义', experience: 28, specialties: '中医内科，中医外科，推拿/按摩，敷贴，熏蒸，把脉', phone: '', honors: '' },
            { position: '执业医师', name: '华平东', experience: 41, specialties: '中医内科，中医眼科，针灸，熏蒸，把脉，中药，敷贴，颈肩腰腿', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂永康中医·推拿正骨·针灸·艾灸',
        therapists: [
            { position: '医师', name: '胡科娜', experience: 8, specialties: '中医内科，针灸，经穴，把脉，中药，擅长各类急、慢性病', phone: '', honors: '' },
            { position: '医士', name: '周龙标', experience: 66, specialties: '中医内科，中医不孕不育，中医妇科，中医康复科，中医肿瘤科', phone: '', honors: '' },
            { position: '副主任医师', name: '顾荣程', experience: 28, specialties: '中医内科，中医肠胃科，中医皮肤科，中医肿瘤科，把脉，中药', phone: '', honors: '' },
            { position: '医师', name: '李兴火', experience: 9, specialties: '中医内科，艾灸，中医内科，针农', phone: '', honors: '' },
            { position: '医师', name: '周韵', experience: 57, specialties: '中医内科，中医肠胃科，中医妇科，中医儿科，中医康复科，中医', phone: '', honors: '' },
            { position: '医师', name: '刁松山', experience: 46, specialties: '中医内科，中医妇科，中医男科，中医不孕不育，中医康复科', phone: '', honors: '' },
            { position: '医师', name: '阮明诸', experience: 14, specialties: '中医妇科，中医儿科，中医肠胃科，中医内科，针灸，推拿/按摩', phone: '', honors: '' },
            { position: '医士', name: '汪虹', experience: 2, specialties: '中医妇科，中医肠胃科，针灸艾灸，埋线减肥，刺络，面部针灸等', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·肩颈腰腿特色调理（港汇店）',
        therapists: [
            { position: '调理师', name: '杨老师', experience: 23, specialties: '脏腑调理、刮痧、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '张老师', experience: 8, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（兰溪路店）',
        therapists: [
            { position: '艾灸师', name: '朱老师', experience: 17, specialties: '刮痧、经络疏通、艾灸', phone: '', honors: '' },
            { position: '专家医师', name: '周老师', experience: 56, specialties: '膏方、中医内科、中医妇科', phone: '', honors: '执业医师' },
            { position: '调理师', name: '陈老师', experience: 18, specialties: '脏腑调理、刮痧、经络疏通', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（莘庄店）',
        therapists: [
            { position: '调理师', name: '陈老师', experience: 18, specialties: '妇科调理、经络疏通、艾灸', phone: '', honors: '康复理疗师' },
            { position: '调理师', name: '孟老师', experience: 23, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '于老师', experience: 12, specialties: '经络疏通、艾灸、SPA', phone: '', honors: '' },
            { position: '调理师', name: '赵老师', experience: 24, specialties: '颈肩腰腿疼调理、脏腑调理、推拿正骨', phone: '', honors: '' },
            { position: '调理师', name: '李想', experience: 22, specialties: '按摩、艾灸、经络疏通', phone: '', honors: '' },
            { position: '健康师', name: '刘老师', experience: 20, specialties: '刮痧、按摩、艾灸', phone: '', honors: '' },
            { position: '艾灸师', name: '朱老师', experience: 18, specialties: '刮痧、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（五角场万达店）',
        therapists: [
            { position: '调理师', name: '师傅', experience: 18, specialties: '拔罐、按摩、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '师傅', experience: 17, specialties: '拔罐、按摩、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '单老师', experience: 16, specialties: '按摩、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（国顺店）',
        therapists: [
            { position: '专家医师', name: '周老师', experience: 56, specialties: '中医内科、脏腑调理、肠胃调理', phone: '', honors: '' },
            { position: '调理师', name: '翟老师', experience: 21, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '崔老师', experience: 19, specialties: '刮痧、经络疏通、艾灸', phone: '', honors: '' },
            { position: '推拿师', name: '武老师', experience: 33, specialties: '推拿正骨、经络疏通、脏腑调理', phone: '', honors: '颈肩腰腿痛专家' },
            { position: '调理师', name: '杨老师', experience: 13, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '艾灸师', name: '陈老师', experience: 12, specialties: '刮痧、按摩、艾灸', phone: '', honors: '颈肩腰腿痛专家' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（漕东里店）',
        therapists: [
            { position: '调理师', name: '马老师', experience: 16, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '' },
            { position: '高级调理师', name: '张老师', experience: 20, specialties: '颈肩腰腿特色、拔罐、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '王老师', experience: 16, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '赵老师', experience: 14, specialties: '脏腑调理、刮痧、经络疏通', phone: '', honors: '' },
            { position: '艾灸师', name: '陈老师', experience: 13, specialties: '推拿按摩、拔罐、经络疏通', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（高岛屋店）',
        therapists: [
            { position: '调理师', name: '宋老师', experience: 22, specialties: '艾灸、正骨推拿、颈肩腰腿痛', phone: '', honors: '' },
            { position: '推拿师', name: '陈老师', experience: 33, specialties: '拔罐、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '赵老师', experience: 19, specialties: '推拿按摩、腑脏调理、妇科调理', phone: '', honors: '健康理疗师' },
            { position: '艾灸师', name: '杜老师', experience: 23, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '陈老师', experience: 16, specialties: '拔罐、按摩、经络疏通', phone: '', honors: '' },
            { position: '艾灸师', name: '朱老师', experience: 17, specialties: '刮痧、经络疏通、艾灸', phone: '', honors: '' },
            { position: '专家医师', name: '周老师', experience: 56, specialties: '脏腑调理、中医内科、不孕不育', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（春申路店）',
        therapists: [
            { position: '调理师', name: '聂老师', experience: 13, specialties: '推拿正骨、刮痧、拔罐', phone: '', honors: '' },
            { position: '推拿师', name: '李老师', experience: 17, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '健康理疗师' },
            { position: '健康师', name: '谭老师', experience: 11, specialties: '健康管理、推拿按摩、刮痧', phone: '', honors: '' },
            { position: '调理师', name: '陈老师', experience: 16, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（康桥店）',
        therapists: [
            { position: '调理师', name: '孙老师', experience: 18, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '晟垚老师', experience: 13, specialties: '颈肩腰腿疼特色、按摩、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '何老师', experience: 29, specialties: '颈肩腰腿、亚健康调理、按摩', phone: '', honors: '' },
            { position: '调理师', name: '饶老师', experience: 15, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（汇融天地店）',
        therapists: [
            { position: '按摩师', name: '张老师', experience: 27, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '贺老师', experience: 17, specialties: '整脊、颈肩腰腿痛、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '王老师', experience: 8, specialties: '按摩、经络疏通', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（浦三路店）',
        therapists: [
            { position: '高级调理师', name: '宁老师', experience: 24, specialties: 'SPA、按摩、经络疏通', phone: '', honors: '技术总监' },
            { position: '调理师', name: '彭老师', experience: 13, specialties: '', phone: '', honors: '执业医师' },
            { position: '调理师', name: '于老师', experience: 11, specialties: 'SPA、刮痧、经络疏通', phone: '', honors: '高级调理师' },
            { position: '调理师', name: '魏老师', experience: 13, specialties: '拔罐、按摩、经络疏通', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（聚丰园路店）',
        therapists: [
            { position: '调理师', name: '侯老师', experience: 13, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '关老师', experience: 14, specialties: '颈肩腰腿、按摩、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '张老师', experience: 8, specialties: '拔罐、按摩、经络疏通', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（世纪公园店）',
        therapists: [
            { position: '调理师', name: '宋老师', experience: 23, specialties: '拔罐、按摩、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '马老师', experience: 14, specialties: '拔罐、按摩、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '贺老师', experience: 15, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '钟老师', experience: 22, specialties: '拔罐、按摩、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（丰庄店）',
        therapists: [
            { position: '调理师', name: '杨老师', experience: 17, specialties: 'SPA、拔罐、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '李老师', experience: 22, specialties: '颈肩腰腿痛特色、艾灸、脏腑调理', phone: '', honors: '' },
            { position: '调理师', name: '韦老师', experience: 17, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（仙霞路店）',
        therapists: [
            { position: '调理师', name: '郭老师', experience: 16, specialties: '颈肩腰腿痛特色、艾灸、经络疏通', phone: '', honors: '康复理疗师' },
            { position: '正骨师', name: '吴老师', experience: 20, specialties: '颈肩腰腿痛特色、正骨、艾灸', phone: '', honors: '高级调理师' },
            { position: '推拿师', name: '赵老师', experience: 28, specialties: '推拿正骨、颈肩腰腿痛调理、经络疏通', phone: '', honors: '执业医师' },
            { position: '艾灸师', name: '陈老师', experience: 22, specialties: '刮痧、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '朱老师', experience: 17, specialties: '刮痧、拔罐、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（爱琴海店）',
        therapists: [
            { position: '调理师', name: '杜老师', experience: 16, specialties: '脾胃调理、颈肩腰腿痛调理、推拿正骨', phone: '', honors: '' },
            { position: '调理师', name: '邱老师', experience: 18, specialties: '正骨、颈肩腰腿疼特色、脏腑调理', phone: '', honors: '' },
            { position: '调理师', name: '肖老师', experience: 13, specialties: '精简腰腿疼调理、乳腺妇科、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '刘老师', experience: 21, specialties: '按摩、经络疏通、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '周老师', experience: 22, specialties: '刮痧、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（浦东大道店）',
        therapists: [
            { position: '调理师', name: '聂老师', experience: 13, specialties: '推拿正骨、刮痧、拔罐', phone: '', honors: '' },
            { position: '推拿师', name: '李老师', experience: 17, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '健康理疗师' },
            { position: '健康师', name: '谭老师', experience: 11, specialties: '健康管理、推拿按摩、刮痧', phone: '', honors: '' },
            { position: '调理师', name: '陈老师', experience: 16, specialties: '脏腑调理、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（东方路店）',
        therapists: [
            { position: '专家调理师', name: '隋老师', experience: 21, specialties: '推拿正骨、肠胃调理、颈椎腰椎调理', phone: '', honors: '技术指导' },
            { position: '调理师', name: '王老师', experience: 19, specialties: '推拿正骨、经络疏通、艾灸', phone: '', honors: '健康理疗师' },
            { position: '调理师', name: '胡老师', experience: 9, specialties: '按摩、艾灸、推拿', phone: '', honors: '' },
            { position: '调理师', name: '朴老师', experience: 9, specialties: '刮痧、按摩、经络疏通', phone: '', honors: '' },
            { position: '调理师', name: '王老师', experience: 10, specialties: '推拿、刮痧、艾灸', phone: '', honors: '副店长' },
            { position: '调理师', name: '陈老师', experience: 18, specialties: '刮痧、经络疏通、艾灸', phone: '', honors: '' },
            { position: '医师', name: '周老师', experience: 56, specialties: '脏腑调理、中医内科、经络疏通', phone: '', honors: '执业医师' }
        ]
    },
    {
        storeName: '名医堂·颈肩腰腿特色调理（静安寺店）',
        therapists: [
            { position: '推拿师', name: '吴老师', experience: 14, specialties: '推拿正骨、颈肩腰腿痛调理、拔罐', phone: '', honors: '' },
            { position: '调理师', name: '万老师', experience: 13, specialties: '八纲辩证、脏腑调理、艾灸', phone: '', honors: '' },
            { position: '资深推拿师', name: '冯老师', experience: 17, specialties: '推拿正骨、颈肩腰腿痛调理、脏腑调理', phone: '', honors: '' },
            { position: '调理师', name: '李老师', experience: 14, specialties: '推拿按摩、脏腑调理、艾灸', phone: '', honors: '' },
            { position: '调理师', name: '赵老师', experience: 18, specialties: '拔罐、经络疏通、艾灸', phone: '', honors: '' }
        ]
    },
    {
        storeName: '名医堂·测试店铺（emagen）',
        therapists: [
            { position: '调理师', name: '吴城良', experience: 18, specialties: '拔罐、经络疏通、艾灸', phone: '19357509506', honors: '' },
            { position: '推拿师', name: '吴城良', experience: 12, specialties: '拔罐、经络疏通、艾灸', phone: '1', honors: '' }
        ]
    }
];

// 新增门店信息（数据库中不存在的）
const newStores = [
    { name: '名医堂·颈肩腰腿特色调理（世纪公园店）', address: '上海市浦东新区世纪公园', phone: '', businessHours: '9:00-21:00', manager: '' },
    { name: '名医堂·颈肩腰腿特色调理（丰庄店）', address: '上海市丰庄', phone: '', businessHours: '9:00-21:00', manager: '' },
    { name: '名医堂·颈肩腰腿特色调理（仙霞路店）', address: '上海市长宁区仙霞路', phone: '', businessHours: '9:00-21:00', manager: '' },
    { name: '名医堂·颈肩腰腿特色调理（爱琴海店）', address: '上海市爱琴海购物公园', phone: '', businessHours: '9:00-21:00', manager: '' },
    { name: '名医堂·颈肩腰腿特色调理（浦东大道店）', address: '上海市浦东新区浦东大道', phone: '', businessHours: '9:00-21:00', manager: '' },
    { name: '名医堂·颈肩腰腿特色调理（东方路店）', address: '上海市浦东新区东方路', phone: '', businessHours: '9:00-21:00', manager: '' },
    { name: '名医堂·颈肩腰腿特色调理（静安寺店）', address: '上海市静安区静安寺', phone: '', businessHours: '9:00-21:00', manager: '' },
    { name: '名医堂·测试店铺（emagen）', address: '测试地址', phone: '', businessHours: '9:00-21:00', manager: '' }
];

// 将专长字符串转换为JSON数组
function parseSpecialties(specialtiesStr) {
    if (!specialtiesStr) return '[]';
    // 替换中文逗号为英文逗号，然后分割
    const specialties = specialtiesStr
        .replace(/，/g, ',')
        .replace(/、/g, ',')
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
    return JSON.stringify(specialties);
}

async function importTherapistsData() {
    const db = getInstance();
    await db.connect();
    
    console.log('🚀 开始导入技师数据...\n');
    
    try {
        // 开始事务
        await db.run('BEGIN TRANSACTION');
        
        // 1. 首先创建新门店
        console.log('📍 创建新门店...');
        for (const store of newStores) {
            try {
                const existing = await db.get('SELECT id FROM stores WHERE name = ?', [store.name]);
                if (!existing) {
                    const result = await db.run(`
                        INSERT INTO stores (name, address, phone, business_hours, manager_name, status)
                        VALUES (?, ?, ?, ?, ?, 'active')
                    `, [store.name, store.address, store.phone, store.businessHours, store.manager]);
                    console.log(`✅ 创建门店: ${store.name} (ID: ${result.lastID})`);
                }
            } catch (err) {
                console.error(`❌ 创建门店失败 ${store.name}:`, err.message);
            }
        }
        
        // 2. 获取所有门店的映射
        const stores = await db.all('SELECT id, name FROM stores');
        const storeMap = {};
        stores.forEach(store => {
            storeMap[store.name] = store.id;
        });
        
        // 3. 清除现有技师数据（可选）
        console.log('\n🧹 清除现有技师数据...');
        await db.run('DELETE FROM therapists');
        
        // 4. 导入技师数据
        console.log('\n👥 导入技师数据...');
        let totalImported = 0;
        
        for (const storeData of therapistsData) {
            const storeId = storeMap[storeData.storeName];
            if (!storeId) {
                console.error(`❌ 未找到门店: ${storeData.storeName}`);
                continue;
            }
            
            console.log(`\n📍 ${storeData.storeName} (ID: ${storeId})`);
            
            for (const therapist of storeData.therapists) {
                try {
                    const specialties = parseSpecialties(therapist.specialties);
                    
                    const result = await db.run(`
                        INSERT INTO therapists (
                            store_id, name, position, experience_years, 
                            specialties, phone, honors, status, rating
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 5.0)
                    `, [
                        storeId,
                        therapist.name,
                        therapist.position,
                        therapist.experience,
                        specialties,
                        therapist.phone || null,
                        therapist.honors || null
                    ]);
                    
                    console.log(`  ✅ ${therapist.position} ${therapist.name} (${therapist.experience}年经验)`);
                    totalImported++;
                } catch (err) {
                    console.error(`  ❌ 导入失败 ${therapist.name}:`, err.message);
                }
            }
        }
        
        // 提交事务
        await db.run('COMMIT');
        
        // 5. 验证导入结果
        console.log('\n📊 导入完成统计：');
        const stats = await db.all(`
            SELECT s.name as store_name, COUNT(t.id) as therapist_count
            FROM stores s
            LEFT JOIN therapists t ON s.id = t.store_id
            GROUP BY s.id
            ORDER BY s.id
        `);
        
        console.table(stats);
        
        const totalTherapists = await db.get('SELECT COUNT(*) as count FROM therapists');
        console.log(`\n✨ 总计导入技师: ${totalImported} 位`);
        console.log(`📊 数据库中技师总数: ${totalTherapists.count} 位`);
        
    } catch (error) {
        console.error('❌ 导入失败:', error);
        await db.run('ROLLBACK');
    } finally {
        await db.close();
    }
}

// 运行导入
importTherapistsData();