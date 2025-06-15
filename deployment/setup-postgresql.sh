#!/bin/bash

# 安装和配置PostgreSQL
SERVER_IP="43.167.226.222"
SERVER_USER="ubuntu"
SERVER_PASSWORD="20031758wW@"
SSHPASS="/home/chengliang/workspace/PostgreSQL/PostgreSQL/workspace/workspace/sshpass-install/bin/sshpass"

echo "开始安装和配置PostgreSQL..."

# 在服务器上执行安装
$SSHPASS -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/ubuntu/postgresql-app

echo "1. 安装PostgreSQL..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib

echo "2. 启动PostgreSQL服务..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo "3. 创建数据库和用户..."
sudo -u postgres psql << 'EOSQL'
-- 创建数据库用户
CREATE USER dbuser WITH PASSWORD 'dbpassword';

-- 创建数据库
CREATE DATABASE clouddb OWNER dbuser;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE clouddb TO dbuser;

-- 连接到clouddb数据库
\c clouddb

-- 授予schema权限
GRANT ALL ON SCHEMA public TO dbuser;
EOSQL

echo "4. 配置PostgreSQL允许本地连接..."
# 修改pg_hba.conf以允许本地连接
sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql

echo "5. 更新环境变量..."
cat > backend/.env << 'EOE'
DATABASE_URL=postgresql://dbuser:dbpassword@localhost:5432/clouddb
JWT_SECRET=production-secret-key-change-me
PORT=3000
NODE_ENV=production
USE_MOCK_DB=false
EOE

echo "6. 初始化数据库表结构..."
cd backend
npm install pg

# 创建数据库初始化脚本
cat > init-db.js << 'EOJS'
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 创建表结构
    await pool.query(`
      -- 用户表
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 门店表
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        phone VARCHAR(20),
        business_hours VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 专业/服务类型表
      CREATE TABLE IF NOT EXISTS specialties (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER DEFAULT 60,
        price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 技师表
      CREATE TABLE IF NOT EXISTS therapists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        store_id INTEGER REFERENCES stores(id),
        title VARCHAR(100),
        experience_years INTEGER,
        rating DECIMAL(3,2),
        service_count INTEGER DEFAULT 0,
        is_recommended BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 技师专长关联表
      CREATE TABLE IF NOT EXISTS therapist_specialties (
        therapist_id INTEGER REFERENCES therapists(id),
        specialty_id INTEGER REFERENCES specialties(id),
        PRIMARY KEY (therapist_id, specialty_id)
      );

      -- 预约表
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(255),
        therapist_id INTEGER REFERENCES therapists(id),
        store_id INTEGER REFERENCES stores(id),
        specialty_id INTEGER REFERENCES specialties(id),
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        total_price DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 技师排班表
      CREATE TABLE IF NOT EXISTS weekly_schedules (
        id SERIAL PRIMARY KEY,
        therapist_id INTEGER REFERENCES therapists(id),
        day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT true
      );
    `);

    console.log('表结构创建成功！');

    // 插入初始数据
    console.log('开始插入初始数据...');

    // 插入门店数据
    const stores = [
      ['名医堂·颈肩腰腿特色调理（莘庄店）', '上海市闵行区莘庄', '上海', '021-12345678', '09:00-21:00'],
      ['名医堂妙康中医·推拿正骨·针灸·艾灸', '上海市浦东新区', '上海', '021-23456789', '09:00-21:00'],
      ['名医堂永康中医·推拿正骨·针灸·艾灸', '上海市黄浦区', '上海', '021-34567890', '09:00-21:00'],
      ['名医堂·颈肩腰腿特色调理（隆昌路店）', '上海市杨浦区隆昌路', '上海', '021-45678901', '09:00-21:00'],
      ['名医堂·颈肩腰腿特色调理（爱琴海店）', '上海市闵行区吴中路爱琴海', '上海', '021-56789012', '09:00-21:00']
    ];

    for (const store of stores) {
      await pool.query(
        'INSERT INTO stores (name, address, city, phone, business_hours) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
        store
      );
    }

    // 插入专业/服务类型
    const specialties = [
      ['推拿按摩', '传统中医推拿按摩，舒缓疲劳', 60, 198],
      ['针灸', '中医针灸调理', 45, 168],
      ['艾灸', '艾灸温经通络', 60, 158],
      ['拔罐', '拔罐祛湿排毒', 30, 98],
      ['刮痧', '刮痧疏通经络', 45, 128],
      ['正骨', '正骨复位调理', 60, 298],
      ['小儿推拿', '专业小儿推拿', 45, 168],
      ['经络疏通', '全身经络疏通调理', 90, 398]
    ];

    for (const specialty of specialties) {
      await pool.query(
        'INSERT INTO specialties (name, description, duration, price) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        specialty
      );
    }

    // 创建一些技师用户
    const therapistUsers = [
      ['zhangsan@example.com', '123456', '张医生', '13800138001'],
      ['lisi@example.com', '123456', '李医生', '13800138002'],
      ['wangwu@example.com', '123456', '王医生', '13800138003'],
      ['zhaoliu@example.com', '123456', '赵医生', '13800138004'],
      ['chenqi@example.com', '123456', '陈医生', '13800138005']
    ];

    for (const user of therapistUsers) {
      await pool.query(
        'INSERT INTO users (email, password, name, phone, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
        [...user, 'therapist']
      );
    }

    // 创建技师记录
    const therapists = [
      [1, 1, '主任医师', 15, 4.8, 1200, true],
      [2, 1, '副主任医师', 10, 4.7, 800, true],
      [3, 2, '主治医师', 8, 4.6, 600, false],
      [4, 2, '医师', 5, 4.5, 400, false],
      [5, 3, '主任医师', 12, 4.9, 1000, true]
    ];

    for (const therapist of therapists) {
      await pool.query(
        'INSERT INTO therapists (user_id, store_id, title, experience_years, rating, service_count, is_recommended) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
        therapist
      );
    }

    // 设置技师专长
    const therapistSpecialties = [
      [1, 1], [1, 2], [1, 6], // 张医生：推拿、针灸、正骨
      [2, 1], [2, 3], [2, 4], // 李医生：推拿、艾灸、拔罐
      [3, 1], [3, 5], [3, 8], // 王医生：推拿、刮痧、经络疏通
      [4, 1], [4, 7], // 赵医生：推拿、小儿推拿
      [5, 1], [5, 2], [5, 3], [5, 6] // 陈医生：推拿、针灸、艾灸、正骨
    ];

    for (const ts of therapistSpecialties) {
      await pool.query(
        'INSERT INTO therapist_specialties (therapist_id, specialty_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        ts
      );
    }

    // 创建一些测试用户（患者）
    const patients = [
      ['patient1@example.com', '123456', '测试用户1', '13900139001'],
      ['patient2@example.com', '123456', '测试用户2', '13900139002']
    ];

    for (const patient of patients) {
      await pool.query(
        'INSERT INTO users (email, password, name, phone, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
        [...patient, 'patient']
      );
    }

    console.log('初始数据插入成功！');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();
EOJS

# 运行初始化脚本
node init-db.js

echo "7. 停止当前服务..."
pm2 stop all

echo "8. 重启服务..."
pm2 restart all

echo "9. 等待服务启动..."
sleep 10

echo "10. 测试API..."
echo "=== 测试门店API ==="
curl -s http://localhost:3000/api/stores | python3 -m json.tool | head -30

echo ""
echo "=== 测试技师API ==="
curl -s http://localhost:3000/api/therapists | python3 -m json.tool | head -30

echo ""
echo "PostgreSQL安装和配置完成！"
EOF

echo "执行完成！"