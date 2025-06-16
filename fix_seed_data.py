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

def fix_database():
    """修复数据库"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!")
        
        # 创建初始化脚本
        init_script = '''
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/mingyi.db');
const db = new sqlite3.Database(dbPath);

console.log('开始初始化数据库...');

// 读取schema
const fs = require('fs');
const schema = fs.readFileSync(path.join(__dirname, '../src/database/schema.sql'), 'utf8');

// 执行schema
db.exec(schema, (err) => {
    if (err) {
        console.error('Schema执行失败:', err);
    } else {
        console.log('✅ Schema执行成功');
    }
    db.close();
});
'''
        
        # 写入初始化脚本
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > scripts/init-db.js << 'EOF'\n{init_script}\nEOF")
        
        # 创建data目录
        execute_command(ssh, f"cd {PROJECT_PATH} && mkdir -p data")
        
        # 初始化数据库
        print("\n🗄️ 重新初始化数据库...")
        execute_command(ssh, f"cd {PROJECT_PATH} && node scripts/init-db.js")
        
        # 再次运行种子数据
        print("\n🌱 重新导入种子数据...")
        execute_command(ssh, f"cd {PROJECT_PATH} && node scripts/seed-data.js")
        
        # 重启服务
        print("\n🔄 重启服务...")
        execute_command(ssh, f"pm2 restart mingyi-platform")
        
        print("\n✅ 修复完成!")
        
    except Exception as e:
        print(f"\n❌ 修复失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_database()