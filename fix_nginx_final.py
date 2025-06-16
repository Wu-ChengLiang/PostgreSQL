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

def fix_nginx():
    """修复Nginx配置"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查Nginx错误日志
        print("📋 检查Nginx错误日志...")
        output, _ = execute_command(ssh, "sudo tail -20 /var/log/nginx/error.log")
        print(output)
        
        # 2. 检查当前Nginx配置
        print("\n📄 当前Nginx配置:")
        output, _ = execute_command(ssh, "sudo cat /etc/nginx/sites-enabled/emagen.323424.xyz")
        print(output)
        
        # 3. 删除所有旧配置
        print("\n🧹 清理旧配置...")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-enabled/*323424*")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-available/*323424*")
        
        # 4. 创建简单的新配置
        print("\n🔧 创建新的Nginx配置...")
        nginx_config = '''server {
    listen 80;
    server_name emagen.323424.xyz;

    location / {
        root /home/ubuntu/mingyi-platform/frontend;
        index index.html;
        try_files $uri $uri/ =404;
    }

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
}'''
        
        # 写入配置文件
        execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/mingyi")
        execute_command(ssh, "sudo ln -s /etc/nginx/sites-available/mingyi /etc/nginx/sites-enabled/mingyi")
        
        # 5. 测试并重载Nginx
        print("\n🔍 测试Nginx配置...")
        output, error = execute_command(ssh, "sudo nginx -t")
        print(output)
        if error:
            print("错误:", error)
        
        print("\n🔄 重载Nginx...")
        execute_command(ssh, "sudo systemctl reload nginx")
        
        # 6. 验证文件权限
        print("\n🔐 检查文件权限...")
        output, _ = execute_command(ssh, f"ls -la {PROJECT_PATH}/frontend/ | head -5")
        print(output)
        
        # 设置正确的权限
        execute_command(ssh, f"sudo chmod -R 755 {PROJECT_PATH}/frontend/")
        execute_command(ssh, f"sudo chown -R www-data:www-data {PROJECT_PATH}/frontend/")
        
        print("\n✅ Nginx修复完成!")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_nginx()