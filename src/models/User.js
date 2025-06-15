const BaseModel = require('./BaseModel');
const bcrypt = require('bcrypt');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  // 创建用户（包含密码加密）
  async createUser(data) {
    // 检查用户名是否已存在
    const existingUser = await this.findOne({ username: data.username });
    if (existingUser) {
      throw new Error('用户名已存在');
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await this.findOne({ email: data.email });
    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }
    
    // 加密密码
    if (data.password) {
      const saltRounds = 10;
      data.password_hash = await bcrypt.hash(data.password, saltRounds);
      delete data.password;
    }
    
    const user = await this.create(data);
    // 删除密码哈希后返回
    delete user.password_hash;
    return user;
  }

  // 验证用户密码
  async verifyPassword(username, password) {
    const user = await this.findOne({ username });
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }
    
    // 返回用户信息（不包含密码）
    delete user.password_hash;
    return user;
  }

  // 根据用户名查找
  async findByUsername(username) {
    return await this.findOne({ username });
  }

  // 根据邮箱查找
  async findByEmail(email) {
    return await this.findOne({ email });
  }

  // 更新用户密码
  async updatePassword(userId, newPassword) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    return await this.update(userId, { password_hash: passwordHash });
  }

  // 获取用户信息（不包含密码）
  async getUserInfo(userId) {
    const user = await this.findById(userId);
    if (user) {
      delete user.password_hash;
    }
    return user;
  }

  // 获取用户统计信息
  async getUserStats(userId) {
    const sql = `
      SELECT 
        u.*,
        COUNT(DISTINCT a.id) as total_appointments,
        COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
        COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END) as cancelled_appointments
      FROM ${this.tableName} u
      LEFT JOIN appointments a ON u.id = a.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    
    const user = await this.db.get(sql, [userId]);
    if (user) {
      delete user.password_hash;
    }
    return user;
  }

  // 搜索用户
  async search(keyword) {
    const sql = `
      SELECT id, username, email, phone, created_at
      FROM ${this.tableName}
      WHERE username LIKE ? OR email LIKE ? OR phone LIKE ?
      ORDER BY created_at DESC
    `;
    return await this.db.all(sql, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]);
  }
}

module.exports = new User();