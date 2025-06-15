#!/bin/bash

# 预约API测试脚本
# 用于验证修复后的预约功能是否正常工作

API_URL="${1:-http://localhost:3000/api}"
USERNAME="TEST_$(date +%s)"
PHONE="138$(date +%s | tail -c 9)"

# 颜色设置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== 预约API功能测试 ===${NC}"
echo "API URL: $API_URL"
echo "测试用户名: $USERNAME"
echo "测试手机号: $PHONE"
echo ""

# 检查curl是否可用
if ! command -v curl >/dev/null 2>&1; then
    echo -e "${RED}错误: curl命令不可用${NC}"
    exit 1
fi

# 测试函数
test_api() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_code="$5"
    
    echo -e "${YELLOW}测试: ${name}${NC}"
    echo "URL: $method $url"
    
    if [ -n "$data" ]; then
        echo "数据: $data"
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
    fi
    
    # 分离响应体和状态码
    response_body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -n 1)
    
    echo "状态码: $status_code"
    echo "响应: $response_body"
    
    if [ "$status_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ 测试通过${NC}"
        return 0
    else
        echo -e "${RED}✗ 测试失败 (期望: $expected_code, 实际: $status_code)${NC}"
        return 1
    fi
    echo ""
}

# 测试计数器
total_tests=0
passed_tests=0

run_test() {
    total_tests=$((total_tests + 1))
    if test_api "$@"; then
        passed_tests=$((passed_tests + 1))
    fi
    echo "---"
}

# 1. 健康检查
run_test "健康检查" "GET" "$API_URL/appointments/health" "" "200"

# 2. 获取技师列表（假设存在therapists端点）
run_test "获取技师列表" "GET" "$API_URL/therapists" "" "200"

# 3. 创建预约 - 缺少必填字段
run_test "创建预约(缺少字段)" "POST" "$API_URL/appointments" \
    '{"username":"'$USERNAME'"}' "400"

# 4. 创建预约 - 技师不存在
run_test "创建预约(技师不存在)" "POST" "$API_URL/appointments" \
    '{
        "username":"'$USERNAME'",
        "customer_name":"测试用户",
        "customer_phone":"'$PHONE'",
        "therapist_id":99999,
        "appointment_date":"2024-12-31",
        "appointment_time":"14:00",
        "service_type":"测试服务"
    }' "404"

# 5. 创建有效预约
APPOINTMENT_DATA='{
    "username":"'$USERNAME'",
    "customer_name":"测试用户",
    "customer_phone":"'$PHONE'",
    "therapist_id":1,
    "appointment_date":"2024-12-25",
    "appointment_time":"14:00",
    "service_type":"测试服务",
    "notes":"自动化测试预约"
}'

echo -e "${YELLOW}测试: 创建有效预约${NC}"
echo "数据: $APPOINTMENT_DATA"

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/appointments" \
    -H "Content-Type: application/json" \
    -d "$APPOINTMENT_DATA")

response_body=$(echo "$response" | head -n -1)
status_code=$(echo "$response" | tail -n 1)

echo "状态码: $status_code"
echo "响应: $response_body"

total_tests=$((total_tests + 1))
if [ "$status_code" = "201" ]; then
    echo -e "${GREEN}✓ 预约创建成功${NC}"
    passed_tests=$((passed_tests + 1))
    
    # 提取预约ID
    APPOINTMENT_ID=$(echo "$response_body" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    if [ -n "$APPOINTMENT_ID" ]; then
        echo "预约ID: $APPOINTMENT_ID"
        
        # 6. 查询用户预约列表
        run_test "查询用户预约列表" "GET" "$API_URL/appointments/user/$USERNAME" "" "200"
        
        # 7. 查询预约详情
        run_test "查询预约详情" "GET" "$API_URL/appointments/$APPOINTMENT_ID?username=$USERNAME" "" "200"
        
        # 8. 尝试查看其他用户的预约（应该失败）
        run_test "访问其他用户预约(应该失败)" "GET" "$API_URL/appointments/$APPOINTMENT_ID?username=OTHER_USER" "" "403"
        
        # 9. 查询技师可用时间
        run_test "查询技师可用时间" "GET" "$API_URL/appointments/availability/1?date=2024-12-25" "" "200"
        
        # 10. 尝试创建时间冲突的预约
        CONFLICT_DATA='{
            "username":"OTHER_'$USERNAME'",
            "customer_name":"冲突用户",
            "customer_phone":"13900000000",
            "therapist_id":1,
            "appointment_date":"2024-12-25",
            "appointment_time":"14:00",
            "service_type":"冲突测试"
        }'
        run_test "创建冲突预约(应该失败)" "POST" "$API_URL/appointments" "$CONFLICT_DATA" "409"
        
        # 11. 取消预约
        run_test "取消预约" "DELETE" "$API_URL/appointments/$APPOINTMENT_ID?username=$USERNAME" "" "200"
        
        # 12. 尝试取消其他用户的预约（应该失败）
        run_test "取消其他用户预约(应该失败)" "DELETE" "$API_URL/appointments/$APPOINTMENT_ID?username=OTHER_USER" "" "404"
    else
        echo -e "${RED}无法提取预约ID${NC}"
    fi
else
    echo -e "${RED}✗ 预约创建失败${NC}"
fi
echo "---"

# 总结
echo -e "${BLUE}=== 测试结果总结 ===${NC}"
echo "总测试数: $total_tests"
echo "通过测试: $passed_tests"
echo "失败测试: $((total_tests - passed_tests))"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 所有测试通过！预约功能正常工作。${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有测试失败，请检查API实现。${NC}"
    
    # 显示一些调试信息
    echo ""
    echo -e "${YELLOW}调试信息:${NC}"
    echo "1. 检查服务器是否运行: curl $API_URL/appointments/health"
    echo "2. 查看服务器日志: tail -f /path/to/app.log"
    echo "3. 检查数据库连接: psql -c 'SELECT COUNT(*) FROM appointments;'"
    echo "4. 验证技师数据: curl $API_URL/therapists"
    
    exit 1
fi