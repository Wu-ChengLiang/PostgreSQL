#!/bin/bash

cd /home/ubuntu/postgresql-app

# 杀掉之前的进程
pkill -f "node src/index.js" || true
pkill -f "npm start" || true

# 安装正确的依赖
cd backend
npm install bcrypt
cd ..

# 删除前端根目录的.eslintrc.json（它是从后端复制过来的）
rm -f .eslintrc.json

# 确保前端已经构建
cd frontend
# 删除.next目录重新构建
rm -rf .next
npm run build

# 返回主目录
cd /home/ubuntu/postgresql-app

# 修改启动脚本，使用正确的生产模式启动
cat > start-services-prod.sh << 'EOF'
#!/bin/bash

cd /home/ubuntu/postgresql-app

# 启动后端
cd backend
nohup node src/index.js > ../backend.log 2>&1 &
echo "后端启动，PID: $!"

# 启动前端（生产模式）
cd ../frontend
PORT=3001 nohup npm start > ../frontend.log 2>&1 &
echo "前端启动，PID: $!"

cd ..
sleep 10

# 检查进程
echo "检查运行状态："
ps aux | grep -E "(node|npm)" | grep -v grep

echo "服务已启动！"
echo "后端日志：tail -f /home/ubuntu/postgresql-app/backend.log"
echo "前端日志：tail -f /home/ubuntu/postgresql-app/frontend.log"
EOF

chmod +x start-services-prod.sh

# 启动服务
bash start-services-prod.sh

echo "修复完成！"