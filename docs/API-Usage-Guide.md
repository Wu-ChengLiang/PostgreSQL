# 名医堂数据平台2.0 API使用指南

## 概述

本文档提供了名医堂数据平台2.0的API使用示例，包括客户端API和管理端API的完整调用方法。

- **基础URL**: `http://localhost:8089/api/v1`
- **数据格式**: JSON
- **字符编码**: UTF-8

## 客户端API使用示例

### 1. 健康检查

检查服务是否正常运行。

```bash
curl http://localhost:8089/health
```

**响应示例**:
```json
{
    "status": "ok",
    "service": "名医堂数据平台2.0",
    "timestamp": "2025-01-15T14:30:00.000Z"
}
```

### 2. 获取门店列表

获取所有门店信息。

```bash
curl http://localhost:8089/api/v1/client/stores
```

**响应示例**:
```json
{
    "success": true,
    "data": {
        "stores": [
            {
                "id": 1,
                "name": "名医堂·颈肩腰腿特色调理（宜山路店）",
                "address": "上海市宜山路",
                "phone": null,
                "business_hours": "09:00-21:00",
                "therapist_count": 4
            }
        ]
    }
}
```

### 3. 搜索技师

#### 3.1 按专长搜索

```bash
curl "http://localhost:8089/api/v1/client/therapists/search?specialty=按摩&limit=5"
```

#### 3.2 按门店搜索

```bash
curl "http://localhost:8089/api/v1/client/therapists/search?store_id=1"
```

#### 3.3 按经验年限搜索

```bash
curl "http://localhost:8089/api/v1/client/therapists/search?min_experience=10"
```

#### 3.4 组合搜索

```bash
curl "http://localhost:8089/api/v1/client/therapists/search?store_id=1&specialty=艾灸&min_experience=5"
```

**响应示例**:
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
                "honors": null,
                "store": {
                    "id": 1,
                    "name": "名医堂·颈肩腰腿特色调理（宜山路店）",
                    "address": "上海市宜山路"
                }
            }
        ],
        "total": 50,
        "page": 1,
        "limit": 20,
        "totalPages": 3
    }
}
```

### 4. 查询技师排班

查询指定技师在某一天的可用时间。

```bash
curl "http://localhost:8089/api/v1/client/therapists/1/schedule?date=2025-01-16"
```

**响应示例**:
```json
{
    "success": true,
    "data": {
        "schedule": {
            "date": "2025-01-16",
            "available_times": [
                "09:00", "10:00", "11:00", "14:00", 
                "15:00", "16:00", "17:00", "18:00"
            ],
            "business_hours": "9:00-21:00"
        }
    }
}
```

### 5. 创建预约

创建新的预约。

```bash
curl -X POST http://localhost:8089/api/v1/client/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "therapist_id": 1,
    "user_name": "张三",
    "user_phone": "13800138000",
    "appointment_date": "2025-01-16",
    "appointment_time": "10:00",
    "notes": "颈椎不适，需要重点调理"
}'
```

**响应示例**:
```json
{
    "success": true,
    "data": {
        "appointment_id": 1,
        "confirmation_code": "APT2025011612ABC"
    }
}
```

### 6. 查询用户预约

根据手机号查询用户的所有预约。

```bash
curl "http://localhost:8089/api/v1/client/appointments/user?phone=13800138000"
```

**响应示例**:
```json
{
    "success": true,
    "data": {
        "appointments": [
            {
                "id": 1,
                "therapist": {
                    "id": 1,
                    "name": "彭老师",
                    "position": "调理师"
                },
                "store": {
                    "id": 1,
                    "name": "名医堂·颈肩腰腿特色调理（宜山路店）",
                    "address": "上海市宜山路"
                },
                "appointment_date": "2025-01-16",
                "appointment_time": "10:00",
                "duration": 60,
                "status": "pending",
                "notes": "颈椎不适，需要重点调理",
                "created_at": "2025-01-15T10:30:00.000Z"
            }
        ]
    }
}
```

### 7. 取消预约

取消指定的预约（需要提供手机号验证）。

```bash
curl -X DELETE http://localhost:8089/api/v1/client/appointments/1 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000"
}'
```

**响应示例**:
```json
{
    "success": true,
    "data": {
        "message": "预约已成功取消"
    }
}
```

## 管理端API使用示例

### 1. 管理员登录

获取访问令牌。

```bash
curl -X POST http://localhost:8089/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
}'
```

**响应示例**:
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "admin": {
            "id": 1,
            "username": "admin",
            "store_id": null,
            "role": "super_admin"
        }
    }
}
```

