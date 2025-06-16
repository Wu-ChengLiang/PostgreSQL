#!/usr/bin/env python3
import paramiko
import sys
import time

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

def final_fix():
    """最终修复部署"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 修复文件权限
        print("🔧 修复文件权限...")
        execute_command(ssh, "chmod 755 /home/ubuntu")
        execute_command(ssh, "chmod -R 755 /home/ubuntu/mingyi-platform")
        execute_command(ssh, "sudo chown -R www-data:www-data /home/ubuntu/mingyi-platform/frontend")
        print("✅ 权限修复完成")
        
        # 2. 检查当前nginx站点配置
        print("\n📋 当前启用的站点...")
        output, _ = execute_command(ssh, "ls -la /etc/nginx/sites-enabled/")
        print(output)
        
        # 3. 创建新的nginx配置
        nginx_config = """server {
    listen 80;
    server_name emagen.323424.xyz;

    # 前端静态文件
    location / {
        root /home/ubuntu/mingyi-platform/frontend;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # API路由 - 映射到正确的后端端口
    location /api/ {
        # 重写路径: /api/xxx -> /api/v1/xxx
        rewrite ^/api/(.*)$ /api/v1/$1 break;
        
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 添加超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
    }
}"""
        
        print("\n🔧 创建新的Nginx配置...")
        execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/mingyi")
        
        # 4. 禁用其他可能冲突的站点
        print("\n🔧 配置站点...")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-enabled/default")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-enabled/mingyi-platform")
        execute_command(ssh, "sudo ln -sf /etc/nginx/sites-available/mingyi /etc/nginx/sites-enabled/mingyi")
        
        # 5. 测试nginx配置
        print("\n🔍 测试Nginx配置...")
        output, error = execute_command(ssh, "sudo nginx -t")
        print(output + error)
        
        # 6. 重启nginx
        print("\n🔄 重启Nginx...")
        execute_command(ssh, "sudo systemctl restart nginx")
        
        # 7. 确保后端在3001端口运行
        print("\n🚀 确保后端服务正确运行...")
        execute_command(ssh, "pm2 delete all || true")
        execute_command(ssh, "cd /home/ubuntu/mingyi-platform && PORT=3001 pm2 start src/app.js --name mingyi-api -- --port 3001")
        
        # 等待服务启动
        print("\n⏳ 等待服务启动...")
        time.sleep(5)
        
        # 8. 验证服务状态
        print("\n📊 服务状态...")
        output, _ = execute_command(ssh, "pm2 list")
        print(output)
        
        output, _ = execute_command(ssh, "sudo netstat -tlnp | grep :3001")
        print(f"\n端口监听: {output}")
        
        # 9. 测试API
        print("\n🧪 测试API访问...")
        
        # 本地测试
        output, _ = execute_command(ssh, "curl -s http://localhost:3001/api/v1/client/stores | jq '.success' 2>/dev/null || echo 'false'")
        print(f"本地API (3001): {output.strip()}")
        
        # 通过nginx测试
        output, _ = execute_command(ssh, 'curl -s "http://emagen.323424.xyz/api/client/stores" | jq ".success" 2>/dev/null || echo "false"')
        print(f"通过Nginx: {output.strip()}")
        
        # 测试前端
        output, _ = execute_command(ssh, 'curl -s -o /dev/null -w "%{http_code}" http://emagen.323424.xyz/')
        print(f"前端访问: HTTP {output.strip()}")
        
        print("\n✅ 部署修复完成!")
        print("\n📋 访问地址:")
        print("前端: http://emagen.323424.xyz")
        print("管理员: http://emagen.323424.xyz/admin.html")
        print("API示例: http://emagen.323424.xyz/api/client/stores")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    final_fix()