const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'mingyi.db');
const schemaPath = path.join(__dirname, '..', 'src', 'database', 'schema.sql');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('无法创建数据库:', err);
        process.exit(1);
    }
    console.log('✓ 成功连接到SQLite数据库');
});

// 读取schema文件
const schema = fs.readFileSync(schemaPath, 'utf8');

// 执行数据库初始化
db.serialize(() => {
    // 执行schema创建表结构
    db.exec(schema, (err) => {
        if (err) {
            console.error('执行schema失败:', err);
            process.exit(1);
        }
        console.log('✓ 数据库表结构创建成功');
    });

    // 创建默认管理员账号
    const adminPassword = 'admin123';
    bcrypt.hash(adminPassword, 10, (err, hash) => {
        if (err) {
            console.error('密码加密失败:', err);
            return;
        }

        db.run(
            `INSERT OR IGNORE INTO admins (username, password_hash, role) VALUES (?, ?, ?)`,
            ['admin', hash, 'super_admin'],
            (err) => {
                if (err) {
                    console.error('创建管理员失败:', err);
                } else {
                    console.log('✓ 默认管理员账号创建成功 (用户名: admin, 密码: admin123)');
                }
            }
        );
    });

    // 插入默认服务项目
    const services = [
        { name: '颈肩调理', category: '调理', duration: 60, price: 198 },
        { name: '腰腿调理', category: '调理', duration: 60, price: 198 },
        { name: '经络疏通', category: '调理', duration: 45, price: 158 },
        { name: '推拿按摩', category: '推拿', duration: 60, price: 168 },
        { name: '艾灸调理', category: '艾灸', duration: 45, price: 128 },
        { name: '刮痧拔罐', category: '调理', duration: 30, price: 98 },
        { name: '脏腑调理', category: '调理', duration: 60, price: 228 },
        { name: '正骨推拿', category: '推拿', duration: 45, price: 268 }
    ];

    const insertService = db.prepare(
        `INSERT OR IGNORE INTO services (name, category, duration, price) VALUES (?, ?, ?, ?)`
    );

    services.forEach(service => {
        insertService.run(service.name, service.category, service.duration, service.price);
    });

    insertService.finalize(() => {
        console.log('✓ 默认服务项目创建成功');
    });
});

// 等待所有操作完成后关闭数据库
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('关闭数据库失败:', err);
        } else {
            console.log('✓ 数据库初始化完成');
        }
    });
}, 1000);