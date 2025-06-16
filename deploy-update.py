import paramiko
import os

def deploy_update():
    hostname = '43.167.226.222'
    username = 'ubuntu'
    password = '20031758wW@'
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔌 连接服务器...")
        ssh.connect(hostname, username=username, password=password)
        
        # 创建SFTP客户端
        sftp = ssh.open_sftp()
        
        # 1. 上传更新的源文件
        print("\n📤 上传更新的源文件...")
        source_files = [
            ('src/app.js', '/home/ubuntu/mingyi-platform/src/app.js'),
        ]
        
        for local_file, remote_file in source_files:
            if os.path.exists(local_file):
                sftp.put(local_file, remote_file)
                print(f"   ✅ 更新 {local_file}")
        
        # 2. 上传报告文件到正确位置
        print("\n📤 上传报告文件...")
        report_files = [
            ('api-test-report.html', '/home/ubuntu/mingyi-platform/api-test-report.html'),
            ('final-api-report.html', '/home/ubuntu/mingyi-platform/final-api-report.html'),
            ('frontend-test-report.html', '/home/ubuntu/mingyi-platform/frontend-test-report.html'),
            ('test-frontend-crud.html', '/home/ubuntu/mingyi-platform/test-frontend-crud.html')
        ]
        
        for local_file, remote_file in report_files:
            if os.path.exists(local_file):
                sftp.put(local_file, remote_file)
                print(f"   ✅ 上传 {local_file}")
        
        sftp.close()
        
        # 3. 重启服务
        print("\n🔄 重启服务...")
        stdin, stdout, stderr = ssh.exec_command('cd /home/ubuntu/mingyi-platform && pm2 restart mingyi-platform')
        print(stdout.read().decode())
        
        # 4. 测试报告访问
        print("\n🧪 测试报告访问...")
        test_urls = [
            '/api-test-report.html',
            '/final-api-report.html',
            '/frontend-test-report.html',
            '/health'
        ]
        
        for url in test_urls:
            stdin, stdout, stderr = ssh.exec_command(f'curl -s -o /dev/null -w "%{{http_code}}" http://localhost:8089{url}')
            status_code = stdout.read().decode().strip()
            print(f"   {url}: {status_code}")
        
        print("\n✅ 更新部署完成！")
        print("\n📊 访问报告：")
        print("   综合验证报告: http://emagen.323424.xyz/final-api-report.html")
        print("   详细测试报告: http://emagen.323424.xyz/api-test-report.html")
        print("   前端测试报告: http://emagen.323424.xyz/frontend-test-report.html")
        print("   前端CRUD测试: http://emagen.323424.xyz/test-frontend-crud.html")
        
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy_update()