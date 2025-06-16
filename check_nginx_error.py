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

def check_nginx():
    """检查Nginx错误"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查Nginx错误日志
        print("📋 Nginx错误日志:")
        output, _ = execute_command(ssh, "sudo tail -30 /var/log/nginx/error.log")
        print(output)
        
        # 2. 检查Nginx配置
        print("\n📄 Nginx站点配置:")
        output, _ = execute_command(ssh, "ls -la /etc/nginx/sites-enabled/")
        print(output)
        
        # 3. 查看default配置
        print("\n📄 Default配置内容:")
        output, _ = execute_command(ssh, "sudo cat /etc/nginx/sites-enabled/default | head -20")
        print(output)
        
        # 4. 测试直接访问文件
        print("\n🔍 测试直接访问index.html:")
        output, _ = execute_command(ssh, "sudo -u www-data cat /home/ubuntu/mingyi-platform/frontend/index.html | head -5")
        print(output)
        
        # 5. 检查文件权限
        print("\n🔐 检查详细权限:")
        output, _ = execute_command(ssh, "namei -l /home/ubuntu/mingyi-platform/frontend/index.html")
        print(output)
        
    except Exception as e:
        print(f"\n❌ 检查失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    check_nginx()