const bcrypt = require('bcrypt');
const { getInstance } = require('./src/database/db');

async function initAdmin() {
    const db = getInstance();
    await db.connect();
    
    try {
        // 检查是否已有admin账户
        const existing = await db.get('SELECT * FROM admins WHERE username = ?', ['admin']);
        
        if (existing) {
            console.log('管理员账户已存在');
            // 更新密码
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.run('UPDATE admins SET password_hash = ? WHERE username = ?', [hashedPassword, 'admin']);
            console.log('管理员密码已更新为: admin123');
        } else {
            // 创建新管理员
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.run(
                `INSERT INTO admins (username, password_hash, role, is_active) 
                 VALUES (?, ?, ?, ?)`,
                ['admin', hashedPassword, 'super_admin', 1]
            );
            console.log('✅ 管理员账户创建成功');
            console.log('用户名: admin');
            console.log('密码: admin123');
        }
    } catch (error) {
        console.error('错误:', error);
    } finally {
        process.env.FORCE_CLOSE = 'true';
        await db.close();
    }
}

initAdmin();