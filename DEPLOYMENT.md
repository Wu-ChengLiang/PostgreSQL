# PostgreSQL API 部署指南

## 服务器信息
- **服务器IP**: 43.167.226.222 (公网) / 10.7.4.15 (内网)
- **服务端口**: 4999
- **技术栈**: Node.js + PostgreSQL + Nginx
- **进程管理**: PM2

## 部署步骤

### 1. 服务器环境配置

SSH 连接到服务器后，执行服务器配置脚本：

```bash
# 上传并执行服务器配置脚本
chmod +x server-setup.sh
sudo ./server-setup.sh
```

### 2. 上传项目文件

```bash
# 在本地执行
scp -r /home/chengliang/cloud-postgres-api/* root@43.167.226.222:/opt/cloud-postgres-api/
```

### 3. 安装依赖并配置

在服务器上执行：

```bash
cd /opt/cloud-postgres-api
npm install --production
mkdir -p logs

# 配置环境变量
cp .env.production .env
```

### 4. 初始化数据库

```bash
# 执行数据库迁移
sudo -u postgres psql -d clouddb -f migrations/001_init.sql
```

### 5. 启动应用

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. 配置 Nginx

```bash
# 复制 Nginx 配置
sudo cp nginx-config.conf /etc/nginx/conf.d/postgres_api.conf

# 测试并重启 Nginx
sudo nginx -t
sudo systemctl restart nginx
```

## API 端点

应用部署后，可通过以下端点访问：

- **健康检查**: http://43.167.226.222/health
- **用户注册**: POST http://43.167.226.222/api/auth/register
- **用户登录**: POST http://43.167.226.222/api/auth/login
- **数据管理**: http://43.167.226.222/api/items
- **用户管理**: http://43.167.226.222/api/users

## 管理命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs postgres-api

# 重启服务
pm2 restart postgres-api

# 停止服务
pm2 stop postgres-api
```

## 安全配置

1. 修改 `.env` 文件中的 `JWT_SECRET`
2. 配置防火墙规则
3. 定期更新系统和依赖包

## 故障排查

1. 检查 PM2 进程状态: `pm2 status`
2. 查看应用日志: `pm2 logs postgres-api`
3. 检查 Nginx 配置: `sudo nginx -t`
4. 测试数据库连接: `sudo -u postgres psql -d clouddb -c "SELECT 1;"`