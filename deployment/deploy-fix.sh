#!/bin/bash

# 快速修复部署脚本
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASSWORD="20031758wW@"
SSHPASS="/home/chengliang/workspace/PostgreSQL/PostgreSQL/workspace/workspace/sshpass-install/bin/sshpass"

echo "修复服务器部署..."

# 创建正确的目录结构并修复ecosystem配置
$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/ubuntu/postgresql-app

# 删除旧的部署
rm -rf *

# 创建新的ecosystem配置
cat > ecosystem.config.js << 'EOC'
module.exports = {
  apps: [
    {
      name: 'postgres-api',
      script: './backend/src/index.js',
      cwd: '/home/ubuntu/postgresql-app',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        USE_MOCK_DB: true,
        JWT_SECRET: 'production-secret-key-change-me'
      }
    },
    {
      name: 'postgres-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/ubuntu/postgresql-app/frontend',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
EOC

echo "配置文件创建完成"
EOF

# 创建正确的部署包
echo "创建新的部署包..."
mkdir -p temp-deploy/backend temp-deploy/frontend

# 复制后端文件
cp -r src package.json package-lock.json README.md .env.example temp-deploy/backend/

# 复制前端文件
cp -r frontend/* temp-deploy/frontend/

# 创建部署包
cd temp-deploy && tar -czf ../deploy-fixed.tar.gz . && cd ..

# 上传到服务器
echo "上传文件到服务器..."
$SSHPASS -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no deploy-fixed.tar.gz $SERVER_USER@$SERVER_IP:/home/ubuntu/postgresql-app/

# 在服务器上解压并安装
$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/ubuntu/postgresql-app
tar -xzf deploy-fixed.tar.gz
rm deploy-fixed.tar.gz

# 创建.env文件
cat > backend/.env << 'EOE'
DATABASE_URL=postgresql://dbuser:dbpassword@localhost:5432/clouddb
JWT_SECRET=production-secret-key-change-me
PORT=3000
NODE_ENV=production
USE_MOCK_DB=true
EOE

# 安装依赖
echo "安装后端依赖..."
cd backend && npm install && cd ..

echo "安装前端依赖..."
cd frontend && npm install && npm run build && cd ..

# 停止现有服务
pm2 stop all || true
pm2 delete all || true

# 启动服务
echo "启动服务..."
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

echo "查看服务状态..."
pm2 list

echo "部署修复完成！"
EOF

# 清理临时文件
rm -rf temp-deploy deploy-fixed.tar.gz

echo "修复完成！"