#!/bin/bash

# 自动部署脚本
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASS="20031758wW@"

echo "🚀 开始自动部署到云服务器..."

# 创建expect脚本来处理密码
cat > deploy-expect.exp << 'EOF'
#!/usr/bin/expect -f

set timeout 300
set server [lindex $argv 0]
set user [lindex $argv 1]
set password [lindex $argv 2]

# 上传文件
spawn scp -o StrictHostKeyChecking=no mingyi-platform.tar.gz server-deploy.sh $user@$server:~/
expect {
    "password:" {
        send "$password\r"
        expect eof
    }
    eof { exit 1 }
}

# SSH连接并执行部署脚本
spawn ssh -o StrictHostKeyChecking=no $user@$server
expect {
    "password:" {
        send "$password\r"
    }
    eof { exit 1 }
}

expect "$ " {
    send "chmod +x server-deploy.sh\r"
}

expect "$ " {
    send "./server-deploy.sh\r"
}

expect "✅ 部署完成！" {
    send "exit\r"
}

expect eof
EOF

# 检查expect是否安装
if ! command -v expect &> /dev/null; then
    echo "❌ expect未安装，尝试使用Python脚本..."
    
    # 创建Python部署脚本
    cat > auto_deploy.py << 'PYEOF'
import paramiko
import sys
import time

def deploy():
    # 服务器信息
    hostname = '43.167.226.222'
    username = 'ubuntu'
    password = '20031758wW@'
    
    # 创建SSH客户端
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # 连接服务器
        print("🔌 连接服务器...")
        ssh.connect(hostname, username=username, password=password)
        
        # 创建SFTP客户端上传文件
        print("📤 上传文件...")
        sftp = ssh.open_sftp()
        sftp.put('mingyi-platform.tar.gz', '/home/ubuntu/mingyi-platform.tar.gz')
        sftp.put('server-deploy.sh', '/home/ubuntu/server-deploy.sh')
        sftp.close()
        
        # 执行部署命令
        commands = [
            'chmod +x server-deploy.sh',
            './server-deploy.sh'
        ]
        
        for cmd in commands:
            print(f"执行: {cmd}")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            
            # 实时输出
            for line in stdout:
                print(line.strip())
            
            # 检查错误
            errors = stderr.read().decode()
            if errors and 'sudo' not in errors:
                print(f"警告: {errors}")
        
        print("\n✅ 自动部署完成！")
        print(f"🌐 访问地址: http://emagen.323424.xyz")
        
    except Exception as e:
        print(f"❌ 部署失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy()
PYEOF

    # 检查paramiko是否安装
    if python3 -c "import paramiko" 2>/dev/null; then
        echo "📦 使用Python进行自动部署..."
        python3 auto_deploy.py
    else
        echo "❌ 需要安装paramiko: pip3 install paramiko"
        echo "请手动执行以下命令进行部署："
        echo "1. scp mingyi-platform.tar.gz server-deploy.sh ubuntu@$SERVER_IP:~/"
        echo "2. ssh ubuntu@$SERVER_IP"
        echo "3. chmod +x server-deploy.sh && ./server-deploy.sh"
    fi
else
    echo "📦 使用expect进行自动部署..."
    chmod +x deploy-expect.exp
    ./deploy-expect.exp $SERVER_IP $SERVER_USER "$SERVER_PASS"
fi

echo ""
echo "🎉 部署流程完成！"
echo "📍 访问地址："
echo "   客户端: http://emagen.323424.xyz/frontend/index.html"
echo "   管理端: http://emagen.323424.xyz/frontend/admin.html"
echo "   健康检查: http://emagen.323424.xyz/health"
echo "   API文档: http://emagen.323424.xyz/docs/API-Usage-Guide.md"