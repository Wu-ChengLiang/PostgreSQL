#!/bin/bash

# 服务器配置
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASS="20031758wW@"
DOMAIN="emagen.323424.xyz"

# 项目配置
PROJECT_NAME="mingyi-platform"
PROJECT_PATH="/home/ubuntu/mingyi-platform"
GIT_REPO="https://github.com/Wu-ChengLiang/PostgreSQL.git"

echo "🚀 开始部署到云服务器..."

# 创建部署命令脚本
cat > deploy_commands.sh << 'EOF'
#!/bin/bash

# 停止旧服务
echo "停止旧服务..."
pm2 stop all || true
pm2 delete all || true

# 更新代码
echo "更新代码..."
cd /home/ubuntu
rm -rf mingyi-platform
git clone https://github.com/Wu-ChengLiang/PostgreSQL.git mingyi-platform
cd mingyi-platform

# 安装依赖
echo "安装依赖..."
npm install

# 初始化数据库
echo "初始化数据库..."
npm run init-db
npm run seed

# 启动服务
echo "启动服务..."
PORT=8089 pm2 start src/app.js --name mingyi-platform

# 保存PM2配置
pm2 save
pm2 startup

# 配置Nginx
echo "配置Nginx..."
sudo tee /etc/nginx/sites-available/emagen.323424.xyz << 'NGINX_EOF'
server {
    listen 80;
    server_name emagen.323424.xyz;

    location / {
        root /home/ubuntu/mingyi-platform/frontend;
        try_files $uri $uri/ /index.html;
    }

    location /api {
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
}
NGINX_EOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/emagen.323424.xyz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 查看状态
pm2 list
echo "部署完成！"
EOF

echo "请在服务器上执行以下命令进行部署："
echo "1. 连接到服务器: ssh ubuntu@43.167.226.222"
echo "2. 输入密码: 20031758wW@"
echo "3. 复制并执行 deploy_commands.sh 的内容"