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

def init_data():
    """初始化数据"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 创建初始化脚本
        print("📝 创建初始化脚本...")
        init_script = '''
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'data/mingyi.db');
const db = new sqlite3.Database(dbPath);

async function init() {
    try {
        console.log('开始初始化数据...');
        
        // 1. 创建管理员用户
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        db.run(`
            INSERT OR REPLACE INTO users (id, username, password, role, email, phone, status)
            VALUES (1, 'admin', ?, 'admin', 'admin@mingyi.com', '13800138000', 'active')
        `, [hashedPassword], (err) => {
            if (err) console.error('创建管理员失败:', err);
            else console.log('✅ 管理员创建成功');
        });
        
        // 2. 创建门店（如果不存在）
        db.get('SELECT COUNT(*) as count FROM stores', (err, row) => {
            if (err || row.count === 0) {
                db.run(`
                    INSERT INTO stores (id, name, address, phone, business_hours, status)
                    VALUES (1, '名医堂总店', '上海市徐汇区宜山路1号', '021-12345678', '9:00-21:00', 'active')
                `, (err) => {
                    if (err) console.error('创建门店失败:', err);
                    else {
                        console.log('✅ 门店创建成功');
                        
                        // 创建技师
                        db.run(`
                            INSERT INTO therapists (store_id, name, position, experience_years, specialties, service_types, status)
                            VALUES (1, '张医师', '专家医师', 10, '["颈椎调理", "腰椎调理"]', '["按摩", "推拿"]', 'active')
                        `, (err) => {
                            if (err) console.error('创建技师1失败:', err);
                            else console.log('✅ 技师1创建成功');
                        });
                        
                        db.run(`
                            INSERT INTO therapists (store_id, name, position, experience_years, specialties, service_types, status)
                            VALUES (1, '李医师', '推拿师', 8, '["肩周炎调理", "关节调理"]', '["推拿", "艾灸"]', 'active')
                        `, (err) => {
                            if (err) console.error('创建技师2失败:', err);
                            else console.log('✅ 技师2创建成功');
                        });
                    }
                });
            } else {
                console.log('✅ 已有门店数据');
            }
        });
        
        // 3. 等待并显示结果
        setTimeout(() => {
            db.all('SELECT COUNT(*) as count FROM stores', (err, rows) => {
                if (!err) console.log('门店数量:', rows[0].count);
            });
            
            db.all('SELECT COUNT(*) as count FROM therapists', (err, rows) => {
                if (!err) console.log('技师数量:', rows[0].count);
            });
            
            db.all('SELECT COUNT(*) as count FROM users', (err, rows) => {
                if (!err) console.log('用户数量:', rows[0].count);
            });
            
            db.close();
            process.exit(0);
        }, 3000);
        
    } catch (error) {
        console.error('错误:', error);
        process.exit(1);
    }
}

init();
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > init_data.js << 'EOF'\n{init_script}\nEOF")
        
        # 2. 运行初始化脚本
        print("\n🌱 初始化数据...")
        output, error = execute_command(ssh, f"cd {PROJECT_PATH} && node init_data.js")
        print(output)
        if error and "DeprecationWarning" not in error:
            print("警告:", error)
        
        # 3. 重启服务
        print("\n🔄 重启服务...")
        execute_command(ssh, "pm2 restart mingyi-platform")
        
        # 4. 等待服务启动
        import time
        time.sleep(3)
        
        # 5. 查看服务状态
        print("\n📊 服务状态:")
        output, _ = execute_command(ssh, "pm2 list")
        print(output)
        
        print("\n✅ 数据初始化完成!")
        
    except Exception as e:
        print(f"\n❌ 初始化失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    init_data()