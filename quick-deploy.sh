#\!/bin/bash

# 快速部署脚本 - 需要手动输入密码
echo "=== 快速部署预约系统API ==="
echo ""

# 检查文件
if [ \! -f "deploy-package.tar.gz" ]; then
    echo "正在打包项目..."
    tar -czf deploy-package.tar.gz \
      --exclude='node_modules' \
      --exclude='.env' \
      --exclude='*.log' \
      --exclude='.git' \
      --exclude='deploy-package.tar.gz' \
      .
fi

# 创建远程执行脚本
cat > remote-deploy.sh << 'SCRIPT'
#\!/bin/bash
set -e

echo "=== 远程部署开始 ==="

# 基本配置
APP_DIR="/home/ubuntu/cloud-postgres-api"
DB_NAME="clouddb"
DB_USER="dbuser"
DB_PASS="secure_$(openssl rand -hex 6)"

# 1. 安装基础软件
echo "1. 检查并安装必要软件..."
which node || {
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
}

which psql || sudo apt install -y postgresql postgresql-contrib
which pm2 || sudo npm install -g pm2
which nginx || sudo apt install -y nginx

# 2. 清理并创建目录
echo "2. 准备应用目录..."
sudo rm -rf $APP_DIR
mkdir -p $APP_DIR
cd $APP_DIR

# 3. 解压文件
echo "3. 解压应用文件..."
tar -xzf ~/deploy-package.tar.gz
mkdir -p logs

# 4. 配置数据库
echo "4. 配置数据库..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# 配置PostgreSQL认证
sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql

# 5. 安装依赖
echo "5. 安装项目依赖..."
npm install --production

# 6. 配置环境变量
echo "6. 创建环境配置..."
cat > .env << ENV
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
NODE_ENV=production
ENV

# 7. 运行数据库迁移
echo "7. 初始化数据库..."
npm run migrate

# 8. PM2启动应用
echo "8. 启动应用服务..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | grep sudo | bash

# 9. 配置Nginx
echo "9. 配置Web服务器..."
sudo bash -c 'cat > /etc/nginx/sites-available/default << NGINX
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name emagen.323424.xyz api.emagen.323424.xyz;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX'

sudo nginx -t && sudo systemctl restart nginx

# 10. 防火墙设置
echo "10. 配置防火墙..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 11. 保存配置信息
echo "=== 部署信息 ===" > ~/deployment-info.txt
echo "时间: $(date)" >> ~/deployment-info.txt
echo "数据库: $DB_NAME" >> ~/deployment-info.txt
echo "用户: $DB_USER" >> ~/deployment-info.txt
echo "密码: $DB_PASS" >> ~/deployment-info.txt
echo "API: http://emagen.323424.xyz/api/" >> ~/deployment-info.txt

# 12. 测试部署
echo ""
echo "12. 测试API服务..."
sleep 3
echo "健康检查:"
curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || echo '{"error": "API未响应"}'
echo ""
echo "门店数量:"
curl -s http://localhost:3000/api/functions/stores | jq '.count' 2>/dev/null || echo "0"

echo ""
echo "=== 部署完成 ==="
echo "部署信息已保存到: ~/deployment-info.txt"
echo ""
pm2 list
echo ""
echo "访问地址: http://emagen.323424.xyz/api/health"
SCRIPT

echo "开始部署..."
echo ""

# 执行部署
echo "步骤1: 上传文件 (需要输入密码)"
scp deploy-package.tar.gz remote-deploy.sh ubuntu@43.167.226.222:~/

echo ""
echo "步骤2: 执行远程部署 (需要输入密码)"
ssh ubuntu@43.167.226.222 "chmod +x remote-deploy.sh && ./remote-deploy.sh"

echo ""
echo "部署完成！测试API:"
echo "curl http://emagen.323424.xyz/api/health"
echo "curl http://emagen.323424.xyz/api/functions/stores"
EOF < /dev/null