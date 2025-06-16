#!/usr/bin/env python3
import paramiko

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

def update_nginx():
    """更新Nginx配置"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 查看mingyi-platform配置
        print("📄 检查mingyi-platform配置:")
        output, _ = execute_command(ssh, "sudo cat /etc/nginx/sites-available/mingyi-platform")
        print(output[:500] + "...\n" if len(output) > 500 else output)
        
        # 2. 更新配置
        print("🔧 更新Nginx配置...")
        nginx_config = '''server {
    listen 80;
    server_name emagen.323424.xyz;

    root /home/ubuntu/mingyi-platform/frontend;
    index index.html index.htm;

    # 前端静态文件
    location / {
        try_files $uri $uri/ @nextjs;
    }

    # Next.js 应用（如果是Next.js）
    location @nextjs {
        try_files $uri /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://127.0.0.1:8089;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}'''
        
        # 写入新配置
        execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/mingyi-platform")
        
        # 3. 测试配置
        print("\n🔍 测试Nginx配置...")
        output, error = execute_command(ssh, "sudo nginx -t")
        print(output)
        if error:
            print("错误:", error)
        
        # 4. 重载Nginx
        print("\n🔄 重载Nginx...")
        execute_command(ssh, "sudo systemctl reload nginx")
        
        # 5. 设置正确的权限
        print("\n🔐 设置文件权限...")
        execute_command(ssh, "sudo chown -R www-data:www-data /home/ubuntu/mingyi-platform/frontend/")
        execute_command(ssh, "sudo chmod -R 755 /home/ubuntu/mingyi-platform/frontend/")
        
        print("\n✅ 配置更新完成!")
        print("🌐 请访问: http://emagen.323424.xyz")
        
    except Exception as e:
        print(f"\n❌ 更新失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    update_nginx()