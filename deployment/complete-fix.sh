#!/bin/bash

# 完整修复脚本
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASSWORD="20031758wW@"
SSHPASS="/home/chengliang/workspace/PostgreSQL/PostgreSQL/workspace/workspace/sshpass-install/bin/sshpass"

echo "开始完整修复..."

$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/ubuntu/postgresql-app

echo "1. 修复数据库表结构..."
sudo -u postgres psql clouddb << 'EOSQL'
-- 添加缺失的列
ALTER TABLE stores ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- 清空现有数据重新插入
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE therapist_specialties CASCADE;
TRUNCATE TABLE weekly_schedules CASCADE;
TRUNCATE TABLE therapists CASCADE;
TRUNCATE TABLE specialties CASCADE;
TRUNCATE TABLE stores CASCADE;
TRUNCATE TABLE users CASCADE;

-- 重新插入数据
-- 插入门店数据
INSERT INTO stores (name, address, city, phone, business_hours) VALUES
('名医堂·颈肩腰腿特色调理（莘庄店）', '上海市闵行区莘庄', '上海', '021-12345678', '09:00-21:00'),
('名医堂妙康中医·推拿正骨·针灸·艾灸', '上海市浦东新区', '上海', '021-23456789', '09:00-21:00'),
('名医堂永康中医·推拿正骨·针灸·艾灸', '上海市黄浦区', '上海', '021-34567890', '09:00-21:00'),
('名医堂·颈肩腰腿特色调理（隆昌路店）', '上海市杨浦区隆昌路', '上海', '021-45678901', '09:00-21:00'),
('名医堂·颈肩腰腿特色调理（爱琴海店）', '上海市闵行区吴中路爱琴海', '上海', '021-56789012', '09:00-21:00');

-- 插入专业/服务类型
INSERT INTO specialties (name, description, duration, price) VALUES
('推拿按摩', '传统中医推拿按摩，舒缓疲劳', 60, 198),
('针灸', '中医针灸调理', 45, 168),
('艾灸', '艾灸温经通络', 60, 158),
('拔罐', '拔罐祛湿排毒', 30, 98),
('刮痧', '刮痧疏通经络', 45, 128),
('正骨', '正骨复位调理', 60, 298),
('小儿推拿', '专业小儿推拿', 45, 168),
('经络疏通', '全身经络疏通调理', 90, 398);

-- 创建技师用户
INSERT INTO users (email, password, name, phone, role) VALUES
('zhangsan@example.com', '$2a$10$YourHashedPasswordHere', '张医生', '13800138001', 'therapist'),
('lisi@example.com', '$2a$10$YourHashedPasswordHere', '李医生', '13800138002', 'therapist'),
('wangwu@example.com', '$2a$10$YourHashedPasswordHere', '王医生', '13800138003', 'therapist'),
('zhaoliu@example.com', '$2a$10$YourHashedPasswordHere', '赵医生', '13800138004', 'therapist'),
('chenqi@example.com', '$2a$10$YourHashedPasswordHere', '陈医生', '13800138005', 'therapist'),
('patient1@example.com', '$2a$10$YourHashedPasswordHere', '测试用户1', '13900139001', 'patient'),
('patient2@example.com', '$2a$10$YourHashedPasswordHere', '测试用户2', '13900139002', 'patient');

-- 创建技师记录
INSERT INTO therapists (user_id, store_id, title, experience_years, rating, service_count, is_recommended) VALUES
(1, 1, '主任医师', 15, 4.8, 1200, true),
(2, 1, '副主任医师', 10, 4.7, 800, true),
(3, 2, '主治医师', 8, 4.6, 600, false),
(4, 2, '医师', 5, 4.5, 400, false),
(5, 3, '主任医师', 12, 4.9, 1000, true);

-- 设置技师专长
INSERT INTO therapist_specialties (therapist_id, specialty_id) VALUES
(1, 1), (1, 2), (1, 6),
(2, 1), (2, 3), (2, 4),
(3, 1), (3, 5), (3, 8),
(4, 1), (4, 7),
(5, 1), (5, 2), (5, 3), (5, 6);

-- 添加一些测试预约
INSERT INTO appointments (user_id, username, therapist_id, store_id, specialty_id, date, start_time, end_time, status, total_price, notes) VALUES
(6, 'TEST_USER', 1, 1, 1, '2025-06-20', '10:00', '11:00', 'scheduled', 198, '测试预约');

EOSQL

echo "2. 修复后端database.js文件..."
cd backend
cat > config/database.js << 'EOJS'
const { Pool } = require('pg');

// 使用环境变量中的数据库连接
const pool = new Pool({
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

module.exports = pool;
EOJS

echo "3. 确保环境变量正确..."
cat > .env << 'EOE'
DATABASE_URL=postgresql://dbuser:dbpassword@localhost:5432/clouddb
JWT_SECRET=production-secret-key-change-me
PORT=3000
NODE_ENV=production
USE_MOCK_DB=false
EOE

echo "4. 修复路由文件（确保使用真实数据库）..."
# 修复stores路由
sed -i 's/const mockDb = require.*//g' src/routes/stores.js || true
sed -i 's/const db = .*//g' src/routes/stores.js || true
sed -i '1a const db = require("../config/database");' src/routes/stores.js || true

# 修复therapists路由
sed -i 's/const mockDb = require.*//g' src/routes/therapists.js || true
sed -i 's/const db = .*//g' src/routes/therapists.js || true
sed -i '1a const db = require("../config/database");' src/routes/therapists.js || true

# 修复appointments路由
sed -i 's/const mockDb = require.*//g' src/routes/appointments.js || true
sed -i 's/const db = .*//g' src/routes/appointments.js || true
sed -i '1a const db = require("../config/database");' src/routes/appointments.js || true

echo "5. 重启服务..."
cd /home/ubuntu/postgresql-app
pm2 stop all
pm2 start ecosystem.config.js

echo "6. 等待服务启动..."
sleep 15

echo "7. 测试API..."
echo "=== 测试本地门店API ==="
curl -s http://localhost:3000/api/stores | python3 -m json.tool | head -30

echo ""
echo "=== 测试本地技师API ==="
curl -s http://localhost:3000/api/therapists | python3 -m json.tool | head -30

echo ""
echo "=== 测试外部访问门店API ==="
curl -s http://emagen.323424.xyz/api/stores | python3 -m json.tool | head -20

echo ""
echo "=== 测试预约创建 ==="
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "username": "TEST_CURL",
    "customer_name": "测试客户",
    "customer_phone": "13800138000",
    "therapist_id": 1,
    "appointment_date": "2025-06-18",
    "appointment_time": "15:00",
    "service_type": "推拿按摩"
  }' | python3 -m json.tool

echo ""
echo "完整修复完成！"

# 查看日志
echo ""
echo "=== 查看后端日志 ==="
pm2 logs postgres-api --lines 10 --nostream
EOF

echo "执行完成！"