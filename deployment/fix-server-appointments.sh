#!/bin/bash

# 服务器预约功能修复脚本
# 请将此脚本复制到服务器上运行：scp fix-server-appointments.sh ubuntu@47.236.71.20:/home/ubuntu/

echo "=== 预约功能诊断和修复脚本 ==="

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 服务器路径
APP_DIR="/home/ubuntu/postgresql-app"
BACKEND_DIR="$APP_DIR/backend"
ROUTES_DIR="$BACKEND_DIR/src/routes"

echo -e "${YELLOW}1. 检查服务器目录结构...${NC}"
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}错误: 应用目录不存在: $APP_DIR${NC}"
    exit 1
fi

if [ ! -d "$ROUTES_DIR" ]; then
    echo -e "${RED}错误: 路由目录不存在: $ROUTES_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 目录结构正常${NC}"

echo -e "${YELLOW}2. 检查当前的appointments.js文件...${NC}"
APPOINTMENTS_FILE="$ROUTES_DIR/appointments.js"
if [ -f "$APPOINTMENTS_FILE" ]; then
    echo -e "${GREEN}✓ appointments.js文件存在${NC}"
    echo "文件大小: $(stat -c%s $APPOINTMENTS_FILE) bytes"
    echo "最后修改: $(stat -c%y $APPOINTMENTS_FILE)"
else
    echo -e "${RED}✗ appointments.js文件不存在${NC}"
fi

