# 名医堂数据平台2.0 系统架构文档

## 1. 系统架构概览

```
┌─────────────────┐     ┌─────────────────┐
│   客户端前端    │     │   管理端前端    │
│   (Vue/React)   │     │   (Vue/React)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │   API层     │
              │  (Express)  │
              └──────┬──────┘
                     │
              ┌──────┴──────┐
              │  业务逻辑层  │
              │  (Services) │
              └──────┬──────┘
                     │
              ┌──────┴──────┐
              │  数据访问层  │
              │    (DAO)    │
              └──────┬──────┘
                     │
              ┌──────┴──────┐
              │   SQLite    │
              │   数据库    │
              └─────────────┘
```

## 2. 数据库设计

### 2.1 stores（门店表）
```sql
CREATE TABLE stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200),
    phone VARCHAR(20),
    business_hours VARCHAR(50) DEFAULT '9:00-21:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 therapists（技师表）
```sql
CREATE TABLE therapists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL,
    years_of_experience INTEGER NOT NULL,
    specialties TEXT NOT NULL,
    phone VARCHAR(20),
    honors TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);
```

### 2.3 users（用户表）
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.4 appointments（预约表）
```sql
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    therapist_id INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);
```

### 2.5 admins（管理员表）
```sql
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    store_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);
```

## 3. API设计原则

### 3.1 RESTful规范
- 使用标准HTTP方法（GET, POST, PUT, DELETE）
- 资源命名使用复数形式
- 响应格式统一为JSON

### 3.2 API版本管理
- URL路径包含版本号：`/api/v1/`

### 3.3 错误处理
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "错误描述"
    }
}
```

### 3.4 成功响应格式
```json
{
    "success": true,
    "data": {
        // 响应数据
    }
}
```

## 4. 安全设计

### 4.1 认证机制
- 管理端使用JWT令牌认证
- 客户端无需登录，但创建预约时需要提供用户信息

### 4.2 数据安全
- 密码使用bcrypt加密
- 敏感信息不在响应中返回
- SQL注入防护（参数化查询）

### 4.3 访问控制
- 管理API需要认证
- 客户端API限流（每IP每分钟60次请求）

## 5. 部署架构

### 5.1 开发环境
- 本地SQLite数据库
- Node.js开发服务器
- 热重载支持

### 5.2 生产环境
- SQLite数据库（定期备份）
- PM2进程管理
- Nginx反向代理
- HTTPS支持

## 6. 扩展性考虑

### 6.1 数据库扩展
- 支持迁移到PostgreSQL/MySQL
- 数据库连接池管理

### 6.2 功能扩展
- 插件化服务架构
- 中间件支持
- 事件驱动架构

### 6.3 性能优化
- 缓存策略（Redis）
- 数据库索引优化
- API响应压缩