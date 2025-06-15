#!/bin/bash

# API基础URL
API_URL="http://localhost:3000/api"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 测试所有API端点 ===${NC}"
echo ""

# 1. 健康检查
echo -e "${YELLOW}1. 健康检查${NC}"
curl -s "$API_URL/health"
echo -e "\n"

# 2. 获取所有门店
echo -e "${YELLOW}2. 获取所有门店${NC}"
curl -s "$API_URL/stores"
echo -e "\n"

# 3. 获取所有技师
echo -e "${YELLOW}3. 获取所有技师${NC}"
curl -s "$API_URL/therapists"
echo -e "\n"

# 4. 查询技师排班
echo -e "${YELLOW}4. 查询技师排班（按名称搜索）${NC}"
curl -s "$API_URL/therapists?action=query_schedule&therapist_name=陈老师"
echo -e "\n"

# 5. 用户注册
echo -e "${YELLOW}5. 用户注册${NC}"
TIMESTAMP=$(date +%s)
EMAIL="test${TIMESTAMP}@example.com"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"testpass123\",
    \"name\": \"测试用户$TIMESTAMP\"
  }")
echo "$REGISTER_RESPONSE"

# 提取token
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}Token: $TOKEN${NC}"
echo ""

# 6. 用户登录
echo -e "${YELLOW}6. 用户登录${NC}"
curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"testpass123\"
  }"
echo -e "\n"

# 7. 创建预约（需要认证）
echo -e "${YELLOW}7. 创建预约（需要认证）${NC}"
APPOINTMENT_RESPONSE=$(curl -s -X POST "$API_URL/appointments" \
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
  }')
echo "$APPOINTMENT_RESPONSE"

# 提取预约ID
APPOINTMENT_ID=$(echo $APPOINTMENT_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}预约ID: $APPOINTMENT_ID${NC}"
echo ""

# 8. 获取预约列表（需要认证）
echo -e "${YELLOW}8. 获取预约列表（需要认证）${NC}"
curl -s -X GET "$API_URL/appointments" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 9. 获取单个预约详情（需要认证）
echo -e "${YELLOW}9. 获取单个预约详情（需要认证）${NC}"
curl -s -X GET "$API_URL/appointments/$APPOINTMENT_ID" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 10. 更新预约状态（需要认证）
echo -e "${YELLOW}10. 更新预约状态（需要认证）${NC}"
curl -s -X PUT "$API_URL/appointments/$APPOINTMENT_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
echo -e "\n"

# 11. 测试无认证访问（应该失败）
echo -e "${YELLOW}11. 测试无认证访问（应该失败）${NC}"
curl -s -X GET "$API_URL/appointments"
echo -e "\n"

# 12. 测试无效token（应该失败）
echo -e "${YELLOW}12. 测试无效token（应该失败）${NC}"
curl -s -X GET "$API_URL/appointments" \
  -H "Authorization: Bearer invalid-token"
echo -e "\n"

# 13. 测试查询技师按服务类型
echo -e "${YELLOW}13. 查询按服务类型搜索技师${NC}"
curl -s "$API_URL/therapists?action=query_schedule&service_type=经络疏通"
echo -e "\n"

# 14. 测试查询技师按门店
echo -e "${YELLOW}14. 查询按门店搜索技师${NC}"
curl -s "$API_URL/therapists?action=query_schedule&store_name=徐汇店"
echo -e "\n"

echo -e "${GREEN}=== 测试完成 ===${NC}"