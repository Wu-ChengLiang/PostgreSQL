# Cloud PostgreSQL API

云端PostgreSQL数据库REST API服务

## 功能特性

- PostgreSQL数据库与Docker部署
- JWT身份验证
- 用户注册/登录
- CRUD操作API
- 速率限制和安全措施

## API端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 用户
- `GET /api/users/profile` - 获取用户资料
- `PUT /api/users/profile` - 更新用户资料
- `DELETE /api/users/account` - 删除账户

### 数据项
- `GET /api/items` - 获取所有项目
- `GET /api/items/:id` - 获取单个项目
- `POST /api/items` - 创建新项目
- `PUT /api/items/:id` - 更新项目
- `DELETE /api/items/:id` - 删除项目

### 健康检查
- `GET /api/health` - API健康状态

## 快速开始

1. 复制环境变量配置:
   ```bash
   cp .env.example .env
   ```

2. 启动服务:
   ```bash
   docker-compose up -d
   ```

3. API将在 http://localhost:3000 上运行

## 使用示例

### 注册用户
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Test User"}'
```

### 登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### 创建项目 (需要认证)
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"我的项目","description":"项目描述"}'
```

## 生产部署

1. 修改 `.env` 中的密钥和密码
2. 使用云服务商的PostgreSQL服务
3. 配置SSL证书
4. 使用环境变量管理敏感信息