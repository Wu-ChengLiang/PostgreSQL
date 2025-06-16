#!/usr/bin/env python3
import paramiko

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

def final_init():
    """最终数据初始化"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 创建完整的初始化脚本
        print("📝 创建完整初始化脚本...")
        final_script = '''
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'data/mingyi.db');
const db = new sqlite3.Database(dbPath);

async function init() {
    try {
        console.log('开始完整数据初始化...');
        
        // 1. 创建管理员账户（在admins表中）
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        db.run(`
            INSERT OR REPLACE INTO admins (id, username, password_hash, role, is_active)
            VALUES (1, 'admin', ?, 'super_admin', 1)
        `, [hashedPassword], (err) => {
            if (err) console.error('创建管理员失败:', err);
            else console.log('✅ 管理员账户创建成功 (用户名: admin, 密码: admin123)');
        });
        
        // 2. 创建测试用户
        db.run(`
            INSERT OR IGNORE INTO users (id, name, phone, email, gender, member_level)
            VALUES 
            (1, '张三', '13900139001', 'zhangsan@example.com', 'male', 'normal'),
            (2, '李四', '13900139002', 'lisi@example.com', 'female', 'silver')
        `, (err) => {
            if (err) console.error('创建用户失败:', err);
            else console.log('✅ 测试用户创建成功');
        });
        
        // 3. 确保有技师数据
        db.get('SELECT COUNT(*) as count FROM therapists', (err, row) => {
            if (!err && row.count < 2) {
                db.get('SELECT id FROM stores LIMIT 1', (err, store) => {
                    if (!err && store) {
                        // 删除旧数据
                        db.run('DELETE FROM therapists', () => {
                            // 创建新技师
                            db.run(`
                                INSERT INTO therapists 
                                (store_id, name, position, experience_years, specialties, service_types, phone, status)
                                VALUES 
                                (?, '张医师', '专家医师', 10, '["颈椎调理", "腰椎调理", "肩周炎调理"]', '["按摩", "推拿", "正骨"]', '13800138001', 'active'),
                                (?, '李医师', '推拿师', 8, '["经络疏通", "关节调理", "腰椎调理"]', '["推拿", "艾灸", "拔罐"]', '13800138002', 'active'),
                                (?, '王医师', '艾灸师', 5, '["艾灸调理", "温经通络", "祛湿排寒"]', '["艾灸", "拔罐", "刮痧"]', '13800138003', 'active')
                            `, [store.id, store.id, store.id], (err) => {
                                if (err) console.error('创建技师失败:', err);
                                else console.log('✅ 技师数据创建成功');
                            });
                        });
                    }
                });
            }
        });
        
        // 4. 创建服务项目
        db.run(`
            INSERT OR IGNORE INTO services 
            (id, name, category, duration, price, description)
            VALUES 
            (1, '全身按摩', '按摩推拿', 60, 198.00, '专业全身经络按摩，舒缓疲劳'),
            (2, '颈椎调理', '专项调理', 45, 168.00, '针对颈椎问题的专业调理'),
            (3, '艾灸理疗', '艾灸', 30, 128.00, '温经通络，祛湿排寒')
        `, (err) => {
            if (err) console.error('创建服务失败:', err);
            else console.log('✅ 服务项目创建成功');
        });
        
        // 5. 显示最终统计
        setTimeout(() => {
            console.log('\\n=== 数据统计 ===');
            
            // 统计各表数据
            const tables = ['stores', 'therapists', 'users', 'admins', 'services'];
            let completed = 0;
            
            tables.forEach(table => {
                db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
                    if (!err) {
                        console.log(`${table}: ${row.count} 条记录`);
                    }
                    completed++;
                    
                    if (completed === tables.length) {
                        // 显示管理员信息
                        db.all('SELECT username, role FROM admins', (err, rows) => {
                            if (!err && rows.length > 0) {
                                console.log('\\n管理员账户:');
                                rows.forEach(row => console.log(`  - ${row.username} (${row.role})`));
                            }
                            
                            console.log('\\n✅ 初始化完成！');
                            console.log('\\n访问信息:');
                            console.log('- 网站地址: http://emagen.323424.xyz');
                            console.log('- 管理后台: http://emagen.323424.xyz/admin.html');
                            console.log('- 管理员账号: admin / admin123');
                            
                            db.close();
                            process.exit(0);
                        });
                    }
                });
            });
        }, 2000);
        
    } catch (error) {
        console.error('错误:', error);
        process.exit(1);
    }
}

init();
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > final_init.js << 'EOF'\n{final_script}\nEOF")
        
        # 2. 运行初始化
        print("\n🌱 运行数据初始化...")
        output, error = execute_command(ssh, f"cd {PROJECT_PATH} && node final_init.js")
        print(output)
        
        # 3. 重启服务
        print("\n🔄 重启服务...")
        execute_command(ssh, "pm2 restart mingyi-platform")
        
        print("\n✅ 最终初始化完成!")
        print("\n📋 测试信息:")
        print("- 网站地址: http://emagen.323424.xyz")
        print("- 管理后台: http://emagen.323424.xyz/admin.html")
        print("- 管理员账号: admin / admin123")
        
    except Exception as e:
        print(f"\n❌ 初始化失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    final_init()