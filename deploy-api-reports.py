import paramiko

def deploy_reports():
    hostname = '43.167.226.222'
    username = 'ubuntu'
    password = '20031758wW@'
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔌 连接服务器...")
        ssh.connect(hostname, username=username, password=password)
        
        # 上传报告文件
        print("📤 上传API测试报告...")
        sftp = ssh.open_sftp()
        
        files_to_upload = [
            ('api-test-report.html', '/home/ubuntu/mingyi-platform/api-test-report.html'),
            ('final-api-report.html', '/home/ubuntu/mingyi-platform/final-api-report.html')
        ]
        
        for local_file, remote_file in files_to_upload:
            try:
                sftp.put(local_file, remote_file)
                print(f"   ✅ 上传 {local_file}")
            except Exception as e:
                print(f"   ❌ 上传失败 {local_file}: {str(e)}")
        
        sftp.close()
        
        print("\n✅ 报告部署完成！")
        print("\n📊 访问报告：")
        print("   详细测试报告: http://emagen.323424.xyz/api-test-report.html")
        print("   综合验证报告: http://emagen.323424.xyz/final-api-report.html")
        print("   前端测试报告: http://emagen.323424.xyz/frontend-test-report.html")
        
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy_reports()