echo -e "${YELLOW}3. 检查后端进程状态...${NC}"
BACKEND_PID=$(ps aux | grep node | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${GREEN}✓ 后端进程运行中 (PID: $BACKEND_PID)${NC}"
    echo "进程详情:"
    ps aux | grep node | grep -v grep
else
    echo -e "${RED}✗ 后端进程未运行${NC}"
fi

echo -e "${YELLOW}4. 检查端口占用...${NC}"
if netstat -tlnp | grep -q ":3000 "; then
    echo -e "${GREEN}✓ 端口3000已被占用${NC}"
    netstat -tlnp | grep ":3000 "
else
    echo -e "${RED}✗ 端口3000未被占用${NC}"
fi

echo -e "${YELLOW}5. 检查后端日志...${NC}"
LOG_FILES=(
    "$BACKEND_DIR/logs/app.log"
    "$BACKEND_DIR/logs/error.log"
    "$BACKEND_DIR/app.log"
    "$BACKEND_DIR/error.log"
    "/var/log/postgresql-app.log"
    "/var/log/app.log"
)

for log_file in "${LOG_FILES[@]}"; do
    if [ -f "$log_file" ]; then
        echo -e "${GREEN}找到日志文件: $log_file${NC}"
        echo "最近10行错误信息:"
        tail -10 "$log_file" | grep -i "error\|fail\|exception" || echo "无错误信息"
        echo "---"
    fi
done

# 检查systemd日志
if command -v journalctl >/dev/null 2>&1; then
    echo -e "${YELLOW}检查systemd日志...${NC}"
    journalctl -u postgresql-app --no-pager -n 20 2>/dev/null || echo "无systemd服务日志"
fi

echo -e "${YELLOW}6. 检查数据库连接...${NC}"
cd "$BACKEND_DIR"

# 检查数据库配置文件
DB_CONFIG_FILES=(
    "config/database.js"
    "src/config/database.js"
    ".env"
)

for config_file in "${DB_CONFIG_FILES[@]}"; do
    if [ -f "$config_file" ]; then
        echo -e "${GREEN}找到配置文件: $config_file${NC}"
        if [[ "$config_file" == *.env ]]; then
            echo "环境变量(隐藏敏感信息):"
            grep -E "^[A-Z_]+" "$config_file" | sed 's/=.*/=***/' || echo "无环境变量"
        else
            echo "配置文件前10行:"
            head -10 "$config_file"
        fi
        echo "---"
    fi
done

echo -e "${YELLOW}7. 测试数据库连接...${NC}"
if command -v node >/dev/null 2>&1; then
    cat > test_db.js << 'EOF'
const { Pool } = require('pg');

// 从环境变量或默认值创建连接
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgresql_api',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✓ 数据库连接成功');
    
    // 测试基本查询
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✓ 查询测试成功:', result.rows[0].current_time);
    
    // 检查关键表是否存在
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('appointments', 'therapists', 'stores')
      ORDER BY tablename
    `);
    
    console.log('✓ 找到以下关键表:', tables.rows.map(r => r.tablename));
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('✗ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

testConnection();
EOF

    if [ -f "package.json" ]; then
        node test_db.js
        rm -f test_db.js
    else
        echo -e "${RED}未找到package.json，无法测试数据库连接${NC}"
    fi
else
    echo -e "${RED}Node.js未安装，无法测试数据库连接${NC}"
fi

echo -e "${YELLOW}8. 备份当前appointments.js并更新...${NC}"
if [ -f "$APPOINTMENTS_FILE" ]; then
    # 创建备份
    cp "$APPOINTMENTS_FILE" "$APPOINTMENTS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✓ 已备份原文件${NC}"
fi

# 创建修复版本的appointments.js
cat > "$APPOINTMENTS_FILE" << 'EOF'
const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// 错误处理中间件
const handleError = (error, res, message = 'Operation failed') => {
  console.error(`${message}:`, error);
  console.error('Stack trace:', error.stack);
  res.status(500).json({ 
    error: message,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// 创建预约（不需要认证，基于用户名）
router.post('/', async (req, res) => {
  console.log('POST /appointments - 收到预约创建请求:', req.body);
  
  try {
    const {
      username,      // 用户名，如 NDR745651115 或 Gbj982984289
      customer_name, // 客户姓名，如 吴先生
      customer_phone,
      store_id,
      therapist_id,
      appointment_date,
      appointment_time,
      service_type,
      notes
    } = req.body;
    
    // 验证必填字段
    const missingFields = [];
    if (!username) missingFields.push('username');
    if (!customer_name) missingFields.push('customer_name');
    if (!customer_phone) missingFields.push('customer_phone');
    if (!therapist_id) missingFields.push('therapist_id');
    if (!appointment_date) missingFields.push('appointment_date');
    if (!appointment_time) missingFields.push('appointment_time');
    
    if (missingFields.length > 0) {
      console.log('缺少必填字段:', missingFields);
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing_fields: missingFields,
        required: ['username', 'customer_name', 'customer_phone', 'therapist_id', 'appointment_date', 'appointment_time']
      });
    }
    
    console.log('字段验证通过，开始创建预约...');
    
    // 检查技师是否存在
    const therapistCheck = await db.query(
      'SELECT id, name, store_id FROM therapists WHERE id = $1 AND status = $2',
      [therapist_id, 'active']
    );
    
    if (therapistCheck.rows.length === 0) {
      console.log('技师不存在或不可用:', therapist_id);
      return res.status(404).json({ 
        error: 'Therapist not found or inactive',
        therapist_id: therapist_id
      });
    }
    
    const therapist = therapistCheck.rows[0];
    console.log('找到技师:', therapist);
    
    // 检查时间冲突
    const conflictCheck = await db.query(
      `SELECT id FROM appointments 
       WHERE therapist_id = $1 
       AND appointment_date = $2 
       AND appointment_time = $3 
       AND status != 'cancelled'`,
      [therapist_id, appointment_date, appointment_time]
    );
    
    if (conflictCheck.rows.length > 0) {
      console.log('时间冲突，已有预约:', conflictCheck.rows[0]);
      return res.status(409).json({ 
        error: 'Time slot already booked',
        existing_appointment_id: conflictCheck.rows[0].id
      });
    }
    
    console.log('时间检查通过，创建预约记录...');
    
    // 创建预约
    const result = await db.query(
      `INSERT INTO appointments 
       (username, customer_name, customer_phone, store_id, therapist_id, 
        appointment_date, appointment_time, service_type, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [username, customer_name, customer_phone, store_id || therapist.store_id, therapist_id,
       appointment_date, appointment_time, service_type, notes, 'confirmed']
    );
    
    console.log('预约创建成功:', result.rows[0]);
    
    // 获取关联信息
    const appointmentDetails = await db.query(
      `SELECT a.*, t.name as therapist_name, s.name as store_name
       FROM appointments a
       LEFT JOIN therapists t ON a.therapist_id = t.id
       LEFT JOIN stores s ON a.store_id = s.id
       WHERE a.id = $1`,
      [result.rows[0].id]
    );
    
    console.log('获取完整预约信息成功');
    
    res.status(201).json({
      success: true,
      appointment: appointmentDetails.rows[0],
      message: `预约成功！预约ID: ${result.rows[0].id}`
    });
  } catch (error) {
    handleError(error, res, 'Failed to create appointment');
  }
});

