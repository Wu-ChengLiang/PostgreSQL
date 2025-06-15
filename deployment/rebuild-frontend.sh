#!/bin/bash

# 重新构建并启动前端
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASSWORD="20031758wW@"
SSHPASS="/home/chengliang/workspace/PostgreSQL/PostgreSQL/workspace/workspace/sshpass-install/bin/sshpass"

echo "重新构建前端..."

# 首先上传修复后的DataTable.tsx文件
echo "上传修复后的文件..."
$SSHPASS -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no frontend/components/tables/DataTable.tsx $SERVER_USER@$SERVER_IP:/home/ubuntu/postgresql-app/frontend/components/tables/

# 在服务器上重新构建
$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/ubuntu/postgresql-app

echo "1. 停止前端进程..."
pkill -f "npm start" || true

echo "2. 重新构建前端..."
cd frontend
rm -rf .next
npm run build

echo "3. 启动前端..."
PORT=3001 NODE_ENV=production nohup npm start > ../frontend.log 2>&1 &
echo "前端PID: $!"

echo "4. 等待服务启动..."
sleep 15

echo "5. 检查服务状态..."
echo "=== 进程状态 ==="
ps aux | grep -E "(node|npm)" | grep -v grep
echo ""

echo "=== 端口监听 ==="
sudo netstat -tlnp | grep -E "(3000|3001)"
echo ""

echo "=== 前端日志 ==="
tail -20 ../frontend.log
echo ""

echo "=== 测试前端 ==="
curl -s -I http://localhost:3001 | head -10
echo ""

echo "=== 测试后端API ==="
curl -s http://localhost:3000/api/stores | python3 -m json.tool | head -20 || echo "API测试失败"
echo ""

echo "完成！"
echo "如果一切正常，可以通过 http://emagen.323424.xyz 访问应用"
EOF

echo "重建完成！"