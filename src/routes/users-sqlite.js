const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const database = require('../config/database-sqlite');

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 生成JWT令牌
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 获取所有用户
router.get('/', async (req, res) => {
  try {
    const users = await database.all(`
      SELECT id, username, email, phone, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户列表失败'
    });
  }
});

// 获取单个用户
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const user = await database.get(`
      SELECT id, username, email, phone, created_at
      FROM users
      WHERE id = ?
    `, [id]);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 获取用户的预约统计
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_appointments
      FROM appointments
      WHERE user_id = ?
    `, [id]);
    
    user.appointment_stats = stats;
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户详情失败'
    });
  }
});

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    
    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名、邮箱和密码为必填项'
      });
    }
    
    // 检查用户名是否已存在
    const existingUser = await database.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: '用户名已存在'
      });
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await database.get(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: '邮箱已被注册'
      });
    }
    
    // 加密密码
    const password_hash = await bcrypt.hash(password, 10);
    
    // 创建用户
    const result = await database.run(`
      INSERT INTO users (username, email, phone, password_hash, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [username, email, phone || null, password_hash]);
    
    const user = await database.get(
      'SELECT id, username, email, phone, created_at FROM users WHERE id = ?',
      [result.lastID]
    );
    
    // 生成令牌
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      user: user,
      token: token
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({
      success: false,
      error: '用户注册失败'
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '请提供用户名和密码'
      });
    }
    
    // 查找用户
    const user = await database.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    // 生成令牌
    const token = generateToken(user);
    
    // 移除密码哈希
    delete user.password_hash;
    
    res.json({
      success: true,
      user: user,
      token: token
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      success: false,
      error: '用户登录失败'
    });
  }
});

// 更新用户信息
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { email, phone } = req.body;
    
    // 检查用户是否存在
    const existingUser = await database.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 构建更新语句
    const updates = [];
    const values = [];
    
    if (email !== undefined) {
      // 检查邮箱是否被其他用户使用
      const emailUser = await database.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      
      if (emailUser) {
        return res.status(409).json({
          success: false,
          error: '邮箱已被其他用户使用'
        });
      }
      
      updates.push('email = ?');
      values.push(email);
    }
    
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有提供要更新的字段'
      });
    }
    
    values.push(id);
    
    await database.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const user = await database.get(
      'SELECT id, username, email, phone, created_at FROM users WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '更新用户信息失败'
    });
  }
});

// 修改密码
router.put('/:id/password', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { old_password, new_password } = req.body;
    
    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: '请提供旧密码和新密码'
      });
    }
    
    // 获取用户信息
    const user = await database.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 验证旧密码
    const isValid = await bcrypt.compare(old_password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: '旧密码错误'
      });
    }
    
    // 加密新密码
    const new_password_hash = await bcrypt.hash(new_password, 10);
    
    // 更新密码
    await database.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [new_password_hash, id]
    );
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      error: '修改密码失败'
    });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // 检查用户是否存在
    const user = await database.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 检查是否有关联的预约
    const appointmentCount = await database.get(
      'SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND status != ?',
      [id, 'cancelled']
    );
    
    if (appointmentCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: '该用户还有未完成的预约，无法删除'
      });
    }
    
    await database.run(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      error: '删除用户失败'
    });
  }
});

// 搜索用户
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: '请提供搜索关键词'
      });
    }
    
    const users = await database.all(`
      SELECT id, username, email, phone, created_at
      FROM users
      WHERE username LIKE ? OR email LIKE ?
      ORDER BY created_at DESC
    `, [`%${keyword}%`, `%${keyword}%`]);
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索用户失败'
    });
  }
});

// 获取用户统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // 检查用户是否存在
    const user = await database.get(
      'SELECT id, username FROM users WHERE id = ?',
      [id]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 获取预约统计
    const appointmentStats = await database.get(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_appointments,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_appointments
      FROM appointments
      WHERE user_id = ?
    `, [id]);
    
    // 获取最常预约的服务类型
    const favoriteServices = await database.all(`
      SELECT 
        service_type,
        COUNT(*) as count
      FROM appointments
      WHERE user_id = ?
      GROUP BY service_type
      ORDER BY count DESC
      LIMIT 3
    `, [id]);
    
    // 获取最常预约的技师
    const favoriteTherapists = await database.all(`
      SELECT 
        t.id,
        t.name,
        COUNT(*) as appointment_count
      FROM appointments a
      JOIN therapists t ON a.therapist_id = t.id
      WHERE a.user_id = ?
      GROUP BY t.id
      ORDER BY appointment_count DESC
      LIMIT 3
    `, [id]);
    
    res.json({
      success: true,
      stats: {
        user_id: id,
        username: user.username,
        appointment_stats: appointmentStats,
        favorite_services: favoriteServices,
        favorite_therapists: favoriteTherapists
      }
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户统计失败'
    });
  }
});

module.exports = router;