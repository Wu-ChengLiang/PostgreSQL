#!/usr/bin/env python3
import paramiko

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
    print(f"命令: {command}")
    if output:
        print(f"输出: {output}")
    if error:
        print(f"错误: {error}")
    return stdout.channel.recv_exit_status()

def init_database():
    """初始化数据库"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!")
        
        # 初始化数据库
        print("\n🗄️ 初始化数据库...")
        execute_command(ssh, f"cd {PROJECT_PATH} && node scripts/init-db.js")
        
        # 导入种子数据
        print("\n🌱 导入种子数据...")
        execute_command(ssh, f"cd {PROJECT_PATH} && node scripts/seed-data.js")
        
        print("\n✅ 数据库初始化完成!")
        
    except Exception as e:
        print(f"\n❌ 初始化失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    init_database()