// 获取用户的预约列表（基于用户名）
router.get('/user/:username', async (req, res) => {
  console.log('GET /appointments/user/:username - 查询用户预约:', req.params.username);
  
  try {
    const username = req.params.username;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const result = await db.query(
      `SELECT a.*, t.name as therapist_name, s.name as store_name
       FROM appointments a
       LEFT JOIN therapists t ON a.therapist_id = t.id
       LEFT JOIN stores s ON a.store_id = s.id
       WHERE a.username = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [username]
    );
    
    console.log(`找到 ${result.rows.length} 个预约记录`);
    
    res.json({
      success: true,
      username: username,
      appointments: result.rows
    });
  } catch (error) {
    handleError(error, res, 'Failed to fetch appointments');
  }
});

// 获取单个预约详情（验证用户名）
router.get('/:id', async (req, res) => {
  console.log('GET /appointments/:id - 查询预约详情:', req.params.id);
  
  try {
    const appointmentId = req.params.id;
    const username = req.query.username || req.headers['x-username'];
    
    // 先获取预约信息
    const result = await db.query(
      `SELECT a.*, t.name as therapist_name, t.title as therapist_title,
              s.name as store_name, s.address as store_address
       FROM appointments a
       LEFT JOIN therapists t ON a.therapist_id = t.id
       LEFT JOIN stores s ON a.store_id = s.id
       WHERE a.id = $1`,
      [appointmentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appointment = result.rows[0];
    
    // 如果提供了用户名，验证是否为预约所有者
    if (username && appointment.username !== username) {
      return res.status(403).json({ 
        error: 'Access denied. You can only view your own appointments.' 
      });
    }
    
    res.json({
      success: true,
      appointment: appointment,
      is_owner: username ? appointment.username === username : undefined
    });
  } catch (error) {
    handleError(error, res, 'Failed to fetch appointment');
  }
});

// 取消预约（验证用户名）
router.delete('/:id', async (req, res) => {
  console.log('DELETE /appointments/:id - 取消预约:', req.params.id);
  
  try {
    const appointmentId = req.params.id;
    const username = req.query.username || req.body.username || req.headers['x-username'];
    
    if (!username) {
      return res.status(400).json({ 
        error: 'Username is required to cancel appointment' 
      });
    }
    
    // 先检查预约是否属于该用户
    const checkResult = await db.query(
      'SELECT * FROM appointments WHERE id = $1 AND username = $2',
      [appointmentId, username]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Appointment not found or you do not have permission to cancel it' 
      });
    }
    
    // 取消预约
    const result = await db.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND username = $3 RETURNING *',
      ['cancelled', appointmentId, username]
    );
    
    console.log('预约取消成功:', result.rows[0]);
    
    res.json({ 
      success: true,
      message: `预约已成功取消`,
      appointment: result.rows[0]
    });
  } catch (error) {
    handleError(error, res, 'Failed to cancel appointment');
  }
});

// 查询可用时间段（公开接口）
router.get('/availability/:therapistId', async (req, res) => {
  console.log('GET /appointments/availability/:therapistId - 查询可用时间:', req.params.therapistId);
  
  try {
    const therapistId = req.params.therapistId;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        error: 'Date is required' 
      });
    }
    
    // 获取技师信息
    const therapistResult = await db.query(
      'SELECT * FROM therapists WHERE id = $1 AND status = $2',
      [therapistId, 'active']
    );
    
    if (therapistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    
    // 获取技师当天已预约的时间
    const bookedResult = await db.query(
      `SELECT appointment_time 
       FROM appointments 
       WHERE therapist_id = $1 
       AND appointment_date = $2 
       AND status != 'cancelled'
       ORDER BY appointment_time`,
      [therapistId, date]
    );
    
    const bookedTimes = bookedResult.rows.map(row => row.appointment_time);
    
    // 生成可用时间段（9:00-21:00，每小时一个时段）
    const allTimes = [];
    for (let hour = 9; hour <= 20; hour++) {
      allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));
    
    console.log(`技师 ${therapistId} 在 ${date} 有 ${availableTimes.length} 个可用时段`);
    
    res.json({
      success: true,
      therapist: therapistResult.rows[0],
      date: date,
      booked_times: bookedTimes,
      available_times: availableTimes,
      total_slots: allTimes.length,
      available_slots: availableTimes.length
    });
  } catch (error) {
    handleError(error, res, 'Failed to check availability');
  }
});

// 健康检查接口
router.get('/health', async (req, res) => {
  try {
    // 测试数据库连接
    const result = await db.query('SELECT NOW() as current_time');
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;
EOF

echo -e "${GREEN}✓ 已更新appointments.js文件${NC}"

echo -e "${YELLOW}9. 重启应用服务...${NC}"

# 尝试不同的重启方法
if systemctl is-active postgresql-app >/dev/null 2>&1; then
    echo "使用systemd重启服务..."
    sudo systemctl restart postgresql-app
    sleep 3
    systemctl status postgresql-app --no-pager -l
elif [ ! -z "$BACKEND_PID" ]; then
    echo "杀死现有进程并重启..."
    kill $BACKEND_PID
    sleep 2
    cd "$BACKEND_DIR"
    nohup node src/index.js > app.log 2>&1 &
    echo "新进程已启动，PID: $!"
else
    echo "启动新的应用进程..."
    cd "$BACKEND_DIR"
    nohup node src/index.js > app.log 2>&1 &
    echo "应用已启动，PID: $!"
fi

echo -e "${YELLOW}10. 验证修复结果...${NC}"
sleep 5

# 检查进程是否运行
NEW_PID=$(ps aux | grep node | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$NEW_PID" ]; then
    echo -e "${GREEN}✓ 应用进程正在运行 (PID: $NEW_PID)${NC}"
else
    echo -e "${RED}✗ 应用进程未运行${NC}"
fi

# 检查端口
if netstat -tlnp | grep -q ":3000 "; then
    echo -e "${GREEN}✓ 端口3000正在监听${NC}"
else
    echo -e "${RED}✗ 端口3000未监听${NC}"
fi

# 测试健康检查接口
echo "测试健康检查接口..."
if command -v curl >/dev/null 2>&1; then
    curl -s http://localhost:3000/api/appointments/health | head -5
else
    wget -qO- http://localhost:3000/api/appointments/health 2>/dev/null | head -5 || echo "无法测试API"
fi

echo ""
echo -e "${GREEN}=== 修复脚本执行完成 ===${NC}"
echo ""
echo "后续步骤:"
echo "1. 检查应用日志: tail -f $BACKEND_DIR/app.log"
echo "2. 测试预约创建API: curl -X POST http://localhost:3000/api/appointments -H 'Content-Type: application/json' -d '{\"username\":\"test\",\"customer_name\":\"测试\",\"customer_phone\":\"13800000000\",\"therapist_id\":1,\"appointment_date\":\"2024-01-20\",\"appointment_time\":\"14:00\"}'"
echo "3. 如果问题仍然存在，请查看详细日志并检查数据库连接"
EOF

chmod +x /home/chengliang/workspace/PostgreSQL/PostgreSQL/fix-server-appointments.sh