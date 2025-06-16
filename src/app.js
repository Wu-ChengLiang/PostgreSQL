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
app.use(helmet());
app.use(cors());
app.use(compression());

// 日志中间件
app.use(morgan('combined'));

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
    windowMs: 1 * 60 * 1000, // 1分钟
    max: 60, // 每个IP最多60次请求
    message: '请求过于频繁，请稍后再试'
});

// 管理端API限流
const adminLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1分钟
    max: 100, // 每个IP最多100次请求
    message: '请求过于频繁，请稍后再试'
});

// 静态文件服务
app.use(express.static('frontend'));

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: '名医堂数据平台2.0',
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