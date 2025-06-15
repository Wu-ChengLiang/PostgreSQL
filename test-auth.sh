#!/bin/bash

# API基础URL
API_URL="http://localhost:3000/api"

echo "=== 测试认证系统 ==="
echo ""

# 注册新用户
echo "1. 注册新用户..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "测试用户"
  }')

echo "注册响应: $REGISTER_RESPONSE"
echo ""

# 提取token
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "注册失败，尝试登录现有用户..."
  
  # 登录
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "testpass123"
    }')
  
  echo "登录响应: $LOGIN_RESPONSE"
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

echo ""
echo "Token: $TOKEN"
echo ""

# 测试需要认证的端点
echo "2. 测试获取预约列表（需要认证）..."
curl -X GET "$API_URL/appointments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo ""

echo "3. 测试创建预约（需要认证）..."
curl -X POST "$API_URL/appointments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "张先生",
    "customer_phone": "13812345678",
    "therapist_id": 1,
    "appointment_date": "2024-01-20",
    "appointment_time": "14:00",
    "service_type": "经络疏通",
    "notes": "首次预约"
  }'

echo ""
echo ""

echo "4. 测试查询排班（不需要认证）..."
curl -X GET "$API_URL/therapists?action=query_schedule&therapist_name=陈老师"

echo ""