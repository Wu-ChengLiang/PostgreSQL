#!/usr/bin/env python3
import paramiko
import sys

# 服务器配置
SERVER_IP = "43.167.226.222"
SERVER_USER = "ubuntu"
SERVER_PASS = "20031758wW@"
PROJECT_PATH = "/home/ubuntu/mingyi-platform"

def execute_command(ssh, command):
    """执行SSH命令并返回输出"""
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.read().decode()
    error = stderr.read().decode()
    return output, error

def fix_cloud_issues():
    """修复云服务器上的问题"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 首先备份当前代码
        print("📦 备份当前代码...")
        execute_command(ssh, f"cd {PROJECT_PATH} && cp -r src src_backup_$(date +%Y%m%d_%H%M%S)")
        
        # 2. 修复therapistService.js中的解构问题
        print("\n🔧 修复技师服务中的解构问题...")
        therapist_fix = '''
# 修复searchTherapists方法中的count解构
sed -i 's/const { count } = await db.get(countQuery, params);/const countResult = await db.get(countQuery, params);\\nconst count = countResult ? countResult.count : 0;/g' src/services/therapistService.js

# 修复getTherapistList方法中的count解构
sed -i "s/const { count } = await db.get(countQuery, storeId ? \\[storeId\\] : \\[\\]);/const countResult = await db.get(countQuery, storeId ? [storeId] : []);\\nconst count = countResult ? countResult.count : 0;/g" src/services/therapistService.js
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && {therapist_fix}")
        print("✅ therapistService.js 修复完成")
        
        # 3. 检查数据库中的管理员账户
        print("\n🔍 检查数据库管理员账户...")
        check_admin_script = '''
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'data/mingyi.db');
const db = new sqlite3.Database(dbPath);

console.log('检查管理员账户...');

// 检查admins表
db.all('SELECT * FROM admins', (err, rows) => {
    if (err) {
        console.error('查询admins表失败:', err);
    } else {
        console.log('\\nadmins表中的管理员:');
        rows.forEach(row => {
            console.log(`  ID: ${row.id}, 用户名: ${row.username}, 角色: ${row.role}, 激活: ${row.is_active}`);
        });
        
        if (rows.length === 0) {
            console.log('\\n⚠️  admins表中没有管理员，正在创建...');
            
            // 创建管理员
            bcrypt.hash('admin123', 10, (err, hash) => {
                if (err) {
                    console.error('密码加密失败:', err);
                    db.close();
                    return;
                }
                
                db.run(`
                    INSERT INTO admins (username, password_hash, role, is_active)
                    VALUES ('admin', ?, 'super_admin', 1)
                `, [hash], (err) => {
                    if (err) {
                        console.error('创建管理员失败:', err);
                    } else {
                        console.log('✅ 管理员创建成功 (用户名: admin, 密码: admin123)');
                    }
                    db.close();
                });
            });
        } else {
            // 验证管理员密码
            const admin = rows.find(r => r.username === 'admin');
            if (admin) {
                bcrypt.compare('admin123', admin.password_hash, (err, result) => {
                    if (err) {
                        console.error('密码验证错误:', err);
                    } else if (result) {
                        console.log('\\n✅ 管理员密码验证成功');
                    } else {
                        console.log('\\n⚠️  管理员密码不正确，正在重置...');
                        bcrypt.hash('admin123', 10, (err, hash) => {
                            if (!err) {
                                db.run('UPDATE admins SET password_hash = ? WHERE username = ?', [hash, 'admin'], (err) => {
                                    if (err) {
                                        console.error('重置密码失败:', err);
                                    } else {
                                        console.log('✅ 密码已重置为: admin123');
                                    }
                                });
                            }
                        });
                    }
                    db.close();
                });
            } else {
                db.close();
            }
        }
    }
});
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > check_admin.js << 'EOF'\n{check_admin_script}\nEOF")
        output, _ = execute_command(ssh, f"cd {PROJECT_PATH} && node check_admin.js")
        print(output)
        
        # 4. 验证修复结果
        print("\n🔍 验证修复结果...")
        verify_script = '''
const therapistService = require('./src/services/therapistService');

async function verify() {
    try {
        console.log('测试技师搜索API...');
        const result = await therapistService.searchTherapists({
            page: 1,
            limit: 10
        });
        console.log('✅ 技师搜索成功，找到', result.total, '个技师');
        
        if (result.therapists.length > 0) {
            console.log('第一个技师:', result.therapists[0].name);
        }
    } catch (error) {
        console.error('❌ 技师搜索失败:', error.message);
    }
}

verify().then(() => process.exit(0));
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > verify_fix.js << 'EOF'\n{verify_script}\nEOF")
        output, _ = execute_command(ssh, f"cd {PROJECT_PATH} && node verify_fix.js")
        print(output)
        
        # 5. 重启服务
        print("\n🔄 重启服务...")
        execute_command(ssh, "pm2 restart mingyi-platform")
        
        # 6. 清理临时文件
        print("\n🧹 清理临时文件...")
        execute_command(ssh, f"cd {PROJECT_PATH} && rm -f check_admin.js verify_fix.js")
        
        print("\n✅ 修复完成!")
        print("\n📋 请测试以下功能:")
        print("1. 管理员登录: http://emagen.323424.xyz/admin.html")
        print("   用户名: admin")
        print("   密码: admin123")
        print("\n2. 技师搜索API: http://emagen.323424.xyz/api/client/therapists/search")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_cloud_issues()