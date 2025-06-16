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

def fix_routes():
    """修复API路由"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查路由配置
        print("📋 检查路由配置...")
        output, _ = execute_command(ssh, "grep -n 'app.use.*api' /home/ubuntu/mingyi-platform/src/app.js")
        print("app.js中的路由配置:")
        print(output)
        
        # 2. 测试不同的API路径
        print("\n🧪 测试不同的API路径...")
        
        # 测试 /api/v1/
        output, _ = execute_command(ssh, "curl -s http://localhost:3001/api/v1/client/stores | python3 -m json.tool | head -10")
        print("测试 /api/v1/client/stores:")
        print(output)
        
        # 测试健康检查
        output, _ = execute_command(ssh, "curl -s http://localhost:3001/health")
        print("\n测试 /health:")
        print(output)
        
        # 3. 更新nginx配置以匹配正确的路由
        nginx_config = """server {
    listen 80;
    server_name emagen.323424.xyz;

    # 前端静态文件
    location / {
        root /home/ubuntu/mingyi-platform/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API路由 - 注意是 /api/v1/
    location /api/ {
        proxy_pass http://localhost:3001/api/v1/;
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
        
        # 4. 重启nginx
        print("\n🔄 重启Nginx...")
        execute_command(ssh, "sudo nginx -s reload")
        
        # 5. 测试最终结果
        print("\n🧪 测试最终API访问...")
        
        # 通过nginx测试
        output, _ = execute_command(ssh, 'curl -s "http://emagen.323424.xyz/api/client/stores" | python3 -m json.tool | head -10')
        print("通过Nginx访问 /api/client/stores:")
        print(output)
        
        # 测试技师搜索
        output, _ = execute_command(ssh, 'curl -s "http://emagen.323424.xyz/api/client/therapists/search?page=1&limit=10" | python3 -m json.tool | head -10')
        print("\n通过Nginx访问 /api/client/therapists/search:")
        print(output)
        
        print("\n✅ 路由修复完成!")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_routes()