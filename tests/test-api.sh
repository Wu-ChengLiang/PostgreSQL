#!/bin/bash

# API 测试脚本
API_BASE="http://43.167.226.222/api"

echo "=== PostgreSQL API 测试 ==="
echo "服务器: 43.167.226.222"
echo "API 基础路径: $API_BASE"
echo ""

# 1. 健康检查
echo "1. 健康检查..."
curl -s "$API_BASE/health" | jq . || curl -s "$API_BASE/health"
echo ""

# 2. 注册用户
echo "2. 注册测试用户..."
curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }' | jq . || echo "注册请求已发送"
echo ""

# 3. 用户登录
echo "3. 用户登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }')

echo "$LOGIN_RESPONSE" | jq . || echo "$LOGIN_RESPONSE"

# 提取 token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")
echo ""

if [ "$TOKEN" != "" ] && [ "$TOKEN" != "null" ]; then
    echo "4. 创建数据项 (需要认证)..."
    curl -s -X POST "$API_BASE/items" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "name": "测试项目",
        "description": "这是一个测试数据项"
      }' | jq . || echo "创建数据项请求已发送"
    echo ""

    echo "5. 获取数据项列表..."
    curl -s -X GET "$API_BASE/items" \
      -H "Authorization: Bearer $TOKEN" | jq . || echo "获取数据项请求已发送"
    echo ""
fi

echo "API 测试完成！"