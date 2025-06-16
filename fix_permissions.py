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

def fix_permissions():
    """修复权限问题"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 修复/home/ubuntu目录权限
        print("🔐 修复目录权限...")
        execute_command(ssh, "chmod 755 /home/ubuntu")
        execute_command(ssh, "chmod 755 /home/ubuntu/mingyi-platform")
        
        # 2. 确保frontend目录权限正确
        execute_command(ssh, "sudo chown -R www-data:www-data /home/ubuntu/mingyi-platform/frontend")
        execute_command(ssh, "sudo chmod -R 755 /home/ubuntu/mingyi-platform/frontend")
        
        # 3. 验证权限
        print("\n📂 验证权限:")
        output, _ = execute_command(ssh, "ls -la /home/ubuntu/")
        print("Ubuntu目录:", output.split('\n')[0])
        
        output, _ = execute_command(ssh, "ls -la /home/ubuntu/mingyi-platform/")
        print("项目目录:", output.split('\n')[0])
        
        output, _ = execute_command(ssh, "ls -la /home/ubuntu/mingyi-platform/frontend/")
        print("前端目录:", output.split('\n')[0])
        
        # 4. 测试www-data用户访问
        print("\n🔍 测试www-data用户访问:")
        output, _ = execute_command(ssh, "sudo -u www-data ls /home/ubuntu/mingyi-platform/frontend/index.html")
        print("测试结果:", output if output else "✅ 可以访问")
        
        # 5. 重载Nginx
        print("\n🔄 重载Nginx...")
        execute_command(ssh, "sudo systemctl reload nginx")
        
        print("\n✅ 权限修复完成!")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_permissions()