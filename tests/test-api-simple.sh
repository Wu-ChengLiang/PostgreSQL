#!/bin/bash

# API基础URL
API_URL="http://emagen.323424.xyz/api"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 测试预约系统API ===${NC}"
echo ""

# 1. 获取门店列表
echo -e "${YELLOW}1. 获取门店列表${NC}"
echo "请求: GET $API_URL/stores"
curl -s "$API_URL/stores" | python3 -m json.tool | head -20
echo ""

# 2. 查询技师（按门店）
echo -e "${YELLOW}2. 查询技师（按门店）${NC}"
echo "请求: GET $API_URL/therapists?action=query_schedule&store_name=莘庄店"
RESPONSE=$(curl -s "$API_URL/therapists?action=query_schedule&store_name=莘庄店")
if [ -z "$RESPONSE" ]; then
    echo "响应: 没有找到符合条件的技师"
else
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
fi
echo ""

# 3. 查询技师（按服务类型）
echo -e "${YELLOW}3. 查询技师（按服务类型）${NC}"
echo "请求: GET $API_URL/therapists?action=query_schedule&service_type=艾灸"
RESPONSE=$(curl -s "$API_URL/therapists?action=query_schedule&service_type=艾灸")
if [ -z "$RESPONSE" ]; then
    echo "响应: 没有找到符合条件的技师"
else
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
fi
echo ""

# 4. 查询技师可用时间
echo -e "${YELLOW}4. 查询技师可用时间${NC}"
TOMORROW=$(date -d "tomorrow" +%Y-%m-%d)
echo "请求: GET $API_URL/appointments/availability/1?date=$TOMORROW"
curl -s "$API_URL/appointments/availability/1?date=$TOMORROW" | python3 -m json.tool
echo ""

# 5. 创建预约
echo -e "${YELLOW}5. 创建预约${NC}"
USERNAME="TEST_USER_$(date +%s)"
echo "请求: POST $API_URL/appointments"
echo "Body: {
  \"username\": \"$USERNAME\",
  \"customer_name\": \"测试客户\",
  \"customer_phone\": \"13800138000\",
  \"therapist_id\": 1,
  \"appointment_date\": \"$TOMORROW\",
  \"appointment_time\": \"14:00\",
  \"service_type\": \"经络疏通\",
  \"notes\": \"测试预约\"
}"

APPOINTMENT_RESPONSE=$(curl -s -X POST "$API_URL/appointments" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"customer_name\": \"测试客户\",
    \"customer_phone\": \"13800138000\",
    \"therapist_id\": 1,
    \"appointment_date\": \"$TOMORROW\",
    \"appointment_time\": \"14:00\",
    \"service_type\": \"经络疏通\",
    \"notes\": \"测试预约\"
  }")

echo "$APPOINTMENT_RESPONSE" | python3 -m json.tool
APPOINTMENT_ID=$(echo "$APPOINTMENT_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo ""

# 6. 查看用户预约
echo -e "${YELLOW}6. 查看用户预约${NC}"
echo "请求: GET $API_URL/appointments/user/$USERNAME"
curl -s "$API_URL/appointments/user/$USERNAME" | python3 -m json.tool
echo ""

# 7. 查看预约详情
if [ ! -z "$APPOINTMENT_ID" ]; then
    echo -e "${YELLOW}7. 查看预约详情${NC}"
    echo "请求: GET $API_URL/appointments/$APPOINTMENT_ID"
    curl -s "$API_URL/appointments/$APPOINTMENT_ID" | python3 -m json.tool
    echo ""
fi

# 8. 取消预约
if [ ! -z "$APPOINTMENT_ID" ]; then
    echo -e "${YELLOW}8. 取消预约${NC}"
    echo "请求: DELETE $API_URL/appointments/$APPOINTMENT_ID?username=$USERNAME"
    curl -s -X DELETE "$API_URL/appointments/$APPOINTMENT_ID?username=$USERNAME" | python3 -m json.tool
    echo ""
fi

echo -e "${GREEN}=== 测试完成 ===${NC}"
echo ""
echo -e "${GREEN}总结：${NC}"
echo "1. 门店和技师数据已经加载到系统中"
echo "2. 预约系统基于用户名（username）工作，不需要token"
echo "3. 查询技师时返回空表示没有找到符合条件的技师"
echo "4. 所有预约操作都需要提供username作为身份标识"