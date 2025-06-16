# 名医堂数据平台2.0

专业的中医按摩预约管理系统，为客户提供便捷的技师搜索、预约服务，为门店提供高效的技师和预约管理功能。

## 功能特点

- 🏥 门店管理：多门店统一管理
- 👨‍⚕️ 技师管理：技师信息、排班、专长管理
- 📅 预约系统：在线预约、时间管理、状态跟踪
- 📊 数据统计：预约统计、工作量分析
- 🔐 权限管理：管理员认证、角色权限
- 📱 响应式设计：支持PC和移动端访问

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite
- **前端**: HTML5 + CSS3 + JavaScript
- **认证**: JWT
- **安全**: Helmet + CORS + Rate Limiting

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run db:init
```

### 3. 导入示例数据

```bash
node scripts/seed-all-data.js
node scripts/seed-therapists.js
```

### 4. 启动服务器

```bash
npm start
```

服务器将在 http://localhost:8089 启动

### 5. 访问系统

- 客户端: http://localhost:8089/frontend/index.html
- 管理后台: http://localhost:8089/frontend/admin.html
- 默认管理员账号: admin / admin123

## API文档

### 基础信息

- **基础URL**: `http://localhost:8089/api/v1`
- **响应格式**: JSON
- **字符编码**: UTF-8

### 客户端API

#### 1. 搜索技师

```http
GET /client/therapists/search
```

**参数**:
- `store_id` (可选): 门店ID
- `specialty` (可选): 专长关键词
- `min_experience` (可选): 最少从业年限
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认20

**响应示例**:
```json
{
    "success": true,
    "data": {
        "therapists": [{
            "id": 1,
            "name": "彭老师",
            "position": "调理师",
            "years_of_experience": 13,
            "specialties": ["按摩", "经络疏通", "艾灸"],
            "store": {
                "id": 1,
                "name": "名医堂·颈肩腰腿特色调理（宜山路店）"
            }
        }],
        "total": 50,
        "page": 1,
        "totalPages": 3
    }
}
```

#### 2. 查询技师排班

```http
GET /client/therapists/:id/schedule
```

**参数**:
- `date` (必填): 查询日期 (YYYY-MM-DD)

**响应示例**:
```json
{
    "success": true,
    "data": {
        "schedule": {
            "date": "2025-01-16",
            "available_times": ["09:00", "10:00", "14:00", "15:00"],
            "business_hours": "9:00-21:00"
        }
    }
}
```

#### 3. 创建预约

```http
POST /client/appointments
```

**请求体**:
```json
{
    "therapist_id": 1,
    "user_name": "张三",
    "user_phone": "13800138000",
    "appointment_date": "2025-01-16",
    "appointment_time": "10:00",
    "notes": "颈椎不适"
}
```

#### 4. 查看用户预约

```http
GET /client/appointments/user?phone=13800138000
```

#### 5. 取消预约

```http
DELETE /client/appointments/:id
```

**请求体**:
```json
{
    "phone": "13800138000"
}
```

#### 6. 获取门店列表

```http
GET /client/stores
```

### 管理端API

#### 认证

所有管理端API需要在请求头中包含JWT令牌：

```
Authorization: Bearer <token>
```

#### 1. 管理员登录

```http
POST /admin/login
```

**请求体**:
```json
{
    "username": "admin",
    "password": "admin123"
}
```

#### 2. 技师管理

##### 获取技师列表
```http
GET /admin/therapists?store_id=1&page=1&limit=20
```

##### 添加技师
```http
POST /admin/therapists
```

**请求体**:
```json
{
    "store_id": 1,
    "name": "王老师",
    "position": "推拿师",
    "years_of_experience": 10,
    "specialties": ["推拿", "正骨"],
    "phone": "13900139000",
    "honors": "高级推拿师"
}
```

##### 更新技师信息
```http
PUT /admin/therapists/:id
```

##### 删除技师
```http
DELETE /admin/therapists/:id
```

#### 3. 预约管理

##### 获取预约列表
```http
GET /admin/appointments?date=2025-01-16&status=pending
```

##### 更新预约状态
```http
PUT /admin/appointments/:id/status
```

**请求体**:
```json
{
    "status": "confirmed"
}
```

#### 4. 数据统计

##### 预约统计
```http
GET /admin/statistics/appointments?start_date=2025-01-01&end_date=2025-01-31
```

##### 技师工作量统计
```http
GET /admin/statistics/therapists?start_date=2025-01-01&end_date=2025-01-31
```

## 数据库结构

### 主要表结构

- **stores**: 门店信息表
- **therapists**: 技师信息表
- **users**: 用户信息表
- **appointments**: 预约记录表
- **admins**: 管理员表
- **services**: 服务项目表

详细结构请参考 `src/database/schema.sql`

## 开发指南

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 生成测试覆盖率报告
npm run test:coverage
```

### 项目结构

```
mingyi-platform/
├── src/
│   ├── app.js              # 主应用入口
│   ├── database/           # 数据库相关
│   ├── routes/             # API路由
│   ├── services/           # 业务逻辑
│   ├── middleware/         # 中间件
│   └── utils/              # 工具函数
├── frontend/               # 前端文件
│   ├── index.html          # 客户端页面
│   ├── admin.html          # 管理后台
│   ├── css/                # 样式文件
│   └── js/                 # JavaScript文件
├── tests/                  # 测试文件
├── scripts/                # 脚本文件
└── docs/                   # 文档文件
```

## 安全考虑

1. **认证与授权**: 使用JWT进行管理员认证
2. **密码安全**: 使用bcrypt加密存储密码
3. **SQL注入防护**: 使用参数化查询
4. **限流保护**: 客户端API每分钟60次，管理端API每分钟100次
5. **CORS配置**: 允许跨域请求
6. **Helmet**: HTTP头部安全保护

## 部署建议

1. **生产环境配置**:
   - 设置环境变量 `NODE_ENV=production`
   - 配置真实的JWT密钥
   - 使用HTTPS

2. **数据库备份**:
   - 定期备份SQLite数据库文件
   - 建议每天自动备份

3. **进程管理**:
   - 使用PM2管理Node.js进程
   - 配置自动重启

4. **反向代理**:
   - 使用Nginx作为反向代理
   - 配置SSL证书

## 许可证

MIT License

## 联系方式

- 技术支持：tech@mingyi-tang.com
- 客服电话：400-888-8888