# 腾讯云服务器部署指南

## 服务器信息
- **公网IP**: 43.167.226.222
- **内网IP**: 10.7.4.15
- **域名**: emagen.323424.xyz
- **用户名**: ubuntu
- **密码**: 20031758wW@

## 🚀 快速部署

### 1. 本地准备
```bash
# 安装sshpass (如果未安装)
sudo apt-get install sshpass  # Ubuntu/Debian
# 或
brew install hudochenkov/sshpass/sshpass  # macOS

# 给部署脚本执行权限
chmod +x deploy-cloud.sh

# 执行部署
./deploy-cloud.sh
```

### 2. 手动部署步骤

#### 2.1 上传代码到服务器
```bash
# 打包项目
tar -czf mingyi-platform.tar.gz --exclude=node_modules --exclude=.git .

# 上传到服务器
scp mingyi-platform.tar.gz ubuntu@43.167.226.222:/home/ubuntu/
```

#### 2.2 服务器端配置
```bash
# SSH连接到服务器
ssh ubuntu@43.167.226.222

# 解压项目
mkdir -p /home/ubuntu/mingyi-platform
cd /home/ubuntu/mingyi-platform
tar -xzf /home/ubuntu/mingyi-platform.tar.gz

# 安装Node.js (如果未安装)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装项目依赖
npm install --production

# 复制生产环境配置
cp .env.production .env
```

#### 2.3 启动服务
```bash
# 设置环境变量并启动
HOST=0.0.0.0 NODE_ENV=production pm2 start src/app.js --name mingyi-platform

# 保存PM2配置
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

## 🌐 网络配置

### 监听地址说明
- **本地开发**: `127.0.0.1` (只允许本机访问)
- **云服务器**: `0.0.0.0` (允许所有网络接口访问)

### 环境变量配置
```bash
# 本地开发
HOST=127.0.0.1
NODE_ENV=development

# 云服务器生产环境
HOST=0.0.0.0
NODE_ENV=production
```

## 🔧 Nginx反向代理配置

### 安装Nginx
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### 配置文件 `/etc/nginx/sites-available/emagen.323424.xyz`
```nginx
server {
    listen 80;
    server_name emagen.323424.xyz 43.167.226.222;

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

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 启用配置
```bash
sudo ln -sf /etc/nginx/sites-available/emagen.323424.xyz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔥 防火墙配置
```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw --force enable
```

## 📋 管理命令

### PM2管理
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs mingyi-platform

# 重启服务
pm2 restart mingyi-platform

# 停止服务
pm2 stop mingyi-platform

# 删除服务
pm2 delete mingyi-platform
```

### 系统服务
```bash
# 查看Nginx状态
sudo systemctl status nginx

# 重启Nginx
sudo systemctl restart nginx

# 查看系统资源
htop
df -h
free -h
```

## 🌍 访问地址

部署完成后，可以通过以下地址访问：

- **域名访问**: http://emagen.323424.xyz
- **公网IP**: http://43.167.226.222
- **直接端口**: http://emagen.323424.xyz:3001
- **健康检查**: http://emagen.323424.xyz/health

## 🔒 安全建议

### 1. 修改默认配置
```bash
# 修改.env文件中的JWT密钥
JWT_SECRET=your-super-secure-jwt-secret-key-change-me-in-production
```

### 2. 配置SSL证书 (推荐)
```bash
# 使用Let's Encrypt免费SSL证书
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d emagen.323424.xyz
```

### 3. 数据库安全
- 使用强密码
- 限制数据库访问IP
- 定期备份数据

## 🐛 故障排除

### 1. 服务无法启动
```bash
# 查看详细日志
pm2 logs mingyi-platform --lines 100

# 检查端口占用
sudo netstat -tlnp | grep :3001

# 检查防火墙
sudo ufw status
```

### 2. 无法访问网站
```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查Nginx配置
sudo nginx -t

# 查看Nginx日志
sudo tail -f /var/log/nginx/error.log
```

### 3. 数据库连接问题
```bash
# 检查数据库服务
sudo systemctl status postgresql

# 测试数据库连接
psql -h localhost -U postgres -d mingyi_platform
```

## 📞 技术支持

如果遇到问题，请检查：
1. 服务器防火墙设置
2. 腾讯云安全组配置
3. 域名DNS解析
4. SSL证书配置

---

**注意**: 请确保在生产环境中修改所有默认密码和密钥！ 