import paramiko
import os

def update_deployment():
    # 服务器信息
    hostname = '43.167.226.222'
    username = 'ubuntu'
    password = '20031758wW@'
    
    # 创建SSH客户端
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # 连接服务器
        print("🔌 连接服务器...")
        ssh.connect(hostname, username=username, password=password)
        
        # 创建SFTP客户端
        sftp = ssh.open_sftp()
        
        # 上传更新的文件
        print("📤 上传更新的文件...")
        files_to_update = [
            ('frontend/js/client.js', '/home/ubuntu/mingyi-platform/frontend/js/client.js'),
            ('frontend/js/admin.js', '/home/ubuntu/mingyi-platform/frontend/js/admin.js'),
        ]
        
        for local_file, remote_file in files_to_update:
            if os.path.exists(local_file):
                sftp.put(local_file, remote_file)
                print(f"   ✅ 更新 {local_file}")
            else:
                print(f"   ❌ 文件不存在: {local_file}")
        
        sftp.close()
        
        # 重启服务
        print("\n🔄 重启服务...")
        stdin, stdout, stderr = ssh.exec_command('cd /home/ubuntu/mingyi-platform && pm2 restart mingyi-platform')
        print(stdout.read().decode())
        
        # 测试前端功能
        print("\n🧪 测试前端功能...")
        
        # 测试门店加载
        print("\n1. 测试门店API:")
        stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:8089/api/v1/client/stores | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\'门店数量: {len(d[\\\"data\\\"][\\\"stores\\\"])}\')"')
        print(stdout.read().decode())
        
        # 测试技师搜索
        print("\n2. 测试技师搜索:")
        stdin, stdout, stderr = ssh.exec_command('curl -s "http://localhost:8089/api/v1/client/therapists/search?limit=3" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\'技师数量: {len(d[\\\"data\\\"][\\\"therapists\\\"])}\')"')
        print(stdout.read().decode())
        
        print("\n✅ 更新完成！")
        print("\n📱 请访问以下地址测试:")
        print("   客户端: http://emagen.323424.xyz/frontend/index.html")
        print("   管理端: http://emagen.323424.xyz/frontend/admin.html")
        print("\n🔍 测试要点:")
        print("   1. 门店下拉框应该显示23家门店")
        print("   2. 选择日期后，时间下拉框应该显示可选时间")
        print("   3. 技师搜索功能应该正常工作")
        
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    update_deployment()