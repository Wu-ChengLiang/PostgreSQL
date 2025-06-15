#!/bin/bash

# API基础URL
API_URL="http://localhost:3000/api"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 测试公开预约系统（基于用户名） ===${NC}"
echo ""

# 模拟不同用户
USERNAME1="NDR745651115"
USERNAME2="Gbj982984289"

# 1. 创建第一个用户的预约
echo -e "${YELLOW}1. 创建预约 - 用户: $USERNAME1${NC}"
APPOINTMENT1=$(curl -s -X POST "$API_URL/appointments" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME1\",
    \"customer_name\": \"吴先生\",
    \"customer_phone\": \"13812345678\",
    \"therapist_id\": 1,
    \"appointment_date\": \"2024-01-20\",
    \"appointment_time\": \"14:00\",
    \"service_type\": \"经络疏通\",
    \"notes\": \"首次预约\"
  }")
echo "$APPOINTMENT1"
APPT_ID1=$(echo $APPOINTMENT1 | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}预约ID: $APPT_ID1${NC}"
echo ""

# 2. 创建第二个用户的预约
echo -e "${YELLOW}2. 创建预约 - 用户: $USERNAME2${NC}"
APPOINTMENT2=$(curl -s -X POST "$API_URL/appointments" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME2\",
    \"customer_name\": \"张女士\",
    \"customer_phone\": \"13987654321\",
    \"therapist_id\": 2,
    \"appointment_date\": \"2024-01-20\",
    \"appointment_time\": \"15:00\",
    \"service_type\": \"足底按摩\",
    \"notes\": \"需要轻柔一些\"
  }")
echo "$APPOINTMENT2"
APPT_ID2=$(echo $APPOINTMENT2 | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}预约ID: $APPT_ID2${NC}"
echo ""

# 3. 查询第一个用户的预约列表
echo -e "${YELLOW}3. 查询用户预约列表 - 用户: $USERNAME1${NC}"
curl -s "$API_URL/appointments/user/$USERNAME1"
echo -e "\n"

# 4. 查询第二个用户的预约列表
echo -e "${YELLOW}4. 查询用户预约列表 - 用户: $USERNAME2${NC}"
curl -s "$API_URL/appointments/user/$USERNAME2"
echo -e "\n"

# 5. 查看预约详情（不提供用户名）
echo -e "${YELLOW}5. 查看预约详情（公开查看）${NC}"
curl -s "$API_URL/appointments/$APPT_ID1"
echo -e "\n"

# 6. 查看预约详情（提供正确的用户名）
echo -e "${YELLOW}6. 查看预约详情（验证用户名）${NC}"
curl -s "$API_URL/appointments/$APPT_ID1?username=$USERNAME1"
echo -e "\n"

# 7. 尝试查看其他用户的预约（应该失败）
echo -e "${YELLOW}7. 尝试查看其他用户的预约（应该失败）${NC}"
curl -s "$API_URL/appointments/$APPT_ID1?username=$USERNAME2"
echo -e "\n"

# 8. 查询技师可用时间
echo -e "${YELLOW}8. 查询技师可用时间${NC}"
curl -s "$API_URL/appointments/availability/1?date=2024-01-20"
echo -e "\n"

# 9. 用户取消自己的预约
echo -e "${YELLOW}9. 取消预约 - 用户: $USERNAME1${NC}"
curl -s -X DELETE "$API_URL/appointments/$APPT_ID1?username=$USERNAME1"
echo -e "\n"

# 10. 尝试取消其他用户的预约（应该失败）
echo -e "${YELLOW}10. 尝试取消其他用户的预约（应该失败）${NC}"
curl -s -X DELETE "$API_URL/appointments/$APPT_ID2?username=$USERNAME1"
echo -e "\n"

# 11. 查看取消后的预约列表
echo -e "${YELLOW}11. 查看取消后的预约列表 - 用户: $USERNAME1${NC}"
curl -s "$API_URL/appointments/user/$USERNAME1"
echo -e "\n"

echo -e "${GREEN}=== 测试完成 ===${NC}"