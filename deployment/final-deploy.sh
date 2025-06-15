#!/bin/bash

# 最终部署脚本
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASSWORD="20031758wW@"
SSHPASS="/home/chengliang/workspace/PostgreSQL/PostgreSQL/workspace/workspace/sshpass-install/bin/sshpass"

echo "开始最终部署..."

# 上传修复后的appointments页面
echo "1. 上传修复后的文件..."
$SSHPASS -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no frontend/app/appointments/page.tsx $SERVER_USER@$SERVER_IP:/home/ubuntu/postgresql-app/frontend/app/appointments/

# 在服务器上执行最终部署
$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/ubuntu/postgresql-app

echo "2. 停止所有服务..."
pkill -f "node src/index.js" || true
pkill -f "npm start" || true
pm2 stop all || true
pm2 delete all || true

echo "3. 重新构建前端..."
cd frontend
rm -rf .next
npm run build

if [ $? -ne 0 ]; then
    echo "前端构建失败！"
    exit 1
fi

echo "4. 使用PM2启动服务..."
cd /home/ubuntu/postgresql-app

# 确保PM2已安装
if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    sudo npm install -g pm2
fi

# 启动服务
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

echo "5. 等待服务完全启动..."
sleep 15

echo "6. 检查服务状态..."
echo "=== PM2进程列表 ==="
pm2 list

echo ""
echo "=== 端口监听状态 ==="
sudo netstat -tlnp | grep -E "(3000|3001)"

echo ""
echo "=== 测试后端API ==="
curl -s http://localhost:3000/api/stores | python3 -m json.tool | head -10 || echo "后端API未响应"

echo ""
echo "=== 测试前端 ==="
curl -s -I http://localhost:3001 | head -5 || echo "前端未响应"

echo ""
echo "=== 查看日志 ==="
echo "后端最近日志："
pm2 logs postgres-api --lines 5 --nostream
echo ""
echo "前端最近日志："
pm2 logs postgres-frontend --lines 5 --nostream

echo ""
echo "部署完成！"
echo "应用地址：http://emagen.323424.xyz"
echo ""
echo "管理命令："
echo "  查看状态：pm2 status"
echo "  查看日志：pm2 logs"
echo "  重启服务：pm2 restart all"
echo "  停止服务：pm2 stop all"
EOF

echo ""
echo "本地测试访问："
echo "curl -I http://emagen.323424.xyz"
curl -I http://emagen.323424.xyz 2>/dev/null | head -5

echo ""
echo "最终部署完成！"