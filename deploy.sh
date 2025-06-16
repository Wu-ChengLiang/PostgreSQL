#!/bin/bash

# 部署脚本 - 名医堂数据平台2.0
# 服务器信息
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
DOMAIN="emagen.323424.xyz"

echo "🚀 开始部署名医堂数据平台2.0到云服务器..."
echo "服务器: $SERVER_IP"
echo "域名: $DOMAIN"

# 创建部署包
echo "📦 创建部署包..."
tar -czf mingyi-platform.tar.gz \
    src/ \
    frontend/ \
    scripts/ \
    docs/ \
    package.json \
    package-lock.json \
    README.md \
    mingyi.db \
    test-frontend-crud.html

echo "✅ 部署包创建完成"

# 生成服务器端部署脚本
cat > server-deploy.sh << 'EOF'
#!/bin/bash

# 停止旧服务
echo "🛑 停止旧服务..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 清理旧文件
echo "🧹 清理旧文件..."
rm -rf /home/ubuntu/mingyi-platform-old
if [ -d "/home/ubuntu/mingyi-platform" ]; then
    mv /home/ubuntu/mingyi-platform /home/ubuntu/mingyi-platform-old
fi

# 创建新目录
mkdir -p /home/ubuntu/mingyi-platform
cd /home/ubuntu/mingyi-platform

# 解压文件
echo "📦 解压部署包..."
tar -xzf /home/ubuntu/mingyi-platform.tar.gz

# 安装依赖
echo "📚 安装依赖..."
npm install --production

# 创建PM2配置文件
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'mingyi-platform',
    script: './src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8089
    }
  }]
};
PM2EOF

# 设置数据库权限
chmod 644 mingyi.db

# 启动服务
echo "🚀 启动服务..."
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 配置Nginx
echo "🔧 配置Nginx..."
sudo tee /etc/nginx/sites-available/mingyi-platform << 'NGINXEOF'
server {
    listen 80;
    server_name emagen.323424.xyz;

    location / {
        proxy_pass http://localhost:8089;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
NGINXEOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/mingyi-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试并重载Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ 部署完成！"
echo "🌐 访问地址: http://emagen.323424.xyz"
echo "📊 PM2状态: pm2 status"
echo "📝 查看日志: pm2 logs mingyi-platform"
EOF

chmod +x server-deploy.sh

echo ""
echo "📋 部署步骤："
echo "1. 使用以下命令上传文件到服务器："
echo "   scp mingyi-platform.tar.gz server-deploy.sh ubuntu@$SERVER_IP:~/"
echo ""
echo "2. SSH登录到服务器："
echo "   ssh ubuntu@$SERVER_IP"
echo "   密码: 20031758wW@"
echo ""
echo "3. 在服务器上执行部署脚本："
echo "   chmod +x server-deploy.sh"
echo "   ./server-deploy.sh"
echo ""
echo "4. 部署完成后访问："
echo "   客户端: http://$DOMAIN/frontend/index.html"
echo "   管理端: http://$DOMAIN/frontend/admin.html"
echo "   健康检查: http://$DOMAIN/health"