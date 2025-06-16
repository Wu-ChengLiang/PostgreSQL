#!/usr/bin/env python3
import paramiko
import sys
import time

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
    if error and not error.startswith("npm WARN"):
        print(f"⚠️  错误: {error}")
    return output, error

def deploy_fixes():
    """部署修复到云服务器"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🚀 开始部署修复到云服务器...")
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ SSH连接成功!\n")
        
        # 1. 停止现有服务
        print("🛑 停止现有服务...")
        execute_command(ssh, "pm2 stop mingyi-platform || true")
        
        # 2. 备份当前代码
        print("\n📦 备份当前代码...")
        execute_command(ssh, f"cd /home/ubuntu && tar -czf mingyi-backup-$(date +%Y%m%d_%H%M%S).tar.gz mingyi-platform")
        
        # 3. 更新therapistService.js - 修复解构问题
        print("\n🔧 修复技师服务中的解构问题...")
        therapist_fix = """
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/therapistService.js');
let content = fs.readFileSync(filePath, 'utf8');

// 修复searchTherapists中的count解构
content = content.replace(
    'const countResult = await db.get(countQuery, params);\\n            const count = countResult ? countResult.count : 0;',
    'const countResult = await db.get(countQuery, params);\\n            const count = countResult && countResult.count !== undefined ? countResult.count : 0;'
);

// 修复getTherapistList中的count解构
content = content.replace(
    'const countResult = await db.get(countQuery, storeId ? [storeId] : []);\\n            const count = countResult ? countResult.count : 0;',
    'const countResult = await db.get(countQuery, storeId ? [storeId] : []);\\n            const count = countResult && countResult.count !== undefined ? countResult.count : 0;'
);

fs.writeFileSync(filePath, content);
console.log('✅ therapistService.js 修复完成');
"""
        
        # 创建修复脚本
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > fix_therapist.js << 'EOF'\n{therapist_fix}\nEOF")
        output, _ = execute_command(ssh, f"cd {PROJECT_PATH} && node fix_therapist.js")
        print(output)
        
        # 4. 创建管理员账户修复脚本
        print("\n🔧 创建管理员账户修复脚本...")
        admin_fix_script = """
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'mingyi.db');
const db = new sqlite3.Database(dbPath);

async function fixAdmin() {
    console.log('🔍 检查管理员账户...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    return new Promise((resolve) => {
        // 先检查admins表
        db.all('SELECT * FROM admins WHERE username = ?', ['admin'], (err, rows) => {
            if (err) {
                console.error('查询失败:', err);
                db.close();
                resolve();
                return;
            }
            
            if (rows.length === 0) {
                console.log('创建管理员账户...');
                db.run(`
                    INSERT INTO admins (username, password_hash, role, is_active)
                    VALUES ('admin', ?, 'super_admin', 1)
                `, [hashedPassword], (err) => {
                    if (err) {
                        console.error('创建失败:', err);
                    } else {
                        console.log('✅ 管理员创建成功');
                    }
                    db.close();
                    resolve();
                });
            } else {
                console.log('更新管理员密码...');
                db.run('UPDATE admins SET password_hash = ? WHERE username = ?', [hashedPassword, 'admin'], (err) => {
                    if (err) {
                        console.error('更新失败:', err);
                    } else {
                        console.log('✅ 密码更新成功');
                    }
                    db.close();
                    resolve();
                });
            }
        });
    });
}

fixAdmin().then(() => {
    console.log('管理员账户处理完成');
});
"""
        
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > fix_admin.js << 'EOF'\n{admin_fix_script}\nEOF")
        output, _ = execute_command(ssh, f"cd {PROJECT_PATH} && node fix_admin.js")
        print(output)
        
        # 5. 重新启动服务
        print("\n🚀 重新启动服务...")
        execute_command(ssh, "cd /home/ubuntu/mingyi-platform && pm2 start src/app.js --name mingyi-platform")
        
        # 等待服务启动
        print("\n⏳ 等待服务启动...")
        time.sleep(5)
        
        # 6. 测试修复结果
        print("\n🧪 测试修复结果...")
        
        # 测试技师搜索API
        test_therapist = """
curl -s "http://localhost:3001/api/client/therapists/search?page=1&limit=10" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print('✅ 技师搜索API正常工作')
        print(f'   找到 {data[\"data\"][\"total\"]} 个技师')
    else:
        print('❌ 技师搜索API失败:', data.get('message'))
except:
    print('❌ API响应解析失败')
"
"""
        output, _ = execute_command(ssh, test_therapist)
        print(output)
        
        # 测试管理员登录API
        test_admin = """
curl -s -X POST "http://localhost:3001/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print('✅ 管理员登录API正常工作')
        print(f'   Token: {data[\"data\"][\"token\"][:20]}...')
    else:
        print('❌ 管理员登录API失败:', data.get('message'))
except Exception as e:
    print('❌ API响应解析失败:', str(e))
"
"""
        output, _ = execute_command(ssh, test_admin)
        print(output)
        
        # 7. 清理临时文件
        print("\n🧹 清理临时文件...")
        execute_command(ssh, f"cd {PROJECT_PATH} && rm -f fix_therapist.js fix_admin.js")
        
        print("\n✅ 部署完成!")
        print("\n📋 下一步:")
        print("1. 访问前端页面: http://emagen.323424.xyz")
        print("2. 管理员登录: http://emagen.323424.xyz/admin.html")
        print("   用户名: admin")
        print("   密码: admin123")
        
    except Exception as e:
        print(f"\n❌ 部署失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy_fixes()