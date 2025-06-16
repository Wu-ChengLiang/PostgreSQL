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
    return output, error

def check_server():
    """检查服务器状态"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查PM2状态
        print("📊 PM2状态:")
        output, _ = execute_command(ssh, "pm2 list")
        print(output)
        
        # 2. 检查最新日志
        print("\n📋 最新日志:")
        output, _ = execute_command(ssh, "pm2 logs mingyi-platform --lines 30 --nostream")
        print(output)
        
        # 3. 检查数据库文件
        print("\n🗄️ 数据库文件:")
        output, _ = execute_command(ssh, f"ls -la {PROJECT_PATH}/data/")
        print(output)
        
        # 4. 检查前端文件
        print("\n📁 前端文件:")
        output, _ = execute_command(ssh, f"ls -la {PROJECT_PATH}/frontend/ | head -10")
        print(output)
        
        # 5. 测试数据库连接
        print("\n🔍 测试数据库:")
        test_script = '''
const Database = require('./src/database/connection');

async function test() {
    try {
        const db = await Database.getInstance();
        
        // 查询门店
        const stores = await db.all('SELECT * FROM stores');
        console.log('门店数量:', stores.length);
        
        // 查询技师
        const therapists = await db.all('SELECT * FROM therapists');
        console.log('技师数量:', therapists.length);
        
        // 查询用户
        const users = await db.all('SELECT username, role FROM users');
        console.log('用户:', users);
        
    } catch (error) {
        console.error('错误:', error.message);
    }
    process.exit(0);
}

test();
'''
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > test_db.js << 'EOF'\n{test_script}\nEOF")
        output, error = execute_command(ssh, f"cd {PROJECT_PATH} && node test_db.js")
        print(output)
        if error:
            print("错误:", error)
        
    except Exception as e:
        print(f"\n❌ 检查失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    check_server()