### 2. 技师管理

#### 2.1 获取技师列表

```bash
curl http://localhost:8089/api/v1/admin/therapists \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2.2 按门店筛选技师

```bash
curl "http://localhost:8089/api/v1/admin/therapists?store_id=1&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2.3 添加新技师

```bash
curl -X POST http://localhost:8089/api/v1/admin/therapists \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "name": "李老师",
    "position": "推拿师",
    "years_of_experience": 8,
    "specialties": ["推拿", "正骨", "经络疏通"],
    "phone": "13900139000",
    "honors": "高级推拿师"
}'
```

#### 2.4 更新技师信息

```bash
curl -X PUT http://localhost:8089/api/v1/admin/therapists/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13900139001",
    "specialties": ["推拿", "正骨", "经络疏通", "艾灸"]
}'
```

#### 2.5 删除技师

```bash
curl -X DELETE http://localhost:8089/api/v1/admin/therapists/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 预约管理

#### 3.1 获取预约列表

```bash
# 获取所有预约
curl http://localhost:8089/api/v1/admin/appointments \
  -H "Authorization: Bearer YOUR_TOKEN"

# 按日期筛选
curl "http://localhost:8089/api/v1/admin/appointments?date=2025-01-16" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 按状态筛选
curl "http://localhost:8089/api/v1/admin/appointments?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3.2 获取预约详情

```bash
curl http://localhost:8089/api/v1/admin/appointments/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3.3 更新预约状态

```bash
# 确认预约
curl -X PUT http://localhost:8089/api/v1/admin/appointments/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
}'

# 标记完成
curl -X PUT http://localhost:8089/api/v1/admin/appointments/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
}'
```

### 4. 数据统计

#### 4.1 预约统计

```bash
curl "http://localhost:8089/api/v1/admin/statistics/appointments?start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例**:
```json
{
    "success": true,
    "data": {
        "statistics": {
            "daily_statistics": [
                {
                    "date": "2025-01-15",
                    "total_appointments": 10,
                    "completed_appointments": 8,
                    "cancelled_appointments": 1,
                    "no_show_appointments": 1
                }
            ],
            "totals": {
                "total_appointments": 150,
                "completed_appointments": 120,
                "cancelled_appointments": 20,
                "no_show_appointments": 10,
                "completion_rate": "80.00%"
            }
        }
    }
}
```

#### 4.2 技师工作量统计

```bash
curl "http://localhost:8089/api/v1/admin/statistics/therapists?start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## JavaScript 示例代码

### 客户端搜索技师示例

```javascript
async function searchTherapists() {
    const response = await fetch('http://localhost:8089/api/v1/client/therapists/search?specialty=按摩');
    const data = await response.json();
    
    if (data.success) {
        console.log(`找到 ${data.data.total} 位技师`);
        data.data.therapists.forEach(therapist => {
            console.log(`${therapist.name} - ${therapist.position}`);
        });
    }
}
```

### 管理端添加技师示例

```javascript
async function addTherapist(token) {
    const response = await fetch('http://localhost:8089/api/v1/admin/therapists', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            store_id: 1,
            name: '新技师',
            position: '调理师',
            years_of_experience: 5,
            specialties: ['按摩', '艾灸']
        })
    });
    
    const data = await response.json();
    if (data.success) {
        console.log('技师添加成功:', data.data.therapist);
    }
}
```

## 错误处理

所有API在出错时会返回统一的错误格式：

```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "错误描述"
    }
}
```

常见错误码：

- `INVALID_PARAMS`: 参数错误
- `NOT_FOUND`: 资源不存在
- `AUTH_FAILED`: 认证失败
- `CONFLICT`: 资源冲突（如时间冲突）
- `SERVER_ERROR`: 服务器内部错误

## 注意事项

1. **字符编码**: 中文参数需要进行URL编码
2. **认证令牌**: 管理端API的令牌有效期为24小时
3. **限流**: 客户端API限制每分钟60次请求，管理端API限制每分钟100次请求
4. **预约时间**: 预约时间前2小时内无法取消
5. **技师删除**: 有未完成预约的技师无法删除（软删除）

## 测试环境

- 默认管理员账号：admin / admin123
- 测试手机号：13800138000
- API测试脚本：`node scripts/test-all-apis.js`