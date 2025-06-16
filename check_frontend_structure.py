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

def check_frontend():
    """检查前端目录结构"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查前端目录内容
        print("📂 前端目录内容:")
        output, _ = execute_command(ssh, "ls -la /home/ubuntu/mingyi-platform/frontend/")
        print(output)
        
        # 2. 检查index.html内容
        print("\n📄 检查index.html:")
        output, _ = execute_command(ssh, "head -20 /home/ubuntu/mingyi-platform/frontend/index.html")
        print(output)
        
        # 3. 这个看起来像是Next.js项目，需要编译
        print("\n🔍 检查package.json:")
        output, _ = execute_command(ssh, "cat /home/ubuntu/mingyi-platform/frontend/package.json | grep -E '\"scripts\"|\"next\"|\"react\"' -A 5")
        print(output)
        
        # 4. 检查根目录的frontend
        print("\n📂 查找其他frontend目录:")
        output, _ = execute_command(ssh, "find /home/ubuntu/mingyi-platform -name 'index.html' -type f | grep -v node_modules | head -10")
        print(output)
        
    except Exception as e:
        print(f"\n❌ 检查失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    check_frontend()