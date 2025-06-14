# PostgreSQL API - 预约系统文档

## 系统概述

本系统是一个完整的连锁调理店预约管理系统，支持多分店、技师管理、排班管理和智能预约功能。

### 核心功能
- 多分店管理
- 技师信息管理（包含职位、专长等）
- 灵活的排班系统
- 智能预约助手（支持自然语言查询）
- 完整的预约流程管理

## API 端点文档

### 基础端点

#### 健康检查
```
GET /api/health
```

### 认证端点

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户姓名"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 分店管理

#### 获取所有分店
```
GET /api/stores
```

响应示例：
```json
[
  {
    "id": 18,
    "name": "名医堂·颈肩腰腿特色调理（东方路店）",
    "address": "上海市浦东新区东方路",
    "phone": null,
    "business_hours": "09:00-21:00",
    "status": "active"
  }
]
```

#### 获取分店详情（包含技师）
```
GET /api/stores/:id
```

### 技师管理

#### 获取技师列表
```
GET /api/therapists
GET /api/therapists?store_id=18
GET /api/therapists?specialty=艾灸
```

#### 搜索技师
```
POST /api/therapists/search
Content-Type: application/json

{
  "query": "王老师",
  "date": "2025-06-14",
  "time": "15:00"
}
```

#### 获取技师排班
```
GET /api/therapists/:id/schedule
GET /api/therapists/:id/schedule?start_date=2025-06-14&end_date=2025-06-20
```

#### 生成技师排班
```
POST /api/therapists/:id/schedule
Content-Type: application/json
Authorization: Bearer <token>

{
  "start_date": "2025-06-14",
  "end_date": "2025-06-20",
  "start_time": "09:00",
  "end_time": "21:00"
}
```

#### 检查技师可用性
```
POST /api/therapists/:id/availability
Content-Type: application/json

{
  "date": "2025-06-14",
  "time": "15:00"
}
```

### 预约管理

#### 创建预约
```
POST /api/appointments
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer_name": "张三",
  "customer_phone": "13800138000",
  "store_id": 18,
  "therapist_id": 13,
  "appointment_date": "2025-06-14",
  "appointment_time": "15:00",
  "duration_minutes": 60,
  "service_type": "颈肩调理",
  "notes": "第一次来，需要详细诊断"
}
```

#### 获取我的预约
```
GET /api/appointments/my-appointments
Authorization: Bearer <token>

可选参数：
?status=pending|confirmed|completed|cancelled
?start_date=2025-06-14
?end_date=2025-06-20
```

#### 获取所有预约（管理员）
```
GET /api/appointments
Authorization: Bearer <token>

可选参数：
?store_id=18
?therapist_id=13
?status=pending
?date=2025-06-14
```

#### 更新预约状态
```
PUT /api/appointments/:id/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "confirmed"  // pending|confirmed|completed|cancelled
}
```

#### 取消预约
```
DELETE /api/appointments/:id
Authorization: Bearer <token>
```

### 智能预约助手

#### 自然语言预约查询
```
POST /api/appointments/assistant
Content-Type: application/json

{
  "message": "我需要调理师-王老师（副店长）为我服务，预计15:00到店"
}
```

响应示例：
```json
{
  "message": "我需要调理师-王老师（副店长）为我服务，预计15:00到店",
  "suggestions": [
    {
      "type": "therapists_found",
      "count": 1,
      "message": "找到 1 位符合条件的技师"
    },
    {
      "type": "availability",
      "message": "其中 1 位技师在 2025-06-14 15:00 可以预约"
    }
  ],
  "available_therapists": [
    {
      "id": 13,
      "name": "王老师",
      "title": "调理师",
      "position": "副店长",
      "store_name": "名医堂·颈肩腰腿特色调理（东方路店）",
      "availability": {
        "is_available": true,
        "schedule_status": "available"
      }
    }
  ]
}
```

## 数据库结构

### 主要数据表

1. **stores** - 分店信息
   - id, name, address, phone, business_hours, status

2. **therapists** - 技师信息
   - id, store_id, name, title, position, years_of_experience, rating_count

3. **therapist_specialties** - 技师专长
   - id, therapist_id, specialty

4. **schedules** - 排班信息
   - id, therapist_id, date, start_time, end_time, status

5. **appointments** - 预约记录
   - id, customer_name, customer_phone, store_id, therapist_id, appointment_date, appointment_time, status

### 预约状态
- **pending** - 待确认
- **confirmed** - 已确认
- **completed** - 已完成
- **cancelled** - 已取消

## 使用示例

### 完整的预约流程

1. **查询可用技师**
```bash
curl -X POST http://emagen.323424.xyz/api/appointments/assistant \
  -H "Content-Type: application/json" \
  -d '{"message":"我想找一位擅长推拿正骨的技师，明天下午3点"}'
```

2. **创建预约**
```bash
# 先登录获取token
TOKEN=$(curl -s -X POST http://emagen.323424.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 创建预约
curl -X POST http://emagen.323424.xyz/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_name": "李四",
    "customer_phone": "13900139000",
    "therapist_id": 13,
    "appointment_date": "2025-06-15",
    "appointment_time": "15:00",
    "service_type": "推拿正骨"
  }'
```

3. **查看预约状态**
```bash
curl -X GET http://emagen.323424.xyz/api/appointments/my-appointments \
  -H "Authorization: Bearer $TOKEN"
```

## 部署信息

- **生产环境**: http://emagen.323424.xyz
- **IP地址**: http://43.167.226.222
- **API基础路径**: /api/
- **数据库**: PostgreSQL 16
- **进程管理**: PM2
- **反向代理**: Nginx

## 注意事项

1. 所有需要认证的端点都需要在请求头中包含 `Authorization: Bearer <token>`
2. Token 有效期为 24 小时
3. 时间格式使用 24 小时制 (HH:MM)
4. 日期格式使用 ISO 8601 (YYYY-MM-DD)
5. 智能助手支持自然语言，但建议使用标准格式以获得最佳结果