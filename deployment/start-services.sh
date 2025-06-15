#!/bin/bash

# 在服务器上启动服务的脚本
cd /home/ubuntu/postgresql-app

# 启动后端
cd backend
nohup node src/index.js > ../backend.log 2>&1 &
echo "后端启动，PID: $!"

# 启动前端
cd ../frontend
nohup npm start > ../frontend.log 2>&1 &
echo "前端启动，PID: $!"

cd ..
sleep 5

# 检查进程
echo "检查运行状态："
ps aux | grep -E "(node|npm)" | grep -v grep

# 检查端口
echo "检查端口："
netstat -tlnp 2>/dev/null | grep -E "(3000|3001)" || echo "端口检查需要sudo权限"

echo "服务已启动！"
echo "后端日志：/home/ubuntu/postgresql-app/backend.log"
echo "前端日志：/home/ubuntu/postgresql-app/frontend.log"