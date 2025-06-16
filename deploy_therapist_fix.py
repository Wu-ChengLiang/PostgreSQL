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

def deploy_fix():
    """部署技师服务修复"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!\n")
        
        # 1. 查看当前的therapistService.js
        print("📋 检查当前代码...")
        output, _ = execute_command(ssh, "grep -n 'const countResult' /home/ubuntu/mingyi-platform/src/services/therapistService.js | head -4")
        print("当前代码:")
        print(output)
        
        # 2. 应用修复
        print("\n🔧 应用修复...")
        
        # 修复searchTherapists中的解构
        execute_command(ssh, """cd /home/ubuntu/mingyi-platform && sed -i '48s/const { count } = await db.get(countQuery, params);/const countResult = await db.get(countQuery, params);\\nconst count = countResult \\&\\& countResult.count !== undefined ? countResult.count : 0;/' src/services/therapistService.js""")
        
        # 修复getTherapistList中的解构
        execute_command(ssh, """cd /home/ubuntu/mingyi-platform && sed -i '160s/const { count } = await db.get(countQuery, storeId ? \\[storeId\\] : \\[\\]);/const countResult = await db.get(countQuery, storeId ? [storeId] : []);\\nconst count = countResult \\&\\& countResult.count !== undefined ? countResult.count : 0;/' src/services/therapistService.js""")
        
        # 3. 验证修复
        print("\n📋 验证修复后的代码...")
        output, _ = execute_command(ssh, "grep -A1 'const countResult' /home/ubuntu/mingyi-platform/src/services/therapistService.js | head -8")
        print("修复后的代码:")
        print(output)
        
        # 4. 重启服务
        print("\n🔄 重启服务...")
        execute_command(ssh, "pm2 restart mingyi-api")
        
        # 5. 等待服务启动
        print("\n⏳ 等待服务启动...")
        execute_command(ssh, "sleep 3")
        
        # 6. 测试修复
        print("\n🧪 测试修复效果...")
        
        # 测试技师搜索API
        output, _ = execute_command(ssh, '''curl -s "http://emagen.323424.xyz/api/client/therapists/search?page=1&limit=10" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print('✅ 技师搜索API修复成功')
        print(f'   找到 {data[\"data\"][\"total\"]} 个技师')
    else:
        print('❌ 技师搜索API仍有问题:', data.get('error', {}).get('message'))
except Exception as e:
    print('❌ API响应解析失败:', str(e))
"''')
        print(output)
        
        print("\n✅ 修复部署完成!")
        
    except Exception as e:
        print(f"\n❌ 部署失败: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy_fix()