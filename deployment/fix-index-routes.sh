#!/bin/bash

# 修复index.js路由引用
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASSWORD="20031758wW@"
SSHPASS="/home/chengliang/workspace/PostgreSQL/PostgreSQL/workspace/workspace/sshpass-install/bin/sshpass"

echo "修复index.js路由引用..."

$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/ubuntu/postgresql-app/backend

echo "1. 查看当前index.js..."
cat src/index.js

echo ""
echo "2. 修复index.js路由引用..."
cat > src/index.js << 'EOJS'
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
const storesRouter = require('./routes/stores');
const therapistsRouter = require('./routes/therapists');
const appointmentsRouter = require('./routes/appointments');
const usersRouter = require('./routes/users');
const specialtiesRouter = require('./routes/specialties');
const dashboardRouter = require('./routes/dashboard');

// 注册路由
app.use('/api/stores', storesRouter);
app.use('/api/therapists', therapistsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/specialties', specialtiesRouter);
app.use('/api/dashboard', dashboardRouter);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Server is running' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
EOJS

echo "3. 重启服务..."
cd /home/ubuntu/postgresql-app
pm2 restart postgres-api

echo "4. 等待并测试..."
sleep 10

echo "=== 测试健康检查 ==="
curl -s http://localhost:3000/health | python3 -m json.tool

echo ""
echo "=== 测试预约创建 ==="
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "username": "TEST_CURL_FIXED",
    "customer_name": "测试客户",
    "customer_phone": "13800138000",
    "therapist_id": 1,
    "appointment_date": "2025-06-18",
    "appointment_time": "15:00",
    "service_type": "推拿按摩"
  }' | python3 -m json.tool

echo ""
echo "=== 测试外部预约创建 ==="
curl -X POST http://emagen.323424.xyz/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "username": "TEST_EXTERNAL",
    "customer_name": "外部测试",
    "customer_phone": "13900139000",
    "therapist_id": 2,
    "appointment_date": "2025-06-19",
    "appointment_time": "16:00",
    "service_type": "艾灸"
  }' | python3 -m json.tool

echo ""
echo "修复完成！"
EOF

echo "执行完成！"