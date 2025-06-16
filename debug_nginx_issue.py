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

def debug_nginx():
    """调试Nginx问题"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查nginx错误日志
        print("📋 检查Nginx错误日志...")
        output, _ = execute_command(ssh, "sudo tail -20 /var/log/nginx/error.log")
        print(output)
        
        # 2. 检查nginx访问日志
        print("\n📋 检查Nginx访问日志...")
        output, _ = execute_command(ssh, "sudo tail -10 /var/log/nginx/access.log")
        print(output)
        
        # 3. 重新配置nginx - 修复路径问题
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
    location /api/client/ {
        proxy_pass http://localhost:3001/api/v1/client/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/admin/ {
        proxy_pass http://localhost:3001/api/v1/admin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}"""
        
        print("\n🔧 更新Nginx配置...")
        execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/mingyi-platform")
        
        # 4. 测试并重载nginx
        print("\n🔍 测试Nginx配置...")
        output, error = execute_command(ssh, "sudo nginx -t")
        print(output + error)
        
        execute_command(ssh, "sudo nginx -s reload")
        print("✅ Nginx已重载")
        
        # 等待一下
        time.sleep(2)
        
        # 5. 测试API访问
        print("\n🧪 测试API访问...")
        
        # 本地测试
        output, _ = execute_command(ssh, "curl -s http://localhost:3001/api/v1/client/stores | jq '.success' 2>/dev/null || echo 'API错误'")
        print(f"本地API测试: {output.strip()}")
        
        # 通过域名测试
        output, _ = execute_command(ssh, 'curl -s "http://emagen.323424.xyz/api/client/stores" | jq ".success" 2>/dev/null || echo "false"')
        print(f"域名API测试: {output.strip()}")
        
        # 测试技师搜索
        output, _ = execute_command(ssh, 'curl -s "http://emagen.323424.xyz/api/client/therapists/search?page=1&limit=10" 2>&1')
        print(f"\n技师搜索API响应: {output[:200]}...")
        
        # 测试管理员登录
        output, _ = execute_command(ssh, '''curl -s -X POST "http://emagen.323424.xyz/api/admin/login" \
            -H "Content-Type: application/json" \
            -d '{"username":"admin","password":"admin123"}' 2>&1''')
        print(f"\n管理员登录API响应: {output[:200]}...")
        
        print("\n✅ 调试完成!")
        
    except Exception as e:
        print(f"\n❌ 调试失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    debug_nginx()