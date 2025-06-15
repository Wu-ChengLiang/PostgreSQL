# API 接口文档

## 基础信息
- **基础URL**: `http://localhost:3002/api`
- **数据格式**: JSON
- **认证方式**: JWT Bearer Token（部分接口需要）

## 🔵 原有API端点（保持不变）

### 1. 认证相关
```
POST   /api/auth/register     # 用户注册
POST   /api/auth/login        # 用户登录
```

### 2. 项目管理
```
GET    /api/items             # 获取所有项目
GET    /api/items/:id         # 获取单个项目
POST   /api/items             # 创建新项目
PUT    /api/items/:id         # 更新项目
DELETE /api/items/:id         # 删除项目
```

### 3. 健康检查
```
GET    /api/health            # API健康状态
```

## 🟢 新增API端点

### 1. 门店管理 (/api/stores)
```
GET    /api/stores                    # 获取所有门店
GET    /api/stores/:id                # 获取单个门店详情
POST   /api/stores                    # 创建新门店
PUT    /api/stores/:id                # 更新门店信息
DELETE /api/stores/:id                # 删除门店
GET    /api/stores/search?name=xxx    # 搜索门店
GET    /api/stores/stats              # 获取门店统计信息
```

**示例请求：**
```bash
# 获取所有门店
curl http://localhost:3002/api/stores

# 响应示例：
{
  "success": true,
  "stores": [
    {
      "id": 1,
      "name": "名医堂·颈肩腰腿特色调理（莘庄店）",
      "address": "上海市闵行区莘庄地铁站北广场",
      "phone": "021-64123456",
      "business_hours": "09:00-21:00",
      "rating": 4.8,
      "review_count": 60
    }
  ]
}
```

### 2. 技师管理 (/api/therapists)
```
GET    /api/therapists                          # 获取所有技师
GET    /api/therapists/:id                      # 获取技师详情
POST   /api/therapists                          # 创建新技师
PUT    /api/therapists/:id                      # 更新技师信息
DELETE /api/therapists/:id                      # 删除技师
GET    /api/therapists/search                   # 搜索技师
       ?name=xxx                                # 按名称搜索
       ?store=xxx                               # 按门店名搜索
       ?service_type=xxx                        # 按服务类型搜索
GET    /api/therapists/:id/availability?date=YYYY-MM-DD  # 获取技师可用时间
GET    /api/therapists/store/:storeId           # 获取指定门店的所有技师
```

**示例请求：**
```bash
# 按名称搜索技师
curl http://localhost:3002/api/therapists/search?name=陈

# 获取技师可用时间
curl http://localhost:3002/api/therapists/1/availability?date=2024-12-25
```

### 3. 预约管理 (/api/appointments)
```
GET    /api/appointments                        # 获取所有预约
       ?user_id=xxx                             # 按用户筛选
       ?therapist_id=xxx                        # 按技师筛选
       ?store_id=xxx                            # 按门店筛选
       ?status=xxx                              # 按状态筛选
       ?date=YYYY-MM-DD                         # 按日期筛选
GET    /api/appointments/:id                    # 获取预约详情
POST   /api/appointments                        # 创建新预约
PUT    /api/appointments/:id/status            # 更新预约状态
DELETE /api/appointments/:id                    # 取消预约
GET    /api/appointments/user/:userId           # 获取用户的所有预约
GET    /api/appointments/therapist/:therapistId # 获取技师的所有预约
GET    /api/appointments/store/:storeId         # 获取门店的所有预约
GET    /api/appointments/stats                  # 获取预约统计
POST   /api/appointments/public/create          # 公开预约接口（基于用户名）
```

**创建预约请求示例：**
```json
POST /api/appointments
{
  "user_id": 1,
  "therapist_id": 1,
  "store_id": 1,
  "service_type": "推拿",
  "appointment_date": "2024-12-25",
  "start_time": "14:00",
  "end_time": "15:00",
  "notes": "颈椎调理"
}
```

**公开预约接口（无需登录）：**
```json
POST /api/appointments/public/create
{
  "username": "test_user",
  "therapist_id": 1,
  "appointment_date": "2024-12-25",
  "start_time": "14:00",
  "end_time": "15:00",
  "service_type": "推拿",
  "notes": "颈椎调理"
}
```

### 4. 用户管理 (/api/users)
```
GET    /api/users                      # 获取所有用户
GET    /api/users/:id                  # 获取用户信息
GET    /api/users/:id/stats            # 获取用户统计信息
POST   /api/users/register             # 用户注册
POST   /api/users/login                # 用户登录
PUT    /api/users/:id                  # 更新用户信息
PUT    /api/users/:id/password         # 修改密码
GET    /api/users/search?keyword=xxx   # 搜索用户
```

**用户注册示例：**
```json
POST /api/users/register
{
  "username": "newuser",
  "email": "newuser@example.com",
  "phone": "13800138000",
  "password": "password123"
}
```

### 5. 仪表板统计 (/api/dashboard)
```
GET    /api/dashboard/stats             # 获取统计数据
GET    /api/dashboard/revenue           # 获取营收统计
GET    /api/dashboard/realtime          # 获取实时数据
```

**统计数据响应示例：**
```json
{
  "success": true,
  "stats": {
    "total_stores": 5,
    "total_therapists": 13,
    "total_users": 8,
    "total_appointments": 5,
    "today_appointments": 2,
    "appointment_by_status": [...],
    "appointment_trend": [...],
    "popular_services": [...],
    "therapist_utilization": [...],
    "store_stats": [...]
  }
}
```

## 🔐 认证说明

需要认证的接口：
- 创建/更新/删除操作通常需要认证
- 获取用户个人信息需要认证
- 部分统计数据可能需要认证

认证方式：
```bash
# 在请求头中添加
Authorization: Bearer <your_jwt_token>
```

## 📝 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {...} // 或其他字段名如 stores, therapists 等
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息描述"
}
```

## 🔄 状态码说明

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权
- `404` - 资源不存在
- `409` - 冲突（如时间冲突）
- `500` - 服务器错误

## 💡 使用示例

### 完整的预约流程
```bash
# 1. 用户登录
curl -X POST http://localhost:3002/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user", "password": "password123"}'

# 2. 查询技师
curl http://localhost:3002/api/therapists/search?service_type=推拿

# 3. 查询技师可用时间
curl http://localhost:3002/api/therapists/1/availability?date=2024-12-25

# 4. 创建预约
curl -X POST http://localhost:3002/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "user_id": 1,
    "therapist_id": 1,
    "store_id": 1,
    "service_type": "推拿",
    "appointment_date": "2024-12-25",
    "start_time": "14:00",
    "end_time": "15:00"
  }'
```

## 📌 注意事项

1. 所有日期格式为 `YYYY-MM-DD`
2. 时间格式为 `HH:MM`（24小时制）
3. 服务类型包括：推拿、正骨、艾灸、拔罐、刮痧、理疗、足疗、头疗等
4. 预约状态：pending（待确认）、confirmed（已确认）、cancelled（已取消）、completed（已完成）