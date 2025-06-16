#!/bin/bash

# 腾讯云服务器部署脚本
# 服务器信息：
# 公网IP: 43.167.226.222
# 内网IP: 10.7.4.15
# 域名: emagen.323424.xyz
# 用户: ubuntu

echo "🚀 开始部署名医堂数据平台到腾讯云服务器..."

# 服务器配置
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASSWORD="20031758wW@"
DOMAIN="emagen.323424.xyz"
APP_NAME="mingyi-platform"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
if ! command -v sshpass &> /dev/null; then
    echo_error "sshpass 未安装，请先安装: sudo apt-get install sshpass"
    exit 1
fi

# 1. 打包项目
echo_info "📦 打包项目文件..."
tar -czf ${APP_NAME}.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=logs \
    --exclude=*.log \
    --exclude=mingyi.db* \
    --exclude=.env.local \
    .

# 2. 上传到服务器
echo_info "📤 上传文件到服务器..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no \
    ${APP_NAME}.tar.gz ${SERVER_USER}@${SERVER_IP}:/home/ubuntu/

# 3. 在服务器上执行部署
echo_info "🔧 在服务器上执行部署..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'EOF'

# 设置变量
APP_NAME="mingyi-platform"
APP_DIR="/home/ubuntu/${APP_NAME}"

echo "🏗️  准备部署环境..."

# 停止现有服务
sudo pkill -f "node.*app.js" || true
sudo pkill -f "node.*index.js" || true

# 创建应用目录
mkdir -p ${APP_DIR}
cd ${APP_DIR}

# 解压文件
echo "📂 解压应用文件..."
tar -xzf /home/ubuntu/${APP_NAME}.tar.gz -C ${APP_DIR}

# 安装Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    echo "📥 安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 安装PM2 (如果未安装)
if ! command -v pm2 &> /dev/null; then
    echo "📥 安装PM2..."
    sudo npm install -g pm2
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install --production

# 复制生产环境配置
echo "⚙️  配置生产环境..."
cp .env.production .env

# 设置权限
chmod +x deploy-cloud.sh

# 启动服务
echo "🚀 启动服务..."
pm2 stop ${APP_NAME} || true
pm2 delete ${APP_NAME} || true

# 使用生产环境配置启动
HOST=0.0.0.0 NODE_ENV=production pm2 start src/app.js --name ${APP_NAME}

# 保存PM2配置
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "✅ 应用部署完成！"
echo "🌍 公网访问: http://emagen.323424.xyz:3001"
echo "🔒 内网访问: http://10.7.4.15:3001"
echo "📊 PM2状态: pm2 status"
echo "📋 查看日志: pm2 logs ${APP_NAME}"

EOF

# 4. 配置Nginx反向代理（可选）
echo_info "🌐 配置Nginx反向代理..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'EOF'

# 安装Nginx (如果未安装)
if ! command -v nginx &> /dev/null; then
    echo "📥 安装Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# 创建Nginx配置
sudo tee /etc/nginx/sites-available/emagen.323424.xyz << 'NGINX_CONF'
server {
    listen 80;
    server_name emagen.323424.xyz 43.167.226.222;

    # 前端静态文件
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API接口
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3001;
        access_log off;
    }
}
NGINX_CONF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/emagen.323424.xyz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Nginx配置完成！"

EOF

# 5. 配置防火墙
echo_info "🔥 配置防火墙..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'EOF'

# 配置UFW防火墙
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw --force enable

echo "✅ 防火墙配置完成！"

EOF

# 清理本地文件
rm -f ${APP_NAME}.tar.gz

echo_info "🎉 部署完成！"
echo_info "🌍 访问地址："
echo_info "   - 域名访问: http://emagen.323424.xyz"
echo_info "   - 公网IP: http://43.167.226.222"
echo_info "   - 直接端口: http://emagen.323424.xyz:3001"
echo_info ""
echo_info "📋 管理命令："
echo_info "   - 查看状态: ssh ubuntu@43.167.226.222 'pm2 status'"
echo_info "   - 查看日志: ssh ubuntu@43.167.226.222 'pm2 logs mingyi-platform'"
echo_info "   - 重启服务: ssh ubuntu@43.167.226.222 'pm2 restart mingyi-platform'"
echo_info ""
echo_warn "⚠️  注意事项："
echo_warn "   1. 请修改.env.production中的JWT_SECRET"
echo_warn "   2. 请配置数据库连接信息"
echo_warn "   3. 建议配置SSL证书启用HTTPS" 