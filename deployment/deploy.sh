#!/bin/bash

# 部署脚本 - 将应用部署到云服务器
# 服务器信息：43.167.226.222
# 域名：emagen.323424.xyz

SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASSWORD="20031758wW@"
DOMAIN="emagen.323424.xyz"
REMOTE_DIR="/home/ubuntu/postgresql-app"

# 使用sshpass进行SSH连接
SSHPASS="/home/chengliang/workspace/PostgreSQL/PostgreSQL/workspace/workspace/sshpass-install/bin/sshpass"

echo "开始部署到云服务器..."

# 创建远程目录
echo "创建远程目录..."
$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# 打包前端应用
echo "构建前端应用..."
cd frontend && npm run build && cd ..

# 创建部署包
echo "创建部署包..."
tar -czf deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=frontend/node_modules \
  --exclude=frontend/.next/cache \
  --exclude=workspace \
  .

# 上传文件到服务器
echo "上传文件到服务器..."
$SSHPASS -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no deploy.tar.gz $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# 在服务器上解压并安装依赖
echo "在服务器上解压并配置..."
$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/ubuntu/postgresql-app
tar -xzf deploy.tar.gz
rm deploy.tar.gz

# 安装后端依赖
echo "安装后端依赖..."
npm install

# 安装前端依赖
echo "安装前端依赖..."
cd frontend
npm install
cd ..

# 创建PM2生态系统文件
cat > ecosystem.config.js << 'EOC'
module.exports = {
  apps: [
    {
      name: 'postgres-api',
      script: './src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        USE_MOCK_DB: true,
        JWT_SECRET: 'production-secret-key-change-me'
      }
    },
    {
      name: 'postgres-frontend',
      script: './frontend/node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
EOC

# 安装PM2（如果未安装）
if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    sudo npm install -g pm2
fi

# 停止现有服务
pm2 stop all || true
pm2 delete all || true

# 启动服务
echo "启动服务..."
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "应用部署完成！"
EOF

# 配置Nginx
echo "配置Nginx..."
$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
# 创建Nginx配置
sudo tee /etc/nginx/sites-available/emagen.323424.xyz << 'EON'
server {
    listen 80;
    server_name emagen.323424.xyz;

    # 前端请求
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API请求
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EON

# 启用站点
sudo ln -sf /etc/nginx/sites-available/emagen.323424.xyz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "Nginx配置完成！"
EOF

# 清理本地部署包
rm -f deploy.tar.gz

echo "部署完成！您可以通过 http://$DOMAIN 访问应用"