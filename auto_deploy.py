#!/usr/bin/env python3
import paramiko
import time

# 服务器配置
SERVER_IP = "43.167.226.222"
SERVER_USER = "ubuntu"
SERVER_PASS = "20031758wW@"
DOMAIN = "emagen.323424.xyz"

# 项目配置
PROJECT_NAME = "mingyi-platform"
PROJECT_PATH = "/home/ubuntu/mingyi-platform"
GIT_REPO = "https://github.com/Wu-ChengLiang/PostgreSQL.git"

def execute_command(ssh, command, show_output=True):
    """执行SSH命令并返回输出"""
    stdin, stdout, stderr = ssh.exec_command(command)
    
    if show_output:
        print(f"执行命令: {command}")
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if output:
            print(f"输出: {output}")
        if error:
            print(f"错误: {error}")
    
    return stdout.channel.recv_exit_status()

def deploy():
    """主部署函数"""
    print("🚀 开始部署到云服务器...")
    
    # 创建SSH客户端
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # 连接服务器
        print(f"📡 连接到服务器 {SERVER_IP}...")
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!")
        
        # 1. 停止旧服务
        print("\n📋 停止旧服务...")
        execute_command(ssh, "pm2 stop all || true")
        execute_command(ssh, "pm2 delete all || true")
        
        # 2. 更新代码
        print("\n📦 更新代码...")
        execute_command(ssh, f"cd /home/ubuntu && rm -rf {PROJECT_NAME}")
        execute_command(ssh, f"cd /home/ubuntu && git clone {GIT_REPO} {PROJECT_NAME}")
        
        # 3. 安装依赖
        print("\n📚 安装依赖...")
        execute_command(ssh, f"cd {PROJECT_PATH} && npm install")
        
        # 4. 初始化数据库
        print("\n🗄️ 初始化数据库...")
        execute_command(ssh, f"cd {PROJECT_PATH} && npm run init-db")
        execute_command(ssh, f"cd {PROJECT_PATH} && npm run seed")
        
        # 5. 启动服务
        print("\n🚀 启动新服务...")
        execute_command(ssh, f"cd {PROJECT_PATH} && PORT=8089 pm2 start src/app.js --name {PROJECT_NAME}")
        execute_command(ssh, "pm2 save")
        
        # 6. 配置Nginx
        print("\n🔧 配置Nginx...")
        nginx_config = f"""server {{
    listen 80;
    server_name {DOMAIN};

    location / {{
        root {PROJECT_PATH}/frontend;
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
        
        # 写入Nginx配置
        execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/{DOMAIN}")
        
        # 启用站点
        execute_command(ssh, f"sudo ln -sf /etc/nginx/sites-available/{DOMAIN} /etc/nginx/sites-enabled/")
        execute_command(ssh, "sudo nginx -t")
        execute_command(ssh, "sudo systemctl reload nginx")
        
        # 7. 查看服务状态
        print("\n📊 服务状态...")
        execute_command(ssh, "pm2 list")
        
        print(f"\n✅ 部署完成!")
        print(f"🌐 访问地址: http://{DOMAIN}")
        
    except Exception as e:
        print(f"\n❌ 部署失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy()