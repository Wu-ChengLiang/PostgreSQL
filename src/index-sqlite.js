require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const database = require('./config/database-sqlite');

// 路由导入
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const userRoutes = require('./routes/users-sqlite');
const storeRoutes = require('./routes/stores-sqlite');
const therapistRoutes = require('./routes/therapists-sqlite');
const appointmentRoutes = require('./routes/appointments-sqlite');
const dashboardRoutes = require('./routes/dashboard-sqlite');

// 保留原有的路由
const appointmentPublicRoutes = require('./routes/appointments-public');
const appointmentFunctions = require('./routes/appointment-functions');

const app = express();
const PORT = process.env.PORT || 3000;

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100个请求
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);
app.use(limiter);

// 初始化数据库连接
const initializeDatabase = async () => {
  try {
    await database.connect();
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
};

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 保留原有的公开预约路由
app.use('/api/appointments-public', appointmentPublicRoutes);
app.use('/api/functions', appointmentFunctions);

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    // 检查数据库连接
    const dbCheck = await database.get('SELECT 1 as test');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: dbCheck ? 'connected' : 'disconnected',
      type: 'SQLite'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err.stack);
  res.status(500).json({ 
    success: false,
    error: '服务器内部错误'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

// 启动服务器
const startServer = async () => {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 API服务器运行在端口 ${PORT}`);
    console.log(`📄 API文档: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  数据库类型: SQLite`);
    console.log(`📁 数据库路径: ${process.env.SQLITE_DB_PATH || './data.db'}`);
  });
};

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  await database.close();
  process.exit(0);
});

// 启动应用
startServer().catch(error => {
  console.error('❌ 启动失败:', error);
  process.exit(1);
});