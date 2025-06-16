import paramiko

def deploy_test_report():
    hostname = '43.167.226.222'
    username = 'ubuntu'
    password = '20031758wW@'
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔌 连接服务器...")
        ssh.connect(hostname, username=username, password=password)
        
        # 上传测试报告
        print("📤 上传测试报告...")
        sftp = ssh.open_sftp()
        sftp.put('frontend-test-report.html', '/home/ubuntu/mingyi-platform/frontend-test-report.html')
        sftp.close()
        
        print("✅ 测试报告已部署！")
        print("\n📊 访问测试报告：")
        print("   http://emagen.323424.xyz/frontend-test-report.html")
        
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy_test_report()