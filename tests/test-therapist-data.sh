#!/bin/bash

# API基础URL
API_URL="http://localhost:3000/api"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 测试技师数据查询 ===${NC}"
echo ""

# 1. 获取所有门店
echo -e "${YELLOW}1. 获取所有门店${NC}"
curl -s "$API_URL/stores" | head -500
echo -e "\n"

# 2. 获取所有技师
echo -e "${YELLOW}2. 获取所有技师（前5个）${NC}"
curl -s "$API_URL/therapists" | head -500
echo -e "\n"

# 3. 查询莘庄店的技师
echo -e "${YELLOW}3. 查询莘庄店的技师${NC}"
curl -s "$API_URL/therapists?action=query_schedule&store_name=莘庄店"
echo -e "\n"

# 4. 查询陈老师
echo -e "${YELLOW}4. 查询陈老师的排班${NC}"
curl -s "$API_URL/therapists?action=query_schedule&therapist_name=陈老师"
echo -e "\n"

# 5. 查询会艾灸的技师
echo -e "${YELLOW}5. 查询擅长艾灸的技师${NC}"
curl -s "$API_URL/therapists?action=query_schedule&service_type=艾灸"
echo -e "\n"

# 6. 查询妙康中医的技师
echo -e "${YELLOW}6. 查询妙康中医的技师${NC}"
curl -s "$API_URL/therapists?action=query_schedule&store_name=妙康中医"
echo -e "\n"

# 7. 创建预约到莘庄店
echo -e "${YELLOW}7. 创建预约到莘庄店的陈老师${NC}"
APPOINTMENT=$(curl -s -X POST "$API_URL/appointments" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "TEST_USER_001",
    "customer_name": "测试客户",
    "customer_phone": "13900000001",
    "therapist_id": 1,
    "appointment_date": "2024-01-25",
    "appointment_time": "10:00",
    "service_type": "经络疏通",
    "notes": "测试预约"
  }')
echo "$APPOINTMENT"
echo ""

echo -e "${GREEN}=== 测试完成 ===${NC}"