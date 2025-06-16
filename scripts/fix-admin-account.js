#!/usr/bin/env node
const bcrypt = require('bcrypt');
const { getInstance } = require('../src/database/db');

async function fixAdminAccount() {
    const db = getInstance();
    await db.connect();

    try {
        console.log('🔍 检查管理员账户...');
        
        // 检查admins表是否存在
        const admins = await db.all('SELECT * FROM admins');
        console.log(`\n找到 ${admins.length} 个管理员账户`);
        
        // 检查是否有admin账户
        const adminAccount = admins.find(a => a.username === 'admin');
        
        if (!adminAccount) {
            console.log('\n⚠️  没有找到admin账户，正在创建...');
            
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await db.run(`
                INSERT INTO admins (username, password_hash, role, is_active)
                VALUES ('admin', ?, 'super_admin', 1)
            `, [hashedPassword]);
            
            console.log('✅ 管理员账户创建成功');
            console.log('   用户名: admin');
            console.log('   密码: admin123');
        } else {
            console.log('\n✅ 找到admin账户，验证密码...');
            
            const isValidPassword = await bcrypt.compare('admin123', adminAccount.password_hash);
            
            if (!isValidPassword) {
                console.log('⚠️  密码不匹配，正在重置...');
                
                const hashedPassword = await bcrypt.hash('admin123', 10);
                
                await db.run(
                    'UPDATE admins SET password_hash = ? WHERE username = ?',
                    [hashedPassword, 'admin']
                );
                
                console.log('✅ 密码已重置为: admin123');
            } else {
                console.log('✅ 密码验证成功');
            }
        }
        
        // 显示所有管理员
        console.log('\n📋 所有管理员账户:');
        const allAdmins = await db.all('SELECT id, username, role, is_active FROM admins');
        allAdmins.forEach(admin => {
            console.log(`   ID: ${admin.id}, 用户名: ${admin.username}, 角色: ${admin.role}, 激活: ${admin.is_active}`);
        });
        
    } catch (error) {
        console.error('❌ 错误:', error);
    } finally {
        process.env.FORCE_CLOSE = 'true';
        await db.close();
    }
}

fixAdminAccount();