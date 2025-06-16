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

def final_fix():
    """最终修复"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查前端目录
        print("📂 检查前端目录...")
        output, _ = execute_command(ssh, f"ls -la {PROJECT_PATH}/frontend/")
        print(output)
        
        # 检查是否有index.html
        output, _ = execute_command(ssh, f"ls {PROJECT_PATH}/frontend/index.html")
        if "index.html" not in output and "No such file" not in output:
            print("✅ 找到正确的前端目录!")
            
            # 2. 清理并重新配置Nginx
            print("\n🔧 重新配置Nginx...")
            
            # 删除旧配置
            execute_command(ssh, "sudo rm -f /etc/nginx/sites-enabled/emagen.323424.xyz")
            execute_command(ssh, "sudo rm -f /etc/nginx/sites-available/emagen.323424.xyz")
            
            # 创建新配置
            nginx_config = f"""server {{
    listen 80;
    server_name emagen.323424.xyz;

    root {PROJECT_PATH}/frontend;
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location /api {{
        proxy_pass http://localhost:8089;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}"""
            
            execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/emagen.323424.xyz")
            execute_command(ssh, "sudo ln -s /etc/nginx/sites-available/emagen.323424.xyz /etc/nginx/sites-enabled/")
            execute_command(ssh, "sudo nginx -t")
            execute_command(ssh, "sudo systemctl reload nginx")
            print("✅ Nginx配置完成")
        
        # 3. 创建简单的初始化数据
        print("\n🌱 创建初始数据...")
        simple_init = '''
const path = require('path');
const Database = require('sqlite3').verbose().Database;
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'data/mingyi.db');
const db = new Database(dbPath);

async function init() {
    try {
        // 创建管理员
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        db.run(`
            INSERT OR IGNORE INTO users (username, password_hash, role, email, phone, status)
            VALUES (?, ?, 'admin', 'admin@mingyi.com', '13800138000', 'active')
        `, ['admin', hashedPassword], (err) => {
            if (err) console.error('创建管理员失败:', err);
            else console.log('✅ 管理员创建成功');
        });
        
        // 创建门店
        db.run(`
            INSERT OR IGNORE INTO stores (name, address, phone, business_hours, status)
            VALUES (?, ?, ?, ?, ?)
        `, ['名医堂总店', '上海市徐汇区宜山路1号', '021-12345678', '9:00-21:00', 'active'], function(err) {
            if (err) {
                console.error('创建门店失败:', err);
                return;
            }
            console.log('✅ 门店创建成功, ID:', this.lastID);
            
            const storeId = this.lastID;
            
            // 创建技师
            db.run(`
                INSERT INTO therapists (store_id, name, position, years_experience, specialties, service_types, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [storeId, '张医师', '专家医师', 10, '["颈椎调理", "腰椎调理"]', '["按摩", "推拿"]', 'active'], (err) => {
                if (err) console.error('创建技师1失败:', err);
                else console.log('✅ 技师1创建成功');
            });
            
            db.run(`
                INSERT INTO therapists (store_id, name, position, years_experience, specialties, service_types, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [storeId, '李医师', '推拿师', 8, '["肩周炎调理", "关节调理"]', '["推拿", "艾灸"]', 'active'], (err) => {
                if (err) console.error('创建技师2失败:', err);
                else console.log('✅ 技师2创建成功');
            });
        });
        
        // 等待一下然后查询
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
        }, 2000);
        
    } catch (error) {
        console.error('错误:', error);
    }
}

init();
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > simple_init.js << 'EOF'\n{simple_init}\nEOF")
        output, error = execute_command(ssh, f"cd {PROJECT_PATH} && node simple_init.js")
        print(output)
        if error:
            print("错误:", error)
        
        # 4. 重启服务
        print("\n🔄 重启服务...")
        execute_command(ssh, "pm2 restart mingyi-platform")
        
        # 5. 查看状态
        print("\n📊 服务状态:")
        output, _ = execute_command(ssh, "pm2 list")
        print(output)
        
        print("\n✅ 修复完成!")
        print(f"🌐 请访问: http://emagen.323424.xyz")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    final_fix()