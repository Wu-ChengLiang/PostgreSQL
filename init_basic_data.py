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
    return output, error

def init_basic_data():
    """初始化基础数据"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        print("✅ 连接成功!")
        
        # 创建基础数据脚本
        basic_data_script = '''
const Database = require('./src/database/connection');

async function initBasicData() {
    const db = await Database.getInstance();
    
    try {
        console.log('开始初始化基础数据...');
        
        // 1. 创建管理员用户
        await db.run(`
            INSERT OR IGNORE INTO users (username, password_hash, role, email, phone, status)
            VALUES ('admin', '$2b$10$K.0HwpsoPDGaB/atFBmmXOGTw4ceeg33.WrxJx/FeC9.gOMxlJla6', 'admin', 'admin@mingyi.com', '13800138000', 'active')
        `);
        console.log('✅ 管理员用户创建成功');
        
        // 2. 创建测试门店
        const storeResult = await db.run(`
            INSERT INTO stores (name, address, phone, business_hours, status, description)
            VALUES ('名医堂总店', '上海市徐汇区宜山路123号', '021-12345678', '9:00-21:00', 'active', '专业中医按摩调理中心')
        `);
        console.log('✅ 门店创建成功，ID:', storeResult.lastID);
        
        // 3. 创建测试技师
        await db.run(`
            INSERT INTO therapists (store_id, name, position, years_experience, specialties, service_types, phone, status)
            VALUES (?, '张医师', '专家医师', 10, '["颈椎调理", "腰椎调理"]', '["按摩", "推拿"]', '13900139001', 'active')
        `, [storeResult.lastID]);
        
        await db.run(`
            INSERT INTO therapists (store_id, name, position, years_experience, specialties, service_types, phone, status)
            VALUES (?, '李医师', '推拿师', 8, '["肩周炎调理", "关节调理"]', '["推拿", "艾灸"]', '13900139002', 'active')
        `, [storeResult.lastID]);
        
        console.log('✅ 技师创建成功');
        
        console.log('✅ 基础数据初始化完成！');
        
    } catch (error) {
        console.error('初始化失败:', error);
    }
}

initBasicData();
'''
        
        # 写入脚本
        execute_command(ssh, f"cd {PROJECT_PATH} && cat > init_basic_data.js << 'EOF'\n{basic_data_script}\nEOF")
        
        # 执行脚本
        print("\n🌱 初始化基础数据...")
        output, error = execute_command(ssh, f"cd {PROJECT_PATH} && node init_basic_data.js")
        
        # 检查前端文件
        print("\n📂 检查前端文件...")
        execute_command(ssh, f"ls -la {PROJECT_PATH}/frontend/")
        
        # 重启服务
        print("\n🔄 重启服务...")
        execute_command(ssh, f"pm2 restart mingyi-platform")
        
        # 查看日志
        print("\n📋 查看服务日志...")
        execute_command(ssh, f"pm2 logs mingyi-platform --lines 20")
        
        print("\n✅ 初始化完成!")
        
    except Exception as e:
        print(f"\n❌ 初始化失败: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    init_basic_data()