# 本地测试说明

由于本地环境没有安装 Docker 和 PostgreSQL，需要在部署到服务器后进行测试。

## 服务器部署步骤

### 1. 连接到服务器
```bash
ssh ubuntu@43.167.226.222
```

### 2. 安装依赖
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 安装 PM2
sudo npm install -g pm2
```

### 3. 配置 PostgreSQL
```bash
# 切换到 postgres 用户
sudo -i -u postgres

# 创建数据库和用户
psql
CREATE DATABASE clouddb;
CREATE USER dbuser WITH ENCRYPTED PASSWORD 'dbpassword';
GRANT ALL PRIVILEGES ON DATABASE clouddb TO dbuser;
\q
exit
```

### 4. 部署应用
```bash
# 克隆或上传代码
cd /home/ubuntu
git clone <repository-url> cloud-postgres-api
# 或使用 scp 上传

cd cloud-postgres-api

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置正确的数据库连接和密钥

# 运行数据库迁移
npm run migrate

# 使用 PM2 启动应用
pm2 start src/index.js --name cloud-api
pm2 save
pm2 startup
```

### 5. 配置 Nginx
```bash
sudo apt install nginx -y

# 创建 Nginx 配置
sudo nano /etc/nginx/sites-available/api.emagen.323424.xyz
```

配置内容见 nginx-config.conf 文件

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/api.emagen.323424.xyz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. 测试 API
```bash
# 健康检查
curl https://api.emagen.323424.xyz/api/health

# 测试 Function Call API
./test-function-api.sh
```

## 本地模拟测试

由于无法运行实际数据库，以下是 API 的预期行为：

### 1. 检查技师可用性
- 输入：门店名、技师名、日期、时间
- 输出：是否可用、技师信息、冲突原因

### 2. 创建预约
- 输入：门店名、技师名、客户信息、预约时间
- 输出：预约成功/失败、预约ID

### 3. 查询技师预约
- 输入：技师名、门店名（可选）
- 输出：今日和明日的预约列表

### 4. 获取门店列表
- 输出：所有门店信息和技师数量

## Function Call 集成示例

```python
import requests

BASE_URL = "https://api.emagen.323424.xyz/api/functions"

def check_availability(store_name, therapist_name, date, time):
    response = requests.post(f"{BASE_URL}/check-availability", json={
        "store_name": store_name,
        "therapist_name": therapist_name,
        "appointment_date": date,
        "appointment_time": time
    })
    return response.json()

def create_appointment(store_name, therapist_name, customer_name, 
                      customer_phone, date, time, service_type=None, notes=None):
    response = requests.post(f"{BASE_URL}/create-appointment", json={
        "store_name": store_name,
        "therapist_name": therapist_name,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "appointment_date": date,
        "appointment_time": time,
        "service_type": service_type,
        "notes": notes
    })
    return response.json()
```