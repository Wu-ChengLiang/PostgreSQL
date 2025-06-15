#!/bin/bash

cd /home/ubuntu/postgresql-app

# 杀掉之前的进程
pkill -f "node src/index.js" || true
pkill -f "npm start" || true

# 安装缺失的依赖
cd backend
npm install bcryptjs
cd ..

# 构建前端
cd frontend
npm run build
cd ..

# 重新启动服务
bash start-services.sh

echo "服务重新启动完成！"