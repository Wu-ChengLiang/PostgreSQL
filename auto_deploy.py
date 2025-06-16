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
