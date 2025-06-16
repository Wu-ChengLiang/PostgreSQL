#!/usr/bin/env python3
import paramiko

# 服务器配置
SERVER_IP = "43.167.226.222"
SERVER_USER = "ubuntu"
SERVER_PASS = "20031758wW@"
PROJECT_PATH = "/home/ubuntu/mingyi-platform"

def execute_command(ssh, command, show_output=True):
    """执行SSH命令并返回输出"""
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.read().decode()
    error = stderr.read().decode()
    if show_output:
        if output:
            print(f"输出: {output}")
        if error:
            print(f"错误: {error}")
    return output, error

def fix_deployment():
    """修复部署问题"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查目录结构
        print("📂 检查目录结构...")
        output, _ = execute_command(ssh, f"ls -la {PROJECT_PATH}/")
        
        # 2. 找到正确的前端目录
        output, _ = execute_command(ssh, f"find {PROJECT_PATH} -name 'index.html' -type f | head -5", False)
        frontend_paths = output.strip().split('\n')
        
        if frontend_paths and frontend_paths[0]:
            # 获取正确的前端目录
            correct_frontend = '/'.join(frontend_paths[0].split('/')[:-1])
            print(f"找到前端目录: {correct_frontend}")
            
            # 3. 更新Nginx配置
            print("\n🔧 更新Nginx配置...")
            nginx_config = f"""server {{
    listen 80;
    server_name emagen.323424.xyz;

    location / {{
        root {correct_frontend};
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
            execute_command(ssh, "sudo nginx -t")
            execute_command(ssh, "sudo systemctl reload nginx")
        
        # 4. 修复数据库连接和Express trust proxy
        print("\n🔧 修复应用配置...")
        fix_app = '''
// 在app.js文件开头添加trust proxy设置
const lineToAdd = "app.set('trust proxy', 1); // 信任第一个代理";
const searchLine = "app.use(express.json());";

// 读取文件
const fs = require('fs');
const path = require('path');
const appFile = path.join(__dirname, 'src/app.js');
let content = fs.readFileSync(appFile, 'utf8');

// 检查是否已经添加
if (!content.includes("app.set('trust proxy'")) {
    // 在express.json()之后添加
    content = content.replace(searchLine, searchLine + '\\n' + lineToAdd);
    fs.writeFileSync(appFile, content);
    console.log('✅ 已添加trust proxy设置');
} else {
    console.log('✅ trust proxy已设置');
}
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > fix_app.js << 'EOF'\n{fix_app}\nEOF")
        execute_command(ssh, f"cd {PROJECT_PATH} && node fix_app.js")
        
        # 5. 创建初始管理员和测试数据
        print("\n🌱 创建初始数据...")
        init_data = '''
const Database = require('./src/database/db-pool');
const bcrypt = require('bcrypt');

async function initData() {
    try {
        const db = await Database.getConnection();
        
        // 创建管理员
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.run(`
            INSERT OR IGNORE INTO users (username, password_hash, role, email, phone, status)
            VALUES (?, ?, 'admin', 'admin@mingyi.com', '13800138000', 'active')
        `, ['admin', hashedPassword]);
        console.log('✅ 管理员创建成功');
        
        // 创建测试门店
        const storeResult = await db.run(`
            INSERT INTO stores (name, address, phone, business_hours, status)
            VALUES (?, ?, ?, ?, ?)
        `, ['名医堂总店', '上海市徐汇区宜山路1号', '021-12345678', '9:00-21:00', 'active']);
        
        const storeId = storeResult.lastID;
        console.log('✅ 门店创建成功, ID:', storeId);
        
        // 创建测试技师
        await db.run(`
            INSERT INTO therapists (store_id, name, position, years_experience, specialties, service_types, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [storeId, '张医师', '专家医师', 10, '["颈椎调理", "腰椎调理"]', '["按摩", "推拿"]', 'active']);
        
        await db.run(`
            INSERT INTO therapists (store_id, name, position, years_experience, specialties, service_types, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [storeId, '李医师', '推拿师', 8, '["肩周炎调理", "关节调理"]', '["推拿", "艾灸"]', 'active']);
        
        console.log('✅ 技师创建成功');
        
        // 验证数据
        const stores = await db.all('SELECT COUNT(*) as count FROM stores');
        const therapists = await db.all('SELECT COUNT(*) as count FROM therapists');
        const users = await db.all('SELECT COUNT(*) as count FROM users');
        
        console.log('📊 数据统计:');
        console.log(`   门店: ${stores[0].count}`);
        console.log(`   技师: ${therapists[0].count}`);
        console.log(`   用户: ${users[0].count}`);
        
    } catch (error) {
        console.error('错误:', error);
    }
    process.exit(0);
}

initData();
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > init_data.js << 'EOF'\n{init_data}\nEOF")
        execute_command(ssh, f"cd {PROJECT_PATH} && node init_data.js")
        
        # 6. 重启服务
        print("\n🔄 重启服务...")
        execute_command(ssh, "pm2 restart mingyi-platform")
        
        # 7. 等待服务启动
        import time
        time.sleep(3)
        
        # 8. 查看最终状态
        print("\n📊 最终状态:")
        execute_command(ssh, "pm2 list")
        
        print("\n✅ 修复完成!")
        print(f"🌐 请访问: http://emagen.323424.xyz")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_deployment()