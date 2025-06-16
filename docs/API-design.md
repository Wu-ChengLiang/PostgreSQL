# 名医堂数据平台2.0 API设计文档

## 1. API概览

基础URL: `http://localhost:3000/api/v1`

## 2. 客户端API

### 2.1 搜索技师
**GET** `/therapists/search`

参数:
- `store_id` (可选): 门店ID
- `specialty` (可选): 专长关键词
- `min_experience` (可选): 最少从业年限

响应示例:
```json
{
    "success": true,
    "data": {
        "therapists": [
            {
                "id": 1,
                "name": "彭老师",
                "position": "调理师",
                "years_of_experience": 13,
                "specialties": ["按摩", "经络疏通", "艾灸"],
                "store": {
                    "id": 1,
                    "name": "名医堂·颈肩腰腿特色调理（宜山路店）"
                }
            }
        ],
        "total": 50
    }
}
```

### 2.2 查询技师排班
**GET** `/therapists/:id/schedule`

参数:
- `date` (必填): 查询日期 (YYYY-MM-DD)

响应示例:
```json
{
    "success": true,
    "data": {
        "schedule": {
            "date": "2025-01-16",
            "available_times": [
                "09:00", "10:00", "11:00", "14:00", "15:00"
            ],
            "business_hours": "9:00-21:00"
        }
    }
}
```

### 2.3 创建预约
**POST** `/appointments`

请求体:
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

响应示例:
```json
{
    "success": true,
    "data": {
        "appointment_id": 123,
        "confirmation_code": "APT20250116123"
    }
}
```

### 2.4 查看用户预约
**GET** `/appointments/user`

参数:
- `phone` (必填): 用户手机号

响应示例:
```json
{
    "success": true,
    "data": {
        "appointments": [
            {
                "id": 123,
                "therapist": {
                    "name": "彭老师",
                    "position": "调理师"
                },
                "store": {
                    "name": "名医堂·颈肩腰腿特色调理（宜山路店）"
                },
                "appointment_date": "2025-01-16",
                "appointment_time": "10:00",
                "status": "confirmed"
            }
        ]
    }
}
```

### 2.5 取消预约
**DELETE** `/appointments/:id`

请求体:
```json
{
    "phone": "13800138000"
}
```

## 3. 管理端API

### 3.1 管理员登录
**POST** `/admin/login`

请求体:
```json
{
    "username": "admin",
    "password": "password123"
}
```

响应示例:
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "admin": {
            "id": 1,
            "username": "admin",
            "store_id": null
        }
    }
}
```

### 3.2 获取门店列表
**GET** `/admin/stores`

Headers:
- `Authorization: Bearer {token}`

### 3.3 技师管理

#### 3.3.1 获取技师列表
**GET** `/admin/therapists`

参数:
- `store_id` (可选): 门店ID
- `page` (可选): 页码
- `limit` (可选): 每页数量

#### 3.3.2 添加技师
**POST** `/admin/therapists`

请求体:
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

#### 3.3.3 更新技师信息
**PUT** `/admin/therapists/:id`

#### 3.3.4 删除技师
**DELETE** `/admin/therapists/:id`

### 3.4 预约管理

#### 3.4.1 获取预约列表
**GET** `/admin/appointments`

参数:
- `store_id` (可选)
- `therapist_id` (可选)
- `date` (可选)
- `status` (可选): pending/confirmed/cancelled/completed

#### 3.4.2 获取预约详情
**GET** `/admin/appointments/:id`

#### 3.4.3 更新预约状态
**PUT** `/admin/appointments/:id/status`

请求体:
```json
{
    "status": "completed"
}
```

### 3.5 数据统计

#### 3.5.1 预约统计
**GET** `/admin/statistics/appointments`

参数:
- `start_date`: 开始日期
- `end_date`: 结束日期
- `store_id` (可选)

#### 3.5.2 技师工作量统计
**GET** `/admin/statistics/therapists`

## 4. 错误码说明

| 错误码 | 描述 |
|--------|------|
| AUTH_FAILED | 认证失败 |
| INVALID_PARAMS | 参数错误 |
| NOT_FOUND | 资源不存在 |
| CONFLICT | 资源冲突（如时间冲突） |
| SERVER_ERROR | 服务器错误 |

## 5. 通用响应头

- `Content-Type: application/json`
- `X-Request-ID`: 请求追踪ID
- `X-RateLimit-Limit`: 速率限制
- `X-RateLimit-Remaining`: 剩余请求次数