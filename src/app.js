// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// 路由导入
const clientRoutes = require('./routes/client');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production'
}));

// CORS配置
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true'
}));

// 压缩中间件
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6
}));

// 日志中间件
app.use(morgan(process.env.LOG_FORMAT || 'combined'));

// 解析JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/frontend', express.static('frontend'));

// 报告文件服务（根目录下的HTML文件）
app.use(express.static('.', {
    index: false,
    extensions: ['html'],
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
    }
}));

// 客户端API限流
const clientLimiter = rateLimit({
    windowMs: (parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.API_RATE_LIMIT_MAX) || 100,
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
});

// 管理端API限流
const adminLimiter = rateLimit({
    windowMs: (parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: (parseInt(process.env.API_RATE_LIMIT_MAX) || 100) * 2, // Admin gets 2x limit
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
});

// 静态文件服务
app.use(express.static('frontend'));

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: '名医堂数据平台3.0',
        version: '3.0.0',
        timestamp: new Date().toISOString() 
    });
});

// 缓存状态
app.get('/cache/stats', (req, res) => {
    const { getCacheInstance } = require('./utils/cache');
    const cache = getCacheInstance();
    res.json({
        status: 'ok',
        stats: cache.getStats(),
        timestamp: new Date().toISOString()
    });
});

// API路由
app.use('/api/v1/client', clientLimiter, clientRoutes);
app.use('/api/v1/admin', adminLimiter, adminRoutes);

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: '请求的资源不存在'
        }
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        error: {
            code: err.code || 'SERVER_ERROR',
            message: err.message || '服务器内部错误'
        }
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 名医堂数据平台3.0 已启动`);
    console.log(`📍 服务器地址: http://localhost:${PORT}`);
    console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});