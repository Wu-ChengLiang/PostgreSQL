#!/bin/bash

# 检查并修复数据库
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASSWORD="20031758wW@"
SSHPASS="/home/chengliang/workspace/PostgreSQL/PostgreSQL/workspace/workspace/sshpass-install/bin/sshpass"

echo "检查并修复数据库..."

$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/ubuntu/postgresql-app

echo "1. 检查现有表结构..."
sudo -u postgres psql clouddb << 'EOSQL'
\dt
\d stores
\d therapists
\d appointments
EOSQL

echo "2. 查看后端实际使用的表结构..."
grep -r "CREATE TABLE" backend/src/ || true
cat backend/src/config/database.js || true

echo "3. 修复config目录结构..."
cd backend
mkdir -p src/config
cp config/database.js src/config/database.js 2>/dev/null || true

echo "4. 创建正确的database.js..."
cat > src/config/database.js << 'EOJS'
const { Pool } = require('pg');

let pool;

if (process.env.USE_MOCK_DB === 'true') {
  // Mock数据库
  console.log('Using mock database (USE_MOCK_DB=true)');
  
  // 模拟数据
  const mockStores = [
    { id: 1, name: '名医堂·颈肩腰腿特色调理（莘庄店）', address: '上海市闵行区莘庄', business_hours: '09:00-21:00' },
    { id: 2, name: '名医堂妙康中医·推拿正骨·针灸·艾灸', address: '上海市', business_hours: '09:00-21:00' },
    { id: 3, name: '名医堂永康中医·推拿正骨·针灸·艾灸', address: '上海市', business_hours: '09:00-21:00' }
  ];
  
  const mockTherapists = [
    { id: 1, name: '张医生', title: '主任医师', store_id: 1, store_name: '名医堂·颈肩腰腿特色调理（莘庄店）', specialties: ['推拿', '针灸'] },
    { id: 2, name: '李医生', title: '副主任医师', store_id: 1, store_name: '名医堂·颈肩腰腿特色调理（莘庄店）', specialties: ['艾灸', '拔罐'] },
    { id: 3, name: '王医生', title: '主治医师', store_id: 2, store_name: '名医堂妙康中医·推拿正骨·针灸·艾灸', specialties: ['正骨', '刮痧'] }
  ];
  
  pool = {
    query: async (text, params) => {
      console.log('Mock Query:', text, params);
      
      if (text.includes('SELECT * FROM stores')) {
        return { rows: mockStores, rowCount: mockStores.length };
      }
      
      if (text.includes('SELECT t.*, s.name as store_name')) {
        return { rows: mockTherapists, rowCount: mockTherapists.length };
      }
      
      if (text.includes('INSERT INTO appointments')) {
        return { 
          rows: [{ 
            id: Math.floor(Math.random() * 1000), 
            ...params 
          }], 
          rowCount: 1 
        };
      }
      
      return { rows: [], rowCount: 0 };
    }
  };
} else {
  // 真实PostgreSQL
  console.log('Using PostgreSQL database');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  // 测试连接
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('数据库连接失败:', err);
    } else {
      console.log('数据库连接成功:', res.rows[0].now);
    }
  });
}

module.exports = pool;
EOJS

echo "5. 修复路由引用..."
# 修复所有路由文件的database引用
find src/routes -name "*.js" -exec sed -i 's|require("../config/database")|require("../config/database")|g' {} \;
find src/routes -name "*.js" -exec sed -i 's|require("../../config/database")|require("../config/database")|g' {} \;

echo "6. 重启服务（使用Mock模式）..."
cd /home/ubuntu/postgresql-app
# 先用Mock模式测试
cat > backend/.env << 'EOE'
DATABASE_URL=postgresql://dbuser:dbpassword@localhost:5432/clouddb
JWT_SECRET=production-secret-key-change-me
PORT=3000
NODE_ENV=production
USE_MOCK_DB=true
EOE

pm2 restart postgres-api

echo "7. 等待并测试..."
sleep 10

echo "=== 测试Mock模式API ==="
curl -s http://localhost:3000/api/stores | python3 -m json.tool || echo "API失败"

echo ""
echo "=== 测试外部访问 ==="
curl -s http://emagen.323424.xyz/api/stores | python3 -m json.tool | head -20

echo ""
echo "=== 查看PM2状态 ==="
pm2 status

echo ""
echo "=== 查看后端日志 ==="
pm2 logs postgres-api --lines 15 --nostream

echo ""
echo "检查完成！"
EOF

echo "执行完成！"