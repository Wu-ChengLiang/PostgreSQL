#!/usr/bin/env python3
import paramiko
import sys

# 服务器配置
SERVER_IP = "43.167.226.222"
SERVER_USER = "ubuntu"
SERVER_PASS = "20031758wW@"

def execute_command(ssh, command):
    """执行SSH命令并返回输出"""
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.read().decode()
    error = stderr.read().decode()
    return output, error

def fix_nginx():
    """修复Nginx配置"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查当前nginx配置
        print("📋 检查当前Nginx配置...")
        output, _ = execute_command(ssh, "cat /etc/nginx/sites-available/mingyi-platform")
        print("当前配置:")
        print(output)
        
        # 2. 创建正确的nginx配置
        nginx_config = """server {
    listen 80;
    server_name emagen.323424.xyz;

    # 前端静态文件
    location / {
        root /home/ubuntu/mingyi-platform/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API路由
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}"""
        
        print("\n🔧 更新Nginx配置...")
        execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/mingyi-platform")
        
        # 3. 检查PM2状态
        print("\n📊 检查PM2服务状态...")
        output, _ = execute_command(ssh, "pm2 list")
        print(output)
        
        # 4. 确保后端在3001端口运行
        print("\n🚀 确保后端服务运行在3001端口...")
        execute_command(ssh, "pm2 stop all || true")
        execute_command(ssh, "cd /home/ubuntu/mingyi-platform && PORT=3001 pm2 start src/app.js --name mingyi-platform")
        
        # 5. 测试nginx配置
        print("\n🔍 测试Nginx配置...")
        output, error = execute_command(ssh, "sudo nginx -t")
        print(output + error)
        
        # 6. 重启nginx
        print("\n🔄 重启Nginx...")
        execute_command(ssh, "sudo systemctl reload nginx")
        
        # 7. 测试API
        print("\n🧪 测试API访问...")
        
        # 测试本地访问
        output, _ = execute_command(ssh, "curl -s http://localhost:3001/api/client/stores | head -20")
        print("本地API测试:")
        print(output)
        
        print("\n✅ Nginx配置修复完成!")
        print("\n请测试:")
        print("1. 前端: http://emagen.323424.xyz")
        print("2. API: http://emagen.323424.xyz/api/client/stores")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_nginx()