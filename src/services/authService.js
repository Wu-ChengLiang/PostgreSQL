const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getInstance } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'mingyi-tang-secret-key-2025';

class AuthService {
    async login(username, password) {
        const db = getInstance();
        await db.connect();

        try {
            // 查找管理员
            const admin = await db.get(
                'SELECT * FROM admins WHERE username = ? AND is_active = 1',
                [username]
            );

            if (!admin) {
                throw new Error('用户名或密码错误');
            }

            // 验证密码
            const isValidPassword = await bcrypt.compare(password, admin.password_hash);
            if (!isValidPassword) {
                throw new Error('用户名或密码错误');
            }

            // 更新最后登录时间
            await db.run(
                'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [admin.id]
            );

            // 生成JWT令牌
            const token = jwt.sign(
                {
                    id: admin.id,
                    username: admin.username,
                    storeId: admin.store_id,
                    role: admin.role
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return {
                token,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    store_id: admin.store_id,
                    role: admin.role
                }
            };
        } finally {
            await db.close();
        }
    }

    async changePassword(adminId, oldPassword, newPassword) {
        const db = getInstance();
        await db.connect();

        try {
            // 获取管理员信息
            const admin = await db.get(
                'SELECT * FROM admins WHERE id = ?',
                [adminId]
            );

            if (!admin) {
                throw new Error('管理员不存在');
            }

            // 验证旧密码
            const isValidPassword = await bcrypt.compare(oldPassword, admin.password_hash);
            if (!isValidPassword) {
                throw new Error('原密码错误');
            }

            // 加密新密码
            const newPasswordHash = await bcrypt.hash(newPassword, 10);

            // 更新密码
            await db.run(
                'UPDATE admins SET password_hash = ? WHERE id = ?',
                [newPasswordHash, adminId]
            );

            return { message: '密码修改成功' };
        } finally {
            await db.close();
        }
    }
}

module.exports = new AuthService();