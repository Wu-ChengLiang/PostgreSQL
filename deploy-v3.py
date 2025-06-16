#!/usr/bin/env python3
import paramiko
import sys
import time

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
    
    if show_output and output:
        print(output.strip())
    if error and not error.startswith("npm WARN"):
        print(f"⚠️  错误: {error}")
    
    return output, error

def deploy_v3():
    """部署3.0版本到云服务器"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🚀 开始部署名医堂3.0版本...")
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ SSH连接成功!\n")
        
        # 1. 备份当前版本
        print("📦 备份当前版本...")
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        execute_command(ssh, f"cd /home/ubuntu && tar -czf mingyi-backup-{timestamp}.tar.gz mingyi-platform")
        
        # 2. 停止服务
        print("\n🛑 停止现有服务...")
        execute_command(ssh, "pm2 stop all || true")
        
        # 3. 更新代码
        print("\n📥 从GitHub拉取最新代码...")
        execute_command(ssh, f"cd {PROJECT_PATH} && git pull origin main")
        
        # 4. 安装依赖
        print("\n📦 安装依赖...")
        execute_command(ssh, f"cd {PROJECT_PATH} && npm install --production")
        
        # 5. 初始化数据库
        print("\n🗄️ 初始化数据库...")
        # 先备份数据库
        execute_command(ssh, f"cd {PROJECT_PATH} && cp mingyi.db mingyi-{timestamp}.db 2>/dev/null || true")
        
        # 运行数据库初始化
        output, _ = execute_command(ssh, f"cd {PROJECT_PATH} && node scripts/seed-data.js 2>&1 | tail -10")
        
        # 初始化管理员账户
        print("\n👤 初始化管理员账户...")
        execute_command(ssh, f"cd {PROJECT_PATH} && node init-admin.js")
        
        # 6. 导入技师数据
        print("\n🌱 导入技师数据...")
        execute_command(ssh, f"cd {PROJECT_PATH} && node scripts/seed-therapists.js 2>&1 | tail -10")
        
        # 7. 更新Nginx配置
        print("\n🔧 更新Nginx配置...")
        nginx_config = """server {
    listen 80;
    server_name emagen.323424.xyz;

    # 前端静态文件
    location / {
        root /home/ubuntu/mingyi-platform/frontend;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # API路由
    location /api/ {
        rewrite ^/api/(.*)$ /api/v1/$1 break;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
    }
}"""
        
        execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/mingyi")
        execute_command(ssh, "sudo ln -sf /etc/nginx/sites-available/mingyi /etc/nginx/sites-enabled/")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-enabled/default")
        execute_command(ssh, "sudo nginx -t")
        execute_command(ssh, "sudo systemctl reload nginx")
        
        # 8. 启动服务
        print("\n🚀 启动3.0版本服务...")
        execute_command(ssh, f"cd {PROJECT_PATH} && PORT=3001 pm2 start src/app.js --name mingyi-v3")
        
        # 9. 等待服务启动
        print("\n⏳ 等待服务启动...")
        time.sleep(5)
        
        # 10. 验证部署
        print("\n🧪 验证部署...")
        
        # 检查PM2状态
        output, _ = execute_command(ssh, "pm2 list")
        
        # 测试健康检查
        output, _ = execute_command(ssh, "curl -s http://localhost:3001/health")
        print(f"健康检查: {output[:100]}")
        
        # 测试API
        output, _ = execute_command(ssh, 'curl -s "http://localhost:3001/api/v1/client/stores" | jq ".success" 2>/dev/null || echo "false"')
        print(f"API测试: success = {output.strip()}")
        
        # 测试前端
        output, _ = execute_command(ssh, 'curl -s -o /dev/null -w "%{http_code}" http://emagen.323424.xyz/')
        print(f"前端访问: HTTP {output.strip()}")
        
        print("\n✅ 部署完成!")
        print("\n🎉 名医堂3.0版本已成功部署!")
        print("\n📋 访问地址:")
        print("- 前端首页: http://emagen.323424.xyz")
        print("- 管理后台: http://emagen.323424.xyz/admin.html")
        print("- 健康检查: http://emagen.323424.xyz/health")
        print("\n📝 默认管理员账户:")
        print("- 用户名: admin")
        print("- 密码: admin123")
        
        # 11. 设置PM2自动启动
        print("\n⚙️ 配置PM2自动启动...")
        execute_command(ssh, "pm2 save")
        execute_command(ssh, "pm2 startup | grep sudo | bash")
        
    except Exception as e:
        print(f"\n❌ 部署失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy_v3()