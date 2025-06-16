import paramiko
import time

def check_server():
    hostname = '43.167.226.222'
    username = 'ubuntu'
    password = '20031758wW@'
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔌 连接服务器检查状态...")
        ssh.connect(hostname, username=username, password=password)
        
        # 检查PM2状态
        print("\n📊 PM2进程状态:")
        stdin, stdout, stderr = ssh.exec_command('pm2 status')
        print(stdout.read().decode())
        
        # 检查日志
        print("\n📝 最近的应用日志:")
        stdin, stdout, stderr = ssh.exec_command('pm2 logs mingyi-platform --lines 20 --nostream')
        output = stdout.read().decode()
        if output:
            print(output)
        
        # 检查端口
        print("\n🔍 检查端口8089:")
        stdin, stdout, stderr = ssh.exec_command('netstat -tlnp | grep 8089')
        port_output = stdout.read().decode()
        if port_output:
            print("端口8089已监听")
        else:
            print("端口8089未监听，尝试重启服务...")
            
            # 重启服务
            stdin, stdout, stderr = ssh.exec_command('cd /home/ubuntu/mingyi-platform && pm2 restart mingyi-platform')
            print(stdout.read().decode())
            
            time.sleep(3)
            
            # 再次检查日志
            print("\n📝 重启后的日志:")
            stdin, stdout, stderr = ssh.exec_command('pm2 logs mingyi-platform --lines 10 --nostream')
            print(stdout.read().decode())
        
        # 检查Nginx配置
        print("\n🔧 Nginx配置状态:")
        stdin, stdout, stderr = ssh.exec_command('sudo nginx -t')
        print(stderr.read().decode())
        
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    check_server()