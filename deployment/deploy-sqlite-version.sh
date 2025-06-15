#!/bin/bash

# 部署配置
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASS="20031758wW@"
DOMAIN="emagen.323424.xyz"
APP_DIR="/home/ubuntu/postgresql-app"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 开始部署SQLite版本的中医理疗预约管理系统${NC}"

# 使用sshpass执行远程命令的函数
remote_exec() {
    ../sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$1"
}

# 复制文件到服务器的函数
copy_to_server() {
    ../sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_IP:$2"
}

# 1. 停止并清理旧服务
echo -e "${YELLOW}1. 停止并清理旧服务...${NC}"
remote_exec "pm2 stop all || true"
remote_exec "pm2 delete all || true"
remote_exec "sudo systemctl stop nginx || true"

# 2. 备份并删除旧代码
echo -e "${YELLOW}2. 备份并删除旧代码...${NC}"
remote_exec "
    if [ -d $APP_DIR ]; then
        mv $APP_DIR ${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S) || true
    fi
    mkdir -p $APP_DIR
"

# 3. 创建新的目录结构
echo -e "${YELLOW}3. 创建新的目录结构...${NC}"
remote_exec "
    cd $APP_DIR
    mkdir -p backend/src backend/config backend/tests frontend logs
"

# 4. 打包项目文件
echo -e "${YELLOW}4. 打包项目文件...${NC}"
cd ..
tar czf deployment/project.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='sshpass*' \
  package.json package-lock.json .env \
  src config tests frontend

cd deployment

# 5. 复制打包文件到服务器
echo -e "${YELLOW}5. 复制打包文件到服务器...${NC}"
copy_to_server "project.tar.gz" "$APP_DIR/"

# 6. 解压文件
echo -e "${YELLOW}6. 解压文件...${NC}"
remote_exec "
    cd $APP_DIR
    tar xzf project.tar.gz
    rm project.tar.gz
    # 移动后端文件到backend目录
    mv package.json package-lock.json .env backend/
    mv src config tests backend/
    # 前端文件已经在frontend目录中
"

# 7. 创建新的环境配置
echo -e "${YELLOW}7. 创建新的环境配置...${NC}"
remote_exec "
cd $APP_DIR/backend
cat > .env << EOF
# Database Configuration
USE_MOCK_DB=false
USE_SQLITE=true
SQLITE_DB_PATH=./data.db

# JWT Secret
JWT_SECRET=your-secret-key-production-$(openssl rand -base64 32)

# Server Configuration
PORT=3000
NODE_ENV=production
EOF
"

# 8. 安装依赖并初始化数据库
echo -e "${YELLOW}8. 安装依赖并初始化数据库...${NC}"
remote_exec "
cd $APP_DIR/backend
npm install --production
node src/scripts/init-db.js || echo '数据库初始化脚本不存在，稍后手动运行'
"

# 9. 构建前端
echo -e "${YELLOW}9. 构建前端应用...${NC}"
remote_exec "
cd $APP_DIR/frontend
# 更新API地址为生产环境
sed -i 's|http://localhost:3002|http://$DOMAIN|g' lib/api.ts
npm install
npm run build
"

# 10. 配置PM2启动脚本
echo -e "${YELLOW}10. 配置PM2启动脚本...${NC}"
remote_exec "
cd $APP_DIR
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'postgresql-api',
      script: './src/index-sqlite.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        USE_MOCK_DB: 'false',
        USE_SQLITE: 'true',
        SQLITE_DB_PATH: './data.db'
      }
    },
    {
      name: 'postgresql-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
EOF
"

# 11. 配置Nginx
echo -e "${YELLOW}11. 配置Nginx...${NC}"
remote_exec "
sudo tee /etc/nginx/sites-available/postgresql << 'EOF'
server {
    listen 80;
    server_name $DOMAIN;

    # 前端请求
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API请求
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 60m;
        add_header Cache-Control 'public, max-age=3600';
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/appointment-booking
sudo ln -sf /etc/nginx/sites-available/postgresql /etc/nginx/sites-enabled/
sudo nginx -t
"

# 12. 启动服务
echo -e "${YELLOW}12. 启动服务...${NC}"
remote_exec "
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo systemctl start nginx
sudo systemctl enable nginx
"

# 13. 等待服务启动
echo -e "${YELLOW}13. 等待服务启动...${NC}"
sleep 10

# 14. 检查服务状态
echo -e "${YELLOW}14. 检查服务状态...${NC}"
remote_exec "
echo '=== PM2 进程状态 ==='
pm2 list
echo -e '\n=== Nginx 状态 ==='
sudo systemctl status nginx | head -10
echo -e '\n=== 端口监听状态 ==='
sudo netstat -tulpn | grep -E ':(80|3000|3001)'
"

# 15. 测试服务
echo -e "${YELLOW}15. 测试服务...${NC}"
echo "测试健康检查接口..."
curl -s "http://$DOMAIN/api/health" | python3 -m json.tool || echo "API健康检查失败"

echo -e "\n测试前端页面..."
curl -s "http://$DOMAIN" | grep -q "控制台" && echo "前端页面正常" || echo "前端页面异常"

# 16. 清理旧文件
echo -e "${YELLOW}16. 清理旧文件...${NC}"
remote_exec "
# 清理旧的备份（保留最近3个）
cd /home/ubuntu
ls -dt postgresql-app_backup_* | tail -n +4 | xargs rm -rf 2>/dev/null || true
# 清理日志
pm2 flush
"

echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}访问地址: http://$DOMAIN${NC}"
echo -e "${GREEN}API地址: http://$DOMAIN/api${NC}"
echo -e "\n${YELLOW}查看日志:${NC}"
echo "后端日志: pm2 logs postgresql-api"
echo "前端日志: pm2 logs postgresql-frontend"