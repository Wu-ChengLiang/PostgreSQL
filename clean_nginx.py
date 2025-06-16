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

def clean_nginx():
    """彻底清理并重新配置Nginx"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 查看所有站点配置
        print("📋 当前所有站点配置:")
        output, _ = execute_command(ssh, "ls -la /etc/nginx/sites-enabled/")
        print(output)
        
        # 2. 删除所有emagen相关配置
        print("\n🧹 删除所有相关配置...")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-enabled/*emagen*")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-available/*emagen*")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-enabled/mingyi")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-available/mingyi")
        
        # 3. 查看剩余配置
        print("\n📋 清理后的配置:")
        output, _ = execute_command(ssh, "ls -la /etc/nginx/sites-enabled/")
        print(output)
        
        # 4. 重载Nginx
        print("\n🔄 重载Nginx...")
        execute_command(ssh, "sudo systemctl reload nginx")
        
        print("\n✅ 清理完成!")
        
    except Exception as e:
        print(f"\n❌ 清理失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    clean_nginx()