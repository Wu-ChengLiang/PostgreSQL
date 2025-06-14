#!/bin/bash

# Test Function Call APIs
BASE_URL="http://localhost:3000/api/functions"

echo "=== Testing Function Call APIs ==="
echo ""

# 1. 获取门店列表
echo "1. Getting store list..."
curl -X GET "$BASE_URL/stores" | jq '.'
echo ""

# 2. 查询技师列表
echo "2. Searching therapists..."
curl -X POST "$BASE_URL/search-therapists" \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "静安寺店"
  }' | jq '.'
echo ""

# 3. 获取技师今日和明日预约
echo "3. Getting therapist appointments..."
curl -X POST "$BASE_URL/get-therapist-appointments" \
  -H "Content-Type: application/json" \
  -d '{
    "therapist_name": "王老师",
    "store_name": "静安寺店"
  }' | jq '.'
echo ""

# 4. 检查技师可用性
echo "4. Checking therapist availability..."
TODAY=$(date +%Y-%m-%d)
curl -X POST "$BASE_URL/check-availability" \
  -H "Content-Type: application/json" \
  -d "{
    \"store_name\": \"名医堂·颈肩腰腿特色调理（静安寺店）\",
    \"therapist_name\": \"王老师\",
    \"appointment_date\": \"$TODAY\",
    \"appointment_time\": \"15:00\"
  }" | jq '.'
echo ""

# 5. 创建预约
echo "5. Creating appointment..."
curl -X POST "$BASE_URL/create-appointment" \
  -H "Content-Type: application/json" \
  -d "{
    \"store_name\": \"名医堂·颈肩腰腿特色调理（静安寺店）\",
    \"therapist_name\": \"王老师\",
    \"customer_name\": \"测试客户\",
    \"customer_phone\": \"13800138000\",
    \"appointment_date\": \"$TODAY\",
    \"appointment_time\": \"15:00\",
    \"service_type\": \"颈肩调理\",
    \"notes\": \"测试预约，预计15:00到店\"
  }" | jq '.'
echo ""

# 6. 查询客户预约记录
echo "6. Getting customer appointments..."
curl -X POST "$BASE_URL/get-customer-appointments" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_phone": "13800138000"
  }' | jq '.'
echo ""

# 7. 测试错误处理 - 缺少必填字段
echo "7. Testing error handling - missing required fields..."
curl -X POST "$BASE_URL/check-availability" \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）"
  }' | jq '.'
echo ""

# 8. 测试错误处理 - 无效的电话号码
echo "8. Testing error handling - invalid phone number..."
curl -X POST "$BASE_URL/create-appointment" \
  -H "Content-Type: application/json" \
  -d "{
    \"store_name\": \"名医堂·颈肩腰腿特色调理（静安寺店）\",
    \"therapist_name\": \"王老师\",
    \"customer_name\": \"测试客户\",
    \"customer_phone\": \"12345\",
    \"appointment_date\": \"$TODAY\",
    \"appointment_time\": \"15:00\"
  }" | jq '.'
echo ""

echo "=== Test completed ===="