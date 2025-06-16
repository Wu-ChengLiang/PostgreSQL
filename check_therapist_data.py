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

def check_data():
    """检查技师数据"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 检查数据库中的技师数量
        print("📋 检查数据库中的技师数据...")
        
        check_script = """
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'mingyi.db');
const db = new sqlite3.Database(dbPath);

// 检查技师表
db.get('SELECT COUNT(*) as count FROM therapists', (err, row) => {
    if (err) {
        console.error('查询失败:', err);
    } else {
        console.log('技师总数:', row.count);
    }
});

// 检查门店表
db.get('SELECT COUNT(*) as count FROM stores', (err, row) => {
    if (err) {
        console.error('查询失败:', err);
    } else {
        console.log('门店总数:', row.count);
    }
    
    db.close();
});
"""
        
        execute_command(ssh, f"cd /home/ubuntu/mingyi-platform && cat > check_data.js << 'EOF'\n{check_script}\nEOF")
        output, _ = execute_command(ssh, "cd /home/ubuntu/mingyi-platform && node check_data.js")
        print(output)
        
        # 2. 如果没有技师数据，导入种子数据
        print("\n🌱 导入技师数据...")
        
        # 先检查是否有种子数据脚本
        output, _ = execute_command(ssh, "ls /home/ubuntu/mingyi-platform/scripts/seed-*.js 2>/dev/null | head -5")
        print("找到的种子脚本:")
        print(output)
        
        # 运行种子数据脚本
        output, _ = execute_command(ssh, "cd /home/ubuntu/mingyi-platform && node scripts/seed-data.js 2>&1 | tail -20")
        print("\n种子数据导入结果:")
        print(output)
        
        # 3. 再次测试API
        print("\n🧪 再次测试技师搜索API...")
        output, _ = execute_command(ssh, 'curl -s "http://emagen.323424.xyz/api/client/therapists/search?page=1&limit=10" | jq . | head -20')
        print(output)
        
        # 清理临时文件
        execute_command(ssh, "cd /home/ubuntu/mingyi-platform && rm -f check_data.js")
        
        print("\n✅ 检查完成!")
        
    except Exception as e:
        print(f"\n❌ 检查失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    check_data()