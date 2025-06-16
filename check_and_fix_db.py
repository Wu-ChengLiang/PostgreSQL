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

def check_db():
    """检查并修复数据库"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查数据库结构
        print("🔍 检查数据库结构...")
        check_script = '''
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/mingyi.db');
const db = new sqlite3.Database(dbPath);

// 查看users表结构
db.all("PRAGMA table_info(users)", (err, rows) => {
    console.log('\\nUsers表结构:');
    if (err) console.error(err);
    else rows.forEach(row => console.log(`  ${row.name} (${row.type})`));
});

// 查看therapists表结构
db.all("PRAGMA table_info(therapists)", (err, rows) => {
    console.log('\\nTherapists表结构:');
    if (err) console.error(err);
    else rows.forEach(row => console.log(`  ${row.name} (${row.type})`));
});

// 查看现有数据
setTimeout(() => {
    db.all('SELECT COUNT(*) as count FROM stores', (err, rows) => {
        if (!err) console.log('\\n门店数量:', rows[0].count);
    });
    
    db.all('SELECT COUNT(*) as count FROM therapists', (err, rows) => {
        if (!err) console.log('技师数量:', rows[0].count);
    });
    
    db.all('SELECT COUNT(*) as count FROM users', (err, rows) => {
        if (!err) console.log('用户数量:', rows[0].count);
    });
    
    db.close();
}, 1000);
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > check_db.js << 'EOF'\n{check_script}\nEOF")
        output, _ = execute_command(ssh, f"cd {PROJECT_PATH} && node check_db.js")
        print(output)
        
        # 2. 创建正确的初始化脚本
        print("\n📝 创建正确的初始化脚本...")
        correct_init_script = '''
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'data/mingyi.db');
const db = new sqlite3.Database(dbPath);

async function init() {
    try {
        console.log('开始初始化数据...');
        
        // 1. 创建管理员用户（使用正确的列名）
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        db.run(`
            INSERT OR REPLACE INTO users (id, username, password_hash, role, email, phone, status)
            VALUES (1, 'admin', ?, 'admin', 'admin@mingyi.com', '13800138000', 'active')
        `, [hashedPassword], (err) => {
            if (err) console.error('创建管理员失败:', err);
            else console.log('✅ 管理员创建成功');
        });
        
        // 2. 检查并创建技师数据
        db.get('SELECT COUNT(*) as count FROM therapists', (err, row) => {
            if (!err && row.count === 0) {
                // 确保有门店
                db.get('SELECT id FROM stores LIMIT 1', (err, store) => {
                    if (!err && store) {
                        db.run(`
                            INSERT INTO therapists (store_id, name, position, experience_years, specialties, service_types, status)
                            VALUES (?, '张医师', '专家医师', 10, '["颈椎调理", "腰椎调理"]', '["按摩", "推拿"]', 'active')
                        `, [store.id], (err) => {
                            if (err) console.error('创建技师1失败:', err);
                            else console.log('✅ 技师1创建成功');
                        });
                        
                        db.run(`
                            INSERT INTO therapists (store_id, name, position, experience_years, specialties, service_types, status)
                            VALUES (?, '李医师', '推拿师', 8, '["肩周炎调理", "关节调理"]', '["推拿", "艾灸"]', 'active')
                        `, [store.id], (err) => {
                            if (err) console.error('创建技师2失败:', err);
                            else console.log('✅ 技师2创建成功');
                        });
                    }
                });
            }
        });
        
        // 3. 显示最终结果
        setTimeout(() => {
            console.log('\\n=== 数据统计 ===');
            
            db.all('SELECT COUNT(*) as count FROM stores', (err, rows) => {
                if (!err) console.log('门店数量:', rows[0].count);
            });
            
            db.all('SELECT COUNT(*) as count FROM therapists', (err, rows) => {
                if (!err) console.log('技师数量:', rows[0].count);
            });
            
            db.all('SELECT COUNT(*) as count FROM users', (err, rows) => {
                if (!err) console.log('用户数量:', rows[0].count);
            });
            
            db.all('SELECT username, role FROM users', (err, rows) => {
                if (!err && rows.length > 0) {
                    console.log('\\n用户列表:');
                    rows.forEach(row => console.log(`  - ${row.username} (${row.role})`));
                }
            });
            
            db.close();
            process.exit(0);
        }, 2000);
        
    } catch (error) {
        console.error('错误:', error);
        process.exit(1);
    }
}

init();
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > correct_init.js << 'EOF'\n{correct_init_script}\nEOF")
        
        # 3. 运行正确的初始化脚本
        print("\n🌱 运行正确的初始化...")
        output, error = execute_command(ssh, f"cd {PROJECT_PATH} && node correct_init.js")
        print(output)
        
        # 4. 重启服务
        print("\n🔄 重启服务...")
        execute_command(ssh, "pm2 restart mingyi-platform")
        
        print("\n✅ 数据库修复完成!")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    check_db()