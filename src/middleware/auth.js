const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mingyi-tang-secret-key-2025';

module.exports = async (req, res, next) => {
    try {
        // 从请求头获取token
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_FAILED',
                    message: '未提供认证令牌'
                }
            });
        }

        // 验证token格式
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_FAILED',
                    message: '认证令牌格式错误'
                }
            });
        }

        const token = parts[1];

        // 验证token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 将用户信息添加到请求对象
        req.admin = {
            id: decoded.id,
            username: decoded.username,
            storeId: decoded.storeId,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_FAILED',
                    message: '认证令牌已过期'
                }
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_FAILED',
                    message: '无效的认证令牌'
                }
            });
        }

        // 其他错误
        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '认证过程出现错误'
            }
        });
    }
};