#!/usr/bin/env python3
import paramiko
import sys

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

def check_backend():
    """检查后端服务状态"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查PM2日志
        print("📋 检查PM2日志...")
        output, _ = execute_command(ssh, "pm2 logs mingyi-platform --lines 20 --nostream")
        print(output)
        
        # 2. 检查端口监听
        print("\n🔍 检查端口监听...")
        output, _ = execute_command(ssh, "sudo netstat -tlnp | grep :3001 || echo '端口3001未监听'")
        print(output)
        
        # 3. 查看app.js配置
        print("\n📄 检查app.js端口配置...")
        output, _ = execute_command(ssh, "grep -n 'PORT\\|port\\|3001\\|8089' /home/ubuntu/mingyi-platform/src/app.js | head -10")
        print(output)
        
        # 4. 重新启动并指定端口
        print("\n🚀 重新启动服务...")
        execute_command(ssh, "pm2 delete mingyi-platform || true")
        output, _ = execute_command(ssh, "cd /home/ubuntu/mingyi-platform && PORT=3001 pm2 start src/app.js --name mingyi-platform --env 'PORT=3001'")
        print(output)
        
        # 等待启动
        execute_command(ssh, "sleep 3")
        
        # 5. 再次检查端口
        print("\n🔍 再次检查端口监听...")
        output, _ = execute_command(ssh, "sudo netstat -tlnp | grep :3001 || sudo netstat -tlnp | grep node")
        print(output)
        
        # 6. 测试本地API
        print("\n🧪 测试本地API...")
        output, _ = execute_command(ssh, "curl -v http://localhost:3001/api/client/stores 2>&1 | grep -E 'HTTP|Connected|success' | head -10")
        print(output)
        
        # 7. 检查实际监听的端口
        print("\n📊 所有Node.js进程监听的端口...")
        output, _ = execute_command(ssh, "sudo lsof -i -P -n | grep LISTEN | grep node")
        print(output)
        
    except Exception as e:
        print(f"\n❌ 检查失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    check_backend()