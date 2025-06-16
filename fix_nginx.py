import paramiko

def fix_nginx():
    hostname = '43.167.226.222'
    username = 'ubuntu'
    password = '20031758wW@'
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔌 连接服务器修复Nginx配置...")
        ssh.connect(hostname, username=username, password=password)
        
        # 删除旧的配置
        print("🧹 清理旧配置...")
        commands = [
            'sudo rm -f /etc/nginx/sites-enabled/postgresql-*',
            'sudo rm -f /etc/nginx/sites-available/postgresql-*',
            'sudo rm -f /etc/nginx/sites-enabled/emagen*',
            'sudo rm -f /etc/nginx/sites-available/emagen*',
            'sudo systemctl reload nginx'
        ]
        
        for cmd in commands:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            stdout.read()
        
        # 测试直接访问
        print("\n🔍 测试本地访问:")
        stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:8089/health')
        health_response = stdout.read().decode()
        print(f"健康检查响应: {health_response}")
        
        # 检查Nginx日志
        print("\n📝 Nginx错误日志:")
        stdin, stdout, stderr = ssh.exec_command('sudo tail -20 /var/log/nginx/error.log')
        print(stdout.read().decode())
        
        # 重新测试外部访问
        print("\n🌐 测试配置后的外部访问...")
        
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_nginx()