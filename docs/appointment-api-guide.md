# 预约系统API接口文档

## 基础信息
- 基础URL: http://emagen.323424.xyz/api
- 认证方式: 基于用户名（username），不需要token

## 1. 门店相关接口

### 获取所有门店
```
GET /api/stores
```
响应示例：
```json
[
  {
    "id": 1,
    "name": "名医堂·颈肩腰腿特色调理（莘庄店）",
    "address": "上海市闵行区莘庄",
    "business_hours": "09:00-21:00"
  }
]
```

## 2. 技师相关接口

### 获取所有技师
```
GET /api/therapists
```

### 查询技师排班（支持多种查询方式）
```
GET /api/therapists?action=query_schedule&therapist_name=陈老师
GET /api/therapists?action=query_schedule&store_name=莘庄店
GET /api/therapists?action=query_schedule&service_type=艾灸
```

参数说明：
- `therapist_name`: 技师姓名（模糊匹配）
- `store_name`: 门店名称（模糊匹配）
- `service_type`: 服务类型/专长（如：艾灸、推拿、经络疏通等）

## 3. 预约相关接口

### 创建预约
```
POST /api/appointments
Content-Type: application/json
```

请求体：
```json
{
  "username": "NDR745651115",      // 必填：用户名/会话ID
  "customer_name": "张先生",         // 必填：客户姓名
  "customer_phone": "13812345678",  // 必填：客户电话
  "therapist_id": 1,                // 必填：技师ID
  "store_id": 1,                    // 可选：门店ID
  "appointment_date": "2024-01-25", // 必填：预约日期 (YYYY-MM-DD)
  "appointment_time": "14:00",      // 必填：预约时间 (HH:MM)
  "service_type": "经络疏通",        // 可选：服务类型
  "notes": "首次预约"                // 可选：备注
}
```

响应示例：
```json
{
  "success": true,
  "appointment": {
    "id": 1,
    "username": "NDR745651115",
    "customer_name": "张先生",
    "customer_phone": "13812345678",
    "therapist_id": 1,
    "appointment_date": "2024-01-25",
    "appointment_time": "14:00",
    "service_type": "经络疏通",
    "status": "confirmed",
    "therapist_name": "陈老师",
    "store_name": "名医堂·颈肩腰腿特色调理（莘庄店）"
  },
  "message": "预约成功！预约ID: 1"
}
```

### 查看用户的所有预约
```
GET /api/appointments/user/{username}
```

示例：
```
GET /api/appointments/user/NDR745651115
```

响应示例：
```json
{
  "success": true,
  "username": "NDR745651115",
  "appointments": [
    {
      "id": 1,
      "customer_name": "张先生",
      "customer_phone": "13812345678",
      "appointment_date": "2024-01-25",
      "appointment_time": "14:00",
      "status": "confirmed",
      "therapist_name": "陈老师",
      "store_name": "名医堂·颈肩腰腿特色调理（莘庄店）"
    }
  ]
}
```

### 查看单个预约详情
```
GET /api/appointments/{id}
GET /api/appointments/{id}?username={username}  // 带用户名验证
```

示例：
```
GET /api/appointments/1
GET /api/appointments/1?username=NDR745651115
```

### 取消预约
```
DELETE /api/appointments/{id}?username={username}
```

示例：
```
DELETE /api/appointments/1?username=NDR745651115
```

注意：必须提供正确的username才能取消预约

### 更新预约状态
```
PUT /api/appointments/{id}/status
Content-Type: application/json
```

请求体：
```json
{
  "status": "cancelled",           // 状态：pending/confirmed/completed/cancelled
  "username": "NDR745651115"       // 必填：用户名验证
}
```

### 查询技师可用时间
```
GET /api/appointments/availability/{therapistId}?date=2024-01-25
```

响应示例：
```json
{
  "success": true,
  "therapist": {
    "id": 1,
    "name": "陈老师",
    "specialties": ["妇科调理", "经络疏通", "艾灸"]
  },
  "date": "2024-01-25",
  "booked_times": ["10:00", "14:00"],
  "available_times": ["09:00", "11:00", "12:00", "13:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
  "total_slots": 12,
  "available_slots": 10
}
```

## 4. 使用示例

### 完整的预约流程

1. **查询门店**
```bash
curl http://emagen.323424.xyz/api/stores
```

2. **查询技师**
```bash
# 按门店查询
curl "http://emagen.323424.xyz/api/therapists?action=query_schedule&store_name=莘庄店"

# 按服务类型查询
curl "http://emagen.323424.xyz/api/therapists?action=query_schedule&service_type=艾灸"
```

3. **查看技师可用时间**
```bash
curl "http://emagen.323424.xyz/api/appointments/availability/1?date=2024-01-25"
```

4. **创建预约**
```bash
curl -X POST http://emagen.323424.xyz/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "username": "USER001",
    "customer_name": "李女士",
    "customer_phone": "13900000001",
    "therapist_id": 1,
    "appointment_date": "2024-01-25",
    "appointment_time": "15:00",
    "service_type": "经络疏通",
    "notes": "肩颈不适"
  }'
```

5. **查看我的预约**
```bash
curl http://emagen.323424.xyz/api/appointments/user/USER001
```

6. **取消预约**
```bash
curl -X DELETE "http://emagen.323424.xyz/api/appointments/1?username=USER001"
```

## 5. 注意事项

1. **用户名（username）**：
   - 每个用户需要有唯一的用户名（如：NDR745651115）
   - 用户只能查看和取消自己创建的预约
   - 创建预约时必须提供username

2. **预约时间**：
   - 根据门店营业时间安排（大部分9:00-21:00）
   - 每个时段为1小时
   - 建议先查询技师可用时间

3. **状态管理**：
   - pending: 待确认
   - confirmed: 已确认
   - completed: 已完成
   - cancelled: 已取消