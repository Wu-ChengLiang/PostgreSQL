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

def fix_frontend():
    """修复前端部署"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 备份当前前端目录
        print("📦 备份当前前端目录...")
        execute_command(ssh, f"mv {PROJECT_PATH}/frontend {PROJECT_PATH}/frontend_backup")
        
        # 2. 创建新的前端目录
        print("📂 创建新的前端目录...")
        execute_command(ssh, f"mkdir -p {PROJECT_PATH}/frontend")
        
        # 3. 查找项目中正确的前端文件
        print("🔍 查找正确的前端文件...")
        
        # 查找本地项目的前端文件
        frontend_files = [
            'index.html',
            'admin.html',
            'css/style.css',
            'css/admin.css',
            'css/style-enhanced.css',
            'js/client.js',
            'js/admin.js',
            'js/utils.js'
        ]
        
        # 创建前端目录结构
        execute_command(ssh, f"mkdir -p {PROJECT_PATH}/frontend/css")
        execute_command(ssh, f"mkdir -p {PROJECT_PATH}/frontend/js")
        
        # 4. 从GitHub获取最新的前端文件
        print("📥 获取最新前端文件...")
        
        # 创建临时目录
        execute_command(ssh, "rm -rf /tmp/frontend_temp && mkdir -p /tmp/frontend_temp")
        
        # 克隆仓库的前端部分
        output, error = execute_command(ssh, "cd /tmp && git clone --depth 1 https://github.com/Wu-ChengLiang/PostgreSQL.git frontend_temp")
        if error and "Cloning into" not in error:
            print(f"Git错误: {error}")
        
        # 复制正确的前端文件
        print("📋 复制前端文件...")
        execute_command(ssh, f"cp -r /tmp/frontend_temp/frontend/* {PROJECT_PATH}/frontend/ 2>/dev/null || true")
        
        # 5. 检查前端文件
        print("\n📂 检查前端文件结构:")
        output, _ = execute_command(ssh, f"ls -la {PROJECT_PATH}/frontend/")
        print(output)
        
        # 6. 清理所有Nginx配置
        print("\n🧹 清理Nginx配置...")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-enabled/*")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-available/*")
        
        # 7. 创建新的Nginx配置
        print("\n🔧 创建新的Nginx配置...")
        nginx_config = f'''server {{
    listen 80;
    server_name emagen.323424.xyz;

    root {PROJECT_PATH}/frontend;
    index index.html;

    # 处理静态文件
    location / {{
        try_files $uri $uri/ =404;
    }}

    # API代理
    location /api {{
        proxy_pass http://127.0.0.1:8089;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_buffering off;
    }}

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {{
        expires 1d;
        add_header Cache-Control "public, immutable";
    }}
}}'''
        
        # 写入配置
        execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/default")
        execute_command(ssh, "sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default")
        
        # 8. 设置权限
        print("\n🔐 设置文件权限...")
        execute_command(ssh, f"sudo chown -R www-data:www-data {PROJECT_PATH}/frontend")
        execute_command(ssh, f"sudo chmod -R 755 {PROJECT_PATH}/frontend")
        
        # 9. 测试并重载Nginx
        print("\n🔍 测试Nginx配置...")
        output, error = execute_command(ssh, "sudo nginx -t")
        print(output)
        if error:
            print(f"Nginx测试输出: {error}")
        
        print("\n🔄 重载Nginx...")
        execute_command(ssh, "sudo systemctl reload nginx")
        
        # 10. 检查服务状态
        print("\n📊 检查服务状态:")
        output, _ = execute_command(ssh, "sudo systemctl status nginx --no-pager | head -10")
        print(output)
        
        # 清理临时文件
        execute_command(ssh, "rm -rf /tmp/frontend_temp")
        
        print("\n✅ 修复完成!")
        print("🌐 请访问: http://emagen.323424.xyz")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_frontend()