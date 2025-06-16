#!/usr/bin/env python3
import paramiko
import os

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

def create_frontend_files(ssh):
    """创建前端文件"""
    print("📝 创建前端文件...")
    
    # 读取本地前端文件
    frontend_files = {
        'index.html': open('frontend/index.html', 'r').read(),
        'admin.html': open('frontend/admin.html', 'r').read(),
        'css/style.css': open('frontend/css/style.css', 'r').read(),
        'css/admin.css': open('frontend/css/admin.css', 'r').read(),
        'css/style-enhanced.css': open('frontend/css/style-enhanced.css', 'r').read(),
        'js/client.js': open('frontend/js/client.js', 'r').read(),
        'js/admin.js': open('frontend/js/admin.js', 'r').read(),
        'js/utils.js': open('frontend/js/utils.js', 'r').read()
    }
    
    # 清理并创建前端目录
    execute_command(ssh, f"rm -rf {PROJECT_PATH}/frontend_new")
    execute_command(ssh, f"mkdir -p {PROJECT_PATH}/frontend_new/css")
    execute_command(ssh, f"mkdir -p {PROJECT_PATH}/frontend_new/js")
    
    # 写入文件
    for filepath, content in frontend_files.items():
        # 转义单引号
        content_escaped = content.replace("'", "'\"'\"'")
        
        # 写入文件
        full_path = f"{PROJECT_PATH}/frontend_new/{filepath}"
        execute_command(ssh, f"cat > {full_path} << 'EOF'\n{content}\nEOF")
        print(f"  ✅ 创建 {filepath}")
    
    # 替换旧的前端目录
    execute_command(ssh, f"rm -rf {PROJECT_PATH}/frontend_old")
    execute_command(ssh, f"mv {PROJECT_PATH}/frontend {PROJECT_PATH}/frontend_old || true")
    execute_command(ssh, f"mv {PROJECT_PATH}/frontend_new {PROJECT_PATH}/frontend")

def deploy_frontend():
    """部署前端"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 创建前端文件
        create_frontend_files(ssh)
        
        # 2. 设置权限
        print("\n🔐 设置文件权限...")
        execute_command(ssh, f"sudo chown -R www-data:www-data {PROJECT_PATH}/frontend")
        execute_command(ssh, f"sudo chmod -R 755 {PROJECT_PATH}/frontend")
        
        # 3. 检查文件
        print("\n📂 检查前端文件:")
        output, _ = execute_command(ssh, f"ls -la {PROJECT_PATH}/frontend/")
        print(output)
        output, _ = execute_command(ssh, f"ls -la {PROJECT_PATH}/frontend/css/")
        print("CSS文件:", output)
        output, _ = execute_command(ssh, f"ls -la {PROJECT_PATH}/frontend/js/")
        print("JS文件:", output)
        
        # 4. 重新配置Nginx
        print("\n🔧 更新Nginx配置...")
        nginx_config = f'''server {{
    listen 80;
    server_name emagen.323424.xyz;

    root {PROJECT_PATH}/frontend;
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location /api {{
        proxy_pass http://127.0.0.1:8089;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {{
        expires 1d;
        add_header Cache-Control "public";
    }}
}}'''
        
        execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/default")
        execute_command(ssh, "sudo nginx -t")
        execute_command(ssh, "sudo systemctl reload nginx")
        
        print("\n✅ 部署完成!")
        print("🌐 请访问: http://emagen.323424.xyz")
        
    except Exception as e:
        print(f"\n❌ 部署失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    # 检查本地文件是否存在
    if not os.path.exists('frontend/index.html'):
        print("❌ 错误：找不到本地前端文件！")
        print("请确保在项目根目录运行此脚本")
        exit(1)
    
    deploy_frontend()