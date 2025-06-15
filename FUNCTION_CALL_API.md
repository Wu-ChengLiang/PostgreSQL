# Function Call API Documentation

## Base URL
```
http://localhost:3000/api/functions
```

## Endpoints

### 1. 检查技师可用性
```
POST /check-availability
```

**Request Body:**
```json
{
  "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）",
  "therapist_name": "王老师",
  "appointment_date": "2024-12-31",
  "appointment_time": "15:00"
}
```

**Response:**
```json
{
  "success": true,
  "is_available": true,
  "therapist_info": {
    "therapist_id": 38,
    "therapist_name": "王老师",
    "therapist_gender": "女",
    "therapist_title": "调理师",
    "store_id": 26,
    "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）"
  },
  "conflict_reason": null
}
```

### 2. 创建预约
```
POST /create-appointment
```

**Request Body:**
```json
{
  "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）",
  "therapist_name": "王老师",
  "customer_name": "张三",
  "customer_phone": "13800138000",
  "appointment_date": "2024-12-31",
  "appointment_time": "15:00",
  "service_type": "颈肩调理",
  "notes": "预计15:00到店"
}
```

**Response:**
```json
{
  "success": true,
  "appointment_id": 1,
  "message": "预约成功"
}
```

### 3. 获取技师今日和明日预约
```
POST /get-therapist-appointments
```

**Request Body:**
```json
{
  "therapist_name": "王老师",
  "store_name": "静安寺店"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "therapist_id": 38,
      "therapist_name": "王老师",
      "therapist_gender": "女",
      "therapist_title": "调理师",
      "therapist_phone": null,
      "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）",
      "today_appointments": [
        {
          "time": "10:00:00",
          "customer_name": "李四",
          "customer_phone": "13900139000"
        }
      ],
      "tomorrow_appointments": []
    }
  ]
}
```

### 4. 查询技师列表
```
POST /search-therapists
```

**Request Body:**
```json
{
  "store_name": "静安寺店",
  "therapist_name": null,
  "specialties": ["推拿正骨", "颈肩腰腿痛调理"]
}
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "therapists": [
    {
      "id": 33,
      "name": "吴老师",
      "gender": "男",
      "title": "推拿师",
      "phone": null,
      "years_of_experience": 14,
      "rating_count": 99,
      "service_count": 0,
      "is_recommended": false,
      "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）",
      "store_address": "上海市静安区南京西路",
      "specialties": ["推拿正骨", "颈肩腰腿痛调理", "拔罐"]
    }
  ]
}
```

### 5. 获取门店列表
```
GET /stores
```

**Response:**
```json
{
  "success": true,
  "count": 30,
  "stores": [
    {
      "id": 1,
      "name": "名医堂·肩颈腰腿特色调理（港汇店）",
      "address": "上海市徐汇区港汇广场",
      "phone": null,
      "business_hours": "09:00-21:00",
      "status": "active",
      "therapist_count": 0
    }
  ]
}
```

### 6. 取消预约
```
POST /cancel-appointment
```

**Request Body:**
```json
{
  "appointment_id": 1,
  "customer_phone": "13800138000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

### 7. 查询客户预约记录
```
POST /get-customer-appointments
```

**Request Body:**
```json
{
  "customer_phone": "13800138000",
  "status": "confirmed",
  "date_from": "2024-12-01",
  "date_to": "2024-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "appointments": [
    {
      "appointment_id": 1,
      "customer_name": "张三",
      "customer_phone": "13800138000",
      "appointment_date": "2024-12-31",
      "appointment_time": "15:00:00",
      "duration_minutes": 60,
      "service_type": "颈肩调理",
      "status": "confirmed",
      "notes": "预计15:00到店",
      "therapist_name": "王老师",
      "therapist_gender": "女",
      "therapist_title": "调理师",
      "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）",
      "store_address": "上海市静安区南京西路"
    }
  ]
}
```

## Error Responses

所有API在出错时返回以下格式：

```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息（可选）"
}
```

## Notes

1. 所有日期格式为 `YYYY-MM-DD`
2. 所有时间格式为 `HH:MM` 或 `HH:MM:SS`
3. 电话号码必须是11位中国手机号格式
4. 所有API都是无需认证的公开接口，适合function calling使用