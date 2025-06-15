#!/bin/bash

# 修复PostgreSQL配置
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASSWORD="20031758wW@"
SSHPASS="/home/chengliang/workspace/PostgreSQL/PostgreSQL/workspace/workspace/sshpass-install/bin/sshpass"

echo "修复PostgreSQL配置..."

$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/ubuntu/postgresql-app

echo "1. 重置数据库用户密码..."
sudo -u postgres psql << 'EOSQL'
-- 重置密码
ALTER USER dbuser WITH PASSWORD 'dbpassword';

-- 确保权限正确
GRANT ALL PRIVILEGES ON DATABASE clouddb TO dbuser;

\c clouddb
GRANT ALL ON SCHEMA public TO dbuser;
GRANT CREATE ON SCHEMA public TO dbuser;
EOSQL

echo "2. 测试数据库连接..."
cd backend
PGPASSWORD=dbpassword psql -h localhost -U dbuser -d clouddb -c "SELECT version();"

echo "3. 重新运行初始化脚本..."
node init-db.js

echo "4. 重启后端服务..."
pm2 restart postgres-api

echo "5. 等待服务启动..."
sleep 10

echo "6. 测试API..."
echo "=== 测试门店API ==="
curl -s http://localhost:3000/api/stores | python3 -m json.tool | head -20

echo ""
echo "=== 测试技师API ==="
curl -s http://localhost:3000/api/therapists | python3 -m json.tool | head -20

echo ""
echo "=== 测试外部访问 ==="
curl -s http://emagen.323424.xyz/api/stores | python3 -m json.tool | head -10

echo ""
echo "修复完成！"

# 查看PM2日志
echo ""
echo "=== 后端日志 ==="
pm2 logs postgres-api --lines 20 --nostream
EOF

echo "执行完成！"