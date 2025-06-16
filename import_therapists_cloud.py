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

def import_therapists():
    """导入技师数据"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 运行技师导入脚本
        print("🌱 导入技师数据...")
        output, error = execute_command(ssh, "cd /home/ubuntu/mingyi-platform && node scripts/seed-therapists.js 2>&1")
        print("导入结果:")
        print(output)
        if error:
            print("错误信息:")
            print(error)
        
        # 2. 如果上面失败，尝试seed-all-data.js
        print("\n🌱 尝试导入所有数据...")
        output, error = execute_command(ssh, "cd /home/ubuntu/mingyi-platform && node scripts/seed-all-data.js 2>&1 | tail -20")
        print("导入结果:")
        print(output)
        
        # 3. 检查技师数量
        print("\n📊 检查技师数量...")
        check_script = """
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mingyi.db');

db.serialize(() => {
    db.get('SELECT COUNT(*) as count FROM therapists', (err, row) => {
        console.log('技师总数:', row ? row.count : 0);
    });
    
    db.all('SELECT id, name, store_id FROM therapists LIMIT 5', (err, rows) => {
        if (rows && rows.length > 0) {
            console.log('\\n前5个技师:');
            rows.forEach(t => console.log(`  ID: ${t.id}, 名称: ${t.name}, 门店ID: ${t.store_id}`));
        }
    });
});

db.close();
"""
        execute_command(ssh, f"cd /home/ubuntu/mingyi-platform && cat > check_therapists.js << 'EOF'\n{check_script}\nEOF")
        output, _ = execute_command(ssh, "cd /home/ubuntu/mingyi-platform && node check_therapists.js")
        print(output)
        
        # 4. 最终测试
        print("\n🧪 最终测试技师搜索API...")
        output, _ = execute_command(ssh, 'curl -s "http://emagen.323424.xyz/api/client/therapists/search?page=1&limit=5" | python3 -m json.tool')
        print(output)
        
        # 清理
        execute_command(ssh, "cd /home/ubuntu/mingyi-platform && rm -f check_therapists.js")
        
        print("\n✅ 导入完成!")
        
    except Exception as e:
        print(f"\n❌ 导入失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    import_therapists()