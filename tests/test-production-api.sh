#!/bin/bash

# Production API Test Script
BASE_URL="http://emagen.323424.xyz/api/functions"

echo "=== Testing Production Function Call APIs ==="
echo "Base URL: $BASE_URL"
echo ""

# 1. 获取门店列表
echo "1. Getting store list..."
curl -X GET "$BASE_URL/stores" | jq '.'
echo ""

# 2. 查询技师列表
echo "2. Searching therapists in 静安寺店..."
curl -X POST "$BASE_URL/search-therapists" \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "静安寺店"
  }' | jq '.'
echo ""

# 3. 获取技师今日和明日预约
echo "3. Getting therapist appointments for 王老师..."
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

# 5. 创建测试预约
echo "5. Creating test appointment..."
TIMESTAMP=$(date +%s)
curl -X POST "$BASE_URL/create-appointment" \
  -H "Content-Type: application/json" \
  -d "{
    \"store_name\": \"名医堂·颈肩腰腿特色调理（静安寺店）\",
    \"therapist_name\": \"王老师\",
    \"customer_name\": \"测试客户$TIMESTAMP\",
    \"customer_phone\": \"138$(printf %08d $((RANDOM % 100000000)))\",
    \"appointment_date\": \"$TODAY\",
    \"appointment_time\": \"15:00\",
    \"service_type\": \"颈肩调理\",
    \"notes\": \"API测试预约\"
  }" | jq '.'
echo ""

# 6. 查询所有东方路店的技师
echo "6. Searching all therapists in 东方路店..."
curl -X POST "$BASE_URL/search-therapists" \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "东方路店"
  }' | jq '.'
echo ""

# 7. 搜索特定专长的技师
echo "7. Searching therapists with specific specialties..."
curl -X POST "$BASE_URL/search-therapists" \
  -H "Content-Type: application/json" \
  -d '{
    "specialties": ["推拿正骨", "颈肩腰腿痛调理"]
  }' | jq '.'
echo ""

echo "=== Test completed ===="